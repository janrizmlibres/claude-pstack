---
status: accepted
---

# pstack adapts to the surface it runs on

No surface is primary. A run's lead is whichever session the user invokes `/pstack:poteto-mode` in, local or cloud, and the user may hand the run off to a session on the other surface at any point, with any input: a spec, a file, or the task verbatim. Each playbook adapts to the surface its lead is on and refuses only where that surface genuinely cannot do the work.

The one absolute rule: **no git worktrees on the user's machine**, for any lead or worker, because they consume local storage. A scratch clone counts as a worktree under this rule.

## Consequences

- **A cloud lead fans out through in-VM subagents by default.** Read-only roles work in the lead's checkout. Code-writing and competing roles get `isolation: "worktree"`, which the rule allows because it covers only the user's machine. These subagents can't nest: the VM pins the spawn depth at 1, so the in-VM tree is flat. A worktree subagent starts from the session's start commit, not the lead's HEAD, so its brief names the lead's HEAD and its first step moves to it.
- **A cloud lead in Auto mode** also starts `create_session` workers, each on its own VM, for a worker that must fan out itself or needs a whole machine. Workers inherit Auto, and the lead reads their transcripts back and polls for completion. Auto is the only route that pre-approves `create_session` and `send_message`. Worker briefs must keep clear of what its classifier refuses (pushes outside the session's branch, credential-adjacent reads), because three consecutive refusals stall a session until a human answers. A worker that asks the human stalls the same way, and the lead can't clear it.
- **A cloud lead not in Auto** still runs, on in-VM subagents only. Each `create_session` call would wait on a human click, so the lead never makes one and says once that Auto would allow separate-VM workers.
- **A local lead** works in the user's checkout. Read-only subagents fan out freely, and code-writing subagents run in parallel only when each owns a disjoint set of files. Competing attempts at the same code (arena runners, races, parallel prototypes) can't share one checkout, so by default the lead runs them one at a time, each on its own local branch. Branches are not worktrees. Competing attempts whose result is an artifact outside the checkout, such as a design package, run in parallel, each into its own scratch directory. The lead starts cloud workers (`claude --cloud --permission-mode auto` under a pseudo-terminal, in the user's default cloud environment) only when the user asks for them in that run, and reads those workers' results only from what they push. The laptop stays on for the run.
- **Hand-off is the user's choice, never a default.** The entry point pushes the input first, because a cloud session sees only pushed work, and keeps no control afterwards. A cloud session can't message a local one, so a done status comes back only by polling GitHub or watching the session.

## Not viable

These stay out until Claude Code changes:

- Local subagents making competing edits to the same files in parallel under a local lead (the no-worktree rule). Such work runs one at a time or goes to cloud workers.
- Nested in-VM subagents under a cloud lead: the VM pins the spawn depth at 1. A worker that must fan out itself runs as a separate session.
- `Agent` with `isolation: "remote"`, on either surface: locally it makes a worktree cut from `main`, and in cloud it shares the lead's checkout.
- A cloud lead running work that needs the user's machine: local UI or CLI checks, simulators, local transcripts, auth that exists only there.
- A cloud session reporting to a local session. Messaging runs only local to cloud.
- A Routine-fired session as a lead: it has no `claude-code-remote` tools and no repo.

## Considered options

- **Cloud lead primary, with hand-off as the default** (this ADR's first version). Rejected: the user works from both surfaces and starts runs from either, so a rule that one surface's constraints win made the other a fallback for no reason the facts required.
- **Local lead primary.** Rejected for the same reason. Its worktree subagents are also ruled out by the no-worktree rule.
