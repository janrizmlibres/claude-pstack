#!/usr/bin/env bun
// check-port-json             fail when port.json and the port disagree
// check-port-json --coverage  list every snapshot file not yet translated, overridden or dropped
//
// Run from the repo root. The check fails on a listed port path that doesn't
// exist (dropped entries aside), a listed snapshot path (a source, a
// depends_on, or the counterpart of an unsourced entry) missing from
// upstream/, and an unlisted port file with no counterpart.
// Exit 0 when clean (with --coverage: nothing left to port), 1 on problems
// (with --coverage: files left to port), 2 on a malformed port.json or usage.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { counterpart, covers, entryFor, portFiles, readPortRecord, type PortRecord } from "./lib/port.ts";
import { runCommand, snapshotFiles, UsageError } from "./lib/upstream.ts";

function main(): number {
  const { values, positionals } = parseArgs({ options: { coverage: { type: "boolean" } }, allowPositionals: true });
  if (positionals.length > 0) throw new UsageError("usage: check-port-json [--coverage]");

  const root = process.cwd();
  const record = readPortRecord(root);
  const files = portFiles(root);
  return values.coverage ? coverage(root, record, files) : check(root, record, files);
}

function check(root: string, record: PortRecord, files: string[]): number {
  const problems: string[] = [];
  const inSnapshot = (path: string) => existsSync(join(root, path));

  for (const entry of record.entries) {
    if (entry.kind !== "dropped" && !files.some((file) => covers(entry.path, file))) {
      problems.push(`${entry.path}: listed as ${entry.kind}, but there is no such port file`);
    }
    const snapshotPaths =
      entry.kind === "port-only" ? [] : [...(entry.sources ?? [counterpart(entry.path)]), ...(entry.depends_on ?? [])];
    for (const path of snapshotPaths.filter((p) => !inSnapshot(p))) {
      problems.push(`${path}: listed by ${entry.path} (${entry.kind}), but not in the snapshot`);
    }
  }
  for (const file of files) {
    if (!entryFor(record, file) && !inSnapshot(counterpart(file))) {
      problems.push(`${file}: no counterpart at ${counterpart(file)}, and port.json doesn't list it`);
    }
  }

  if (problems.length === 0) {
    console.log(`port.json agrees with the port: ${files.length} port files, ${record.entries.length} entries.`);
    return 0;
  }
  console.log(`${problems.join("\n")}\n\n${problems.length} problem${problems.length === 1 ? "" : "s"} in port.json.`);
  return 1;
}

function coverage(root: string, record: PortRecord, files: string[]): number {
  const snapshot = snapshotFiles(root).map((file) => `upstream/${file}`);
  const accounted = new Set<string>();
  const under = (path: string) => snapshot.filter((file) => covers(path, file));

  for (const entry of record.entries.filter((e) => e.kind === "dropped")) {
    for (const file of under(counterpart(entry.path))) accounted.add(file);
  }
  for (const file of files) {
    const entry = entryFor(record, file);
    if (entry?.kind === "port-only" || entry?.kind === "dropped") continue;
    if (!entry?.sources) {
      accounted.add(counterpart(file));
    } else if (file === entry.path) {
      for (const source of entry.sources) for (const made of under(source)) accounted.add(made);
    } else {
      const rest = file.slice(entry.path.length);
      for (const source of entry.sources) accounted.add(`${source}${rest}`);
    }
  }

  const left = snapshot.filter((file) => !accounted.has(file));
  if (left.length > 0) console.log(left.join("\n") + "\n");
  console.log(`${left.length} of ${snapshot.length} snapshot files not yet translated, overridden or dropped.`);
  return left.length === 0 ? 0 : 1;
}

runCommand("check-port-json", main);
