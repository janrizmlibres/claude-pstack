#!/bin/bash
# usage: crash.sh <name> <signal>
# Starts a run whose background agent stays busy ~40s, waits for SubagentStart,
# sends <signal> to the owning claude process (the hook's ppid), then shows the log.
S=$(cd "$(dirname "$0")/.." && pwd); name=$1; sig=$2
log=$S/runs/$name.hooks.jsonl; rm -f "$log"
"$S/bin/run.sh" "$name" "Use the Agent tool with subagent_type general-purpose and run_in_background true, prompt 'Run bash: ping -c 40 127.0.0.1 > /dev/null; echo pinged. Reply PINGED.'. Then wait for its completion notification and report it." &
runner=$!
for i in $(seq 1 60); do grep -q SubagentStart "$log" 2>/dev/null && break; sleep 1; done
sleep 4
cpid=$(python3 -I -c 'import json,sys; print([json.loads(l) for l in open(sys.argv[1])][-1]["ppid"])' "$log")
echo "owner pid $cpid: $(ps -o comm= -p $cpid)"
kill -$sig $cpid; echo "sent SIG$sig"
wait $runner
sleep 3
python3 -I "$S/bin/ev.py" "$log"
echo "orphans: $(pgrep -f 'ping -c 40 127.0.0.1' | tr '\n' ' ')"
