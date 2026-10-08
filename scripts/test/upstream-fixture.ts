// A small stand-in for cursor/plugins, and a port checkout holding a
// hand-copied snapshot of it, shared by the upstream-diff and
// upstream-snapshot tests.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { FixtureRepo, tempDir, writeFiles, type Files } from "./harness.ts";

export const snapshotPaths = ["pstack", "kit/skills/keep"];

export const upstreamFiles: Files = {
  "pstack/.cursor-plugin/plugin.json": JSON.stringify({ name: "pstack", version: "1.2.3" }, null, 2) + "\n",
  "pstack/.gitignore": "node_modules/\n",
  "pstack/README.md": "# pstack\n\nWorkflows.\n",
  "pstack/skills/a/SKILL.md": "---\nname: a\n---\n\nSkill a.\n",
  "pstack/skills/b/SKILL.md": Array.from({ length: 20 }, (_, i) => `Line ${i} of skill b.`).join("\n") + "\n",
  "pstack/scripts/run.sh": { content: "#!/bin/sh\necho run\n", executable: true },
  "kit/skills/keep/SKILL.md": "---\nname: keep\n---\n\nVendored.\n",
  "kit/skills/other/SKILL.md": "Not vendored.\n",
  "unrelated/file.md": "Outside every snapshot path.\n",
};

/** The upstream fixture with its first commit made. */
export function fixtureUpstream(): { upstream: FixtureRepo; first: string } {
  const upstream = new FixtureRepo();
  const first = upstream.commit({ write: upstreamFiles });
  return { upstream, first };
}

/** A port checkout whose `upstream/` mirrors the fixture's first commit by hand. */
export function portAt(upstream: FixtureRepo, commit: string): string {
  const port = tempDir("pstack-port-");
  const mirrored = Object.fromEntries(
    Object.entries(upstreamFiles).filter(([path]) => snapshotPaths.some((p) => path.startsWith(`${p}/`))),
  );
  writeFiles(join(port, "upstream"), mirrored);
  writeFileSync(
    join(port, "upstream", "snapshot.json"),
    JSON.stringify(
      { repo: upstream.url, commit, version: "1.2.3", paths: snapshotPaths, taken: "2026-10-06T00:00:00.000Z" },
      null,
      2,
    ) + "\n",
  );
  return port;
}
