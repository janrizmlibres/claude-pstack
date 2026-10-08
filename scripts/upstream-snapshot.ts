#!/usr/bin/env bun
// upstream-snapshot [--repo <url>] [--path <path>]... [ref]
//
// Run from the repo root. Replaces the snapshot under upstream/ with
// upstream's <paths> at <ref> (default main), byte for byte, and writes
// upstream/snapshot.json. --repo and --path default to the existing record's;
// the first snapshot must give both. Only a sync advances the snapshot.
// Exit 0 on success, 2 on a usage or git failure.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
  git,
  readRecord,
  recordFile,
  runCommand,
  snapshotDir,
  UsageError,
  withUpstreamClone,
  type SnapshotRecord,
} from "./lib/upstream.ts";

/** Where pstack's version lives, relative to upstream's root. */
const versionFile = "pstack/.cursor-plugin/plugin.json";

const usage = "usage: upstream-snapshot [--repo <url>] [--path <path>]... [ref]";

function parse(): { repo?: string; paths: string[]; ref: string } {
  const { values, positionals } = parseArgs({
    options: { repo: { type: "string" }, path: { type: "string", multiple: true } },
    allowPositionals: true,
  });
  if (positionals.length > 1) throw new UsageError(usage);
  const paths = (values.path ?? []).map((p) => p.replace(/^\/+|\/+$/g, ""));
  return { repo: values.repo, paths, ref: positionals[0] ?? "main" };
}

function main(): number {
  const root = process.cwd();
  const options = parse();
  const previous = existsSync(recordFile(root)) ? readRecord(root) : undefined;
  const repo = options.repo ?? previous?.repo;
  const paths = options.paths.length > 0 ? options.paths : previous?.paths;
  if (!repo || !paths) throw new UsageError(`no snapshot record yet: give --repo and at least one --path\n${usage}`);

  return withUpstreamClone(repo, options.ref, paths, (clone) => {
    const versionPath = join(clone.dir, versionFile);
    if (!existsSync(versionPath)) throw new UsageError(`${versionFile} is missing at ${options.ref}`);
    const { version } = JSON.parse(readFileSync(versionPath, "utf8")) as { version: string };

    const out = snapshotDir(root);
    for (const path of new Set([...(previous?.paths ?? []), ...paths])) {
      rmSync(join(out, path), { recursive: true, force: true });
    }
    mkdirSync(out, { recursive: true });
    const archive = join(clone.dir, ".git", "snapshot.tar");
    git(clone.dir, ["archive", "--format=tar", "-o", archive, "HEAD", "--", ...paths]);
    const untar = Bun.spawnSync(["tar", "-xf", archive, "-C", out], { stderr: "pipe" });
    if (untar.exitCode !== 0) throw new UsageError(`tar failed:\n${untar.stderr.toString().trim()}`);

    const record: SnapshotRecord = { repo, commit: clone.commit, version, paths, taken: new Date().toISOString() };
    writeFileSync(recordFile(root), JSON.stringify(record, null, 2) + "\n");
    console.log(`Snapshot taken: ${repo}@${clone.commit} (pstack ${version}).`);
    return 0;
  });
}

runCommand("upstream-snapshot", main);
