# Can Claude Projects act as orchestrate's coordinator?

Research for issue #8. This file records facts and a fit table. It makes no decision. The decision belongs to the later grilling ticket (#26).

Researched 2026-10-06. Projects are a public beta, so everything below can change. Each claim cites a numbered source from the [Sources](#sources) list. When no primary source says something, the claim is marked **unknown**. Sources [9]–[11] are feature requests users filed on Anthropic's GitHub. They describe behaviour the filers observed, not documented behaviour, and are labelled **user-reported** wherever they are used.

## 1. What upstream's coordinator does

Upstream's `orchestrate` playbook is part of the `poteto-mode` skill [1]. Its helper is the `orch` CLI in `scripts/orch/` [2]. Between them they give the coordinator these duties:

| # | Duty | Upstream detail |
|---|---|---|
| D1 | Be a standing chat | One local "standing coordinator chat" runs a multi-day program. It frames the work, writes briefs, drains the inbox, makes the calls and owns the report to the human. It never authors or edits code [1, Roles and placement]. |
| D2 | Spawn workers | Workers and verifiers run with `environment: "cloud"` by default. They run locally only for a fixed list of exceptions (control-ui/cli verification, local transcripts, simulators, auth that exists only on this machine). Agents are spawned, resumed and drained only through the Task tool [1, Roles and placement]. |
| D3 | Brief every spawn | Each spawn carries a full brief (GOAL, SCOPE, CONTEXT, ACCEPTANCE, VERIFY, TIMEBOX, FORBIDDEN, REPORT, STANDING). Missing fields mean the coordinator refuses to spawn. "Every spawn and every resume carries the standing orders verbatim" [1, intro; The brief]. |
| D4 | Choose models | A unit's verifier runs "on a different model family from its worker" [1, Roles and placement; Verification]. |
| D5 | Read results | Completions are queue events, not interrupts. On each completion the coordinator runs `orch inbox push`. It drains in batches at four drain points and never reviews a diff inside a drain [1, Queue and drain]. |
| D6 | Hold the store | `orchestrate/<slug>/` holds `preferences.md`, `overview.md`, `units.tsv`, `frontier.json`, `ledger.tsv`, `inbox/`, `gates.md`, `decisions.tsv` and `status.md`. Every file has one writer. Reads and writes go through `bun scripts/orch/orch.ts` [1, Store layout]. Its commands are `init`, `unit add/set/get/list/counts`, `ledger record/check/summary`, `inbox push/drain/count`, `gate park/list/resolve`, `frontier set/show`, `standing show/add` and `status`, and the store is guarded by a pid lock file [2]. |
| D7 | Run sub-coordinators | Sub-coordinators are local and durable, one per track, used only past "one drain" of load. Each spawns its own workers. "Nesting works to depth 3, and a nested spawn has the full Task schema including `environment`". They roll up results at wave boundaries [1, Roles and placement]. |
| D8 | Cap in-flight work | "Cap in-flight children at what one drain can process, roughly ten, as a rolling window" [1, Roles and placement; Steps 4]. |
| D9 | Kill switch | When spawning would produce garbage, "write a stop line at the top of the standing orders, let in-flight work finish, fix the cause, clear it" [1, Liveness and failure]. |
| D10 | Wake on a heartbeat | A frontier watcher wake is armed "via the loop skill, with a long heartbeat fallback" [1, Queue and drain]. |
| D11 | Check liveness and recover | Probe read-only and never resume a worker to check on it. Write synthetic postmortems for silent deaths. Retry by failure mode. After a restart, reattach cloud work by PR and branch [1, Liveness and failure]. |
| D12 | Land and stack | The coordinator may land a verified unit mechanically itself (fast-forward or clean cherry-pick, then push). One stacker per stack runs `gt`, and restacks run in the cloud [1, Roles and placement; Stack safety]. |
| D13 | Escalate and report | Human gates are parked in `gates.md`. The reply at each checkpoint is built from the tables [1, Escalation]. |

## 2. What Claude Code Projects are

### Shape

- A project is "one ongoing conversation where Claude coordinates a stream of related work". It starts a **thread** for each task [3, intro].
- The **project conversation** is "one long-running session where Claude acts as coordinator. It takes what you send, decides what becomes a thread, and keeps track of every thread it started. It sees what threads report back, not every step they take." [3, How a project is organized].
- **Threads** are "the workers. Each is a separate session with its own context window that does one piece of work and reports back to the conversation when it finishes." A cloud thread works on its own branch and can open a PR [3, How a project is organized].
- A thread is a cloud session by default. If you ask, it can run on your computer through Remote Control [3, intro; Run a thread on your own computer].
- Anthropic's launch post: "Projects have threads that do the work and a coordinator that directs them". Each thread is "a Claude Code cloud session working on its own branch and copy of the repo". The post was published 2026-09-17 [4].

### Creating a project

- You create a project at claude.ai/code, in the desktop app's Code tab, or in the mobile app. You can start from scratch with the **New project** dialog (only a name is required; a goal and context are optional), or from a cloud session with **Continue as project** or **Move to project** [3, Create a project].
- Prerequisites: a Pro or Max plan, code on github.com, push access, and the Claude GitHub App installed on each repository. A `/web-setup` token is not enough for project threads [3, Check the prerequisites; 5].
- On your first project, the coordinator takes a turn by itself after you create it, and that turn uses your plan [3, Start a new project from scratch].

### What the coordinator can do

The docs describe the coordinator's abilities only as behaviour. They publish no tool list for it.

| Ability | Status | Evidence |
|---|---|---|
| Start threads | Documented | New work "goes to a new thread or to a thread already working in that area". Several unrelated tasks in one message become separate threads. The coordinator can also propose **Suggested threads** and wait for you to start them [3, Send work and read results]. |
| Read thread results | Documented, but summary-level by default | "It sees what threads report back, not every step they take" [3, How a project is organized]. When asked, "Claude reads each thread and answers in the conversation" [3, Threads guessed or stalled]. A thread's full results stay in the thread [3, Send work and read results]. User-reported: on mobile, a project thread shows only messages, a to-do list and a PR button, not the commands it ran [11]. |
| Message a running thread | Documented, by routing | A follow-up in the project conversation reaches a thread "only when Claude matches the follow-up to that thread". A message typed in the thread's own box goes straight to it [3, Open a thread when you need control]. |
| Answer a thread's permission prompt | Not possible | The prompt lives inside the thread. "Telling Claude in the project conversation to go ahead doesn't reach it" [3, Unblock a thread waiting on approval]. |
| Use connectors (MCP) | Not possible | "The project conversation itself has no connectors" [3, Get skills, plugins, connectors, and tools into threads]. |
| Read and write project memory | Documented | You can ask Claude to remember or forget things "in the project conversation or any cloud thread" [3, Give a project standing context]. User-reported: the coordinator uses a memory tool for this [10]. |
| Edit project instructions and add repositories | Documented | "ask Claude to change the instructions"; "ask Claude in the conversation to add a repository to the project" [3, Give a project standing context]. |
| Create routines | Documented | Scheduled work requested in a project becomes a routine that "runs as threads in that project" [3, How projects relate to other Claude Code features]. |
| Run a shell, its own filesystem or git | **Unknown** | Not documented. User-reported: the coordinator "can attach the repo to itself mid-session, but only for that session" [9]. |
| Choose a model per thread | Documented | Defaults are set in **Project settings > General**. "To use a different model for one task, ask for it in the task" [3, Choose models and let Claude manage context]. All models come from Anthropic [3, Limitations]. |

### Nesting

- A thread can use subagents: "a thread can still use subagents for its own side tasks" [3, How projects relate to other Claude Code features]. The launch post adds that "each thread can further split its delegated work into pieces using subagents, loops, and workflows" [4]. Agent teams can run "inside a cloud session" [3, How projects relate to other Claude Code features].
- **Unknown:** whether a thread can start further project threads, or act as a coordinator itself. No source describes a coordinator below the project conversation.
- A thread belongs to the one project that started it. Threads cannot be moved between projects, and projects cannot be merged [3, Limitations].

### How many threads

- "There's no fixed number; Claude starts as many as the work calls for, and a limit you ask for is a preference rather than a cap. The enforced limit is 200 new threads per day across your projects." [3, What draws on your plan].
- A limit like "Run at most two threads at a time" is something Claude saves to project memory and keeps to. It is not an enforced setting: "a thread limit you give this way isn't a hard cap" [3, Tune how Claude runs a project].

### Persistent state and files

| Store | What it holds | Limits and behaviour |
|---|---|---|
| Project instructions | "Text sent to each new thread and to Claude in the project conversation" | Up to 16,000 characters. Changes "reach new threads, not threads already running" [3, Give a project standing context; Project settings reference]. |
| Project memory | Notes kept as files. "Every cloud thread reads the index file `MEMORY.md` when it starts and opens the other files when it needs them" | Editable in **Project settings > Memory**. Separate from local auto memory and from repo `CLAUDE.md` [3, Give a project standing context]. A thread on your own computer starts "not with its memory files loaded" [3, Run a thread on your own computer]. User-reported: such threads cannot read or write project memory at all [10]. |
| Library | Files you add, plus files that threads produce | Threads read uploads under `/mnt/project-files`. You can add up to 100 files and 2 GB per pick, at most 480 MB per file, and at most 10 folders. Uploads are copies [3, Give a project standing context; Add files and folders]. **Unknown:** whether a thread or the coordinator can overwrite a Library file in place. |
| Repositories | Branches and PRs on GitHub | Pausing, archiving or deleting a project does not touch them [3, Pause, archive, or delete a project]. |
| Thread sandbox | The thread's working tree | "A cloud thread's sandbox pauses between turns … If the sandbox can't be resumed, the thread continues from a fresh clone, so uncommitted changes can be lost." [3, Limitations]. |

### Lifetime

- The conversation "works from recent messages, recent threads, and project memory rather than its full history, so it keeps going for as long as the project runs". Threads compact automatically [3, Choose models and let Claude manage context].
- Threads are marked **Resolved** "automatically after a week with no activity", and you can reopen them [3, See what needs you in Overview].
- Cloud threads keep running after you close your laptop. A thread on your computer runs only while that computer is awake [3, intro].
- **Pause** interrupts every thread and the conversation. **Archive** stops running threads and routines. **Delete** is permanent but leaves GitHub untouched [3, Pause, archive, or delete a project].
- **Restart Claude** reconnects the coordinator when it stops replying. "Threads aren't affected" [3, Claude hasn't responded].
- User-reported: the coordinator session itself gets replaced "for an upgrade or an age limit, which happens routinely and invisibly" [9]. Not documented.

### Skills, agents and CLAUDE.md

- **Threads:** every cloud thread clones every repository in the project. It loads `CLAUDE.md` and `.claude/skills/`, `.claude/agents/` and `.claude/commands/` from each one. Permission rules, hooks and `env` from `.claude/settings.json` apply only in a single-repository project. Plugins declared in a repo's settings do not load; add them under **Project settings > Plugins** instead [3, What threads pick up from your repositories; Get skills, plugins, connectors, and tools into threads]. Threads also load the skills enabled on your claude.ai account [3, same]. Nothing comes from the local machine's Claude Code setup [3, How a project is organized].
- **Coordinator:** the docs do not say that the coordinator loads repository `CLAUDE.md`, skills or agents. They say only that it receives the project instructions [3, Give a project standing context]. User-reported: the coordinator "does not" load them, and "the coordinator can't have hooks of its own" [9]. **Unknown** officially.
- For scale: upstream's `orchestrate.md` is 16,779 bytes [1]. That is more than the 16,000-character limit on project instructions [3].

### CLI access

- "Projects are available at claude.ai/code, in the desktop app, and in the Claude mobile app, not in the terminal CLI, the VS Code extension, or the JetBrains plugin, and not through Amazon Bedrock, Google Cloud's Agent Platform, or Microsoft Foundry." [3, Limitations].
- "A local session doesn't have these options." Local sessions cannot join a project [3, Start from an existing cloud session; Limitations].
- Two adjacent mechanisms exist for plain cloud sessions. `claude -p "<msg>" --cloud <session-id>` queues one message into a cloud session [5, Send follow-ups from the CLI]. Cross-session messaging can reach cloud sessions from a session connected to Remote Control [6, Message sessions on other machines]. **Unknown:** whether either one accepts a project conversation's id or a project thread's id.
- The Managed Agents API also has "session threads" spawned "by the coordinator" [8]. That is a separate API product, and no source links it to Claude Code Projects.

### Pricing and limits

- Public beta on Pro and Max, rolling out gradually. Not yet available on Team or Enterprise [3, note; 4].
- Projects have no separate price. Usage "counts against the same plan limits as your other Claude Code sessions, and a project can't spend past those limits on its own" unless usage credits are turned on. When a thread hits a limit, it waits and continues after the reset [3, Usage and cost].
- What uses the plan: running threads (each a full session), the coordinator's own tokens, and idle threads that wake when CI or reviews arrive on their PRs. An idle project uses nothing [3, What draws on your plan].
- New projects default to Opus. Threads run at high effort and the coordinator at low effort [3, Choose models and let Claude manage context].
- Routines, which are the only scheduled wake available, have a minimum interval of one hour [7, schedule trigger].

## 3. Fit: orchestrate's coordinator duties against Projects

The verdicts mean:

- **Supported:** Projects does it natively.
- **Workaround:** possible with instructions or a different mechanism, at the cost noted.
- **Unsupported:** documented as not possible.
- **Unknown:** no primary source says.

| Duty | Verdict | Basis |
|---|---|---|
| D1 Standing coordinator chat that outlives sessions | **Supported** | The long-running project conversation keeps going "for as long as the project runs" [3]. Unlike upstream's coordinator, it is remote, not local. |
| D2 Spawn cloud workers | **Supported** | The coordinator starts threads, which are cloud sessions [3]. |
| D2 Spawn a local worker for the exception list | **Workaround** | Use a Remote Control thread on your computer. It needs Claude Code ≥ v2.1.280, the machine awake, and Require trusted devices turned off, and it starts without project memory [3]. |
| D2 Spawn and drain only through tools the coordinator controls | **Unknown** | Thread starts are documented as behaviour. The coordinator's tool interface is not published [3]. |
| D3 Standing orders verbatim on every spawn | **Supported** | Project instructions go to every new thread, up to 16,000 characters [3]. |
| D3 Standing orders verbatim on every resume | **Workaround** | Instruction edits reach new threads only [3]. The coordinator would have to paste them into each follow-up, by instruction. |
| D3 Full brief template, refuse to spawn on missing fields | **Workaround** | Enforced only by instruction. Projects has no brief schema. **Unknown:** whether the coordinator passes your exact text or its own rewording to a thread [3]. |
| D4 Verifier on a different model family | **Unsupported** | Only Anthropic models are available [3, Limitations]. Workaround: a different Anthropic model or effort per task [3]. |
| D5 Read worker results | **Supported** | Threads report back to the conversation. The coordinator can read each thread when asked [3]. |
| D5 Completions as queue events, batched drains, `orch inbox` | **Workaround** | Reports arrive in the conversation by themselves [3]. Batching and inbox discipline would exist only as instructions. Projects has no inbox file. |
| D6 Hold the single-writer store through the `orch` CLI | **Unknown / workaround** | Whether the coordinator can run `bun` or write files is undocumented. A user report says it can attach a repo to itself [9]. Candidate homes: project memory files [3], Library files (overwrite semantics unknown) [3], or the store committed to a repo branch by one bookkeeper thread. Memory is free-form notes, not a single-writer table. |
| D7 Sub-coordinators per track, nesting to depth 3 | **Unsupported as documented** | The docs describe one coordinator and worker threads. Whether threads can start project threads is **unknown**. Workaround: a thread fans out internally with subagents, workflows or agent teams [3, 4], but those are not project threads and do not appear in Overview. Separate projects per track cannot be linked or merged [3]. |
| D8 In-flight cap (~10, rolling window) | **Workaround** | A cap you ask for "isn't a hard cap". The only enforced limit is 200 new threads per day [3]. |
| D9 Kill switch: stop new spawns, let in-flight finish | **Workaround** | **Pause** is a hard stop that interrupts in-flight work [3], which is the opposite of upstream's soft stop. A soft stop ("start no new threads") is an instruction, not an enforced setting [3]. |
| D10 Heartbeat or frontier watcher wake | **Workaround** | Project routines run as threads, with a minimum interval of one hour [3, 7]. Idle threads wake on CI or review activity on their PRs [3]. **Unknown:** whether a routine or a thread report wakes the coordinator on a schedule. |
| D11 Read-only liveness probes | **Supported** | The Overview pane shows each thread's state (Working, Waiting on you, Idle, Resolved…), and you can ask for a status of every thread [3]. Reviving a thread idle past the cache lifetime re-reads its whole conversation [3]. |
| D11 Restart recovery | **Supported** | Cloud threads persist, and Restart Claude leaves threads untouched [3]. User-reported: the coordinator is silently replaced from time to time [9]. |
| D12 Coordinator lands a verified unit itself | **Unknown** | The coordinator's git and GitHub access is undocumented, and it has no connectors [3]. Workaround: the **Merge it** button, or a landing thread [3]. |
| D12 One stacker per stack running `gt` in the cloud | **Workaround** | A dedicated thread with `gt` installed by the environment's setup script [3]. Threads branch from the default branch unless told otherwise [3]. |
| D13 Escalate to the human | **Supported, with a gap** | **Waiting on you** and desktop notifications cover escalation. Permission prompts can be answered only inside the thread, not through the coordinator [3]. |
| D13 Checkpoint report built from tables | **Workaround** | Overview and on-demand status are native [3]. Reports built from tables depend on D6. |
| Coordinator loads the port's skills and the orchestrate playbook | **Unknown, leaning unsupported** | Threads load repo skills, agents and `CLAUDE.md`, and project plugins [3]. The coordinator receives project instructions only (16,000-character cap, smaller than upstream's playbook). A user report says it loads no repo files [9]. |
| Drive the coordinator from the CLI | **Unsupported** | "not in the terminal CLI" [3]. **Unknown:** whether `claude -p --cloud <id>` or cross-session messaging reach project sessions [5, 6]. |
| Plans the port must support | **Constraint** | Pro and Max only during the beta. Not Team, Enterprise, Bedrock, Vertex or Foundry [3]. |

## What stays unknown

1. The coordinator's actual tool set: shell, filesystem, git, `gh`, the Task tool, and whether its thread-start call takes a brief we control word for word.
2. Whether a thread can start project threads, which is the sub-coordinator question.
3. Whether the coordinator loads repository `CLAUDE.md`, skills or agents. The only evidence is a user report that it does not [9].
4. Whether Library files can be overwritten in place, which bears on a single-writer store.
5. Whether a routine, or anything other than a thread report or a human message, can wake the coordinator on a schedule.
6. Whether `claude -p --cloud <session-id>` or cross-session messaging can address a project conversation or thread.
7. When and how the coordinator session gets replaced. This is user-reported [9] and undocumented.

## Sources

All sources were accessed 2026-10-06.

1. Upstream `orchestrate` playbook, cursor/plugins @ `df58112`: https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/playbooks/orchestrate.md
2. Upstream `orch` CLI, cursor/plugins @ `df58112`: https://github.com/cursor/plugins/tree/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/scripts/orch (`orch.ts`, `store.ts`)
3. Claude Code docs, "Let Claude coordinate ongoing work with Projects": https://code.claude.com/docs/en/claude-projects
4. Anthropic blog, "Projects redesigned: from folder to conversation", 2026-09-17: https://claude.com/blog/projects-redesigned
5. Claude Code docs, "Use Claude Code in the cloud": https://code.claude.com/docs/en/claude-code-on-the-web
6. Claude Code docs, "Message your other Claude Code sessions": https://code.claude.com/docs/en/cross-session-messaging
7. Claude Code docs, "Automate work with routines": https://code.claude.com/docs/en/routines
8. Claude API reference, "Get Session Thread" (Managed Agents beta): https://platform.claude.com/docs/en/api/beta/sessions/threads/retrieve
9. anthropics/claude-code#99610, "Projects (beta): persistently load the attached repo (CLAUDE.md, skills, hooks) into the coordinator session" (open feature request, user-reported): https://github.com/anthropics/claude-code/issues/99610
10. anthropics/claude-code#97464, "Projects: threads running on a local folder (Remote Control) can't read or write project memory" (open feature request, user-reported): https://github.com/anthropics/claude-code/issues/97464
11. anthropics/claude-code#97690, "Projects beta: full execution details for project threads" (open feature request, user-reported; says a thread on mobile shows only messages, a to-do list and a PR button): https://github.com/anthropics/claude-code/issues/97690

The Claude Code changelog (https://code.claude.com/docs/en/changelog) has no entries about Projects as of v2.1.291. The v2.1.280 minimum for local threads is stated only in [3].
