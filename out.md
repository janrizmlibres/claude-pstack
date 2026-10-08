## Step 1
```
$ date -u +%FT%TZ; git branch --show-current; git log --oneline -1
2026-10-08T03:14:30Z
claude/depthprobe-otter-probe-k45f0u
d8eff85 Probe: raise subagent spawn depth via project settings
$ printenv CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH; echo exit=$?
3
exit=0
$ cat .claude/settings.json 2>/dev/null; echo exit=$?
{"env":{"CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH":"3"}}
exit=0
$ cat ~/.claude/settings.json 2>/dev/null | sed -E 's/("[^"]*(TOKEN|KEY|SECRET|PASS|AUTH|COOKIE)[^"]*"[[:space:]]*:[[:space:]]*)"[^"]*"/\1"<redacted>"/Ig'; echo exit=$?
exit=0
$ claude --version 2>&1
2.1.293 (Claude Code)
$ for p in $(pgrep -f claude); do echo "pid $p: $(tr '\0' '\n' < /proc/$p/environ 2>/dev/null | grep -E '^CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=')"; done
pid 84: 
pid 105: CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1
pid 109: CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1
pid 416: CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=3
pid 429: CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=3
```
Lead Agent tool: yes (direct)

## Step 2: Agent reply (L1, verbatim)
```
(1) Yes, I can call the Agent tool directly. My tools are Agent, Artifact, Bash, Edit, Glob, Grep, ListAgents, Read, ReportFindings, SendUserFile, ShowOnboardingRolePicker, Skill, SuggestSkills, ToolSearch, Write, SubagentHandback and mcp__claude-code-remote__*. Deferred: SendMessage, Task*, WebFetch, WebSearch, Monitor, mcp__github__* and others.

(2)
3
exit=0

(3) I called Agent (general-purpose, foreground, no isolation) with the level-2 prompt, and it worked without error.

CHILD REPLY:
(1) Yes, the Agent tool is directly callable. Tools: Agent, Artifact, Bash, Edit, Glob, Grep, ListAgents, Read, ReportFindings, SendUserFile, ShowOnboardingRolePicker, Skill, SuggestSkills, ToolSearch, Write, SubagentHandback, mcp__claude-code-remote__* (add_repo, archive_session, create_session, create_trigger, delete_trigger, fire_trigger, get_event, get_session, get_trigger, interrupt_session, list_environments, list_events, list_repos, list_sessions, list_triggers, read_documentation, register_repo_root, send_later, send_message, set_session_tags, set_session_title, subscribe_pr_activity, unarchive_session, unsubscribe_pr_activity, unwatch_url, update_trigger, watch_url). Also deferred: SendMessage, Task*, WebFetch, WebSearch, Monitor, mcp__github__* and others.

(2) Output:
3
exit=0

(3) N is 2, not 1, so I did not spawn a child agent.
```
Note: the Agent tool result itself said the report arrived via a SubagentHandback message (agentId a88a743818569db77), not inline in the tool result.

SUMMARY arm A: lead_depth=3; L1_agent=yes; L1_depth=3; L2_spawned=yes; L2_depth=3; error=none
