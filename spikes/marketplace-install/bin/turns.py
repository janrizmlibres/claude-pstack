# usage: PROJ=... turns.py <out.jsonl> <turn>... ; drives one claude process turn by turn in $PROJ
import json, subprocess, sys, os
out = open(sys.argv[1], "w")
p = subprocess.Popen(["claude", "-p", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose",
                      "--allowedTools", "Read Bash Skill Agent"],
                     cwd=os.environ["PROJ"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
for turn in sys.argv[2:]:
    p.stdin.write(json.dumps({"type": "user", "message": {"role": "user", "content": turn}}) + "\n"); p.stdin.flush()
    for line in p.stdout:
        out.write(line); out.flush()
        try:
            if json.loads(line).get("type") == "result": break
        except Exception: pass
p.stdin.close(); p.wait(); print("exit", p.returncode)
