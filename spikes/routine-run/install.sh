#!/bin/bash
# Installs the routine-run canary into the cloud VM's Claude config dir, logging what it finds.
# Runs only inside the probe cloud environment's setup script; never fails the setup.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
DEST="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

echo "user=$(id -un) HOME=$HOME CLAUDE_CONFIG_DIR=${CLAUDE_CONFIG_DIR:-<unset>} DEST=$DEST"
echo "canary commit=$(git -C "$HERE" rev-parse --short HEAD)"
echo "claude on PATH: $(command -v claude || echo no) $(claude --version 2>/dev/null)"
echo "--- $DEST before install"; ls -la "$DEST" 2>&1

# VM user settings: raise the subagent spawn depth, merged into whatever the VM already has.
mkdir -p "$DEST"
want='{"env":{"CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH":"3"}}'
if [ -f "$DEST/settings.json" ]; then
  echo "settings.json existed; merging"
  jq --argjson w "$want" '. * $w' "$DEST/settings.json" > "$DEST/settings.json.new" && mv "$DEST/settings.json.new" "$DEST/settings.json"
else
  echo "$want" > "$DEST/settings.json"
fi
echo "--- settings.json env after merge"; jq '.env' "$DEST/settings.json"

echo "--- plugin install"
timeout 90 claude plugin marketplace add "$HERE/market" --scope user < /dev/null 2>&1; echo "marketplace add exit $?"
timeout 90 claude plugin install routine-canary@routine-canary-market --scope user < /dev/null 2>&1; echo "plugin install exit $?"
timeout 60 claude plugin list < /dev/null 2>&1

echo "--- $DEST after install"; ls -la "$DEST" 2>&1
echo "install done at $(date -u +%FT%TZ)"
