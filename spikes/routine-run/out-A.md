# Routine-run probe — arm A findings

Run date (per context): 2026-10-08.

## 1. Entry

Yes. ENTRY-TOKEN: **R8V3T**.

Wrapper: the skill text arrived inside the first user turn, after the stored prompt, in this form:

```
[SCHEDULED TASK - AUTOMATED FIRING OF A CONFIGURED PROMPT]
... (scheduler preamble) ...
<command-message>routine-canary:canary-entry</command-message>
<command-name>/routine-canary:canary-entry</command-name>
<command-args>You are a probe run of a Claude Code routine, arm A. ...</command-args>
[SCHEDULED TASK - AUTOMATED FIRING OF A CONFIGURED PROMPT]
... (scheduler preamble repeated) ...

Base directory for this skill: /opt/routine-canary/spikes/routine-run/market/routine-canary/skills/canary-entry

# Canary entry

ENTRY-TOKEN: R8V3T
...
ARGUMENTS: You are a probe run of a Claude Code routine, arm A. ...
```

So: `<command-message>` / `<command-name>` / `<command-args>` tags, each block prefixed by the `[SCHEDULED TASK - AUTOMATED FIRING OF A CONFIGURED PROMPT]` banner; the skill body itself was plain text (no tags) starting with `Base directory for this skill:` and ending with `ARGUMENTS: <the prompt>`.

## 2. Other messages

No `<routine-fire-payload>` block observed. No GitHub event context (`<wake reason="external-event">`) observed.

Other blocks received (all in the same user turn, *before* the scheduled-task/prompt text unless noted):

1. System reminder with AGENTS.md (before prompt):
   > Codebase and user instructions are shown below. ... Contents of /home/user/claude-pstack/AGENTS.md (project instructions, checked into the codebase):
   > ## Agent skills
   > ### Issue tracker
   > Issues live in this repo's GitHub Issues, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.
   > ### Triage labels
   > Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.
   > ### Domain docs
   > Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
