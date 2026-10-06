#!/bin/bash
# SessionStart probe: records that user-level hooks ran, and tries a refresh pull of the probe clone.
log=/tmp/pstack-probe-sessionstart.log
{
  echo "hook ran at $(date -u +%FT%TZ) as $(id -un)"
  timeout 30 git -C /opt/pstack-probe pull --ff-only 2>&1
  echo "after pull: commit=$(git -C /opt/pstack-probe rev-parse HEAD) stamp=$(cat /opt/pstack-probe/probe/cloud-user-config/STAMP)"
} >> "$log" 2>&1
echo "User SessionStart hook marker: PROBE-HOOK-c41e"
exit 0
