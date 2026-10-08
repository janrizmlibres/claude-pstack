#!/bin/bash
# Paste this into the probe cloud environment's "Setup script" field.
# Clones the routine-run probe branch and installs the canary plugin into the VM's ~/.claude.
LOG=/var/log/routine-canary-setup.log
{
  echo "setup ran at $(date -u +%FT%TZ)"
  git clone --branch research/routine-run https://github.com/janrizmlibres/claude-pstack.git /opt/routine-canary \
    && bash /opt/routine-canary/spikes/routine-run/install.sh
} >> "$LOG" 2>&1
exit 0
