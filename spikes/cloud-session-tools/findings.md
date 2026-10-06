# Cloud session tools probe — findings

Lead session: `session_01K52547PxV5PrmorXj79Fw9` (title "Cloud session tools probe"), environment `env_011fdXavJ6U87ghgCCgmnoee` ("Mira").
Started 2026-10-06T16:15:01Z.

Status: IN PROGRESS (step 1 done).

## Start state (lead)

```
$ hostname            -> vm
$ pwd                 -> /home/user/claude-pstack
$ git branch --show-current -> claude/probe-cloud-session-tools-x4zh0g
$ git log --oneline -1      -> 412e0b5 Add agent skill docs and domain glossary
$ ls -la ~/.claude (names)
  .last-cleanup backups environment-manager launcher-settings.json plugins projects
  session-env sessions shell-snapshots skills stop-hook-git-check.sh
  stop-hook-reply-gate.py user-prompt-submit-reply-reminder.py
$ ls ~/.claude/skills ~/.claude/agents ~/.claude/plugins
  /root/.claude/plugins: synced
  /root/.claude/skills:  session-start-hook synced
  (~/.claude/agents does not exist)
```

`get_session` (no id) on self returned `"lineage":{"depth":0,"limit":8}` — a nesting
depth cap of 8 is reported. Self `turn_handoff.tools` also lists
`mcp__claude-code-remote__check_repo_access`, which was NOT exposed to me as a tool.

## Tools

The `mcp__claude-code-remote__*` tools were deferred (MCP server still connecting at
start). One `ToolSearch` query `+claude-code-remote` (max 30) loaded all 27.
Full list:

add_repo, archive_session, create_session, create_trigger, delete_trigger,
fire_trigger, get_event, get_session, get_trigger, interrupt_session,
list_environments, list_events, list_repos, list_sessions, list_triggers,
read_documentation, register_repo_root, send_later, send_message,
set_session_tags, set_session_title, subscribe_pr_activity, unarchive_session,
unsubscribe_pr_activity, unwatch_url, update_trigger, watch_url

Not present: no tool to read the *parent* session id / "message my parent"
(send_message has `to: "parent"` / `session_id: "@parent"` but documented as
STANDING sessions only), no environment-variables param on create_session
(its description mentions `environment_variables` but the schema has no such field).

### Verbatim descriptions and schemas

See `schemas.md` in this directory (kept separate because it is long).

## Caps / limits mentioned in descriptions

- `create_session`: `clone_depth` default 50; `permission_mode` "Cannot be more permissive than
  the calling session's mode"; `extra_allowed_tools` — "the child never carries a grant its parent lacks";
  'plan' mode blocks waiting for human approval. Child failure is reported as `<child-session-event>`
  "where enabled"; "a session that finishes cleanly does not report back".
- `get_session` on self: `lineage.limit = 8` (nesting depth).
- `list_events`: limit default 20, max 100.
- `list_sessions`: limit default 20, max 100; tags max 16.
- `list_environments`: default 20, max 100. `list_repos`: default 50, max 200.
- `list_triggers`: default 20, max 100.
- `send_message`: message bounded to 64 KiB; attachments max 16 (project channel sessions only).
- `fire_trigger`: text bounded to 64 KiB.
- `create_trigger`/`update_trigger`: cron minimum interval "normally hourly (some projects allow shorter)".
- `send_later`: one-minute granularity, min delay 1 minute.
- `set_session_title`: max 500 chars.
- `watch_url`: "A watch ends when the session ends".

## Environments

`list_environments` returned:
```
{"environments":[{"environment_id":"env_011fdXavJ6U87ghgCCgmnoee","name":"Mira","description":"","state":"active","kind":"anthropic_cloud","created_at":"2026-10-06T12:42:26.534716Z"},{"environment_id":"env_01C2nsLM8YNe2GsPB79MDmsm","name":"Default","description":"Default - trusted network access","state":"active","kind":"anthropic_cloud","created_at":"2026-10-05T07:22:00.542515Z"}],"has_more":false}
```
Model: `create_session.model` is a free string, "Defaults to the calling session's model". No enum is given.

## Raw log

1. Bash env commands (above).
2. `ToolSearch {"query":"+claude-code-remote","max_results":30}` -> 27 tool schemas (see schemas.md).
3. `get_session {}` ->
```
{"ccr":{"id":"session_01K52547PxV5PrmorXj79Fw9", "title":"Cloud session tools probe", "session_status":"SESSION_STATUS_RUNNING", "created_at":"2026-10-06T16:14:48.784240Z", "updated_at":"2026-10-06T16:15:10.002593Z", "environment_id":"env_011fdXavJ6U87ghgCCgmnoee", "session_context":{"sources":[{"git_repository":{"url":"https://github.com/janrizmlibres/claude-pstack", "revision":"main"}}], "outcomes":[{"git_repository":{"git_info":{"repo":"janrizmlibres/claude-pstack", "branches":["claude/probe-cloud-session-tools-x4zh0g"]}}}], "model":"<configured model id>"}, "origin":"claude_code_cli", "connection_status":"connected", "tags":["config:auto-create-pr:off", "config:meta-mcp-own-entry"], "external_metadata":{"container_cc_version":"2.1.291", "context_usage":{"max_tokens":1000000, "used_tokens":0}, "cross_session_inbound":"available", "current_branches":{"":"claude/probe-cloud-session-tools-x4zh0g"}, "last_served_model":"<configured model id>", "rate_limit_info":{"isUsingOverage":false, "rateLimitType":"five_hour", "resetsAt":1791305400, "status":"allowed"}, "turn_handoff":{"no_query_first":true, "staged_files":true, "tools":["Bash", "Write", "Edit", "Read", "Glob", "Grep", "Agent", "NotebookEdit", "WebFetch", "WebSearch", "TaskStop", "SearchMcpRegistry", "SuggestConnectors", "ListConnectors", "Artifact", "mcp__claude-code-remote__list_triggers", "mcp__claude-code-remote__create_trigger", "mcp__claude-code-remote__update_trigger", "mcp__claude-code-remote__delete_trigger", "mcp__claude-code-remote__fire_trigger", "mcp__claude-code-remote__send_later", "mcp__claude-code-remote__add_repo", "mcp__claude-code-remote__check_repo_access", "mcp__claude-code-remote__list_repos"], "v":1, "worker_epoch":1}}, "unread":true, "environment_kind":"anthropic_cloud", "status_bucket":"SESSION_STATUS_BUCKET_WORKING", "configured_model":"<configured model id>"},"lineage":{"depth":0,"limit":8}}
```
(model id redacted to keep model identifiers out of the repo.)
4. `list_environments {}` -> (above).
