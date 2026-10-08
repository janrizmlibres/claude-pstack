import { describe, expect, test } from "bun:test";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FakeRemote, git, runBashScript, runShell, scriptsDir, tempDir, writeFiles } from "./test/harness.ts";

/** Keys Claude Code's cloud harness already wrote to the VM's user settings before setup runs. */
const vmSettings = {
  model: "opus",
  env: { CLAUDE_CODE_ENTRYPOINT: "remote", BASH_MAX_TIMEOUT_MS: "600000" },
  permissions: { allow: ["Bash(git status:*)"], defaultMode: "acceptEdits" },
  hooks: {
    SessionStart: [{ matcher: "startup", hooks: [{ type: "command", command: "/usr/local/bin/harness-start" }] }],
    Stop: [{ hooks: [{ type: "command", command: "/usr/local/bin/harness-stop" }] }],
  },
};

/**
 * A stub on PATH that logs its arguments, one call per line, to
 * `$STUB_LOG/<name>.log`, and exits 1 when its call starts with `$STUB_FAIL`.
 */
const stub = (name: string) => ({
  content: `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$STUB_LOG/${name}.log"
[[ -n \${STUB_FAIL:-} && "${name} $*" == "$STUB_FAIL"* ]] && exit 1
exit 0
`,
  executable: true,
});

/** A directory standing in for the setup line's clone, holding only the installer. */
function bareClone(): string {
  const clone = tempDir("pstack-clone-");
  mkdirSync(join(clone, "scripts"));
  copyFileSync(join(scriptsDir, "cloud-install.sh"), join(clone, "scripts", "cloud-install.sh"));
  return clone;
}

/**
 * The setup line's clone, a fake HOME holding `settings`, and stub claude and
 * npx on PATH. Git is stubbed too unless `clone` is a real git clone.
 */
function fixture({ settings = vmSettings, clone }: { settings?: object | null; clone?: string } = {}) {
  const stubs = { claude: stub("claude"), npx: stub("npx"), ...(clone ? {} : { git: stub("git") }) };
  clone ??= bareClone();
  const home = tempDir("pstack-home-");
  if (settings) writeFiles(home, { ".claude/settings.json": JSON.stringify(settings, null, 2) });
  const bin = tempDir("pstack-bin-");
  writeFiles(bin, stubs);
  const logs = tempDir("pstack-logs-");
  const env = { PATH: `${bin}:${process.env.PATH ?? ""}`, STUB_LOG: logs };
  const settingsFile = join(home, ".claude", "settings.json");

  return {
    clone,
    install: (args: string[] = [], extraEnv: Record<string, string> = {}) =>
      runBashScript(join(clone, "scripts", "cloud-install.sh"), args, { cwd: tempDir(), home, env: { ...env, ...extraEnv } }),
    settingsText: () => readFileSync(settingsFile, "utf8"),
    settings: () => JSON.parse(readFileSync(settingsFile, "utf8")),
    calls: (name: string) => {
      const log = join(logs, `${name}.log`);
      return existsSync(log) ? readFileSync(log, "utf8").trimEnd().split("\n") : [];
    },
    resetCalls: (name: string) => writeFileSync(join(logs, `${name}.log`), ""),
    /** Run a hook command as Claude Code does, through the shell, with the stubs on PATH. */
    runHook: (command: string, extraEnv: Record<string, string> = {}) => {
      const result = runShell(command, { cwd: tempDir(), home, env: { ...env, ...extraEnv } });
      return { exitCode: result.exitCode, output: result.stdout + result.stderr };
    },
  };
}

const pullHooks = (settings: { hooks: { SessionStart: { hooks: { command: string }[] }[] } }) =>
  settings.hooks.SessionStart.flatMap((group) => group.hooks).filter((hook) => hook.command.includes(" pull "));

