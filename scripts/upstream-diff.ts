#!/usr/bin/env bun
// upstream-diff [ref]    what upstream changed at <ref> (default main) since the snapshot
// upstream-diff --verify fail when upstream/ differs from the commit snapshot.json records
//
// Run from the repo root. Sparse-clones upstream's snapshot paths at the ref
// and diffs the snapshot under upstream/ against them, renames detected.
// Exit 0 when the diff ran (and, with --verify, nothing differs), 1 when
// --verify found a difference, 2 on a usage or git failure.
import { parseArgs } from "node:util";
import { gitRun, readRecord, runCommand, snapshotTree, UsageError, withUpstreamClone } from "./lib/upstream.ts";

function main(): number {
  const { values, positionals: refs } = parseArgs({ options: { verify: { type: "boolean" } }, allowPositionals: true });
  const verify = values.verify ?? false;
  if (refs.length > (verify ? 0 : 1)) throw new UsageError("usage: upstream-diff [ref] | upstream-diff --verify");

  const root = process.cwd();
  const record = readRecord(root);
  const ref = verify ? record.commit : (refs[0] ?? "main");

  return withUpstreamClone(record.repo, ref, record.paths, (clone) => {
    const tree = snapshotTree(clone, root, record.paths);
    const diff = gitRun(clone.dir, ["diff", "--patch-with-stat", "-M", "--exit-code", tree, clone.commit, "--", ...record.paths]);
    if (diff.code > 1) throw new UsageError(`git diff failed:\n${diff.stderr.trim()}`);
    const changed = diff.code === 1;
    const target = `${record.repo}@${clone.commit}`;

    if (verify) {
      if (!changed) {
        console.log(`upstream/ matches ${target}.`);
        return 0;
      }
      console.log(`upstream/ differs from ${target}, the commit snapshot.json records. Hand edits?\n`);
      process.stdout.write(diff.stdout);
      return 1;
    }

    if (!changed) {
      console.log(`No upstream changes under the snapshot paths: ${record.commit} → ${target} (${ref}).`);
      return 0;
    }
    console.log(`Upstream changes since the snapshot: ${record.commit} → ${target} (${ref}).\n`);
    process.stdout.write(diff.stdout);
    return 0;
  });
}

runCommand("upstream-diff", main);
