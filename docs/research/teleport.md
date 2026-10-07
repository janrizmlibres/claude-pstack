# What `claude --teleport` brings back to a local session

Question: issue #34. Docs research only: `claude --teleport` was not run. Checked 2026-10-07 against the Claude Code docs at code.claude.com and the changelog up to v2.1.292 (the installed CLI is 2.1.292).

## Short answer

Teleport is a **one-time, interactive copy** of a cloud session into the local terminal. It checks out the session's **pushed branch** and loads the **full conversation history**, and from then on the local copy is a separate session: "new work there stays local and doesn't appear in the cloud session." It is a fork, not a move and not a live view. Nothing in the docs says it stops the cloud session. It does not give a script a cloud lead's status or report.

The documented way for a local session to *hear back* from a cloud session is **cross-session messaging over Remote Control**. While a local session is connected to Remote Control, `ListAgents` lists your cloud sessions and `SendMessage` can reach them with a reply address. A reply that reaches an idle local session starts a new turn there.

## Sources

| Key | URL |
|---|---|
| WEB | https://code.claude.com/docs/en/claude-code-on-the-web |
| GLOSS | https://code.claude.com/docs/en/glossary (entry "Teleport") |
| CLI | https://code.claude.com/docs/en/cli-reference |
| CMDS | https://code.claude.com/docs/en/commands |
| RC | https://code.claude.com/docs/en/remote-control |
| XSM | https://code.claude.com/docs/en/cross-session-messaging |
| TOOLS | https://code.claude.com/docs/en/tools-reference (`ListAgents` row) |
| SDK | https://code.claude.com/docs/en/agent-sdk/typescript ("Task-notification subkinds", "Peer origin fields") |
| CL | https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md |

Context7 (`/websites/code_claude`) returned the same WEB and GLOSS passages quoted below.

## 1. What teleport brings into the local terminal

- **Conversation:** yes, all of it. "When you teleport a session, Claude verifies you're in the correct repository, fetches and checks out the branch from the cloud session, and loads the full conversation history into your terminal." (WEB, "From cloud to terminal") The glossary adds that it "resumes from the cloud session's last state" (GLOSS).
- **Branch:** yes, but only once it has been pushed. Teleport requirements table: "Branch available: The branch from the cloud session must have been pushed to the remote. Teleport automatically fetches and checks it out." (WEB, "Teleport requirements") Since v2.0.41 it also sets the upstream branch (CL 2.0.41: "Teleporting a session from web will automatically set the upstream branch").
- **Cloud working tree:** no. Teleport fetches a git branch from the remote. Nothing in the docs copies the VM's files, so uncommitted or unpushed work in the cloud VM does not come back. *(Inferred from the "Branch available" requirement. No doc says this outright.)*
- **The local working tree must be clean.** "Your working directory must have no uncommitted changes. Teleport prompts you to stash changes if needed." (WEB) Since v2.1.243, `claude --teleport <session>` offers the stash instead of exiting (CL 2.1.243).
- **Other preconditions** (WEB, "Teleport requirements"): run it from a checkout of the same repository (not a fork), signed in to the same claude.ai account. It needs claude.ai subscription auth, not an API key (WEB, "`--teleport` is unavailable"). The branch fetch never waits for input: if git or ssh would prompt, the fetch fails, and "the checkout then works only if your local clone already has the branch" (WEB; CL 2.1.285).
- `--teleport` is not `--resume`: "`--resume` reopens a conversation from this machine's local history and doesn't list cloud sessions; `--teleport` pulls a cloud session and its branch." (WEB)

## 2. Move, fork, or read-only?

**It forks.** The local session is a writable copy, and the cloud session is a separate session from then on.

- "The terminal gets its own copy of the session: new work there stays local and doesn't appear in the cloud session on claude.ai or the Claude mobile app. To keep steering from your phone after teleporting, start `/remote-control` in the local session." (WEB)
- From the CLI, handoff runs one way, cloud to terminal: "you can pull cloud sessions into your terminal with `--teleport`, but you can't push an existing terminal session to the cloud." (WEB, note under "Move tasks between terminal and cloud")
- The changelog treats the two copies as separate. Remote Control had been uploading a teleported session into the connected session, so it "appeared appended to the original on phone and web", and v2.1.261 fixed that (CL 2.1.261).
- With Remote Control on, after `/teleport` "the connected device doesn't receive the pulled conversation's earlier history. New messages in both directions go to and from the pulled conversation, which is now the one open in your terminal." (RC, "What connected devices see")
- **Does the cloud copy stop?** The docs never say teleport stops, pauses or archives the cloud session. The "own copy" wording points to the cloud session staying as it was, still open on claude.ai and still able to take messages. *(Inferred. Not stated.)*

## 3. Running, finished, paused or reclaimed sessions; TTY; scripts

