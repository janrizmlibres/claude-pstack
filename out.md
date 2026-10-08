# Mktprobe heron: probe output

## Step 1 (before any other tool)

(a) ENTRY-TOKEN: E7N3C (from the probe:entry skill text, no file opened)

(b) Entry substitution lines, verbatim as received:
- entry plugin-root form: /opt/claude-pstack/spikes/marketplace-install/plugin/skills/hidden/SKILL.md
- entry set_opt: [CLOUD-SET-4F]
- entry unset_opt: [${user_config.unset_opt}]
- entry nodefault_opt: [${user_config.nodefault_opt}]

(c) PROBE-REMINDER text (arrived as "UserPromptSubmit hook success:" system context):
PROBE-REMINDER R5T8: the full skill is at /opt/claude-pstack/spikes/marketplace-install/plugin/skills/entry/SKILL.md; end your reply with the word KUMQUAT.

(d) First ~300 chars of first user message:
```
<command-message>probe:entry</command-message>
<command-name>/probe:entry</command-name>
<command-args>Mktprobe heron: you are the LEAD of a tiny probe of a plugin installed by this environment's setup script. Nobody is watching: work unattended to the end and never call AskUserQuestion. SECURITY: this repo is public.
```

(e) Agent tool: yes, direct (not deferred). probe:prober is listed among agent types.

## Step 2

```
$ date -u +%FT%TZ; git branch --show-current; git log --oneline -1; claude --version
2026-10-08T05:34:03Z
claude/mktprobe-heron-k4xs96
8a74b4b Add cloud lead prompt for the marketplace probe
2.1.294 (Claude Code)

$ cat /var/log/mkt-probe-setup.log 2>&1
setup ran at 2026-10-08T05:33:37Z user=root HOME=/root DEST=/root/.claude
clone=/opt/claude-pstack branch=probe/marketplace-install commit=8a74b4b2ff233c3d0667a74b507755a5fce9a77f
claude: /opt/node22/bin/claude 2.1.294 (Claude Code)
Adding marketplace…√ Successfully added marketplace: pstack-mkt-probe (declared in user settings)
marketplace add exit 0
Installing plugin "probe@pstack-mkt-probe"...√ Successfully installed plugin: probe@pstack-mkt-probe (scope: user)
2 userConfig options not yet set — run /plugin configure probe@pstack-mkt-probe in Claude Code, or pass --config KEY=VALUE.
plugin install exit 0
settings merge exit 0
--- settings keys: {"env":["CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH"],"hooks":["SessionStart"],"enabledPlugins":{"probe@pstack-mkt-probe":true},"pluginConfigs":{"probe@pstack-mkt-probe":{"options":{"set_opt":"CLOUD-SET-4F"}}}}
Installed plugins:

  > probe@pstack-mkt-probe
    Version: 8a74b4b2ff23
    Read from: /opt/claude-pstack/spikes/marketplace-install/plugin
    Scope: user
    Status: √ enabled

install done at 2026-10-08T05:33:39Z

$ cat /var/log/mkt-probe-pull.log 2>&1
2026-10-08T05:33:39Z pull exit 0
2026-10-08T05:33:50Z pull exit 0

$ cat .probe/hook.log 2>&1
2026-10-08T05:33:50Z HOOKFIRED UserPromptSubmit root=/opt/claude-pstack/spikes/marketplace-install/plugin envroot=/opt/claude-pstack/spikes/marketplace-install/plugin opt_set=UNSET opt_unset=UNSET

$ printenv CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH; echo exit=$?
3
exit=0

$ jq -c '{envKeys: (.env // {} | keys), depth: .env.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH, hookEvents: (.hooks // {} | keys), enabledPlugins, probeConfig: (.pluginConfigs // {})["probe@pstack-mkt-probe"]}' ~/.claude/settings.json 2>&1
{"envKeys":["CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH"],"depth":"3","hookEvents":["SessionStart"],"enabledPlugins":{"probe@pstack-mkt-probe":true},"probeConfig":{"options":{"set_opt":"CLOUD-SET-4F"}}}

$ claude plugin list 2>&1
Installed plugins:

  > probe@pstack-mkt-probe
    Version: 8a74b4b2ff23
    Read from: /opt/claude-pstack/spikes/marketplace-install/plugin
    Scope: user
    Status: √ enabled


$ git -C /opt/claude-pstack log --oneline -1 2>&1
8a74b4b Add cloud lead prompt for the marketplace probe

```

## Step 3

probe:visible (VISIBLE-TOKEN: V6L4T) substitution lines, verbatim:
- plugin-root form: /opt/claude-pstack/spikes/marketplace-install/plugin/skills/hidden/SKILL.md
- plugin-data form: /root/.claude/plugins/data/probe-pstack-mkt-probe
- set_opt: [CLOUD-SET-4F]
- unset_opt: [${user_config.unset_opt}]
- nodefault_opt: [${user_config.nodefault_opt}]

