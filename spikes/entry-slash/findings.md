# Entry-slash probe: findings

Questions: (1) does a hidden project skill (`disable-model-invocation: true`) expand when a cloud session's initial prompt starts with `/<skill>`, and do its frontmatter hooks fire? (2) the same for a `create_session` child's prompt; (3) how can a local process holding only `git`, `gh` and the `claude` CLI find a cloud worker's branch and result?

Run 2026-10-07, 14:31–14:38Z, Claude Code 2.1.292 locally, Max account, environment "Mira" (`env_011fdXavJ6U87ghgCCgmnoee`). Three cloud sessions, all in Auto mode. Nobody clicked anything in claude.ai.

## Setup

- Probe branch `probe/entry-slash` adds `.claude/skills/probe-entry/SKILL.md` (copy: `probe-entry.SKILL.md` in this directory). It sets `disable-model-invocation: true` and two frontmatter hooks. A `UserPromptSubmit` command hook appends `<UTC> HOOKFIRED UserPromptSubmit "prompt":"<first 40 chars>"` to `.probe/hook.log`. A `PreToolUse` hook on `Bash` appends `<UTC> PRETOOLHOOK Bash`. The body holds `ENTRY-TOKEN: Q7Z4K`, which appears in no prompt.
- **Lead:** launched locally from a worktree checked out on `probe/entry-slash`, with `script -q <file> claude --permission-mode auto --cloud "$(cat LEAD-PROMPT.txt)"`. The prompt's first line is `/probe-entry` (`LEAD-PROMPT.txt`).
- **Child:** the lead called `create_session` with `source_revision: "probe/entry-slash"`, `permission_mode: "auto"`, `outcome_branch: "claude/entry-slash-child"`, and `CHILD-PROMPT.txt` verbatim as the prompt (first line `/probe-entry`).
- **Naming session:** launched locally with `-n "zebra quartz worker"` and a prompt starting "Pelican lighthouse naming probe", to see where the branch name comes from.
- Raw logs: `out-lead.md` and `out-child.md`, copied from the sessions' branches.

## 1. Slash expansion in a CLI-launched cloud lead: yes

- The model received the skill expanded, as a normal user message: `<command-message>probe-entry</command-message>`, `<command-name>/probe-entry</command-name>`, `<command-args>…rest of prompt…</command-args>`, then `Base directory for this skill: /home/user/claude-pstack/.claude/skills/probe-entry` and the body with `ENTRY-TOKEN: Q7Z4K`. The lead logged the token in its first Bash call. The transcript shows no Read, `cat` or `grep` of `SKILL.md` before that call.
- The init event's `skills` and `slash_commands` lists both include `probe-entry`, even with `disable-model-invocation: true`.
- **The stored transcript keeps the raw text.** `list_events` shows the first `user` event as the plain string `/probe-entry\nYou are the LEAD…`, with no tags and no body. The CLI inside the VM does the expansion. A reader of `list_events` can't tell from the user event alone that a skill was entered.
- **Hooks:** `UserPromptSubmit` fired on the entry turn (`14:31:59Z HOOKFIRED … "prompt":"/probe-entry\nYou are the LEAD`). `PreToolUse` then logged every Bash call for the rest of the session. A later turn sent from local with `claude -p "<msg>" --cloud <id>` fired `UserPromptSubmit` again (`14:36:19Z HOOKFIRED … "prompt":"Later turn from local: …`). A turn started by the cloud's own Stop-hook feedback ("There are untracked files…") did not fire it.

## 2. Slash expansion in a `create_session` child: yes, but framed as a system notification

- The child knew `Q7Z4K` and logged it in its first Bash call, without reading any file. The lead confirmed from the child's `list_events` that its only turn-1 tool calls were two Bash calls (write the log; commit and push), and neither touched `SKILL.md`.
- The stored first user event is the raw `/probe-entry\n…` string (`inbound_origin: mcp_create_session`). The child's init `skills` list includes `probe-entry`.
- **The child model saw the expansion wrapped as two `<system-reminder>` blocks headed "[SYSTEM NOTIFICATION - NOT USER INPUT] This is an automated background-task event, NOT a message from the user."** One block carried the command tags and args, the other the skill body. The result event's `origin.kind` is `task-notification`. It ran the skill anyway, but a skill that tells the model "the user asked for X" may carry less weight in a child than in a lead.
- **Hooks:** `UserPromptSubmit` fired on the child's entry turn (`14:32:55Z … "prompt":"/probe-entry\nYou are the CHILD session`). It fired again on the later turn the lead triggered with `send_message("turn 2 ping from lead")` (`14:34:31Z`). On that later turn the hook's `prompt` was a `<task-notification>\n<task-type>queued-r…` wrapper, not the message text. The child picked up the message with `ReadNotifications`, and it reached the model inside `<cross-session-message from-session="session_01RHDEXvmXA6fqMTf39A5Vou">`. `PreToolUse` fired on every child Bash call.
- The fallback (a second `send_message` whose text is `/probe-entry`) wasn't needed, so it wasn't tested. Inferred: such a message would arrive as notification data through `ReadNotifications` and would not be slash-expanded.
- **`outcome_branch` counts as the child's designated branch.** In Auto, the child's `git push origin HEAD:claude/entry-slash-child` went through on both turns (`[new branch]`, then `0dcefcf..4b173af`), with no denial. This settles the open question in `spikes/session-tools-perms/findings.md`.
- `create_session`'s return value has no `permission_mode` field, but `get_session` later read `auto`.

