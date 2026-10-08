# Depth-raise probe: findings

Question: can `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` be raised inside a Claude Code cloud session (claude.ai/code VM)? The worker-backend probe (`research/worker-backend`) found the VM sets it to `1`, so in-VM subagents have no Agent tool. This probe tests whether a settings `env` block overrides that.

Run 2026-10-08, 03:14–03:15Z, Claude Code 2.1.293 locally and in the VM, environment Mira (`env_011fdXavJ6U87ghgCCgmnoee`), Auto mode. Two cloud leads, launched unattended from this machine. Nobody clicked anything in claude.ai. Both sessions finished and pushed within about a minute.

## Answer

**Yes, through the repo's `.claude/settings.json`.** A project-level `{"env":{"CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH":"3"}}` raised the depth to 3 in the VM: the level-1 subagent had the Agent tool and spawned a level-2 subagent without error. Putting the same `env` block in the launch-time `--settings` did nothing: depth stayed 1.

## Setup

Both leads were launched from the main checkout (on `main`, clean), which was never switched.

- **Arm A (project settings).** Branch `probe/depth-raise-project` = `origin/main` (`2ddbb97`) plus one commit `d8eff85` adding `.claude/settings.json` = `{"env":{"CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH":"3"}}`. Launched with:
  ```
  script -q <log> claude --permission-mode auto \
    --settings '{"remote":{"defaultEnvironmentId":"env_011fdXavJ6U87ghgCCgmnoee"}}' \
    --debug-file <dbg> --ref probe/depth-raise-project --cloud "$(cat LEAD-PROMPT-A.txt)"
  ```
  Session `session_01AfKzAu35dEvXCeZgBb65ep`, branch `claude/depthprobe-otter-probe-k45f0u`.
- **Arm B (launch-time settings).** Launched with:
  ```
  script -q <log> claude --permission-mode auto \
    --settings '{"remote":{"defaultEnvironmentId":"env_011fdXavJ6U87ghgCCgmnoee"},"env":{"CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH":"3"}}' \
    --debug-file <dbg> --cloud "$(cat LEAD-PROMPT-B.txt)"
  ```
  Session `session_014CBfbjq3yadsDmUusUAY4P`, branch `claude/depthprobe-wren-wqq6s8`.
- **Source branch.** `claude --cloud` takes a hidden flag `--ref <ref>` ("Branch, tag, or SHA to check out in the remote session; defaults to local current branch. Requires --cloud or --environment."), so arm A didn't need a `git switch`. There is also a hidden `--on-branch <branch>` ("Work directly on <branch> in the remote session (checkout and push to it) … Mutually exclusive with --ref"), which wasn't used.
- **Prompts:** `LEAD-PROMPT-A.txt` and `LEAD-PROMPT-B.txt` in this directory. They're identical apart from the nonce ("Depthprobe otter" / "Depthprobe wren") and the arm letter.
- **Raw outputs:** `out-A.md` and `out-B.md`, copied verbatim from the sessions' branches. The prompt had the lead pass `~/.claude/settings.json` through a sed filter that redacts token-like keys. The VM's file printed nothing in either arm (empty or absent; `exit=0` is the pipeline's status).

## Observed

### Session-create payload (local `--debug-file`)
- Arm A: `session_context.sources[0].revision = probe/depth-raise-project`. Arm B: `revision = main`.
- Requested outcome branches were `claude/depthprobe-otter-probe` (A, words taken from the generated title "Depthprobe otter subagent nesting probe") and `claude/depthprobe-wren` (B). The session got them with a random suffix.
- **Arm B's payload has no env or settings field.** The only occurrence of `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` in the debug log is inside the prompt text. The payload's top-level fields are `title`, `events` (a `set_permission_mode: auto` control request and the user message), `session_context` (`sources`, `outcomes`, `model`) and `environment_id`.

### Arm A: project `.claude/settings.json` (out-A.md)
- Lead: on `claude/depthprobe-otter-probe-k45f0u` at `d8eff85`. `printenv CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` → `3`. `.claude/settings.json` present with the env block.
- `/proc/<pid>/environ` of the VM's `claude`-matching processes: pids 105 and 109 → `=1`, pids 416 and 429 → `=3`, pid 84 → unset.
- Level 1 (general-purpose, foreground, no isolation): **Agent directly callable**, `printenv` → `3`. It spawned level 2 "without error".
- Level 2: **Agent directly callable**, `printenv` → `3`. As instructed, it didn't spawn level 3.
- No error text anywhere. Lead summary: `lead_depth=3; L1_agent=yes; L1_depth=3; L2_spawned=yes; L2_depth=3; error=none`.

### Arm B: launch-time `--settings` env (out-B.md)
- Lead: on `claude/depthprobe-wren-wqq6s8` at `2ddbb97`, no `.claude/settings.json`. `printenv` → `1`. Every `claude`-matching process (pids 81, 85, 95, 322) has `=1`.
- Level 1: **no Agent tool**, neither direct nor deferred. `printenv` → `1`. No spawn, so no level 2. As in the earlier probe, the limit shows up as a missing tool, not as an error message.
- Lead summary: `lead_depth=1; L1_agent=no; L1_depth=1; L2_spawned=no; L2_depth=n/a; error=none`.

## Inferred (not tested directly)

- The VM's runtime starts its processes with `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1` (arm A's pids 105/109 still show `1`). Claude Code then applies the project settings `env` block on top of its own environment, so the Bash shells and subagents it starts inherit `3` (pids 416/429). Which pid is which process wasn't recorded.
- In 2.1.293 the limit is read from the env var first (`let e=a.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH; if(e!==void 0) return e;`), then from the feature flag `tengu_hazel_trellis`, with a default of 3. So any value that reaches the session's environment wins over the flag.
- A local `--settings` env applies only to the local launcher process. `claude --cloud` doesn't send it to the cloud session (it's absent from the payload). The hidden `--forward-home-settings` flag says it forwards "CLAUDE.md, rules, output styles, preferences, portable permission rules", and env isn't on that list. Not tested.
- Level 2 also had the Agent tool at depth 3, so level 3 should be reachable, and level 3 would then be the last level without Agent. Not tested.
- Any branch a cloud session starts from (`--ref`, or `source_revision` for `create_session` children) that carries the `.claude/settings.json` env block should get the raised depth. Not tested for `create_session` children.

## Not tested

- A per-environment variable set in the cloud environment's own config (claude.ai UI). That route wasn't needed.
- Values above 3, and background (`run_in_background`) subagents at depth 3.
- `.claude/settings.local.json` (normally git-ignored, so it wouldn't reach the VM through the repo anyway).

## Evidence

- Sessions: A `session_01AfKzAu35dEvXCeZgBb65ep`, B `session_014CBfbjq3yadsDmUusUAY4P`. Both are safe to archive.
- Branches: `claude/depthprobe-otter-probe-k45f0u` (A's `out.md`, on top of `d8eff85`) and `claude/depthprobe-wren-wqq6s8` (B's `out.md`). The launch branch `probe/depth-raise-project` was deleted after the run. Its commit `d8eff85` survives as the parent of A's output commit.
