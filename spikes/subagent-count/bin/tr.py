#!/usr/bin/env python3
"""Print tool results and the final result from a stream-json run."""
import json, sys
for l in open(sys.argv[1]):
    r = json.loads(l)
    if r.get("type") == "user":
        for c in r["message"].get("content", []):
            if isinstance(c, dict) and c.get("type") == "tool_result":
                print("TOOL_RESULT:", "err" if c.get("is_error") else "ok", str(c["content"])[:400])
    if r.get("type") == "result":
        print("FINAL:", str(r.get("result"))[:800])
