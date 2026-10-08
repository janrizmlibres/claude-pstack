---
name: canary-entry
description: Canary entry skill for the routine-run probe. Only ever entered by a prompt whose first line is its slash command.
disable-model-invocation: true
hooks:
  UserPromptSubmit:
    - hooks:
        - type: command
          command: 'd=/tmp/routine-canary; mkdir -p "$d"; p=$(head -c 6000 | tr -d "\n" | grep -o "\"prompt\":\"[^\"]\{0,60\}" | head -1); echo "$(date -u +%FT%TZ) SKILLHOOK UserPromptSubmit $p" >> "$d/skill-hook.log"'
---

# Canary entry

ENTRY-TOKEN: R8V3T

You were entered through the routine-canary plugin's `canary-entry` skill. Record in your findings that you received ENTRY-TOKEN R8V3T from this skill's text, and describe how this text reached you (quote the tags around it, if any). Do not open this skill's SKILL.md file to confirm it.
