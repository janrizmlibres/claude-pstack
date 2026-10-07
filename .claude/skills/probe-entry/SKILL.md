---
name: probe-entry
description: Probe skill for a slash-entry test. Only ever entered by a user typing /probe-entry.
disable-model-invocation: true
hooks:
  UserPromptSubmit:
    - hooks:
        - type: command
          command: 'd="${CLAUDE_PROJECT_DIR:-$PWD}/.probe"; mkdir -p "$d"; p=$(head -c 4000 | tr -d "\n" | grep -o "\"prompt\":\"[^\"]\{0,40\}" | head -1); echo "$(date -u +%FT%TZ) HOOKFIRED UserPromptSubmit $p" >> "$d/hook.log"'
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: 'd="${CLAUDE_PROJECT_DIR:-$PWD}/.probe"; mkdir -p "$d"; echo "$(date -u +%FT%TZ) PRETOOLHOOK Bash" >> "$d/hook.log"'
---

# Probe entry

ENTRY-TOKEN: Q7Z4K

You were entered through the `probe-entry` skill. Before doing anything else, record in your probe log that you received ENTRY-TOKEN Q7Z4K from this skill's text, and describe how this text reached you (for example as an expanded slash command, with or without command-name tags). Do not open this skill's SKILL.md file to confirm it.