describe("cloud-install.sh", () => {
  test("merges depth 3, the Read rule and the pull hook into user settings, keeping the harness's keys", () => {
    const f = fixture();

    const result = f.install();

    expect(result.exitCode).toBe(0);
    expect(f.settings()).toEqual({
      ...vmSettings,
      env: { ...vmSettings.env, CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH: "3" },
      permissions: { ...vmSettings.permissions, allow: ["Bash(git status:*)", `Read(/${f.clone}/pstack/**)`] },
      hooks: {
        ...vmSettings.hooks,
        SessionStart: [
          ...vmSettings.hooks.SessionStart,
          { hooks: [{ type: "command", command: expect.any(String), timeout: 15 }] },
        ],
      },
    });
  });

  test("with no user settings yet, writes them", () => {
    const f = fixture({ settings: null });

    expect(f.install().exitCode).toBe(0);
    expect(f.settings().env).toEqual({ CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH: "3" });
    expect(f.settings().permissions.allow).toEqual([`Read(/${f.clone}/pstack/**)`]);
    expect(pullHooks(f.settings())).toHaveLength(1);
  });

  test("the pull hook fast-forwards the clone on the installed ref, silently", () => {
    const f = fixture();
    f.install(["release/v1"]);
    const [hook] = pullHooks(f.settings());
    f.resetCalls("git");

    const result = f.runHook(hook!.command);

    expect(result).toEqual({ exitCode: 0, output: "" });
    expect(f.calls("git")).toEqual([`-C ${f.clone} pull --ff-only -q origin release/v1`]);
  });

  test("a failing pull never fails the session", () => {
    const f = fixture();
    f.install();
    const [hook] = pullHooks(f.settings());

    expect(f.runHook(hook!.command, { STUB_FAIL: "git" })).toEqual({ exitCode: 0, output: "" });
  });

  test("a second run changes nothing", () => {
    const f = fixture();
    f.install(["--config", "work_model=sonnet"]);
    const first = f.settingsText();

    expect(f.install(["--config", "work_model=sonnet"]).exitCode).toBe(0);
    expect(f.settingsText()).toBe(first);
  });

  test("a run on another ref replaces the pull hook instead of adding one", () => {
    const f = fixture();
    f.install();

    f.install(["release/v1"]);

    const hooks = pullHooks(f.settings());
    expect(hooks).toHaveLength(1);
    expect(hooks[0]!.command).toContain("origin release/v1");
  });

  test("checks the clone out at the ref, then installs the plugin with the --config values", () => {
    const f = fixture();

    const result = f.install(["release/v1", "--config", "work_model=sonnet", "--config", "volume_model=haiku"]);

    expect(result.exitCode).toBe(0);
    expect(f.calls("git")).toEqual([
      `-C ${f.clone} fetch -q --depth 1 origin release/v1`,
      `-C ${f.clone} checkout -q -B release/v1 FETCH_HEAD`,
    ]);
    expect(f.calls("claude")).toEqual([
      `plugin marketplace add ${f.clone} --scope user`,
      "plugin install pstack@claude-pstack --scope user --config work_model=sonnet --config volume_model=haiku",
    ]);
  });

  test("the ref defaults to main", () => {
    const f = fixture();

    f.install(["--config", "work_model=opus"]);

    expect(f.calls("git")).toEqual([
      `-C ${f.clone} fetch -q --depth 1 origin main`,
      `-C ${f.clone} checkout -q -B main FETCH_HEAD`,
    ]);
    expect(pullHooks(f.settings())[0]!.command).toContain("origin main");
  });

  test("with real git, checks a depth-1 clone of main out at the ref, and the hook fast-forwards it", () => {
    const remote = new FakeRemote();
    remote.commit({
      write: { "scripts/cloud-install.sh": readFileSync(join(scriptsDir, "cloud-install.sh"), "utf8"), "pstack/v": "main\n" },
    });
    git(remote.dir, "checkout", "-q", "-b", "release/v1");
    // The ref's installer always fails: the run that checks the ref out finishes
    // the install with the installer it started with.
    const refInstaller = Array(400).fill(`echo "the ref's installer ran" >&2; exit 7`).join("\n");
    const rc1 = remote.commit({ write: { "scripts/cloud-install.sh": refInstaller, "pstack/v": "rc1\n" } });
    git(remote.dir, "checkout", "-q", "main");
    const clone = join(tempDir(), "claude-pstack");
    git(tempDir(), "clone", "-q", "--depth", "1", remote.url, clone);
    const f = fixture({ clone });

    const result = f.install(["release/v1"]);

    expect(result.exitCode).toBe(0);
    expect(git(clone, "branch", "--show-current")).toBe("release/v1");
    expect(git(clone, "rev-parse", "HEAD")).toBe(rc1);

    git(remote.dir, "checkout", "-q", "release/v1");
    const rc2 = remote.commit({ write: { "pstack/v": "rc2\n" } });

    expect(f.runHook(pullHooks(f.settings())[0]!.command)).toEqual({ exitCode: 0, output: "" });
    expect(git(clone, "rev-parse", "HEAD")).toBe(rc2);
  });

  test("installs Playwright Chromium", () => {
    const f = fixture();

    expect(f.install().exitCode).toBe(0);
    expect(f.calls("npx")).toEqual(["--yes playwright install --with-deps chromium"]);
  });

  test("a failing Chromium install warns and still exits 0", () => {
    const f = fixture();

    const result = f.install([], { STUB_FAIL: "npx" });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain("warning: Playwright Chromium did not install");
    expect(pullHooks(f.settings())).toHaveLength(1);
  });

  test("a failing plugin install fails the setup before settings are touched", () => {
    const f = fixture();
    const before = f.settingsText();

    const result = f.install([], { STUB_FAIL: "claude plugin install" });

    expect(result.exitCode).not.toBe(0);
    expect(f.settingsText()).toBe(before);
    expect(f.calls("npx")).toEqual([]);
  });

  test("an unknown option is a usage error", () => {
    const f = fixture();

    const result = f.install(["--frobnicate"]);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("usage: cloud-install.sh [ref] [--config KEY=VALUE]...");
    expect(f.calls("claude")).toEqual([]);
  });
});