## 3. A local lead finding a cloud worker's results

**What `claude --cloud` prints** (under `script`, it returns in about 3 s):

```
Created cloud session: Probe entry lead session
View: https://claude.ai/code/session_01RHDEXvmXA6fqMTf39A5Vou?from=cli&m=0
Resume with: claude --teleport session_01RHDEXvmXA6fqMTf39A5Vou
```

It prints a title, a URL and a session id. **It prints no branch.** With `-n "<name>"` the printed title is that name (`Created cloud session: zebra quartz worker`).

**`claude -p "<msg>" --cloud <id>`** prints only this, then exits 0:

```
Sent to cloud session.
Session ID: session_01RHDEXvmXA6fqMTf39A5Vou
View: https://claude.ai/code/session_01RHDEXvmXA6fqMTf39A5Vou?from=cli&m=0
```

It carries no status, branch or reply. The session still acted on the message: it pushed again 5 s later.

**The branch name comes from the prompt, not the title.**

| Session | Title | Prompt starts | Designated branch |
|---|---|---|---|
| lead | "Probe entry lead session" (generated) | `/probe-entry` / "You are the LEAD of a small probe" | `claude/probe-entry-lead-3w4lgl` |
| naming | "zebra quartz worker" (`-n`) | "Pelican lighthouse naming probe." | `claude/pelican-lighthouse-naming-probe-ezk640` |

The name is `claude/<slug from the prompt's opening>-<6 random chars>`, and `-n` doesn't affect it. The slug is generated, not a fixed transform: the earlier `cloud-session-tools` lead got `claude/probe-cloud-session-tools-x4zh0g`. So a local lead can't predict the exact name. Inferred: it can steer the slug by opening each worker prompt with a distinctive phrase, then match on it with `git ls-remote origin 'refs/heads/claude/<phrase-slug>-*'`. That match works only after the worker's first push, because the branch doesn't exist on the remote before then (the lead's first push came 25 s after launch).

**`claude -p --teleport <session_id>` reveals the branch, as a side effect.** With no prompt, it fetches the session's branch and checks it out in the current directory, then fails with "Error: Input must be provided either through stdin or as a prompt argument when using --print" (exit 1). After that, `git branch --show-current` names the branch and the worker's files are in the checkout. It did the same on both sessions tried: `claude/probe-entry-lead-3w4lgl` and `claude/pelican-lighthouse-naming-probe-ezk640`. It changes the checkout, so run it only in a disposable worktree. It relies on a side effect of an error path and may change in a later release. Not tested: what it does before the session has pushed.

**Other local routes:**

- `claude agents --json --all` lists local interactive and background sessions only. No cloud session appeared.
- `claude --help` lists no subcommand that lists cloud sessions or shows their status. `--cloud` accepts only "description, session_id or url".
- Local `~/.claude` keeps no record of the created session, outside the launching transcript.
- Commit trailers: the child's commits carried `Claude-Session: https://claude.ai/code/session_01LP6QiRQMRFMfLfemW6LtQ9`, so `git log --all --grep=<session id>` maps a session to its branch. The lead's commits carried no trailer, so a worker adds one only when its prompt says to.

**Most robust recipe (inferred):** the local lead records the session id from stdout. It opens the worker prompt with a nonce phrase and tells the worker to push to its designated branch with a `Claude-Session:` trailer and a final status file. It then polls `git ls-remote origin 'refs/heads/claude/*'` for the nonce slug, or `git fetch` + `git log --grep=<session id>`. `claude -p --teleport <id>` in a scratch worktree is the fallback when the slug match fails.

## Surprises

- In the child, the slash-expanded prompt arrives framed as "SYSTEM NOTIFICATION - NOT USER INPUT", not as a user turn.
- `list_events` stores the raw `/skill …` text, so the stored transcript doesn't show the expansion.
- In this lead the `claude-code-remote` tools were already loaded. `ToolSearch "+claude-code-remote"` returned "No matching deferred tools found" (in earlier probes they were deferred).
- In `list_events`, pages are newest-first and `limit` applies before the `kinds` filter. "First user event" needed `before_id` paging.
- The UI title (`-n`) and the branch slug (from the prompt) are independent.

## Evidence

- Sessions: lead `session_01RHDEXvmXA6fqMTf39A5Vou`, child `session_01LP6QiRQMRFMfLfemW6LtQ9` (parent = lead), naming `session_011HpBW3Z9cLdSdpakzf1Lfi`. All are safe to archive.
- Branches: `probe/entry-slash` (probe skill and prompts), `claude/probe-entry-lead-3w4lgl` (lead log), `claude/entry-slash-child` (child log), `claude/pelican-lighthouse-naming-probe-ezk640` (`naming.txt` = `NAMING-OK`). All are safe to delete once this branch is kept.
