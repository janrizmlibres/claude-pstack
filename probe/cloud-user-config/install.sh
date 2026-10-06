#!/bin/bash
# Installs the probe's user-level config into this VM's Claude config dir, logging what it finds.
# Run by the cloud environment's setup script; never fails the setup.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
DEST="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

echo "user=$(id -un) uid=$(id -u) HOME=$HOME CLAUDE_CONFIG_DIR=${CLAUDE_CONFIG_DIR:-<unset>} DEST=$DEST"
echo "probe commit=$(git -C "$HERE" rev-parse HEAD) stamp=$(cat "$HERE/STAMP")"
echo "claude on PATH: $(command -v claude || echo no) $(claude --version 2>/dev/null)"
echo "other .claude dirs: $(ls -d /home/*/.claude /root/.claude 2>/dev/null | tr '\n' ' ')"
echo "--- $DEST before install"; ls -la "$DEST" 2>&1
[ -f "$DEST/settings.json" ] && { echo "--- existing settings.json"; cat "$DEST/settings.json"; }

mkdir -p "$DEST/skills" "$DEST/agents" "$DEST/hooks"
cp -R "$HERE/claude-home/skills/." "$DEST/skills/"
cp "$HERE/claude-home/agents/"*.md "$DEST/agents/"
cp "$HERE/claude-home/hooks/session-start.sh" "$DEST/hooks/" && chmod +x "$DEST/hooks/session-start.sh"
cat "$HERE/claude-home/CLAUDE.md" >> "$DEST/CLAUDE.md"
if [ -f "$DEST/settings.json" ]; then
  # Keep whatever the VM already has; append our SessionStart entry to any existing ones.
  jq -s '.[0] as $a | .[1] as $b | ($a * $b) | .hooks.SessionStart = (($a.hooks.SessionStart // []) + $b.hooks.SessionStart)' \
    "$DEST/settings.json" "$HERE/claude-home/settings.json" > "$DEST/settings.json.new" && mv "$DEST/settings.json.new" "$DEST/settings.json"
else
  cp "$HERE/claude-home/settings.json" "$DEST/settings.json"
fi
echo "setup commit=$(git -C "$HERE" rev-parse HEAD) stamp=$(cat "$HERE/STAMP") at=$(date -u +%FT%TZ)" > "$DEST/pstack-probe-stamp"

echo "--- plugin arm"
timeout 90 claude plugin marketplace add "$HERE/plugin-market" --scope user < /dev/null 2>&1; echo "marketplace add exit $?"
timeout 90 claude plugin install probe-plugin@pstack-probe-market --scope user < /dev/null 2>&1; echo "plugin install exit $?"

echo "--- $DEST after install"; ls -la "$DEST" "$DEST/skills" "$DEST/agents" 2>&1
echo "install done at $(date -u +%FT%TZ)"
