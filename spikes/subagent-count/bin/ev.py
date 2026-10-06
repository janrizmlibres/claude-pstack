#!/usr/bin/env python3
"""Print a hook log as one line per event: t+, event, live count, ids."""
import json, sys
rows = [json.loads(l) for l in open(sys.argv[1])]
t0 = rows[0]["ts"] if rows else 0
for r in rows:
    i = r["input"]
    extra = []
    for k in ("agent_id", "agent_type", "tool_name", "stop_reason", "source", "reason", "tool_use_id"):
        if i.get(k): extra.append(f"{k}={i[k]}")
    ti = i.get("tool_input") or {}
    for k in ("subagent_type", "run_in_background", "task_id", "command"):
        if k in ti: extra.append(f"in.{k}={str(ti[k])[:50]}")
    if r["denied"]: extra.append("DENIED")
    if r.get("swept"): extra.append(f"SWEPT={r['swept']}")
    print(f"{r['ts']-t0:7.2f} {r['event']:18} live {r['live_before']}->{r['live_after']} sess={i.get('session_id','')[:8]} " + " ".join(extra))
