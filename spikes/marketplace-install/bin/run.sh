#!/bin/bash
# usage: run.sh <name> <prompt> [extra claude args...] — one headless turn in $PROJ (where the
# probe plugin is installed at local scope), stream-json to $OUT/<name>.jsonl
: "${PROJ:?set PROJ}" "${OUT:?set OUT}"
name=$1; prompt=$2; shift 2; mkdir -p "$OUT"
cd "$PROJ" && claude -p "$prompt" --output-format stream-json --verbose "$@" > "$OUT/$name.jsonl" 2> "$OUT/$name.err"
echo "exit $?"
