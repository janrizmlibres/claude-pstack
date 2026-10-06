#!/bin/bash
# usage: run.sh <name> <prompt> [extra claude args...]  — one headless turn, stream-json to runs/<name>.jsonl
S=$(cd "$(dirname "$0")/.." && pwd); export PROBE_DIR=$S
name=$1; prompt=$2; shift 2; mkdir -p "$S/runs"
cd "$S/proj"
claude -p "$prompt" --plugin-dir "$S/probe-plugin" --output-format stream-json --verbose \
  --allowedTools "Read Glob Grep Bash Skill Agent" "$@" > "$S/runs/$name.jsonl" 2> "$S/runs/$name.err"
echo "exit $?"
