---
name: visible
description: Probe skill that the model may invoke. Use when asked for the visible probe token.
---

VISIBLE-TOKEN: V6L4T

Substitution check (copy these lines verbatim into your report):
- plugin-root form: ${CLAUDE_PLUGIN_ROOT}/skills/hidden/SKILL.md
- plugin-data form: ${CLAUDE_PLUGIN_DATA}
- set_opt: [${user_config.set_opt}]
- unset_opt: [${user_config.unset_opt}]
- nodefault_opt: [${user_config.nodefault_opt}]
