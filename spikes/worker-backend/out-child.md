# nestprobe child output

- UTC time: 2026-10-08T02:25:45Z
- pwd: /home/user/claude-pstack
- branch: claude/nestprobe-child

## Tools callable directly (initial list)
Agent, Artifact, AskUserQuestion, Bash, Edit, Glob, Grep, ListAgents, Read, ReadNotifications, ReportFindings, ScheduleWakeup, SendUserFile, ShowOnboardingRolePicker, Skill, SuggestSkills, ToolSearch, Workflow, Write

## Tools that became directly callable after MCP servers connected
mcp__1a59c906-04da-521d-bda7-7f71b9f9e01c__batch, mcp__1a59c906-04da-521d-bda7-7f71b9f9e01c__guide, mcp__1a59c906-04da-521d-bda7-7f71b9f9e01c__update, mcp__claude-code-remote__add_repo, mcp__claude-code-remote__archive_session, mcp__claude-code-remote__create_session, mcp__claude-code-remote__create_trigger, mcp__claude-code-remote__delete_trigger, mcp__claude-code-remote__fire_trigger, mcp__claude-code-remote__get_event, mcp__claude-code-remote__get_session, mcp__claude-code-remote__get_trigger, mcp__claude-code-remote__interrupt_session, mcp__claude-code-remote__list_environments, mcp__claude-code-remote__list_events, mcp__claude-code-remote__list_repos, mcp__claude-code-remote__list_sessions, mcp__claude-code-remote__list_triggers, mcp__claude-code-remote__read_documentation, mcp__claude-code-remote__register_repo_root, mcp__claude-code-remote__send_later, mcp__claude-code-remote__send_message, mcp__claude-code-remote__set_session_tags, mcp__claude-code-remote__set_session_title, mcp__claude-code-remote__subscribe_pr_activity, mcp__claude-code-remote__unarchive_session, mcp__claude-code-remote__unsubscribe_pr_activity, mcp__claude-code-remote__unwatch_url, mcp__claude-code-remote__update_trigger, mcp__claude-code-remote__watch_url

## Deferred tools named in system reminders
ArtifactComments, ArtifactData, CronCreate, CronDelete, CronList, DesignSync, EnterPlanMode, EnterWorktree, ExitPlanMode, ExitWorktree, ListConnectors, ListPlugins, ListSkills, Monitor, NotebookEdit, PushNotification, SearchMcpRegistry, SearchPlugins, SearchSkills, SendMessage, SuggestConnectors, SuggestPluginInstall, TaskCreate, TaskGet, TaskList, TaskStop, TaskUpdate, WebFetch, WebSearch, ListMcpResourcesTool, ReadMcpResourceDirTool, ReadMcpResourceTool, mcp__1a59c906-04da-521d-bda7-7f71b9f9e01c__{create,delete,export,query,read}, mcp__github__* (actions_get, actions_list, actions_run_trigger, add_comment_to_pending_review, add_issue_comment, add_reply_to_pull_request_comment, create_branch, create_or_update_file, create_pull_request, create_repository, delete_file, disable_pr_auto_merge, enable_pr_auto_merge, fork_repository, get_check_run, get_commit, get_file_contents, get_job_logs, get_label, get_latest_release, get_me, get_release_by_tag, get_tag, get_team_members, get_teams, issue_read, issue_write, list_branches, list_commits, list_issue_fields, list_issue_types, list_issues, list_pull_requests, list_releases, list_repository_collaborators, list_tags, merge_pull_request, pull_request_read, pull_request_review_write, push_files, request_copilot_review, resolve_review_thread, run_secret_scanning, search_code, search_commits, search_issues, search_pull_requests, search_repositories, search_users, sub_issue_write, unresolve_review_thread, update_issue_comment, update_pull_request, update_pull_request_branch)

## Explicit
AskUserQuestion: present
Agent: present
claude-code-remote tools: present (initially "still connecting"; became directly callable after a ToolSearch)
Agent isolation values: worktree, remote
