import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runScript, tempDir, writeFiles } from "./test/harness.ts";
import { fixtureUpstream, portAt } from "./test/upstream-fixture.ts";

/**
 * A stub `gh` on PATH that logs each call to `$STUB_LOG/gh.log` and answers
 * from files in `$STUB_DIR`: `pr list`, `pr view` and `api` print
 * `pr-list.json`, `pr-view.json` and `api.json`. A call starting with
 * `$STUB_FAIL` exits 1.
 */
const ghStub = {
  content: `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$STUB_LOG/gh.log"
[[ -n \${STUB_FAIL:-} && "gh $*" == "$STUB_FAIL"* ]] && { echo "gh: failed" >&2; exit 1; }
case "$1 $2" in
  "pr list") cat "$STUB_DIR/pr-list.json" ;;
  "pr view") cat "$STUB_DIR/pr-view.json" ;;
  "api "*) cat "$STUB_DIR/api.json" ;;
esac
exit 0
`,
  executable: true,
};

type Pr = { number: number; headRefName: string; url: string };

function fixture() {
  const { upstream, first } = fixtureUpstream();
  const port = portAt(upstream, first);
  const bin = tempDir("pstack-bin-");
  writeFiles(bin, { gh: ghStub });
  const stubDir = tempDir("pstack-stub-");
  const logs = tempDir("pstack-logs-");
  const output = join(tempDir("pstack-out-"), "github_output");
  writeFileSync(output, "");
  const answer = { prs: [] as Pr[], comments: [] as string[], snapshotCommit: first };
  const env = { PATH: `${bin}:${process.env.PATH ?? ""}`, STUB_DIR: stubDir, STUB_LOG: logs, GITHUB_OUTPUT: output };

  return {
    upstream,
    first,
    answer,
    gate: (args: string[] = [], extraEnv: Record<string, string> = {}) => {
      writeFiles(stubDir, {
        "pr-list.json": JSON.stringify(answer.prs),
        "pr-view.json": JSON.stringify({ comments: answer.comments.map((body) => ({ body })) }),
        "api.json": JSON.stringify({ repo: upstream.url, commit: answer.snapshotCommit, version: "1.3.0" }),
      });
      return runScript("sync-gate.ts", args, { cwd: port, env: { ...env, ...extraEnv } });
    },
    ghCalls: () => {
      const log = join(logs, "gh.log");
      return existsSync(log) ? readFileSync(log, "utf8").trimEnd().split("\n") : [];
    },
    outputs: () =>
      Object.fromEntries(
        readFileSync(output, "utf8")
          .split("\n")
          .filter(Boolean)
          .map((line) => line.split(/=(.*)/).slice(0, 2)),
      ),
  };
}

const syncPr: Pr = { number: 12, headRefName: "sync/1.3.0", url: "https://github.com/o/r/pull/12" };
const otherPr: Pr = { number: 7, headRefName: "feature/x", url: "https://github.com/o/r/pull/7" };

describe("sync-gate", () => {
  test("stops without touching GitHub when upstream matches the snapshot", () => {
    const f = fixture();
    f.upstream.commit({ write: { "unrelated/file.md": "Upstream moved, but not under the snapshot paths.\n" } });

    const result = f.gate();

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("matches the snapshot");
    expect(f.outputs()).toEqual({ sync: "false" });
    expect(f.ghCalls()).toEqual([]);
  });

  test("starts a sync when upstream moved and no sync PR is open, naming upstream's version and commit", () => {
    const f = fixture();
    f.answer.prs = [otherPr];
    const second = f.upstream.commit({
      write: { "pstack/.cursor-plugin/plugin.json": JSON.stringify({ name: "pstack", version: "1.3.0" }) },
    });

    const result = f.gate();

    expect(result.exitCode).toBe(0);
    expect(f.outputs()).toEqual({ sync: "true", version: "1.3.0", commit: second });
    expect(f.ghCalls().some((call) => call.startsWith("pr comment"))).toBe(false);
  });

  test("comments on the open sync PR instead of starting another when upstream moved past it", () => {
    const f = fixture();
    f.answer.prs = [otherPr, syncPr];
    f.answer.snapshotCommit = f.upstream.commit({ write: { "pstack/README.md": "# pstack\n\nSynced in #12.\n" } });
    const third = f.upstream.commit({
      write: { "pstack/.cursor-plugin/plugin.json": JSON.stringify({ name: "pstack", version: "1.4.0" }) },
    });

    const result = f.gate();

    expect(result.exitCode).toBe(0);
    expect(f.outputs()).toEqual({ sync: "false" });
    const comments = f.ghCalls().filter((call) => call.startsWith("pr comment"));
    expect(comments).toHaveLength(1);
    expect(comments[0]).toStartWith("pr comment 12 --body ");
    expect(comments[0]).toContain("v1.4.0");
    expect(comments[0]).toContain(third);
    expect(f.ghCalls()).toContain(
      "api repos/{owner}/{repo}/contents/upstream/snapshot.json?ref=sync%2F1.3.0 -H Accept: application/vnd.github.raw+json",
    );
  });

  test("stays quiet when the open sync PR already brings the port to upstream's state", () => {
    const f = fixture();
    f.answer.prs = [syncPr];
    f.answer.snapshotCommit = f.upstream.commit({ write: { "pstack/README.md": "# pstack\n\nSynced in #12.\n" } });
    f.upstream.commit({ write: { "unrelated/file.md": "Upstream moved, but not under the snapshot paths.\n" } });

    const result = f.gate();

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("#12");
    expect(f.outputs()).toEqual({ sync: "false" });
    expect(f.ghCalls().some((call) => call.startsWith("pr comment"))).toBe(false);
  });

  test("doesn't repeat a comment the sync PR already carries for upstream's commit", () => {
    const f = fixture();
    f.answer.prs = [syncPr];
    f.answer.snapshotCommit = f.upstream.commit({ write: { "pstack/README.md": "# pstack\n\nSynced in #12.\n" } });
    const third = f.upstream.commit({ write: { "pstack/README.md": "# pstack\n\nLater still.\n" } });
    f.answer.comments = ["Looks good.", `Upstream has moved on to v1.2.3 (${third}).`];

    const result = f.gate();

    expect(result.exitCode).toBe(0);
    expect(f.outputs()).toEqual({ sync: "false" });
    expect(f.ghCalls().some((call) => call.startsWith("pr comment"))).toBe(false);
  });

  test("checks a named ref", () => {
    const f = fixture();

    expect(f.gate(["main"]).exitCode).toBe(0);
    expect(f.outputs()).toEqual({ sync: "false" });
  });

  test("fails when gh fails, so the workflow never syncs on a guess", () => {
    const f = fixture();
    f.upstream.commit({ write: { "pstack/README.md": "# pstack\n\nChanged.\n" } });

    const result = f.gate([], { STUB_FAIL: "gh pr list" });

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("gh pr list");
    expect(f.outputs()).toEqual({});
  });

  test("fails on a usage error", () => {
    const f = fixture();

    const result = f.gate(["main", "extra"]);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("usage");
  });
});
