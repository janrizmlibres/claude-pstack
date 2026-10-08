import { describe, expect, test } from "bun:test";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runBashScript, scriptsDir, tempDir, writeFiles } from "./test/harness.ts";

/** Keys the cloud harness already wrote to the VM's user settings before setup runs. */
const harnessSettings = {
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

/** A setup-line clone holding the installer, a fake HOME, and stub claude, git and npx. */
function fixture(settings: object | null = harnessSettings) {
  const clone = tempDir("pstack-clone-");
  mkdirSync(join(clone, "scripts"));
  copyFileSync(join(scriptsDir, "cloud-install.sh"), join(clone, "scripts", "cloud-install.sh"));
  const home = tempDir("pstack-home-");
  if (settings) writeFiles(home, { ".claude/settings.json": JSON.stringify(settings, null, 2) });
  const bin = tempDir("pstack-bin-");
  writeFiles(bin, { claude: stub("claude"), git: stub("git"), npx: stub("npx") });
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
      const proc = Bun.spawnSync({
        cmd: ["sh", "-c", command],
        env: { ...env, HOME: home, ...extraEnv },
        stdout: "pipe",
        stderr: "pipe",
      });
      return { exitCode: proc.exitCode, output: proc.stdout.toString() + proc.stderr.toString() };
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
      ...harnessSettings,
      env: { ...harnessSettings.env, CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH: "3" },
      permissions: { ...harnessSettings.permissions, allow: ["Bash(git status:*)", `Read(/${f.clone}/pstack/**)`] },
      hooks: {
        ...harnessSettings.hooks,
        SessionStart: [
          ...harnessSettings.hooks.SessionStart,
          { hooks: [{ type: "command", command: expect.any(String), timeout: 15 }] },
        ],
      },
    });
  });

  test("with no user settings yet, writes them", () => {
    const f = fixture(null);

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
