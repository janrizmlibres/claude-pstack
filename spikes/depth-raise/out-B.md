# Depthprobe wren (arm B)

## Step 1
```
$ date -u +%FT%TZ; git branch --show-current; git log --oneline -1
2026-10-08T03:14:29Z
claude/depthprobe-wren-wqq6s8
2ddbb97 Settle worker backends in ADR 0001 and add sub-lead to glossary
$ printenv CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH; echo exit=$?
1
exit=0
$ cat .claude/settings.json 2>/dev/null; echo exit=$?
exit=1
$ cat ~/.claude/settings.json (redacted); echo exit=$?
exit=0
$ claude --version 2>&1
2.1.293 (Claude Code)
$ for p in $(pgrep -f claude); do ...; done
pid 81: CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1
pid 85: CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1
pid 95: CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1
pid 322: CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1
```

Lead has Agent tool: yes (directly callable).

## Step 2: L1 reply (verbatim)
```
(1) No. The Agent tool isn't directly callable, and it isn't in the deferred list either. Tools I have: Artifact, Bash, Edit, Glob, Grep, ListAgents, Read, ReportFindings, SendUserFile, ShowOnboardingRolePicker, Skill, SuggestSkills, ToolSearch, Write, SubagentHandback, plus the mcp__claude-code-remote__* tools. Deferred: ArtifactComments, ArtifactData, Cron*, DesignSync, Enter/ExitWorktree, ListConnectors, MCP resource tools, Monitor, NotebookEdit, PushNotification, Search*/Suggest*, SendMessage, Task*, WebFetch, WebSearch and mcp__github__*.

(2) Output:
1
exit=0

(3) N was 1, but I have no Agent tool, so I couldn't spawn a child. No call was made and there is no CHILD REPLY.
```

SUMMARY arm B: lead_depth=1; L1_agent=no; L1_depth=1; L2_spawned=no; L2_depth=n/a; error=none
