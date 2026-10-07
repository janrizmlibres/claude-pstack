# Session-tools permission probe: lead instructions

You are one **arm** of a probe. Your launch prompt names your `ARM` (A, B1, B2, C or D) and, for arm A only, a list `OTHER_SESSIONS` of other arms' session ids.

**Goal:** find out which way of granting `mcp__claude-code-remote__*` tools stops the claude.ai "Allow …?" permission prompt, so that a cloud lead can fan out with nobody clicking. Nobody is watching this session. If a tool call waits on a permission prompt, nobody will approve it. That is an expected outcome, and the progress file you pushed before the call is how the outcome gets observed. So follow the push discipline below exactly.

Do not change any settings file, permission mode or allow list yourself. Do not open a PR. Record facts, not guesses. Mark anything inferred as inferred.

## Push discipline

Keep one log file, `spikes/session-tools-perms/out-<ARM>.md`. After **every** numbered step below, and **immediately before** every call to a `mcp__claude-code-remote__*` tool, append a line to it, commit, and push:

```
git add -A && git commit -qm "perms probe <ARM>: <step>" && git push -q origin HEAD:refs/heads/probe/perms-<ARM-lowercase>-out
```

The line before a remote-tool call reads `ABOUT TO CALL <tool> at <UTC time>`. The line after reads `RETURNED <tool> at <UTC time>: <one-line gist>`, or `DENIED <tool>: <verbatim reason>` if the call was refused. Paste raw tool output into the log as fenced blocks. Trim anything over ~3 KB, but keep the fields named below verbatim.

## Steps (all arms)

1. **Environment.** Run and log: `date -u +%FT%TZ`, `whoami`, `claude --version`, `git branch --show-current`, `git log --oneline -1`, `cat .claude/settings.json`, `cat ~/.claude/settings.json` (it may be absent), `env | grep -iE '^[^=]*(permission|allowed|claude_code)' | sed 's/=.*/=<value omitted>/'` (names only).

**Never write the value of any token, secret, key or credential to the log.** This repo is public. Log variable names only.
2. **Load the tools.** Run `ToolSearch` with query `+claude-code-remote` and `max_results` 30. Log how many tools loaded.
3. **Own mode.** Call `get_session {}` (no id), then `list_events` on your own session id with `kinds: ["system"]` and `limit: 5`. Log your session id, `lineage`, and from the `init` system event: `permissionMode`, and any field that lists allowed or pre-approved tools. Then call `list_events` on yourself with `kinds: ["control_request"]`, `limit: 20`, and log whether any permission request has been raised so far.
4. **Spawn a child.** Call `create_session` with:
   - `source_url: "https://github.com/janrizmlibres/claude-pstack"`, `source_revision: "main"` (main has no `.claude/settings.json`, so the child's only grant is what you pass it)
   - `title: "perms probe <ARM> child X"`
   - `extra_allowed_tools: ["mcp__claude-code-remote__send_message", "mcp__claude-code-remote__get_session", "mcp__claude-code-remote__list_events", "mcp__claude-code-remote__create_session"]`
   - `prompt`: the CHILD PROMPT below, with `<NAME>` = `<ARM>-X`.
   Log the full return value.
5. **Watch the child.** Every ~30 s for up to 5 minutes (use `sleep 30` in Bash; if that is blocked, use `Monitor` with an until-loop), call `get_session` on the child. Log each `session_status`, `status_bucket` and `post_turn_summary.needs_action`. Stop early once the bucket reads COMPLETED or FAILED, or once it has read BLOCKED twice in a row. Then call `list_events` on the child with `kinds: ["system", "control_request", "result"]`, `limit: 30`, and log the child's `permissionMode`, every `control_request` (tool name and subtype), and its final `result` text.
6. **Message the child.** Call `send_message` with the child's id and message `lead ping <ARM>`. Log the return value.
7. **Read your inbox.** Call `ReadNotifications` (load it with ToolSearch if it is deferred). Log what arrived.

Arm-specific steps follow. Then do **Finish**.

## Arm A only

8. **Child without a grant.** Repeat step 4 with `title: "perms probe A child Y"`, `<NAME>` = `A-Y`, and **no** `extra_allowed_tools`. Repeat step 5 for it.
9. **Other arms.** For each id in `OTHER_SESSIONS`, call `get_session` and log `session_status`, `status_bucket`, `post_turn_summary` (whole object) and `lineage`. Then call `list_events` with `kinds: ["system", "control_request"]`, `limit: 30`, and log its `permissionMode` from the `init` event and every `control_request` (tool name). If the init event lists allowed tools or a permission-related setting, log that verbatim.
10. **Routine.** Call `create_trigger` with `name: "perms probe routine"`, `initiation: "own_followup"`, `create_new_session_on_fire: true`, no `cron_expression` and no `run_once_at`, and `prompt`: the CHILD PROMPT with `<NAME>` = `routine`, and with `@parent` replaced by your own session id. Log the result. Call `fire_trigger` with its id. Log the result. Find the fired session (from the fire result, or `list_sessions` with `limit: 5`) and watch it as in step 5. Log its `permissionMode`, its `control_request` events, its repo/branch (`get_session` `session_context`), and its final text. Then call `delete_trigger` (this also deletes the session the Routine started, so log everything first).

## Arm D only

8. **An unlisted tool.** `set_session_title` is not in this branch's allow list. Call it on your own session with `title: "perms probe D (renamed)"`. Log whether it ran, was denied at once (verbatim reason), or hung. If it hangs, nothing after this step will run, and the log shows that.

## Finish

Append a `## Summary` to the log with: your arm, your `permissionMode`, which remote-tool calls ran without a prompt, which raised a `control_request`, the child's (and for A, child Y's and the routine session's) outcome, and anything surprising. Commit and push. Then end your turn.

## CHILD PROMPT

```
You are a probe child named <NAME>. Nobody is watching this session. Do not change any settings. Steps:
1. Run ToolSearch with query "+claude-code-remote" and max_results 30.
2. Call mcp__claude-code-remote__get_session with no arguments. Note your session id and lineage.
3. Call mcp__claude-code-remote__send_message with session_id "@parent" and message "<NAME> alive".
4. Call mcp__claude-code-remote__list_events on your own session id with kinds ["system"] and limit 3, and note permissionMode from the init event.
5. End with a final message: "<NAME> FINAL: mode=<permissionMode>; send_message=<ran|denied: reason>".
Do not create any sessions, push or edit files.
```
