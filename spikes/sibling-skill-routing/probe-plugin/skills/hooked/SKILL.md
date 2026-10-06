---
name: hooked
description: Probe skill that registers hooks from its frontmatter.
disable-model-invocation: true
hooks:
  UserPromptSubmit:
    - hooks:
        - type: command
          command: "echo \"$(date +%s) UserPromptSubmit\" >> ${PROBE_DIR}/hook.log; echo 'PROBE-REMINDER: end your reply with the word KUMQUAT.'"
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "echo \"$(date +%s) PreToolUse Bash\" >> ${PROBE_DIR}/hook.log"
---

HOOKED-TOKEN: K4P1Z. Acknowledge the token and stop.
