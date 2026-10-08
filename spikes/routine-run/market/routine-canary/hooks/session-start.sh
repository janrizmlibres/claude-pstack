#!/bin/bash
# Plugin SessionStart canary: records that the plugin's hook ran, then pulls the setup clone
# the way the port's setup line keeps a clone-backed plugin current.
d=/tmp/routine-canary; mkdir -p "$d"
src=$(head -c 2000 | grep -o '"source":"[^"]*"' | head -1)
{
  echo "$(date -u +%FT%TZ) PLUGIN-SESSIONSTART $src root=${CLAUDE_PLUGIN_ROOT:-<unset>}"
  timeout 30 git -C /opt/routine-canary pull --ff-only 2>&1
  echo "after pull: commit=$(git -C /opt/routine-canary rev-parse --short HEAD 2>&1)"
} >> "$d/plugin-hook.log" 2>&1
echo "Canary plugin SessionStart marker: CANARY-HOOK-7m2p"
exit 0
