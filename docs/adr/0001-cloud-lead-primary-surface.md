---
status: accepted
---

# Cloud lead is the primary surface for v1

Where local and cloud pull apart (worker backend, concurrency, test lock, distribution), the cloud lead's constraints win. A run's lead runs by default in a Claude Code cloud session in Auto mode and fans out through `create_session` workers. Only a cloud session has the `claude-code-remote` tools, which give each worker its own VM, start it from a pushed branch, and let the lead read its full transcript and status. A local lead can reach cloud workers only through `claude --cloud` under a pseudo-terminal and must read their results from pushed branches. Upstream pstack is shaped the same way: cloud workers by default, local as the named exception.

## Consequences

- **The local session is the entry point, not the lead.** The user still starts and talks to pstack locally. When the run is ready to execute, the local session pushes the spec and hands off with `claude --cloud --permission-mode auto "<brief>"`. The cloud lead gets only what was pushed and briefed, not the local conversation.
- **Hand-off is the default.** A run stays local only when it needs the user's machine (live checks against a local UI or CLI, local transcripts, simulators, auth that exists only on that machine) or when the user asks for local.
- **Auto mode is required for unattended fan-out.** No other route pre-approves `create_session` and `send_message`: allow rules, `dontAsk`, `--allowedTools` and claude.ai "Always allow" all still prompt. Workers inherit Auto. Worker briefs must keep clear of what Auto's classifier refuses (pushes outside the session's branch, credential-adjacent reads), because three consecutive refusals stall the session until a human answers.
- **A local lead stays supported.** Every playbook still runs to completion on it, adapting rather than refusing: worktree subagents, a test lock, narrower fan-out.
- **The same rule holds for any surface that can't do what upstream does.** A cloud subagent has no `Agent` tool, so it owns its diff directly instead of delegating further.

## Reopen when

This is a v1 call. Syncs treat it as fixed until one of these happens:

1. Auto mode stops being available, or its classifier proves unworkable for worker briefs (repeated refusal stalls, or workers unable to push).
2. Local sessions gain the `claude-code-remote` tools, which would put a local lead on equal footing.
3. Cloud fan-out costs too much of the subscription's usage to be the default.
4. Upstream drops cloud fan-out.

## Considered options

- **Local lead primary** with worktree subagents, or with `claude --cloud` workers. Rejected: those workers share the laptop's RAM and need a test lock, cloud results come back only as pushed branches, and closing the laptop ends the run.
- **Split by playbook** (fan-out playbooks in cloud, single-agent playbooks local). Rejected: single-agent playbooks run fine under either lead, so the split only adds a rule every sync must re-check.
