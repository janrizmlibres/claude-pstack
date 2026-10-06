# usage: turns.py <out.jsonl> <turn>... ; drives one claude process turn by turn
import json, subprocess, sys, os
S = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.environ["PROBE_DIR"] = S
out = open(sys.argv[1], "w")
p = subprocess.Popen(["claude", "-p", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose",
                      "--plugin-dir", f"{S}/probe-plugin", "--allowedTools", "Read Bash Skill Agent"],
                     cwd=f"{S}/proj", stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
for turn in sys.argv[2:]:
    with open(f"{S}/hook.log", "a") as h: h.write(f"--- sending: {turn[:40]}\n")
    p.stdin.write(json.dumps({"type": "user", "message": {"role": "user", "content": turn}}) + "\n"); p.stdin.flush()
    for line in p.stdout:
        out.write(line); out.flush()
        try:
            if json.loads(line).get("type") == "result": break
        except Exception: pass
p.stdin.close(); p.wait(); print("exit", p.returncode)
