---
name: hooked-auto
description: Model-invocable probe skill that registers a hook from its frontmatter. Use when asked for the hooked-auto probe.
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "echo \"$(date +%s) AUTO PreToolUse Bash\" >> ${PROBE_DIR}/hook.log"
---

HOOKED-AUTO-TOKEN: A3U7O. Acknowledge the token and stop.
