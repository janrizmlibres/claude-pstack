import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { runScript, tempDir } from "./test/harness.ts";
import { fixtureUpstream, inSnapshot, portAt, snapshotPaths, upstreamFiles } from "./test/upstream-fixture.ts";

const upstreamSnapshot = (cwd: string, ...args: string[]) => runScript("upstream-snapshot.ts", args, { cwd });
const pathArgs = snapshotPaths.flatMap((p) => ["--path", p]);
const record = (port: string) => JSON.parse(readFileSync(join(port, "upstream", "snapshot.json"), "utf8"));

describe("upstream-snapshot", () => {
  test("copies the listed paths at a ref byte for byte and records the snapshot", () => {
    const { upstream, first } = fixtureUpstream();
    upstream.commit({ write: { "pstack/README.md": "# pstack\n\nLater.\n" } });
    const port = tempDir("pstack-port-");
    const before = Date.now();

    const result = upstreamSnapshot(port, "--repo", upstream.url, ...pathArgs, first);

    expect(result.exitCode).toBe(0);
    for (const [path, entry] of Object.entries(upstreamFiles)) {
      const file = join(port, "upstream", path);
      if (!inSnapshot(path)) {
        expect(existsSync(file)).toBe(false);
        continue;
      }
      const content = typeof entry === "string" ? entry : entry.content;
      expect(readFileSync(file, "utf8")).toBe(content);
    }
    expect(statSync(join(port, "upstream", "pstack", "scripts", "run.sh")).mode & 0o111).not.toBe(0);
    expect(statSync(join(port, "upstream", "pstack", "README.md")).mode & 0o111).toBe(0);

    const written = record(port);
    expect(written).toMatchObject({ repo: upstream.url, commit: first, version: "1.2.3", paths: snapshotPaths });
    expect(Date.parse(written.taken)).toBeGreaterThanOrEqual(before - 1000);
    expect(Object.keys(written)).toEqual(["repo", "commit", "version", "paths", "taken"]);
  });

  test("advances an existing snapshot to main from its own record, dropping deleted files", () => {
    const { upstream, first } = fixtureUpstream();
    const port = portAt(upstream, first);
    const second = upstream.commit({
      write: { "pstack/.cursor-plugin/plugin.json": JSON.stringify({ name: "pstack", version: "1.3.0" }) + "\n" },
      remove: ["pstack/skills/a"],
    });

    const result = upstreamSnapshot(port);

    expect(result.exitCode).toBe(0);
    expect(existsSync(join(port, "upstream", "pstack", "skills", "a"))).toBe(false);
    expect(record(port)).toMatchObject({ repo: upstream.url, commit: second, version: "1.3.0", paths: snapshotPaths });
  });

  test("leaves a snapshot that upstream-diff --verify accepts", () => {
    const { upstream, first } = fixtureUpstream();
    const port = tempDir("pstack-port-");
    upstreamSnapshot(port, "--repo", upstream.url, ...pathArgs, first);

    const verify = runScript("upstream-diff.ts", ["--verify"], { cwd: port });

    expect(verify.exitCode).toBe(0);
  });

  test("needs --repo and --path when there is no record yet", () => {
    const { upstream } = fixtureUpstream();
    const port = tempDir("pstack-port-");

    const result = upstreamSnapshot(port, "--repo", upstream.url);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("--path");
    expect(existsSync(join(port, "upstream"))).toBe(false);
  });
});
