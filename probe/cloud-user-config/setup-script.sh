#!/bin/bash
# Paste this into the cloud environment's "Setup script" field.
# Clones the probe branch of claude-pstack and installs it into this VM's ~/.claude.
LOG=/var/log/pstack-probe-setup.log
{
  echo "setup ran at $(date -u +%FT%TZ)"
  git clone --branch probe/cloud-user-config https://github.com/janrizmlibres/claude-pstack.git /opt/pstack-probe \
    && bash /opt/pstack-probe/probe/cloud-user-config/install.sh
} >> "$LOG" 2>&1
exit 0
