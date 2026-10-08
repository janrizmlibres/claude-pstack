# Routine-run probe — arm C

## 1. Entry

Yes. ENTRY-TOKEN: **R8V3T**, from the `canary-entry` skill text.

How it arrived: inside the first user turn. The turn opened with the header `[SCHEDULED TASK - AUTOMATED FIRING OF A CONFIGURED PROMPT]` (followed by the scheduler's explanatory paragraph), then these tags:
`<command-message>routine-canary:canary-entry</command-message>`, `<command-name>/routine-canary:canary-entry</command-name>`, `<command-args>…probe prompt…</command-args>`.
After `</command-args>` the same `[SCHEDULED TASK - AUTOMATED FIRING OF A CONFIGURED PROMPT]` header and paragraph appeared again, and then the skill body came as plain text with no wrapping tags. It started `Base directory for this skill: /opt/routine-canary/spikes/routine-run/market/routine-canary/skills/canary-entry`, then `# Canary entry`, `ENTRY-TOKEN: R8V3T`, …, and ended with `ARGUMENTS: <probe prompt repeated>`.

## 2. Other messages

- **Before the prompt (same turn, preceding it):** a `<system-reminder>` holding the project instructions from `/home/user/claude-pstack/AGENTS.md`: "## Agent skills / ### Issue tracker / Issues live in this repo's GitHub Issues, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`. / ### Triage labels / Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. … / ### Domain docs / Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`."
- **Before the prompt:** a `<system-reminder>` with userEmail context (the account's email address; value withheld here).
- **Before the prompt:** a `<system-reminder>` with the attribution for git commits and PRs ("End git commit messages with: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> / Claude-Session: https://claude.ai/code/session_01RkLXFUudCA5c6yMUL815eF … End pull request descriptions with: 🤖 Generated with [Claude Code](https://claude.com/claude-code) …").
- **After the skill body:** the hook output line `SessionStart:startup hook success: Canary plugin SessionStart marker: CANARY-HOOK-7m2p`, followed by the environment block, the deferred-tools list, the agent-types list, the MCP server instructions (github) and the skills list.
- **Mid-run (after my first tool batch):** two `<system-reminder>` blocks, each holding a subagent hand-back (`<agent-message from="a7ea8fe9bcd8561d5">` and `from="a20bc52247ef5c8be"`). Their contents are quoted in sections 4 and 5.
- `<routine-fire-payload>` block: **not observed**.
- GitHub event context: **not observed**.

## 3. Setup

`cat /tmp/routine-canary/*.log`:
```
2026-10-08T05:37:00Z PLUGIN-SESSIONSTART "source":"startup" root=/opt/routine-canary/spikes/routine-run/market/routine-canary
Already up to date.
after pull: commit=1ab1b35
2026-10-08T05:47:11Z PLUGIN-SESSIONSTART "source":"startup" root=/opt/routine-canary/spikes/routine-run/market/routine-canary
From https://github.com/janrizmlibres/claude-pstack
 * [new branch]      claude/ccr-probe-lead-yjswwv -> origin/claude/ccr-probe-lead-yjswwv
 * [new branch]      claude/hopeful-curie-mz021j -> origin/claude/hopeful-curie-mz021j
 * [new branch]      probe/routine-run-push-A -> origin/probe/routine-run-push-A
 * [new branch]      research/ccr-probe -> origin/research/ccr-probe
 * [new branch]      research/marketplace-install -> origin/research/marketplace-install
Already up to date.
after pull: commit=1ab1b35
2026-10-08T05:47:13Z SKILLHOOK UserPromptSubmit "prompt":"/routine-canary:canary-entry
You are a probe run of a Claud
```

`tail -n 6 /var/log/routine-canary-setup.log`:
```
-rw-r--r--  1 root root   336 Oct  8 05:36 settings.json
drwxr-xr-x  3 root root  4096 Oct  8 05:36 skills
-rwxr-xr-x  1 root root  6395 Oct  8 05:36 stop-hook-git-check.sh
-rwxr-xr-x  1 root root 25556 Oct  8 05:36 stop-hook-reply-gate.py
-rwxr-xr-x  1 root root  3630 Oct  8 05:36 user-prompt-submit-reply-reminder.py
install done at 2026-10-08T05:36:59Z
```

SessionStart marker in context: **yes**. It arrived as `SessionStart:startup hook success: Canary plugin SessionStart marker: CANARY-HOOK-7m2p`, placed after the skill body in the first turn.

## 4. Plugin

`routine-canary:canary-agent` is listed among the agent types ("Canary agent for the routine-run probe. Spawned only by the probe prompt. (Tools: All tools)"). I spawned it in the foreground. The Agent tool result did not contain the reply; it said the report came through SubagentHandback as an agent message. That reply, verbatim:
```
AGENT-TOKEN: K2W9N
depth_env=3
agent_tool=yes
```

## 5. Depth

Top level: `printenv CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` → `3` (rc=0).

Level 1 report (verbatim):
```
L1 agent_tool=yes, L1 depth_env=3 (exit code 0), L2 reply: "Level 2 depth probe results:
- I have the Agent tool: yes. It is in my tool list, and a system reminder lists the agent types I could spawn. I did not spawn any agents.
- `printenv CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` printed `3` and exited with code 0."

Note: L2 was spawned in the foreground as general-purpose and finished without errors. Its report came back through its SubagentHandback call, delivered as an agent message, not inline in the Agent tool result.
```
Errors: none. Both foreground Agent results returned a pointer ("This agent's report was delivered to you as a message from …") rather than the report itself.

## 6. Model

The system prompt names `claude-opus-5-5`, with fallbacks `claude-opus-5[1m]` and `claude-opus-4-8[1m]`. get_session reports `configured_model` and `last_served_model` as `claude-opus-5-5`.

## 7. Tools and mode

Loaded tools: Agent, Artifact, Bash, Edit, Glob, Grep, ListAgents, PushNotification, Read, ReadNotifications, ReportFindings, ScheduleWakeup, SendUserFile, ShowOnboardingRolePicker, Skill, ToolSearch, Workflow, Write, mcp__Claude_Code_Remote__add_repo, mcp__Claude_Code_Remote__archive_session, mcp__Claude_Code_Remote__create_session, mcp__Claude_Code_Remote__create_trigger, mcp__Claude_Code_Remote__delete_trigger, mcp__Claude_Code_Remote__fire_trigger, mcp__Claude_Code_Remote__get_session, mcp__Claude_Code_Remote__get_trigger, mcp__Claude_Code_Remote__interrupt_session, mcp__Claude_Code_Remote__list_environments, mcp__Claude_Code_Remote__list_repos, mcp__Claude_Code_Remote__list_sessions, mcp__Claude_Code_Remote__list_triggers, mcp__Claude_Code_Remote__read_documentation, mcp__Claude_Code_Remote__register_repo_root, mcp__Claude_Code_Remote__send_later, mcp__Claude_Code_Remote__set_session_tags, mcp__Claude_Code_Remote__set_session_title, mcp__Claude_Code_Remote__subscribe_pr_activity, mcp__Claude_Code_Remote__unarchive_session, mcp__Claude_Code_Remote__unsubscribe_pr_activity, mcp__Claude_Code_Remote__unwatch_url, mcp__Claude_Code_Remote__update_trigger, mcp__Claude_Code_Remote__watch_url.

Deferred tools: ArtifactComments, ArtifactData, CronCreate, CronDelete, CronList, DesignSync, EnterWorktree, ExitWorktree, ListConnectors, ListMcpResourcesTool, ListPlugins, ListSkills, Monitor, NotebookEdit, ReadMcpResourceDirTool, ReadMcpResourceTool, SearchMcpRegistry, SearchPlugins, SearchSkills, SendMessage, SuggestConnectors, SuggestPluginInstall, SuggestSkills, TaskCreate, TaskGet, TaskList, TaskStop, TaskUpdate, WebFetch, WebSearch, and the GitHub MCP tools: mcp__github__actions_get, actions_list, actions_run_trigger, add_comment_to_pending_review, add_issue_comment, add_reply_to_pull_request_comment, create_branch, create_or_update_file, create_pull_request, create_repository, delete_file, disable_pr_auto_merge, enable_pr_auto_merge, fork_repository, get_check_run, get_commit, get_file_contents, get_job_logs, get_label, get_latest_release, get_release_by_tag, get_tag, get_team_members, get_teams, issue_read, issue_write, list_branches, list_commits, list_issue_fields, list_issue_types, list_issues, list_pull_requests, list_releases, list_repository_collaborators, list_tags, merge_pull_request, pull_request_read, pull_request_review_write, push_files, request_copilot_review, resolve_review_thread, run_secret_scanning, search_code, search_commits, search_issues, search_pull_requests, search_repositories, search_users, sub_issue_write, subscribe_pr_activity, unresolve_review_thread, unsubscribe_pr_activity, update_issue_comment, update_pull_request, update_pull_request_branch (every name carries the `mcp__github__` prefix).

Remote MCP tools: in my context the server's prefix is `mcp__Claude_Code_Remote__` (capitalized, underscores), not `mcp__claude-code-remote__`. Under that prefix: add_repo, archive_session, **create_session**, create_trigger, delete_trigger, fire_trigger, get_session, get_trigger, interrupt_session, list_environments, list_repos, list_sessions, list_triggers, read_documentation, register_repo_root, send_later, set_session_tags, set_session_title, subscribe_pr_activity, unarchive_session, unsubscribe_pr_activity, unwatch_url, update_trigger, watch_url. **No `send_message` tool is present.** So `create_session` is present in my tool list.
The server-side `turn_handoff.tools` from get_session names only these `mcp__claude-code-remote__*` tools: list_triggers, create_trigger, update_trigger, delete_trigger, fire_trigger, send_later, add_repo, check_repo_access, list_repos. That list has no create_session.
I called none of the forbidden tools.

get_session (`CLAUDE_CODE_REMOTE_SESSION_ID` = `cse_01RkLXFUudCA5c6yMUL815eF`). I made three calls: no id, the `cse_` id, and `session_01RkLXFUudCA5c6yMUL815eF`. All three succeeded and returned the same session (`id: session_01RkLXFUudCA5c6yMUL815eF`):
- `permission_mode`: `PERMISSION_MODE_AUTO` (`session_context.permission_mode: "auto"`)
- `session_status`: `SESSION_STATUS_RUNNING`; `status_bucket`: `SESSION_STATUS_BUCKET_WORKING`
- `origin`: `force_run_trigger`
- tags: `config:auto-create-pr:off`, `config:routine-lineage-none`, `routine:auto-mode-forced`, `routine_notify_push`
- `session_context.autofix_on_pr_create: true`; `lineage: {depth: 0, limit: 8}`
- Outcome branches: there is no `outcome_branch` field; `external_metadata.current_branches` is `{"": null}`.

Permission prompts or refusals: none observed.

## 8. Repo

```
pwd: /home/user/claude-pstack
git branch --show-current: (empty — detached HEAD)
git log --oneline -3:
e66df57 Add release and QA terms to glossary
84ec1bc Allow local worktrees in ADR 0001 and add local-only to glossary
18017b5 Add spec and plan to glossary
git status -sb: ## HEAD (no branch)
```
Designated push branch: **none named**. The system prompt mentions one only generically: "Commit or push only when the user asks. If on the default branch, branch first." and "If the pull request for your designated branch has already been merged: … Restart your designated branch from the latest default branch (keep the same branch name)". Neither names a branch. Fallback used: `claude/routine-run-C`.

## 9. Push

Commit `b040a7f` ("Add routine-run probe findings (arm C)"), on branch `claude/routine-run-C`, created from the detached HEAD `e66df57`.

`git push -u origin claude/routine-run-C` was **accepted** (rc=0):
```
remote: 
remote: Create a pull request for 'claude/routine-run-C' on GitHub by visiting:        
remote:      https://github.com/janrizmlibres/claude-pstack/pull/new/claude/routine-run-C        
remote: 
To https://github.com/janrizmlibres/claude-pstack
 * [new branch]      claude/routine-run-C -> claude/routine-run-C
branch 'claude/routine-run-C' set up to track 'origin/claude/routine-run-C'.
```

`git push origin HEAD:refs/heads/probe/routine-run-push-C` (a branch outside `claude/`) was also **accepted** (rc=0):
```
remote: 
remote: Create a pull request for 'probe/routine-run-push-C' on GitHub by visiting:        
remote:      https://github.com/janrizmlibres/claude-pstack/pull/new/probe/routine-run-push-C        
remote: 
To https://github.com/janrizmlibres/claude-pstack
 * [new branch]      HEAD -> probe/routine-run-push-C
```

## Summary

`entry=R8V3T setup=yes(CANARY-HOOK-7m2p in context; logs present) plugin_agent=yes(AGENT-TOKEN K2W9N) depth_L2=ok(env=3, L2 has Agent tool) model=claude-opus-5-5 remote_tools=present(mcp__Claude_Code_Remote__*, create_session yes, send_message no) mode=auto(PERMISSION_MODE_AUTO, origin force_run_trigger) claude_push=accepted other_push=accepted`
