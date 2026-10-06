# Spike: can hooks count live subagents?

Can `PreToolUse` on `Agent` plus `SubagentStart`/`SubagentStop` keep a reliable count of running subagents, shared across sessions, and can a hook deny a spawn with a reason the model sees?

Claude Code 2.1.291, headless (`claude -p`), `--model haiku`, hooks loaded with `--settings`. Run on 2026-10-06.

## Layout

- `hooks/probe.py`: the only hook. Every configured event runs it. It logs the raw input to `$PROBE_LOG` and keeps a lock-guarded live-agent set in `$PROBE_STATE/live.json`. With `PROBE_CAP` set, it denies `Agent` spawns at the cap. With `PROBE_REPAIR=1`, it also runs the three leak repairs listed at the end.
- `bin/run.sh <name> <prompt>`: one headless turn with the probe wired to `SessionStart`, `SessionEnd`, `Stop`, `SubagentStart`, `SubagentStop`, and to `PreToolUse`/`PostToolUse`/`PostToolUseFailure` on `Agent|TaskStop|TaskOutput|Bash`.
- `bin/crash.sh <name> <TERM|KILL>`: starts a run with a busy background agent and signals the owning `claude` process once `SubagentStart` lands.
- `bin/ev.py`, `bin/tr.py`: print a hook log as a timeline, and print a run's tool results.
- `runs/` (git-ignored): logs, written by the scripts.

## Results

| Case | Events seen | Count |
|---|---|---|
| Foreground agent | `PreToolUse Agent` → `SubagentStart` → … → `SubagentStop` → `PostToolUse Agent` | exact |
| Background agent | `PreToolUse` → `PostToolUse` and `SubagentStart` (either order, same ms) → … → `SubagentStop` | exact |
| Nested agent (d2 under a background d1) | `SubagentStart`/`Stop` fire for d2 as well. d2's spawning `PreToolUse` carries d1's `agent_id`; `SubagentStart` has no parent field | exact |
| 4 parallel spawns in one message, cap 2 | Claude Code runs each spawn's `PreToolUse` → `SubagentStart` in turn, ~0.7 s apart. Spawns 3 and 4 denied | exact |
| Two concurrent sessions, shared state, cap 1 | session B's spawn denied while A's agent ran | exact |
| Spawn refused by native cap / unknown `subagent_type` | `PreToolUse` → `PostToolUseFailure`; no `SubagentStart` | exact |
| `TaskStop` on a background agent | **no `SubagentStop`** | **leaks 1** |
| `SIGTERM` to `claude` with a background agent running | `SessionEnd` fires; **no `SubagentStop`** | **leaks 1** |
| `SIGKILL` to `claude` | **nothing** fires; the agent's Bash child (`ping`) survives as an orphan | **leaks 1** |
| Hook denies `Agent` (`permissionDecision: "deny"`) | model gets a tool error `PreToolUse:Agent hook error: <reason>` and quotes the reason; no `PostToolUseFailure` | n/a |

Fields actually received (2.1.291), where the docs page differs:
- `SubagentStart`: `session_id`, `transcript_path`, `cwd`, `prompt_id`, `agent_id`, `agent_type`. No `agent_config`, no parent id, no `tool_use_id`.
- `SubagentStop`: adds `permission_mode`, `stop_hook_active`, `agent_transcript_path`, `last_assistant_message`, `background_tasks`, `session_crons`. No `stop_reason`.
- `PostToolUse Agent`: `tool_response.agentId` links a spawn's `tool_use_id` to its `agent_id`.
- `TaskStop`'s `tool_input.task_id` equals the background agent's `agent_id`.

The native cap (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`) **counts nested agents**. With the cap at 1, a d1 agent's own spawn was refused with `Concurrent subagent limit reached…`. So the native cap already bounds one session's whole tree. A hook count adds only a cap **across sessions**.

Every hook's parent PID is the `claude` process, for subagent events too: subagents run in-process.

## Repairs (verified with `PROBE_REPAIR=1`)

- `PostToolUse` on `TaskStop` removes `task_id` from the live set. This fixed the `TaskStop` leak.
- `SessionEnd` drops the ending session's entries. This fixed the `SIGTERM` leak.
- Every event drops entries whose recorded owner PID (the hook's ppid at `SubagentStart`) is dead. This fixed the `SIGKILL` leak at the next session's `SessionStart`.

## Gaps

- **Race across sessions.** `PreToolUse` is ~30 ms ahead of `SubagentStart`. Two sessions spawning inside that window both pass the check. Not observed, but the design allows it. Reserving on `PreToolUse` would close it: per session spawns are serialized, so `SubagentStart` claims that session's oldest reservation, and `PostToolUseFailure` or a deny releases it.
- **PID reuse.** A recycled PID makes a dead owner look alive. Recording the process start time alongside the PID avoids it.
- **Not tested:** interactive sessions (Esc on a running foreground agent, `/exit` with background agents), `/compact`, cloud sessions, agent teams and `TaskCreate`. In `-p` mode the process waits for background agents before exiting, so a background agent outliving its session was only reached by signals.
