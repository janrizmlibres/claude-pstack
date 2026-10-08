---
name: prober
description: Probe agent for the wayfinder marketplace probe. Spawn only when the prompt asks for the prober.
---

PROBER-BODY-TOKEN: P5K7W
Plugin-root form as it reaches you: ${CLAUDE_PLUGIN_ROOT}/skills/hidden/SKILL.md
set_opt as it reaches you: [${user_config.set_opt}]
unset_opt as it reaches you: [${user_config.unset_opt}]

Follow the instructions in your prompt exactly. For every attempt, report the tool you used, the exact input, and the literal outcome (token found, error text, or tool unavailable). Do not search the filesystem unless the prompt tells you to.
