import json, sys
ids = {}  # tool_use_id -> depth of the agent that ran it
def depth(parent):
    return 0 if parent is None else ids.get(parent, 0) + 1
for line in open(sys.argv[1]):
    try: m = json.loads(line)
    except Exception: continue
    t = m.get("type")
    if t == "system" and m.get("subtype") == "init":
        print("INIT skills:", [s for s in m.get("skills", []) if "probe" in s], "agents:", [a for a in m.get("agents", []) if "probe" in a or "prober" in a or "preloader" in a])
        print("     slash:", [s for s in m.get("slash_commands", []) if "probe" in s])
    if t in ("assistant", "user"):
        d = depth(m.get("parent_tool_use_id"))
        for c in m["message"].get("content", []) if isinstance(m["message"].get("content"), list) else []:
            if c.get("type") == "tool_use":
                ids[c["id"]] = d
                print(f"{'  '*d}[d{d}] CALL {c['name']}: {json.dumps(c['input'])[:400]}")
            elif c.get("type") == "tool_result":
                r = c.get("content")
                if isinstance(r, list): r = " ".join(x.get("text", "") for x in r if isinstance(x, dict))
                print(f"{'  '*d}[d{d}] RESULT{' ERR' if c.get('is_error') else ''}: {str(r)[:600]!r}")
            elif c.get("type") == "text" and t == "assistant":
                print(f"{'  '*d}[d{d}] TEXT: {c['text'][:1500]}")
    if t == "result":
        print("RESULT:", m.get("subtype"), "| session", m.get("session_id"))
