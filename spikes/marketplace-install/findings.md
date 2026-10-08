# Marketplace and cloud plugin-install probe: findings

Question: do the plugin mechanics the port builds on hold on a **marketplace** install and on a **cloud install by the setup line**, not just under `--plugin-dir` or as a project skill?

Run 2026-10-08, 05:26–05:35Z, Claude Code 2.1.294 locally and in the VM. The probe plugin and installer are on `probe/marketplace-install` (see `README.md`). Raw outputs: `out-local.md` (each local run's final report, permission mode and denials) and `out-cloud.md` (the cloud lead's log, verbatim from `claude/mktprobe-heron-k4xs96`).

## Answer

Every item on the ticket holds, locally and in cloud. One new constraint showed up that earlier probes had masked by pre-allowing `Read`: **in default permission mode, a `Read` of any `${CLAUDE_PLUGIN_ROOT}` path is a permission request.** That includes an invoked skill's own file. Headless runs and subagents can't answer the request, so the read is denied. Auto mode allows the read, and so does one `Read(<plugin cache>/**)` allow rule, which subagents also pick up.

| Item | Local (marketplace, `#branch` add) | Cloud (setup line, directory marketplace in place) |
|---|---|---|
| `${CLAUDE_PLUGIN_ROOT}` in skill and agent bodies | substituted: `~/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd` | substituted: `/opt/claude-pstack/spikes/marketplace-install/plugin` |
| Path read to a hidden sibling, depth 0–2 | yes (`H8M2Q` at d0, d1, d2; `D3X9R` playbook at d2), when `Read` is allowed (Auto or allow rule) | yes, the same tokens, Auto |
| Skill tool on the hidden sibling | refused (`…cannot be used with Skill tool due to disable-model-invocation…`) | not retried |
| Skill-frontmatter `UserPromptSubmit` reminder hook | fired on the slash-entry turn and the next turn; reminder reached the model | fired on the entry turn and on the subagent hand-back turn; reminder reached the model |
| `${CLAUDE_PLUGIN_ROOT}` in that hook's command | expanded, both as substitution and as an exported env var | expanded, both ways |
| Slash entry `/probe:entry` as the first prompt line | expanded (`<command-name>/probe:entry</command-name>`, body token known without a file read) | expanded the same way in a `claude --cloud` lead |
| Unset `userConfig` option, with or without `default` | literal `${user_config.KEY}` | literal `${user_config.KEY}` |
| `--config set_opt=…` value | not tested locally | reached skill and agent bodies (`[CLOUD-SET-4F]`) |
| Setup line's user-settings `env` depth 3 | n/a | `printenv` → `3` in lead, d1; d1 and d2 had the Agent tool; d1 spawned d2 |
| `marketplace add owner/repo#branch` serves a relative-path plugin from that branch | yes: clone at `probe/marketplace-install`, installed version `8a65843e2ecd` = branch head commit | n/a (setup line clones the ref) |

## Observed

### Local

