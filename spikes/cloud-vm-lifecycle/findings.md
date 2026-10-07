# Cloud VM lifecycle probe

Run on 2026-10-07 with Claude Code 2.1.291 on a Max account. Six throwaway `claude --cloud` sessions were started from a clean clone of this repo at `main`. Each one stamped its VM state into `.probe/log.txt` on its own `probe/vm-<name>` branch. Raw logs are in `logs/` and the exact prompts are in `prompts/`.

Every stamp records the wall clock, `/proc/uptime`, the kernel `boot_id` and the contents of `/tmp/vm-marker`. That marker is an unpushed file written at setup. These fields tell a resumed session's VM states apart:

| boot_id | uptime vs wall time | marker | Meaning |
|---|---|---|---|
| same | advances with the wall clock | present | never paused |
| new | ~10 s | present | **paused, then restored**: the VM rebooted on its saved disk |
| new | ~10 s | MISSING | **reclaimed**: a fresh VM |

## Sessions

| Name | Session | Role |
|---|---|---|
| shell | `session_01A3FTkutHZDbLCsPMGxPMrH` | background Bash loop: 40 × (sleep 30, push a heartbeat); the turn then ends |
| monitor | `session_01UbYUx2j3YgoBLpfCrkXgtZ` | the same loop under the Monitor tool; the turn then ends |
| agent | `session_0177PDeyUuGDY4TmpJ9bt4sw` | background subagent: 20 separate Bash calls, each waiting 55 s then pushing a heartbeat; the turn then ends |
| ctla | `session_01JHqS79J4VPWCjB958KqajA` | idle control; follow-ups at varied gaps to bracket the pause |
| ctlb | `session_01T6B2nVqCcj56DA78rrndsX` | idle control; a single follow-up after about 2 h |
| ctlc | `session_011qtVxMspvhnk7RriELfYn2` | idle control; a single follow-up after about 6 h |

## Launch and throttle

- `claude -p --cloud "<prompt>"` is refused: "Starting a new cloud session with --cloud is interactive only". Creating a session needs a TTY. Under `script -q <file> claude --cloud "<prompt>"` it prints "Created cloud session: … / View: … / Resume with: claude --teleport …" and returns. The cloud session keeps running after the local process ends.
- The launch folder must already be trusted. In a fresh clone, all six launches first stalled at the workspace-trust prompt.
- **All six were started in the same second (01:13:00Z) and all six were created.** No throttle error appeared. Each pushed its start stamp by 01:13:14Z.

## Background work vs. pausing

| Loop | Heartbeats | Span | Longest gap | Wall-vs-uptime drift | Reboots |
|---|---|---|---|---|---|
| shell (background Bash) | 40/40 | 01:13:50 → 01:34:44Z | 33 s | < 1 s | 0 |
| monitor (Monitor tool) | 40/40 | 01:13:47 → 01:34:40Z | 33 s | < 1 s | 0 |
| agent (background subagent, rerun) | 20/20 | 01:27:37 → 01:46:46Z | 62 s | < 1 s | 0 |

In each case the main turn ended right after it started the work. Each loop then ran for about 20 minutes without pausing. In the same window an idle control paused within about 5 minutes, so all three kinds of background work kept the VM awake.

The first agent run did nothing. The harness refused the subagent's first call, `sleep 55 && …`, because a foreground command that starts with `sleep` and is chained to others is blocked. The subagent then finished after one call. The rerun waited with `timeout 55 tail -f /dev/null` instead.

**After the work ends, the VM pauses as usual.** At 01:42Z, about 7.7 min after their last heartbeats, shell and monitor both came back on a new boot with uptime about 9 s and the marker present.

Not tested: work that runs past an hour, and whether the 30-minute background-command limit stops a loop first. (A 50-minute loop was planned and dropped.)

## Pause interval (ctla)

Idle is measured from the session's previous stamp push. Its turn ended a few seconds after that push, so each idle figure is an upper bound.

| Follow-up | Sent | Idle before | boot_id | uptime | Result |
|---|---|---|---|---|---|
| 1 | 01:23:46Z | ~10.6 min | new | 10.72 | paused |
| 2 | 01:29:13Z | ~5.3 min | new | 9.13 | paused |
| 3 | 01:31:54Z | ~2.5 min | same | 163.65 (expected ~164) | awake |
| 4 | 01:36:22Z | ~4.4 min | same | 431.51 (expected ~431) | awake |

**The pause comes after about 4½–5 minutes idle.** A pause is a reboot that keeps the disk: the boot id changes and uptime restarts, but `/tmp` and the checkout survive. Processes do not survive. Agent session follow-up 1 (01:24:10Z, after ~11 min idle) shows the same pattern.

## Reclaim

| Session | Idle before follow-up | boot_id | marker | Result |
|---|---|---|---|---|
| ctlb | 2 h 03 min (01:13 → 03:16Z) | new | present | paused, not reclaimed |
| ctlc | 6 h 03 min (01:13 → 07:16Z) | new | present | paused, not reclaimed |
| shell | 12 h 01 min (01:42 → 13:43Z) | new | present | paused, not reclaimed |

**No reclaim was seen within 12 hours.** The reclaim interval is still unknown.

## Waking a session from the CLI

`claude -p "<msg>" --cloud <session_id>` returns in about 2 s with "Sent to cloud session." It prints no reply, so answers have to come back through a pushed branch or the transcript. Each time, the paused session restored and acted on the message with nobody opening the browser. The stamp landed 5–11 s after sending: 10 s for ctla after ~11 min, 11 s for ctlb after 2 h, 5 s for ctlc after 6 h, 15 s for shell after 12 h.

Waking a *reclaimed* session from the CLI is still untested, because no session was reclaimed.

## Evidence branches

`probe/vm-shell`, `probe/vm-monitor`, `probe/vm-agent`, `probe/vm-ctla`, `probe/vm-ctlb` and `probe/vm-ctlc` are throwaway. Delete them once this file is read. The six sessions can be archived.
