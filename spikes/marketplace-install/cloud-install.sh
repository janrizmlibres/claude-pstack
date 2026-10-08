#!/bin/bash
# Probe copy of the decided scripts/cloud-install.sh: installs the clone it sits in as a
# directory marketplace, installs the probe plugin at user scope with any --config args,
# and merges an env block and a SessionStart pull hook into the VM's user settings.
# Logs to /var/log/mkt-probe-setup.log and never fails the setup.
set -u
LOG=/var/log/mkt-probe-setup.log
CLONE="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
{
  echo "setup ran at $(date -u +%FT%TZ) user=$(id -un) HOME=$HOME DEST=$DEST"
  echo "clone=$CLONE branch=$(git -C "$CLONE" branch --show-current) commit=$(git -C "$CLONE" rev-parse HEAD)"
  echo "claude: $(command -v claude || echo none) $(claude --version 2>&1)"
  timeout 90 claude plugin marketplace add "$CLONE" --scope user < /dev/null 2>&1; echo "marketplace add exit $?"
  timeout 90 claude plugin install probe@pstack-mkt-probe --scope user "$@" < /dev/null 2>&1; echo "plugin install exit $?"
  mkdir -p "$DEST"
  [ -f "$DEST/settings.json" ] || echo '{}' > "$DEST/settings.json"
  jq --arg clone "$CLONE" '
    .env = ((.env // {}) + {"CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH": "3"})
    | .hooks.SessionStart = ((.hooks.SessionStart // []) + [{"hooks": [{"type": "command",
        "command": ("timeout 20 git -C " + $clone + " pull --ff-only -q >/dev/null 2>&1; echo \"$(date -u +%FT%TZ) pull exit $?\" >> /var/log/mkt-probe-pull.log; exit 0")}]}])
  ' "$DEST/settings.json" > "$DEST/settings.json.new" && mv "$DEST/settings.json.new" "$DEST/settings.json"
  echo "settings merge exit $?"
  echo "--- settings keys: $(jq -c '{env: (.env|keys), hooks: (.hooks|keys), enabledPlugins, pluginConfigs: (.pluginConfigs // null)}' "$DEST/settings.json" 2>&1)"
  claude plugin list 2>&1
  echo "install done at $(date -u +%FT%TZ)"
} >> "$LOG" 2>&1
exit 0
