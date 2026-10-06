#!/usr/bin/env python3
"""Hook probe: logs every hook event it receives and keeps a live-subagent count.

Env:
  PROBE_LOG    JSONL file every event is appended to
  PROBE_STATE  dir holding live.json, the live-agent set shared by every session
  PROBE_CAP    deny Agent spawns once this many agents are live (unset = never deny)

Counting rule under test: SubagentStart adds agent_id, SubagentStop removes it,
PreToolUse on Agent denies when the live set is at the cap.
Repairs for the events that never arrive (PROBE_REPAIR=1):
  PostToolUse on TaskStop removes tool_input.task_id (it is the agent_id);
  SessionEnd drops the ending session's entries;
  every event drops entries whose owning claude process (the hook's ppid) is gone.
"""
import fcntl, json, os, sys, time

raw = sys.stdin.read()
try:
    ev = json.loads(raw)
except ValueError:
    ev = {"unparsed": raw[:500]}

name = ev.get("hook_event_name", "?")
state_dir = os.environ.get("PROBE_STATE", "/tmp/probe-state")
os.makedirs(state_dir, exist_ok=True)
cap = os.environ.get("PROBE_CAP")


def trim(v, n=160):
    if isinstance(v, str):
        return v if len(v) <= n else v[:n] + f"...<{len(v)}>"
    if isinstance(v, dict):
        return {k: trim(x, n) for k, x in v.items()}
    if isinstance(v, list):
        return [trim(x, n) for x in v[:10]]
    return v


out = None
with open(os.path.join(state_dir, "lock"), "w") as lk:
    fcntl.flock(lk, fcntl.LOCK_EX)
    path = os.path.join(state_dir, "live.json")
    live = json.load(open(path)) if os.path.exists(path) else {}
    before = len(live)
    repair = os.environ.get("PROBE_REPAIR") == "1"
    swept = []

    if repair:
        for aid, e in list(live.items()):
            try:
                os.kill(e["pid"], 0)
            except (OSError, KeyError):
                swept.append(aid); live.pop(aid)

    if name == "SubagentStart":
        live[ev.get("agent_id", "?")] = {
            "session": ev.get("session_id"),
            "type": ev.get("agent_type"),
            "t": time.time(),
            "pid": os.getppid(),
        }
    elif name == "SubagentStop":
        live.pop(ev.get("agent_id", "?"), None)
    elif repair and name == "PostToolUse" and ev.get("tool_name") == "TaskStop":
        tid = (ev.get("tool_input") or {}).get("task_id")
        if live.pop(tid, None): swept.append(tid)
    elif repair and name == "SessionEnd":
        for aid, e in list(live.items()):
            if e.get("session") == ev.get("session_id"):
                swept.append(aid); live.pop(aid)
    elif name == "PreToolUse" and ev.get("tool_name") == "Agent" and cap is not None:
        if len(live) >= int(cap):
            out = {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": (
                        f"PROBE-CAP: {len(live)} subagents already running "
                        f"(cap {cap}). Wait for one to finish, then retry."
                    ),
                }
            }

    json.dump(live, open(path, "w"))
    with open(os.environ.get("PROBE_LOG", "/tmp/probe.jsonl"), "a") as f:
        f.write(json.dumps({
            "ts": round(time.time(), 3),
            "pid": os.getpid(),
            "ppid": os.getppid(),
            "event": name,
            "live_before": before,
            "live_after": len(live),
            "denied": out is not None,
            "swept": swept if repair else None,
            "input": trim(ev),
        }) + "\n")

if out:
    print(json.dumps(out))
