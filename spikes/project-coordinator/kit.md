# Project coordinator probe: kit

For the ticket "What can a Claude Project coordinator actually do?". The fixture is the private repo `janrizmlibres/pstack-project-probe` @ `6261a85`. Its README lists the canaries and where each one lives.

Each probe has an expected trace. Copy each reply into `results/` (or paste it into the chat) **verbatim**, with screenshots where a reply points at the UI.

## Setup (human, in the web UI)

1. **GitHub App access.** github.com/settings/installations → Claude → Configure. If the App is limited to selected repos, add `pstack-project-probe`.
2. **Create the project.** claude.ai/code → New project:
   - Name: `pstack-probe`
   - Repository: `janrizmlibres/pstack-project-probe`, and nothing else, so the project is single-repo and the repo's `.claude/settings.json` hooks apply.
   - Goal: leave empty.
3. **Project instructions** (Project settings → Instructions), exactly:
   ```
   Project instructions canary: INSTR-CANARY-B6V4.
   This project is a probe. Start a thread only when a message explicitly asks for one.
   ```
   Set them before the coordinator's first turn if the UI allows it. Otherwise set them right after, and note the order.
4. **Record:** what the coordinator did on its automatic first turn (screenshot), and the URLs of the project and its conversation.

## Probe 1: coordinator's loaded context (paste into the project conversation)

```
Probe 1 of 6. Answer only from what is already in your context. Do not call any tool for this message.
1. List every tool you can call, by exact name, with its parameter names. Include deferred tools whose names you can see.
2. Quote every canary string you can see (they look like WORD-CANARY-XXXX) and say where each one came from.
3. List the skills you have been told about, by exact name.
4. List the subagent/agent types you have been told about, by exact name.
5. Is a repository checked out in your working environment? If you know the path, give it.
Use exact names, no paraphrase.
```

Settles: the tool list, and whether `CLAUDE.md`, skills, agents, the `SessionStart` hook and project instructions load. Canaries: `CLAUDEMD-…` means `CLAUDE.md` loaded, `HOOK-…` means the hook fired, `INSTR-…` means the instructions arrived, and `probe-canary` / `probe-agent` in the lists means skills and agents were discovered.

## Probe 2: coordinator's tools, tried for real

```
Probe 2 of 6. Now use your tools. For each step show the exact command or tool call and its verbatim output or error. If you have no tool for a step, write "no tool" and move on. Do not work around a missing tool by starting a thread.
1. Shell: `pwd; whoami; hostname; ls -la`
2. Is pstack-project-probe on disk? If not, try to make it available to yourself (clone or attach) and say how you did it.
3. `git --version; gh --version; gh auth status; bun --version; node --version`
4. From the repo root: `bun scripts/probe.ts env`
5. `bun scripts/probe.ts store coordinator "probe 2"`, then commit store/ledger.tsv on a new branch probe/coordinator and push it.
6. List /mnt/project-files. Try to create /mnt/project-files/coordinator-write.txt, overwrite it with new content, and read it back.
7. Save a project memory: "MEMORY-CANARY-H2L7 written by the coordinator". Name the tool you used.
8. If you have any claude-code-remote tools (create_session, list_sessions, …), call list_sessions with limit 5 and show the result. Do not create sessions.
9. Now quote every canary string you can see, as in probe 1.
```

Settles: shell, filesystem, git, `gh`, whether a repo script runs, and where a single-writer store could live (repo branch, Library, memory). Step 9 shows whether attaching the repo loads `CLAUDE.md` after the fact.

## Probe 3: brief fidelity and thread context

