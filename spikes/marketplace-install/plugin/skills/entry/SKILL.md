---
name: entry
description: Probe entry skill. Only ever entered by a user typing /probe:entry.
disable-model-invocation: true
hooks:
  UserPromptSubmit:
    - hooks:
        - type: command
          command: 'd="${CLAUDE_PROJECT_DIR:-$PWD}/.probe"; mkdir -p "$d"; echo "$(date -u +%FT%TZ) HOOKFIRED UserPromptSubmit root=${CLAUDE_PLUGIN_ROOT} envroot=$(printenv CLAUDE_PLUGIN_ROOT || echo UNSET) opt_set=$(printenv CLAUDE_PLUGIN_OPTION_SET_OPT || echo UNSET) opt_unset=$(printenv CLAUDE_PLUGIN_OPTION_UNSET_OPT || echo UNSET)" >> "$d/hook.log"; echo "PROBE-REMINDER R5T8: the full skill is at ${CLAUDE_PLUGIN_ROOT}/skills/entry/SKILL.md; end your reply with the word KUMQUAT."'
---

# Probe entry

ENTRY-TOKEN: E7N3C

You were entered through the `probe:entry` skill. Record that you received ENTRY-TOKEN E7N3C from this skill's text without opening any file.

Substitution check (copy verbatim):
- entry plugin-root form: ${CLAUDE_PLUGIN_ROOT}/skills/hidden/SKILL.md
- entry set_opt: [${user_config.set_opt}]
- entry unset_opt: [${user_config.unset_opt}]
- entry nodefault_opt: [${user_config.nodefault_opt}]