- `claude plugin marketplace add 'janrizmlibres/claude-pstack#probe/marketplace-install' --scope local` cloned that ref over SSH (`Cloning repository … (ref: probe/marketplace-install)`) and recorded `"ref": "probe/marketplace-install"` in the project's `.claude/settings.local.json` and in `~/.claude/plugins/known_marketplaces.json`. `main` has no marketplace manifest, so the catalog could only have come from the branch.
- `claude plugin install probe@pstack-mkt-probe --scope local` installed from that tree into `~/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/`, with `gitCommitSha` `8a65843…` (the branch head at the time) and version `8a65843e2ecd`, since the manifest has no `version`. It printed `3 userConfig options not yet set — run /plugin configure … or pass --config KEY=VALUE.`
- Runs A and B (user settings default to Auto): the lead, a `probe:prober` subagent and its `probe:prober` child each read `H8M2Q` from the substituted path. The child also read `playbooks/deep.md` (`D3X9R`). No denials.
- Run B2 (`--permission-mode default`, `Read` not allowed): both the lead's and the d1 subagent's `Read` were denied with `Claude requested permissions to read from /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md, but you haven't granted it yet.`
- Run C (default mode): after `Skill probe:visible` loaded, a `Read` of `skills/visible/SKILL.md`, the invoked skill's own file, was denied the same way. Invoking a skill does not make its directory readable.
- Run D (default mode, `--allowedTools "Read(~/.claude/plugins/cache/pstack-mkt-probe/**)"`) and run F (default mode, the same rule in the project's `settings.local.json` `permissions.allow`): the lead and the d1 subagent both read `H8M2Q`, no denials.
- Run E (`bin/turns.py`, two turns, first turn `/probe:entry …`): the hook fired at 05:31:24Z and 05:31:31Z. The log line was `root=/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd envroot=<same>`. Both replies quoted `PROBE-REMINDER R5T8: the full skill is at …/skills/entry/SKILL.md` and ended with `KUMQUAT`.

### Cloud

Environment `mkt-probe` (`env_018jkUJUm9M3D8icS9Yh3urA`, trusted network), with the setup script set to:

```
git clone --depth 1 --branch probe/marketplace-install https://github.com/janrizmlibres/claude-pstack /opt/claude-pstack && bash /opt/claude-pstack/spikes/marketplace-install/cloud-install.sh --config set_opt=CLOUD-SET-4F
```

The lead was launched with `claude --permission-mode auto --settings '{"remote":{"defaultEnvironmentId":"env_018jkUJUm9M3D8icS9Yh3urA"}}' --ref probe/marketplace-install --cloud "$(cat LEAD-PROMPT.txt)"` as session `session_01AhLPcGrq8CWr9WPFCQQBSo`, branch `claude/mktprobe-heron-k4xs96`.

- Setup log: marketplace add and plugin install both exited 0. `claude plugin list` shows `Version: 8a74b4b2ff23`, `Read from: /opt/claude-pstack/spikes/marketplace-install/plugin`, `Scope: user`. The `--config` value is stored in `/root/.claude/settings.json` as `pluginConfigs["probe@pstack-mkt-probe"].options.set_opt`. The installer reported `2 userConfig options not yet set`.
- The lead knew `E7N3C` before any tool call. Its first message arrived as `<command-message>probe:entry</command-message><command-name>/probe:entry</command-name><command-args>…`.
- Hook log: two lines (05:33:50Z entry turn, 05:34:38Z hand-back turn), each `root=/opt/claude-pstack/spikes/marketplace-install/plugin envroot=<same>`. The reminder arrived as `UserPromptSubmit hook success:` context.
- `printenv CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` → `3` in the lead and in d1. d1 had the Agent tool directly and spawned d2, which also listed the Agent tool. The VM default is `1` (from the depth-raise probe), so the user-settings `env` block is what raised it.
- The SessionStart pull hook logged `pull exit 0` twice. The first entry probably came from the throwaway "Envlookup" session (`session_01TotPCjy6CFoxDCFLbqHQ9b`), which ran in the same environment 10 s earlier and built the setup cache.

## Incidental

- A skill-frontmatter hook's command sees no `CLAUDE_PLUGIN_OPTION_<KEY>` env vars (`opt_set=UNSET`), even in cloud where `set_opt` is configured. The port doesn't rely on them.
- The configured value reaches agent bodies too (`set_opt as it reaches you: [CLOUD-SET-4F]` at d1 and d2).

## Not tested

- A cloud session in default permission mode. By the local result, its `Read` of `/opt/claude-pstack/...` should prompt, and the same allow rule should clear it.
- `--config` on a local install, and `/plugin configure` values.
- `${CLAUDE_PLUGIN_ROOT}` after a hook pull that changes plugin files mid-session.

## Evidence

- Branches: `probe/marketplace-install` (plugin, installer, prompts), `claude/mktprobe-heron-k4xs96` (cloud output, on top of `8a74b4b`), this branch.
- Sessions: `session_01AhLPcGrq8CWr9WPFCQQBSo` (probe lead) and `session_01TotPCjy6CFoxDCFLbqHQ9b` (envlookup). Both are safe to archive.
- Environment `mkt-probe` is safe to archive after the release checks reuse it or not.
