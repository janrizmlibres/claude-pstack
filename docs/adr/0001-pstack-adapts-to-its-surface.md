---
status: accepted
---

# pstack adapts to the surface it runs on

No surface is primary. A run's lead is whichever session the user invokes `/pstack:poteto-mode` in, local or cloud, and the user may hand the run off to a session on the other surface at any point, with any input: a spec, a file, or the task verbatim. Each playbook adapts to the surface its lead is on and refuses only where that surface genuinely cannot do the work.

The one absolute rule: **no git worktrees on the user's machine**, for any lead or worker, because they consume local storage. A scratch clone counts as a worktree under this rule.

## Consequences

- **A cloud lead fans out through in-VM subagents by default.** Read-only roles work in the lead's checkout. Code-writing and competing roles get `isolation: "worktree"`, which the rule allows because it covers only the user's machine. The VM pins the spawn depth at 1, so the setup line writes `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=3` into the VM's user settings: a settings-file `env` block overrides the pin, and the in-VM tree then nests like a local one. A sub-lead, such as an Autopilot owner, is an in-VM subagent that runs its own panels. A worktree subagent starts from the session's start commit, not the lead's HEAD, so its brief names the lead's HEAD and its first step moves to it.
- **A cloud lead in Auto mode** also starts `create_session` workers, each on its own VM, for a worker that needs a whole machine. Workers inherit Auto, and the lead reads their transcripts back and polls for completion. Auto is the only route that pre-approves `create_session` and `send_message`. Worker briefs must keep clear of what its classifier refuses (pushes outside the session's branch, credential-adjacent reads), because three consecutive refusals stall a session until a human answers. A worker that asks the human stalls the same way, and the lead can't clear it.
- **A cloud lead not in Auto** still runs, on in-VM subagents only, sub-leads included. Each `create_session` call would wait on a human click, so the lead never makes one and says once that Auto would allow separate-VM workers.
- **A local lead** works in the user's checkout. Read-only subagents fan out freely, and code-writing subagents run in parallel only when each owns a disjoint set of files. Competing attempts at the same code (arena runners, races, parallel prototypes, orchestrate units) can't share one checkout, so by default they go to cloud workers: `claude --cloud --permission-mode auto` under a pseudo-terminal, in the user's default cloud environment, after the lead pushes the run's base. The lead reads those workers' results only from what they push. Work that needs the user's machine stays local: local UI or CLI checks, local transcripts, simulators, IDE state, auth that exists only there. Competing attempts whose result is an artifact outside the checkout, such as a design package, run locally in parallel, each into its own scratch directory. The laptop stays on for the run.
- **Local-only is opt-in.** The user asks for it per run in plain words ("local only", "no cloud workers"). The lead also falls back to it, and says so once, when it can't start cloud workers: Auto isn't available on the account, no default cloud environment is set, or a launch fails. Under local-only, competing attempts at the same code run one at a time, each on its own local branch. Branches are not worktrees.
- **Hand-off is the user's choice, never a default.** The entry point pushes the input first, because a cloud session sees only pushed work, and keeps no control afterwards. A cloud session can't message a local one, so a done status comes back only by polling GitHub or watching the session.

## Not viable

These stay out until Claude Code changes:

- Local subagents making competing edits to the same files in parallel under a local lead (the no-worktree rule). Such work goes to cloud workers, or runs one at a time under local-only.
- `Agent` with `isolation: "remote"`, on either surface: locally it makes a worktree cut from `main`, and in cloud it shares the lead's checkout.
- A cloud lead running work that needs the user's machine: local UI or CLI checks, simulators, local transcripts, auth that exists only there.
- A cloud session reporting to a local session. Messaging runs only local to cloud.
- A Routine-fired session as a lead: it has no `claude-code-remote` tools and no repo.

## Considered options

- **Cloud lead primary, with hand-off as the default** (this ADR's first version). Rejected: the user works from both surfaces and starts runs from either, so a rule that one surface's constraints win made the other a fallback for no reason the facts required.
- **Local lead primary.** Rejected for the same reason. Its worktree subagents are also ruled out by the no-worktree rule.
- **A local lead starts cloud workers only when the user asks in that run** (this ADR's second version). Rejected: the user mostly works with cloud workers, and upstream defaults its workers to cloud, so asking every run made the common case the opt-in.