- **Finished session:** documented. "When a session completes, you can create a PR from claude.ai/code or teleport the session to your terminal to continue working." (WEB, "Run tasks in parallel")
- **Running session:** neither allowed nor refused in the CLI docs. The VS Code extension can pull a session that is still working: v2.1.283 "Fixed a session teleported from the web dropping the messages sent while Claude was working" (CL). Whether the cloud turn in progress keeps running after the pull isn't documented. Since teleport makes a copy, it probably does. *(Inferred.)*
- **Paused / expired / reclaimed VM:** teleport isn't covered for this case. The docs say an expired environment keeps its conversation history: "Cloud sessions stop after a period of inactivity and the session's VM is reclaimed … Reopen the session from claude.ai/code to provision a fresh VM. Restored: your conversation history. Not restored: background work that was still running when the VM was reclaimed, such as subagents and shell commands." (WEB, "Environment expired") Teleport reads the conversation from the account and the branch from the git remote. Neither lives on the VM, so teleport should work on a reclaimed session as long as its branch was pushed. *(Inferred. Not stated.)*
- **Archived session:** teleport isn't covered. An archived session refuses new messages: "cloud session <id> is archived and cannot accept new messages" (WEB, error table).
- **Infrastructure:** "`--teleport` connects through the same Remote Control session infrastructure that cloud sessions use, so authentication and session-expiry errors surface with Remote Control wording. You may see `Remote Control session expired` or `Access denied`." (WEB, troubleshooting)
- **TTY:** everything documented is interactive. `claude --teleport` with no ID opens "an interactive session picker", and `claude --teleport <session-id>` "resume[s] a specific session directly" into the terminal (WEB). The CLI reference describes it as "Resume a cloud session in your local terminal" (CLI), and `claude --help` on 2.1.292 prints `--teleport [session]  Resume a teleport session, optionally specify session ID`. The stash step is a dialog (CL 2.1.281 lists "`/teleport`'s uncommitted-changes and login prompts" among dialogs). In-session variants: `/teleport` or `/tp` (picker), `/tasks` then `t`, and "Open in > Terminal" on claude.ai/code, which copies the command (WEB, CMDS).
- **Scripts:** no documented `-p` / non-interactive form of teleport, and no JSON output for it. `-p` + `--cloud <id>` sends a message and exits, but it "exits without waiting for a reply" (WEB, "Send follow-ups from the CLI"). *(Not documented: whether `claude -p --teleport <id> "<prompt>"` works.)*

## 4. Getting a cloud lead's status or report back locally, without GitHub

| Route | What the docs say | Fit for a local `/poteto-mode` entry point |
|---|---|---|
| **Cross-session messaging over Remote Control** | A local session connected to Remote Control can list and message your cloud sessions: `ListAgents` shows "your cloud sessions … while this session is connected to Remote Control" and labels them `cloud` (TOOLS; XSM; CL 2.1.229: "labels your cloud sessions as `cloud`"). A message to the cloud goes "Through Anthropic servers, straight to the cloud session" (XSM). "Once delivered, … the receiving Claude can reply to the sender the same way, except in the one-way cross-machine case". The one-way case is a send from a session not connected to Remote Control, which carries no reply address (XSM). Replies from the cloud arrive "through Remote Control" as `peer` messages (SDK, "Peer origin fields"). Delivery: "When the receiving session is idle, Claude Code starts a new turn with the message." (XSM) Requires v2.1.224+ and claude.ai sign-in (XSM, "Availability"). | **Best documented fit.** The local session turns on Remote Control (`claude --rc`, `/remote-control`, or "Enable Remote Control for all sessions" (RC)) and keeps running. It sends the hand-off to the cloud lead with a reply address, and the lead's reply wakes it. `notify_when_idle` won't do this: it is "only to your sessions on this machine" (XSM). |
| **Teleport** | One-time copy of conversation + branch (section 1). | Gets the lead's final transcript locally, but by hand: interactive, and a fork. Not a status channel. |
| **`claude -p "<msg>" --cloud <id>`** | Queues a message, prints `{ok, session_id, url}` with `--output-format json`, no reply (WEB). | Send-only. |
| **Projects** | "One ongoing conversation at claude.ai/code or in the desktop app. Claude starts parallel sessions called threads … and shows you which ones need you." (docs overview table for [Projects](https://code.claude.com/docs/en/claude-projects)) | Not a terminal surface, so it doesn't fit a local entry point. |
| **Channels** | Push external events into a session (XSM "Related resources" → https://code.claude.com/docs/en/channels). Research preview. | Would need the lead to post to some endpoint. Not researched further. |

Cross-session messaging caveats:
- The local session has to stay running and connected. Remote Control sessions "run directly on your machine … your computer has to stay on and the `claude` process has to keep running." (RC) A message to an `offline` Remote Control session "arrives only after that session's machine reconnects." (XSM)
- Inbound controls: by default a session that prompts for permissions accepts messages. A session that bypasses permissions holds them for approval unless the sender also bypasses. `crossSessionInbound: "accept"` delivers everything (XSM, "Control inbound messages"). A held message in an unattended `-p` session expires after `dialogExpiry`, five minutes by default (XSM, "Non-interactive sessions").
- `isolatePeerMachines: true` puts a human approval in front of every cross-machine send (XSM).
- Cloud sessions also have a separate server-side `send_message` tool for messaging each other. Its deliveries carry a `peer-send-message` subkind, which is not the cross-session `SendMessage` tool (SDK, "Task-notification subkinds"). An earlier probe on this map saw these arrive in cloud as queued notifications.
- **Not documented:** whether a cloud session can *start* a conversation with a local Remote Control session that never messaged it first. The docs only cover replying to a sender's reply address, and listing "your Remote Control sessions on other machines" from a session connected to Remote Control. Whether a cloud session counts as "connected to Remote Control" for that listing isn't stated. Test it before relying on the lead messaging first.

## Not found / not documented

- Whether teleport stops, pauses or archives the cloud session. It only says the terminal gets "its own copy".
- Whether a cloud turn still in progress keeps running after teleport, and whether teleport is refused for a running session in the CLI. The VS Code changelog shows a pull of a session that was still working.
- Teleport on a paused, expired/reclaimed or archived session.
- A non-interactive or `-p` form of `--teleport`, or any JSON output from it.
- Whether a cloud session can message a local Remote Control session first, without a reply address.
- Whether `/tasks` in a local session shows status for cloud sessions it started. WEB says to "run `/tasks` to see your background sessions, then press `t` to teleport into one". CMDS describes `/tasks` as "background work in the current session".