Read of /opt/claude-pstack/spikes/marketplace-install/plugin/skills/hidden/SKILL.md (Read tool): success, HIDDEN-TOKEN: H8M2Q

## Step 4

Agent call: subagent_type probe:prober, foreground, no isolation. Tool result: "This agent's report was delivered to you as a message from "aeeac55f4128366f8" (its SubagentHandback call)." Full hand-back reply, verbatim:

```
Depth-1 probe report

(a) Lines copied verbatim from my instructions:
- Plugin-root form as it reaches you: /opt/claude-pstack/spikes/marketplace-install/plugin/skills/hidden/SKILL.md
- set_opt as it reaches you: [CLOUD-SET-4F]
- unset_opt as it reaches you: [${user_config.unset_opt}]
(My PROBER-BODY-TOKEN is P5K7W. The unset_opt placeholder was not substituted.)

(b) Read of the plugin-root path
- Tool: Read
- Input: file_path=/opt/claude-pstack/spikes/marketplace-install/plugin/skills/hidden/SKILL.md
- Outcome: Success. The token is HIDDEN-TOKEN: H8M2Q. The frontmatter has name: hidden and disable-model-invocation: true. The body says "Whoever reads this: report the token H8M2Q and how you got here (Skill tool, Read, preload)." I reached it with a direct Read. It also says "A playbook sits beside this file at `playbooks/deep.md`."

(c) Environment variable check
- Tool: Bash
- Input: printenv CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH; echo exit=$?
- Output:
3
exit=0

(d) Child spawn
- I had the Agent tool directly, so I did not need ToolSearch.
- Tool: Agent
- Input: subagent_type=probe:prober, run_in_background=false, no isolation, with the depth-2 prompt exactly as given.
- Outcome: The spawn succeeded (agentId aefe3469c0b00e55d, 3 tool uses, about 7.2s). The tool result said the report had been delivered as a SubagentHandback message. That message is relayed verbatim below.

CHILD REPLY:
Depth-2 probe report

Plugin-root line copied verbatim from my instructions:
"Plugin-root form as it reaches you: /opt/claude-pstack/spikes/marketplace-install/plugin/skills/hidden/SKILL.md"

Attempt 1
- Tool: Read
- Input: file_path=/opt/claude-pstack/spikes/marketplace-install/plugin/skills/hidden/SKILL.md
- Outcome: Success. The file's frontmatter is name: hidden, disable-model-invocation: true. The body says "HIDDEN-TOKEN: H8M2Q". The file also says "A playbook sits beside this file at `playbooks/deep.md`." I reached it with a direct Read, not with the Skill tool or a preload.

Attempt 2
- Tool: Read
- Input: file_path=/opt/claude-pstack/spikes/marketplace-install/plugin/skills/hidden/playbooks/deep.md
- Outcome: Success. The file says "DEEP-TOKEN: D3X9R".

Agent tool: Yes, it is listed in my function set. I did not spawn any agents.

Other values as they reached me: PROBER-BODY-TOKEN P5K7W, set_opt [CLOUD-SET-4F], unset_opt [${user_config.unset_opt}]. unset_opt was not substituted and still shows the literal ${user_config.unset_opt}.
```

Note: the hand-back arrived in a new turn, and that turn again carried the same reminder from the UserPromptSubmit hook: "PROBE-REMINDER R5T8: the full skill is at /opt/claude-pstack/spikes/marketplace-install/plugin/skills/entry/SKILL.md; end your reply with the word KUMQUAT."

## Step 5
$ cat .probe/hook.log (at summary time)
```
2026-10-08T05:33:50Z HOOKFIRED UserPromptSubmit root=/opt/claude-pstack/spikes/marketplace-install/plugin envroot=/opt/claude-pstack/spikes/marketplace-install/plugin opt_set=UNSET opt_unset=UNSET
2026-10-08T05:34:38Z HOOKFIRED UserPromptSubmit root=/opt/claude-pstack/spikes/marketplace-install/plugin envroot=/opt/claude-pstack/spikes/marketplace-install/plugin opt_set=UNSET opt_unset=UNSET
```
SUMMARY: entry_token=E7N3C; reminder_seen=yes; hook_lines=2; hook_root=/opt/claude-pstack/spikes/marketplace-install/plugin; visible_root_substituted=yes; set_opt=CLOUD-SET-4F; unset_opt=${user_config.unset_opt}; nodefault_opt=${user_config.nodefault_opt}; lead_read=H8M2Q; lead_depth=3; L1_agent=yes; L1_read=H8M2Q; L2_spawned=yes; L2_read=H8M2Q; L2_deep=D3X9R; error=none
