# Worker-backend probe: findings

Questions, for the wayfinder ticket "Worker backend: where pstack's parallel workers run" (#23): (1) how deep plain in-VM subagents nest in a cloud session, foreground and background, and what sets the limit; (2) whether `isolation: "worktree"` subagents in a cloud VM get real, mutually isolated git worktrees, and what happens to them afterwards; (3) a `create_session` child's tool list, and what an `AskUserQuestion` call does to it; (4) the VM's resources. Also: can `claude --cloud` be pointed at a chosen cloud environment?

Run 2026-10-08, 02:24–02:34Z, Claude Code 2.1.293 locally and in the VM, Max account. Two cloud sessions plus one `create_session` child, all in Auto mode. Nobody clicked anything in claude.ai.

## Setup

- **Lead:** launched locally from the main checkout (on `main`, clean) with `script -q <log> claude --permission-mode auto --settings '{"remote":{"defaultEnvironmentId":"env_011fdXavJ6U87ghgCCgmnoee"}}' --debug-file <dbg> --cloud "$(cat LEAD-PROMPT.txt)"`. The prompt opens with "Nestprobe heron", and the designated branch came out as `claude/nestprobe-heron-gsd2fi`. The prompt is `LEAD-PROMPT.txt` in this directory. The child's prompt is embedded at its end, between `CHILD-PROMPT-BEGIN` and `CHILD-PROMPT-END`.
- **Child:** the lead called `create_session` with `source_revision: "main"`, `permission_mode: "auto"`, `outcome_branch: "claude/nestprobe-child"`.
- **Environment probe:** a second tiny session ("Envprobe kestrel") was launched the same way, with the other environment's id in `--settings`.
- Raw logs: `out-lead.md` (lead) and `out-child.md` (child), copied from the sessions' branches. `env-select-debug.txt` holds the environment-selection lines from the two local `--debug-file` logs.
- No nudge was needed. The lead ran all seven steps unattended in about 9 minutes.

## 1. Nesting of plain in-VM subagents: depth 1, with no nesting at all

- **Observed:** in the cloud VM, `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1`. It is set in the lead's environment and inherited by subagents, which printed `1` with `printenv`.
- **Observed:** the level-1 general-purpose subagent (foreground, no isolation) has **no Agent tool**. Agent isn't in its deferred list either. Its own words: "(1) Agent tool: no. My tools are Artifact, Bash, Edit, Glob, Grep, ListAgents, Read, ReportFindings, SendUserFile, ShowOnboardingRolePicker, Skill, SuggestSkills, ToolSearch, Write, SubagentHandback and the mcp__claude-code-remote__* tools … None of them is called Agent." So the deepest level reached is 1: the lead spawns, and subagents can't. The limit shows up as a missing tool, not as an error message.
- **Background (`run_in_background: true`):** the same. Depth 1, no Agent tool, and a slightly smaller tool set (no ListAgents, ReportFindings, SendUserFile, ShowOnboardingRolePicker or SuggestSkills).
- **Other subagent env in the VM (observed names):** `CLAUDE_CODE_BG_TASKS_REPORT_RUNNING=0`. `CLAUDE_CODE_CHILD_SESSION` and `CLAUDE_AUTO_BACKGROUND_TASKS` are set too (values not logged, because the name filter skipped them). `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` is **not** set in the VM.
- **From the 2.1.293 binary (inferred, read from strings, not tested):**
  - Depth resolves as `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` env if set. Otherwise it comes from the feature flag `tengu_hazel_trellis`, with a default of `3`.
  - Over the limit, a spawn throws "Subagent nesting limit reached (depth N of M). Complete this task directly using your tools instead of spawning another agent. If the user explicitly requested deeper nesting, ask them to raise CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH."
  - Concurrency is capped by `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`, default `20`, with the error "Concurrent subagent limit reached. You can run N subagents at once. Do not retry."
  - Locally the env var is unset, and a local subagent (the one writing this) does have the Agent tool. So the cloud's depth 1 is a cloud-specific setting, not the CLI default.
- **Possible escape hatch (observed tools, not tested):** level-1 subagents keep `mcp__claude-code-remote__create_session` and `send_message`, so a subagent could start a full child *session* even though it can't spawn a subagent.
- **Not tested:** whether a repo's `.claude/settings.json` `env` block can raise `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` inside the cloud VM.

## 2. `isolation: "worktree"` in cloud: real, isolated worktrees, kept afterwards, mergeable

- **Location and naming (observed):** `/home/user/claude-pstack/.claude/worktrees/agent-<agentId>`, on a new local branch `worktree-agent-<agentId>`. The Agent tool result reports `worktreePath` and `worktreeBranch`. Each worktree shows as `locked` in `git worktree list` while its agent runs and is unlocked afterwards.
- **Base commit (observed):** all three worktrees started at `2ea8e47`, the session's start commit (also `origin/main`). They did **not** start at the lead's current `HEAD`, which by then held lead commits, and for W2/W3 the merged W1 commit too. So a worktree subagent doesn't see the lead's newer commits. Inferred, not separated: the base is either the session base ref (`CLAUDE_CODE_BASE_REF` is set in the VM) or the remote default branch. In this run both were the same commit.
- **Isolation from the lead (observed):** W1 wrote and committed `wt-probe/W1.txt` (commit `c7d632b`). Afterwards the lead's checkout had no `wt-probe/`.
- **Parallel isolation (observed):** W2 and W3 ran in one message, each committing its own file and then waiting 25 s. Each saw only its own file and commit (`ls wt-probe` showed `W2.txt` or `W3.txt` alone). Both appeared in each other's `git worktree list`, because they share one `.git`.
- **Afterwards (observed):** all three worktrees and all three `worktree-agent-*` branches were **kept**. Every one had a commit, so the remove-if-unchanged path wasn't exercised. They were never pushed. The tool result carries no kept/removed field.
- **Merge (observed):** `git merge --no-edit worktree-agent-abd13cd8f699fd088` in the lead worked ("Merge made by the 'ort' strategy", `wt-probe/W1.txt` added). The lead then pushed it to its designated branch.
- **Gotchas (observed):**
  - `.claude/` isn't gitignored. A lead running `git add -A` would stage the worktrees as embedded repos, so the lead added `.claude/worktrees/` to `.git/info/exclude`.
  - Worktree subagents added `Co-Authored-By` and `Claude-Session` trailers to their commits without being asked.
  - Subagent reports came back through a `SubagentHandback` message, not inline in the Agent tool result.

## 3. `create_session` child: has Agent and AskUserQuestion, and AskUserQuestion blocks it

- **Tool list (observed, `out-child.md`):**
  - Direct tools: Agent, Artifact, AskUserQuestion, Bash, Edit, Glob, Grep, ListAgents, Read, ReadNotifications, ReportFindings, ScheduleWakeup, SendUserFile, ShowOnboardingRolePicker, Skill, SuggestSkills, ToolSearch, Workflow, Write.
  - The `claude-code-remote` MCP tools, including `create_session`, are "still connecting" at first, then become directly callable.
  - EnterWorktree and ExitWorktree are deferred.
  - Agent's `isolation` enum is `worktree | remote`, the same as the lead's.
  - The child also had an extra MCP server (`mcp__1a59c906-…__batch/guide/update`, plus deferred create/delete/export/query/read) that the lead didn't have.
- **The lead's own tool list was the same set** (Agent and AskUserQuestion direct, isolation `worktree | remote`). Agent types: claude, claude-code-guide, Explore, general-purpose, Plan, statusline-setup.
- **Inferred:** `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1` applies inside the child too. The child is a full session with its own Agent tool, so a `create_session` child can run its own one-level fan-out of subagents. Its env wasn't read.
- **The child pushed its tool list to `claude/nestprobe-child` (observed), then called AskUserQuestion at 02:25:49Z.** From then on, `get_session` on the child returned, every time for about 5.5 minutes:
  `status=SESSION_STATUS_REQUIRES_ACTION; status_bucket=SESSION_STATUS_BUCKET_BLOCKED; post_turn_summary={"status_category":"need_input","status_detail":"Waiting on permission: AskUserQuestion","needs_action":"Approve or deny AskUserQuestion"}`.
  Even in Auto, AskUserQuestion shows up as a **pending permission**, and nothing answered it. Around 02:31, `connection_status` went from `connected` to `disconnected`.
- **`send_message` from the lead** ("Answer from lead: Blue. Please finish now.") returned `{"status":"delivered"}`. About 22 s later the child was `SESSION_STATUS_IDLE / SESSION_STATUS_BUCKET_COMPLETED`, with `worker_epoch` changed from 1 to 2. What happened, observed in `list_events`:
  - The worker restarted.
  - The pending AskUserQuestion was dropped with no `tool_result`.
  - The message arrived as a task-notification that the child read with `ReadNotifications`, as a `<cross-session-message from-session="session_01FWterKmc4p3rzCwvx4fphG">`, **not** as the answer to the question.
- **So `send_message` "clears" the block only as a side effect, by waking and restarting the worker.** The child then misreported its own history: "AskUserQuestion was never called", "asked=no". Its transcript shows the call.
- Not tested: whether `interrupt_session` clears it without a message, and whether the claude.ai UI showed an answerable question.

## 4. VM resources (observed, lead VM)

- `nproc`: 4
- `free -g`: 15 GiB total, 15 available, no swap
- `df -h /`: `/dev/vda 252G size, 9.1G used, 30G avail, 24%` (verbatim. Size and avail don't add up, presumably an overlay or quota)
- Claude Code 2.1.293 in the VM.

## 5. Choosing the cloud environment for `claude --cloud` from local

- **`--environment <environment_id>` exists, but only for self-hosted environments.** `claude --help`: "Create a new cloud session that runs on the given self-hosted environment (ccpool_...)". The binary rejects other ids with "Error: --environment expects a self-hosted environment id (ccpool_...), got <…>". It can't be combined with `--cloud <session_id|url>`.
- **For Anthropic cloud environments, the setting `remote.defaultEnvironmentId` picks the environment, and it works per launch through `--settings` (observed).** The local debug log on each launch:
  - lead, with `--settings '{"remote":{"defaultEnvironmentId":"env_011fdXavJ6U87ghgCCgmnoee"}}'`: "Using configured default environment: env_011fdXavJ6U87ghgCCgmnoee", "Selected environment: … (Mira, anthropic_cloud)"
  - Envprobe kestrel, with `env_01C2nsLM8YNe2GsPB79MDmsm`: "Using configured default environment: env_01C2nsLM8YNe2GsPB79MDmsm", "Selected environment: … (Default, anthropic_cloud)"
  - Both logs list "Available environments: env_011fdXavJ6U87ghgCCgmnoee (Mira, anthropic_cloud), env_01C2nsLM8YNe2GsPB79MDmsm (Default, anthropic_cloud)". No `defaultEnvironmentId` is set in `~/.claude/settings.json` or `~/.claude.json`, so the `--settings` value made the choice.
- From the binary (inferred): the settings schema describes `remote.defaultEnvironmentId` as "Default environment ID to use for cloud sessions". A slash command described as "Choose the default environment for cloud agents" (the `/remote-env` string sits nearby) sets it persistently. With no configured default, the CLI falls back to an `anthropic_cloud` environment or the first available one ("Configured default environment X not found, using first available").
- Environment ids are visible with `claude --debug-file <f> --cloud …`. The cloud-side `list_environments` tool would list them too (not called).

## Surprises

- Cloud sessions set `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1`, so in-VM subagents can't spawn subagents at all. Locally they can (CLI default 3).
- Worktree subagents branch from the session's start commit, not the lead's `HEAD`. Work the lead has committed since isn't in them.
- In Auto, a child's AskUserQuestion becomes a permission prompt ("Approve or deny AskUserQuestion") that blocks the child indefinitely. `send_message` doesn't answer it. It restarts the worker, which drops the call, and the child then wrongly reports it never asked.
- `create_session` children had an MCP server the CLI-launched lead lacked.
- `.claude/worktrees/` isn't ignored, so `git add -A` in a lead with live worktrees stages them as embedded repos.

## Evidence

- Sessions: lead `session_01FWterKmc4p3rzCwvx4fphG` (env Mira), child `session_01TnE4qtDH4SijE5uVkiy7GV` (parent = lead), Envprobe kestrel `session_01SXMXWkboeCxJJXwhCnUrpv` (env Default). All are safe to archive.
- Branches: `claude/nestprobe-heron-gsd2fi` (lead log, plus the merged `wt-probe/W1.txt`), `claude/nestprobe-child` (child log). Both are safe to delete once this branch is kept. The `worktree-agent-*` branches lived only in the VM.