```
Probe 3 of 6. Start exactly one new thread. Its brief is the text between the BRIEF START and BRIEF END lines, passed byte for byte: no summary, no rewording, nothing added. Once it has started, give me the thread's name and URL, then wait for its report and relay it verbatim.

BRIEF START
BRIEF-NONCE-Q8Z3. Odd formatting follows; keep it as it is:
  * indented bullet with three trailing spaces   
	a tab-indented line
UPPER lower MiXeD, "straight quotes", ‘curly quotes’, 2+2=5 (deliberately wrong; do not fix it).

Do these steps in order and report verbatim outputs:
1. Before anything else, write your first user message exactly as you received it, byte for byte, including anything before or after this brief, to probe/thread-a-received.md.
2. List every tool you can call, by exact name. Say whether you have Agent, and whether you have any mcp__claude-code-remote__* tools.
3. Quote every canary string (WORD-CANARY-XXXX) already in your context and say where each came from. Then run: cat ~/.probe-hook-fired
4. List the skills and agent types you were told about. Invoke the probe-canary skill and run the probe-agent subagent; report what each returns.
5. Run: bun scripts/probe.ts env ; bun scripts/probe.ts store thread-a "probe 3"
6. List /mnt/project-files and try to write /mnt/project-files/thread-a-write.txt.
7. Commit everything on branch probe/thread-a, push it, and report the branch name.
Do not start any threads or sessions.
BRIEF END
```

**Human:** open the thread and copy its first message from the UI into the results verbatim. That copy is the ground truth for brief fidelity. Note any text added before or after the brief, and whether the project instructions appear inline or not at all.

## Probe 4: can a thread start threads (sub-coordinators)?

```
Probe 4 of 6. Start one more thread. Its brief is the text between the BRIEF lines, byte for byte.

BRIEF START
BRIEF-NONCE-T4C6. You are testing whether a thread can start work outside itself. Report each step's tool call and verbatim result.
1. Can you start a new thread in this project? If you have a tool for it, start one with the brief: "GRANDTHREAD-NONCE-P1X5: create branch probe/grandthread with one empty commit, push it, then stop."
2. If you have mcp__claude-code-remote__create_session, also create one cloud session on this repository with the prompt: "SUBSESSION-NONCE-V3R8: create branch probe/subsession with one empty commit, push it, then stop."
3. Say whether you can see this project's other threads, and how.
Do nothing else.
BRIEF END
```

**Human:** approve any permission prompts with "Allow once" and note each one. Afterwards, check Overview for a grandthread, and `list_sessions` (probe 5) for a sub-session.

## Probe 5: reaching the coordinator or a thread from outside (agent-driven, human clicks)

Send me the session ids or URLs of the coordinator and of thread A. I then run:

1. `claude -p "OUTSIDE-NONCE-D7F2: reply PONG and run hostname" --cloud <thread-A id>`, and the same for the coordinator. **Human:** does the message appear in each, and does either answer?
2. A plain `claude --cloud` session that uses the `claude-code-remote` tools to:
   - `list_sessions`: are the coordinator and the project threads listed?
   - `list_events` on thread A: a second, verbatim read of the brief it received.
   - `send_message` to thread A and to the coordinator.
   - `create_trigger` + `fire_trigger` aimed at the coordinator's session: can a routine wake it?
   **Human:** click "Allow once" on each prompt.
3. Optional, only if Remote Control is already connected: cross-session messaging from a local session to the coordinator.

## Probe 6: coordinator readback

```
Probe 6 of 6. 1) What did each thread you started report? 2) Read thread A in full and quote its first message as you see it. 3) Did any message reach you from outside this conversation (OUTSIDE-NONCE-D7F2, a routine, another session)? 4) Quote every canary string you can see now.
```

## Results checklist (what the resolution must state)

- [ ] Coordinator tool set: shell / fs / git / `gh` / `bun`, with the repo script run or failed
- [ ] Single-writer store candidates: repo branch push, Library overwrite, project memory
- [ ] Brief fidelity: sent vs received diff, wrappers, where the instructions went
- [ ] Threads starting threads or sessions (sub-coordinator)
- [ ] `CLAUDE.md` / skills / agents / hook loading: coordinator vs thread
- [ ] Outside reach: `claude -p --cloud`, `list_sessions` visibility, `send_message`, routine firing
- [ ] Cleanup: delete `pstack-project-probe` and archive or delete the project
