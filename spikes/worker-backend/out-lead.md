# Nestprobe lead log

## Step 1: VM and env
```
2026-10-08T02:25:03Z
/home/user/claude-pstack
claude/nestprobe-heron-gsd2fi
2ea8e47 Add setup line to glossary
/home/user/claude-pstack  2ea8e47 [claude/nestprobe-heron-gsd2fi]
4
               total        used        free      shared  buff/cache   available
Mem:              15           0          15           0           0          15
Swap:              0           0           0
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda        252G  9.1G   30G  24% /
2.1.293 (Claude Code)
--- env names
ANTHROPIC_BASE_URL
CLAUDECODE
CLAUDE_ADDITIONAL_DIRECTORIES
CLAUDE_AFTER_LAST_COMPACT
CLAUDE_AUTOCOMPACT_PCT_OVERRIDE
CLAUDE_AUTO_BACKGROUND_TASKS
CLAUDE_CODE_ACCOUNT_UUID
CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD
CLAUDE_CODE_ARTIFACT_ASSETS
CLAUDE_CODE_ARTIFACT_DB
CLAUDE_CODE_ARTIFACT_MULTI_FILE
CLAUDE_CODE_ARTIFACT_TYPES
CLAUDE_CODE_ARTIFACT_TYPE_CATALOG
CLAUDE_CODE_ARTIFACT_TYPE_CLOUD_CREATE
CLAUDE_CODE_BASE_REF
CLAUDE_CODE_BG_TASKS_REPORT_RUNNING
CLAUDE_CODE_CHILD_SESSION
CLAUDE_CODE_CONTAINER_ID
CLAUDE_CODE_DEBUG
CLAUDE_CODE_DIAGNOSTICS_FILE
CLAUDE_CODE_DISABLE_BUILTIN_ANTMCP
CLAUDE_CODE_ENTRYPOINT
CLAUDE_CODE_ENVIRONMENT_RUNNER_VERSION
CLAUDE_CODE_EXECPATH
CLAUDE_CODE_GZIP_REQUEST_BODIES
CLAUDE_CODE_HOLD_UNANSWERED_PARKED_PERMISSION
CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH
CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH
CLAUDE_CODE_MESSAGING_SOCKET
CLAUDE_CODE_MESSAGING_TOKEN
CLAUDE_CODE_ORGANIZATION_UUID
CLAUDE_CODE_POST_FOR_SESSION_INGRESS_V2
CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST
CLAUDE_CODE_PROXY_RESOLVES_HOSTS
CLAUDE_CODE_REMOTE
CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE
CLAUDE_CODE_REMOTE_HERMETIC_MODE
CLAUDE_CODE_REMOTE_SDK_URL
CLAUDE_CODE_REMOTE_SEND_KEEPALIVES
CLAUDE_CODE_REMOTE_SESSION_ID
CLAUDE_CODE_REMOTE_TOOLS_FORWARD
CLAUDE_CODE_SESSION_ATTENDED
CLAUDE_CODE_SESSION_ID
CLAUDE_CODE_SYNC_SESSION_REFS
CLAUDE_CODE_SYNC_SKILLS
CLAUDE_CODE_TEE_SDK_STDOUT
CLAUDE_CODE_USER_EMAIL
CLAUDE_CODE_USE_CCR_V2
CLAUDE_CODE_VERSION
CLAUDE_CODE_WORKER_EPOCH
CLAUDE_EFFORT
CLAUDE_ENABLE_STREAM_WATCHDOG
CLAUDE_PID
CLAUDE_SESSION_INGRESS_TOKEN_FILE
--- subagent vars
CLAUDE_CODE_BG_TASKS_REPORT_RUNNING=0
CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1
CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1
```

### Tools
Directly callable (at start): Agent, Artifact, AskUserQuestion, Bash, Edit, Glob, Grep, ListAgents, Read, ReadNotifications, ReportFindings, ScheduleWakeup, SendUserFile, ShowOnboardingRolePicker, Skill, SuggestSkills, ToolSearch, Workflow, Write.
claude-code-remote MCP tools (server was "still connecting" at start, then auto-loaded as directly callable): add_repo, archive_session, create_session, create_trigger, delete_trigger, fire_trigger, get_event, get_session, get_trigger, interrupt_session, list_environments, list_events, list_repos, list_sessions, list_triggers, read_documentation, register_repo_root, send_later, send_message, set_session_tags, set_session_title, subscribe_pr_activity, unarchive_session, unsubscribe_pr_activity, unwatch_url, update_trigger, watch_url.
Deferred: ArtifactComments, ArtifactData, CronCreate, CronDelete, CronList, DesignSync, EnterPlanMode, EnterWorktree, ExitPlanMode, ExitWorktree, ListConnectors, ListPlugins, ListSkills, Monitor, NotebookEdit, PushNotification, SearchMcpRegistry, SearchPlugins, SearchSkills, SendMessage, SuggestConnectors, SuggestPluginInstall, TaskCreate, TaskGet, TaskList, TaskStop, TaskUpdate, WebFetch, WebSearch, ListMcpResourcesTool, ReadMcpResourceDirTool, ReadMcpResourceTool, plus ~55 mcp__github__* tools.

- Agent: PRESENT (direct). isolation enum: ["worktree", "remote"].
- AskUserQuestion: PRESENT (direct).
- EnterWorktree / ExitWorktree: DEFERRED.
- claude-code-remote tools: PRESENT (direct after MCP connect).
- Agent types: claude, claude-code-guide, Explore, general-purpose, Plan, statusline-setup.