2. System reminder with user context (before prompt): `# userEmail — The user's email address is <redacted by probe>. Use it only to identify the user...` (address deliberately not copied into the repo).
3. System reminder with attribution (before prompt):
   > Attribution for git commits and pull requests you create from here on ...
   > - End git commit messages with: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> / Claude-Session: https://claude.ai/code/session_01EZkWvd3N3UCoRC1gXbfy1g
   > - End pull request descriptions with: 🤖 Generated with [Claude Code](https://claude.com/claude-code) ...
4. SessionStart hook output (after the skill body, in system context): `SessionStart:startup hook success: Canary plugin SessionStart marker: CANARY-HOOK-7m2p`
5. Environment block, deferred-tool list, agent-type list, MCP server instructions (github), skill list, auto-mode note, and `Today's date is 2026-10-08.` — all after the skill body.
6. Later, during the run: two `<system-reminder>` blocks wrapping `<agent-message from="...">` subagent hand-backs (quoted in steps 4 and 5).

## 3. Setup

`cat /var/log/routine-canary-setup.log`:
```
setup ran at 2026-10-08T05:48:04Z
Cloning into '/opt/routine-canary'...
user=root HOME=/root CLAUDE_CONFIG_DIR=<unset> DEST=/root/.claude
canary commit=1ab1b35
claude on PATH: /opt/node22/bin/claude 2.1.294 (Claude Code)
--- /root/.claude before install
total 60
drwxr-xr-x  4 root root  4096 Oct  8 05:48 .
drwx------ 13 root root  4096 Oct  8 05:48 ..
drwxr-xr-x  2 root root  4096 Oct  8 05:48 environment-manager
-rw-------  1 root root   442 Oct  8 05:48 launcher-settings.json
drwxr-xr-x  3 root root  4096 Oct  8 05:48 skills
-rwxr-xr-x  1 root root  6395 Oct  8 05:48 stop-hook-git-check.sh
-rwxr-xr-x  1 root root 25556 Oct  8 05:48 stop-hook-reply-gate.py
-rwxr-xr-x  1 root root  3630 Oct  8 05:48 user-prompt-submit-reply-reminder.py
--- settings.json env after merge
{
  "CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH": "3"
}
--- plugin install
Adding marketplace…√ Successfully added marketplace: routine-canary-market (declared in user settings)
marketplace add exit 0
Installing plugin "routine-canary@routine-canary-market"...√ Successfully installed plugin: routine-canary@routine-canary-market (scope: user)
plugin install exit 0
Installed plugins:

  > routine-canary@routine-canary-market
    Version: 0.0.1
    Read from: /opt/routine-canary/spikes/routine-run/market/routine-canary
    Scope: user
    Status: √ enabled

--- /root/.claude after install
total 72
drwxr-xr-x  6 root root  4096 Oct  8 05:48 .
drwx------ 13 root root  4096 Oct  8 05:48 ..
drwxr-xr-x  2 root root  4096 Oct  8 05:48 backups
drwxr-xr-x  2 root root  4096 Oct  8 05:48 environment-manager
-rw-------  1 root root   442 Oct  8 05:48 launcher-settings.json
drwxr-xr-x  4 root root  4096 Oct  8 05:48 plugins
-rw-r--r--  1 root root   336 Oct  8 05:48 settings.json
drwxr-xr-x  3 root root  4096 Oct  8 05:48 skills
-rwxr-xr-x  1 root root  6395 Oct  8 05:48 stop-hook-git-check.sh
-rwxr-xr-x  1 root root 25556 Oct  8 05:48 stop-hook-reply-gate.py
-rwxr-xr-x  1 root root  3630 Oct  8 05:48 user-prompt-submit-reply-reminder.py
install done at 2026-10-08T05:48:07Z
```

`ls -la ~/.claude ~/.claude/plugins`:
```
/root/.claude:
total 104
drwxr-xr-x 10 root root  4096 Oct  8 05:48 .
drwx------ 16 root root  4096 Oct  8 05:48 ..
-rw-r--r--  1 root root    24 Oct  8 05:48 .last-cleanup
drwxr-xr-x  2 root root  4096 Oct  8 05:48 backups
drwxr-xr-x  2 root root  4096 Oct  8 05:48 environment-manager
-rw-------  1 root root   442 Oct  8 05:48 launcher-settings.json
drwxr-xr-x  6 root root  4096 Oct  8 05:48 plugins
-rw-------  1 root root   214 Oct  8 05:48 policy-limits.json
-rw-------  1 root root   223 Oct  8 05:48 policy-limits.json.stamp.json
drwx------  3 root root  4096 Oct  8 05:48 projects
-rw-------  1 root root     2 Oct  8 05:48 remote-settings.json
drwxr-xr-x  3 root root  4096 Oct  8 05:48 session-env
drwx------  2 root root  4096 Oct  8 05:48 sessions
-rw-r--r--  1 root root   336 Oct  8 05:48 settings.json
drwxr-xr-x  2 root root  4096 Oct  8 05:48 shell-snapshots
drwxr-xr-x  4 root root  4096 Oct  8 05:48 skills
-rwxr-xr-x  1 root root  6395 Oct  8 05:48 stop-hook-git-check.sh
-rwxr-xr-x  1 root root 25556 Oct  8 05:48 stop-hook-reply-gate.py
-rwxr-xr-x  1 root root  3630 Oct  8 05:48 user-prompt-submit-reply-reminder.py

/root/.claude/plugins:
total 32
drwxr-xr-x  6 root root 4096 Oct  8 05:48 .
drwxr-xr-x 10 root root 4096 Oct  8 05:48 ..
drwxr-xr-x  3 root root 4096 Oct  8 05:48 cache
drwxr-xr-x  3 root root 4096 Oct  8 05:48 data
-rw-r--r--  1 root root  357 Oct  8 05:48 installed_plugins.json
-rw-r--r--  1 root root  268 Oct  8 05:48 known_marketplaces.json
drwxr-xr-x  2 root root 4096 Oct  8 05:48 marketplaces
drwxr-xr-x  3 root root 4096 Oct  8 05:48 synced
```

`cat /tmp/routine-canary/*.log`:
```
2026-10-08T05:48:09Z PLUGIN-SESSIONSTART "source":"startup" root=/opt/routine-canary/spikes/routine-run/market/routine-canary
Already up to date.
after pull: commit=1ab1b35
2026-10-08T05:48:10Z SKILLHOOK UserPromptSubmit "prompt":"/routine-canary:canary-entry
You are a probe run of a Claud
```

SessionStart marker: **yes**. It appeared in system context right after the skill body / before the environment block, as:
`SessionStart:startup hook success: Canary plugin SessionStart marker: CANARY-HOOK-7m2p`

## 4. Plugin

- `routine-canary:canary-entry` in my skill list: **no** — the skill-list reminder did not include it (it was invoked via the `/routine-canary:canary-entry` command at entry, though).
- `routine-canary:canary-agent` among Agent types: **yes** ("Canary agent for the routine-run probe. Spawned only by the probe prompt. (Tools: All tools)").
- Spawned in foreground. Reply verbatim (delivered as an `<agent-message>` hand-back):
```
AGENT-TOKEN: K2W9N
depth_env=3
agent_tool=yes
```

## 5. Depth

Top level `printenv CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`: `3` (rc=0).

Level 1 report verbatim:
```
L1 agent_tool=yes
L1 printenv=3
rc=0
L2 report (verbatim)=
(a) Agent tool available: yes. It is in my tool list, and the available agent types were listed to me. I did not spawn any agents.

(b) Verbatim output of `printenv CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH; echo rc=$?`:
```
3
rc=0
```

I did not modify any files or print any other env var.
```
No errors at either level.

## 6. Model

System prompt: "This session is configured for the model `claude-opus-5-5`" (fallbacks `claude-opus-5[1m]`, `claude-opus-4-8[1m]`); also "The exact model ID is claude-opus-5-5."

## 7. Tools and mode

Loaded: Agent, Artifact, Bash, Edit, Glob, Grep, ListAgents, PushNotification, Read, ReadNotifications, ReportFindings, ScheduleWakeup, SendUserFile, ShowOnboardingRolePicker, Skill, ToolSearch, Workflow, Write, mcp__claude-code-remote__add_repo, mcp__claude-code-remote__subscribe_pr_activity, mcp__claude-code-remote__unsubscribe_pr_activity.

Deferred: ArtifactComments, ArtifactData, CronCreate, CronDelete, CronList, DesignSync, EnterWorktree, ExitWorktree, ListConnectors, ListMcpResourcesTool, ListPlugins, ListSkills, Monitor, NotebookEdit, ReadMcpResourceDirTool, ReadMcpResourceTool, SearchMcpRegistry, SearchPlugins, SearchSkills, SendMessage, SuggestConnectors, SuggestPluginInstall, SuggestSkills, TaskCreate, TaskGet, TaskList, TaskStop, TaskUpdate, WebFetch, WebSearch, mcp__github__actions_get, mcp__github__actions_list, mcp__github__actions_run_trigger, mcp__github__add_comment_to_pending_review, mcp__github__add_issue_comment, mcp__github__add_reply_to_pull_request_comment, mcp__github__create_branch, mcp__github__create_or_update_file, mcp__github__create_pull_request, mcp__github__create_repository, mcp__github__delete_file, mcp__github__disable_pr_auto_merge, mcp__github__enable_pr_auto_merge, mcp__github__fork_repository, mcp__github__get_check_run, mcp__github__get_commit, mcp__github__get_file_contents, mcp__github__get_job_logs, mcp__github__get_label, mcp__github__get_latest_release, mcp__github__get_release_by_tag, mcp__github__get_tag, mcp__github__get_team_members, mcp__github__get_teams, mcp__github__issue_read, mcp__github__issue_write, mcp__github__list_branches, mcp__github__list_commits, mcp__github__list_issue_fields, mcp__github__list_issue_types, mcp__github__list_issues, mcp__github__list_pull_requests, mcp__github__list_releases, mcp__github__list_repository_collaborators, mcp__github__list_tags, mcp__github__merge_pull_request, mcp__github__pull_request_read, mcp__github__pull_request_review_write, mcp__github__push_files, mcp__github__request_copilot_review, mcp__github__resolve_review_thread, mcp__github__run_secret_scanning, mcp__github__search_code, mcp__github__search_commits, mcp__github__search_issues, mcp__github__search_pull_requests, mcp__github__search_repositories, mcp__github__search_users, mcp__github__sub_issue_write, mcp__github__unresolve_review_thread, mcp__github__update_issue_comment, mcp__github__update_pull_request, mcp__github__update_pull_request_branch, mcp__visualize__read_me, mcp__visualize__show_widget.

`mcp__claude-code-remote__*` tools: **yes** — add_repo, subscribe_pr_activity, unsubscribe_pr_activity. `create_session`: **not present** (loaded or deferred). (`get_session` is mentioned in the system prompt text but is not in the tool list.)

Permission mode: context says "While auto mode is active:" — i.e. auto mode. No other explicit mode string observed.

## 8. Repo

```
$ pwd
/home/user/claude-pstack
$ git remote -v | sed 's#//[^@]*@#//#'
origin	https://github.com/janrizmlibres/claude-pstack (fetch)
origin	https://github.com/janrizmlibres/claude-pstack (push)
$ git branch --show-current
claude/hopeful-curie-b7wqvk
$ git log --oneline -3
1ab1b35 Add routine-run canary fixture
e66df57 Add release and QA terms to glossary
84ec1bc Allow local worktrees in ADR 0001 and add local-only to glossary
$ git symbolic-ref refs/remotes/origin/HEAD
fatal: ref refs/remotes/origin/HEAD is not a symbolic ref
$ git status -sb
## claude/hopeful-curie-b7wqvk
```

Designated branch: `claude/hopeful-curie-b7wqvk`. Instruction quote:
> **janrizmlibres/claude-pstack**: Develop on branch `claude/hopeful-curie-b7wqvk`
> ...
> 5. **NEVER** push to a different branch without explicit permission

## 9. Push

(see below)
