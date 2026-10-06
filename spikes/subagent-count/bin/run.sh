#!/bin/bash
# usage: run.sh <name> <prompt> [extra claude args...]
# One headless turn with the probe hooks loaded via --settings.
# stream-json -> runs/<name>.jsonl, hook log -> runs/<name>.hooks.jsonl.
# PROBE_STATE defaults to a per-run dir; export it to share a live count across runs.
S=$(cd "$(dirname "$0")/.." && pwd)
name=$1; prompt=$2; shift 2; mkdir -p "$S/runs"
export PROBE_LOG=${PROBE_LOG:-$S/runs/$name.hooks.jsonl}
export PROBE_STATE=${PROBE_STATE:-$S/runs/$name.state}
H="python3 -I $S/hooks/probe.py"
hook() { printf '{"matcher":"%s","hooks":[{"type":"command","command":"%s"}]}' "$1" "$H"; }
T='Agent|TaskStop|TaskOutput|Bash'
settings=$(cat <<JSON
{"hooks":{
 "SessionStart":[$(hook '')],"SessionEnd":[$(hook '')],"Stop":[$(hook '')],
 "SubagentStart":[$(hook '')],"SubagentStop":[$(hook '')],
 "PreToolUse":[$(hook "$T")],"PostToolUse":[$(hook "$T")],"PostToolUseFailure":[$(hook "$T")]
}}
JSON
)
cd "$S/proj"
claude -p "$prompt" --settings "$settings" --model haiku --output-format stream-json --verbose \
  --allowedTools "Agent Bash Read TaskStop TaskOutput" "$@" < /dev/null > "$S/runs/$name.jsonl" 2> "$S/runs/$name.err"
echo "exit $?"
