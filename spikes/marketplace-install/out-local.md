# Local runs: final reports

Claude Code 2.1.294, 2026-10-08, plugin `probe@pstack-mkt-probe` installed at local scope in a throwaway project from `janrizmlibres/claude-pstack#probe/marketplace-install`. Each block is the run's final `result` text, verbatim, plus the stream's permission mode and `permission_denials`. Lines about an unrelated MCP server's authorization are cut.

## A-read-allowed

Flags: `--allowedTools "Read Skill Agent" (user default mode: auto)`

permissionMode: `auto`

```
Here are the four steps, each reported literally.

**1. Skill tool, `probe:hidden`**: error, verbatim:
```
Skill probe:hidden cannot be used with Skill tool due to disable-model-invocation. Ask the user to run /probe:hidden themselves — it cannot be invoked via the Skill tool. Do not replicate this skill's workflow by other means — it is reserved for explicit user invocation.
```

**2. Skill tool, `probe:visible`**: loaded, `VISIBLE-TOKEN: V6L4T`. Its five substitution lines, verbatim:
```
- plugin-root form: /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md
- plugin-data form: /Users/janlibs/.claude/plugins/data/probe-pstack-mkt-probe
- set_opt: [${user_config.set_opt}]
- unset_opt: [${user_config.unset_opt}]
- nodefault_opt: [${user_config.nodefault_opt}]
```

**3. Read on the plugin-root path**: succeeded, `HIDDEN-TOKEN: H8M2Q`. The file's frontmatter has `disable-model-invocation: true`, and its body points to `playbooks/deep.md` beside it. I didn't open that file.

**4. Agent `probe:prober`**:

DEPTH1 REPLY (verbatim):
```
Depth 1 report. I did no filesystem search.

(a) These lines are copied word for word from my own instructions:
- Plugin-root form as it reaches you: /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md
- set_opt as it reaches you: [${user_config.set_opt}]
- unset_opt as it reaches you: [${user_config.unset_opt}]
(Both set_opt and unset_opt arrived as literal placeholders that were never filled in.)
Also in my instructions: PROBER-BODY-TOKEN: P5K7W

(b) Reading the plugin-root path
- Tool: Read
- Input: file_path=/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md
- Outcome: token found. HIDDEN-TOKEN: H8M2Q
  The frontmatter has name: hidden and disable-model-invocation: true. The body says to report H8M2Q and how I got there (I used the Read tool). It also mentions a playbook next to the file at playbooks/deep.md. I did not read that file myself because the depth-1 task did not ask for it.

(c) Spawning the child
- Tool: Agent (available)
- Input: subagent_type=probe:prober, description="Depth 2 probe", run_in_background=false, prompt='Depth 2. Copy the plugin-root line from your own instructions verbatim. Read that path with the Read tool and report the token or error verbatim. Then Read the playbooks/deep.md file in the same directory and report its token or error. Do not spawn agents.'
- Outcome: the spawn worked. agentId is abda4bc97342763ef. Its report came back as a SubagentHandback message.

CHILD REPLY (word for word):
Depth 2 report. I spawned no agents and did no filesystem search.

The plugin-root line, copied word for word from my own instructions:
/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md

Attempt 1
- Tool: Read
- Input: file_path=/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md
- Outcome: token found. HIDDEN-TOKEN: H8M2Q
  The file's frontmatter says name=hidden and disable-model-invocation: true. Its body asks the reader to report H8M2Q and how they got there. I got there with the Read tool, not the Skill tool or a preload. The body also mentions a playbook at playbooks/deep.md next to this file.

Attempt 2
- Tool: Read
- Input: file_path=/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/playbooks/deep.md
- Outcome: token found. DEEP-TOKEN: D3X9R

Other values from my own instructions, as they reached me:
- PROBER-BODY-TOKEN: P5K7W
- set_opt: [${user_config.set_opt}], left as the literal placeholder (not filled in)
- unset_opt: [${user_config.unset_opt}], left as the literal placeholder (not filled in)

(end of child reply)


Relevant paths:
- /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md
- /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/playbooks/deep.md (only the child read this one)
```

**What the probe shows:**
- **The hidden skill isn't really hidden.** `disable-model-invocation` only blocked the Skill tool. Its file content was still readable: I got `H8M2Q` with the Read tool, the depth-1 and depth-2 agents got it the same way, and the depth-2 agent also read `D3X9R` from the playbook. The path to the file came from the visible skill's plugin-root substitution.
- **Option placeholders aren't filled in.** `${CLAUDE_PLUGIN_ROOT}` and the plugin-data path were substituted. All three `${user_config.*}` values stayed as literal text, including `set_opt`, in both the skill and the agent instructions.
- **Agents can spawn agents.** The `probe:prober` agent had the Agent tool, so a depth-2 agent ran.
```

permission_denials: `[]`

## B-default-perms

Flags: `--allowedTools "Skill Agent" (user default mode: auto)`

permissionMode: `auto`

```
All three steps worked. The skill, my own Read and the subagent's Read all reached the hidden token **H8M2Q**.

**1. Skill `probe:visible`.** The plugin-root line, copied verbatim:
```
- plugin-root form: /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md
```
The skill also printed `VISIBLE-TOKEN: V6L4T`. The `user_config` placeholders were not filled in: `set_opt: [${user_config.set_opt}]`, `unset_opt: [${user_config.unset_opt}]`, `nodefault_opt: [${user_config.nodefault_opt}]`.

**2. Read on that path.** It succeeded. The token is `HIDDEN-TOKEN: H8M2Q`, which I got with the Read tool. The file is marked `disable-model-invocation: true`, but a direct Read still returns its contents. It also points to `playbooks/deep.md`. You didn't ask for that file, so I didn't open it.

**3. Agent `probe:prober`.** Its reply, verbatim:

> Depth 1 report.
>
> Plugin-root line, copied verbatim from my system prompt:
> Plugin-root form as it reaches you: /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md
>
> Attempt 1
> - Tool: Read
> - Input: file_path = /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md
> - Outcome: The read worked and the token was found. Verbatim file contents:
>   ---
>   name: hidden
>   description: Probe skill marked disable-model-invocation. Holds the hidden token.
>   disable-model-invocation: true
>   ---
>
>   HIDDEN-TOKEN: H8M2Q
>
>   Whoever reads this: report the token H8M2Q and how you got here (Skill tool, Read, preload).
>   A playbook sits beside this file at `playbooks/deep.md`.
>
> Token: H8M2Q, obtained with the Read tool.
>
> Other values from my system prompt, as they reach me:
> - PROBER-BODY-TOKEN: P5K7W
> - set_opt: [${user_config.set_opt}] (not substituted)
> - unset_opt: [${user_config.unset_opt}] (not substituted)
>
> Notes:
> - The file points to a playbook at playbooks/deep.md, which would be /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/playbooks/deep.md. Your prompt didn't ask for it, so I did not read it.
> - I spawned no agents and searched no files.

I didn't search the filesystem or use Bash.
```

permission_denials: `[]`

## B2-default-mode

Flags: `--permission-mode default --allowedTools "Skill Agent"`

permissionMode: `default`

```
Neither read returned a token. Both attempts were blocked because permission to read the hidden skill file hasn't been granted.

**1. Skill `probe:visible`**
- Visible token: `V6L4T`
- Plugin-root line, verbatim: `/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md`
- The `${user_config.set_opt}`, `${user_config.unset_opt}` and `${user_config.nodefault_opt}` placeholders were not filled in.

**2. Read of that path (from this session)**
- Error, verbatim: `Claude requested permissions to read from /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md, but you haven't granted it yet.`

**3. Agent `probe:prober` (depth 1), reply trimmed to attempt and outcome**
- Attempt: Read, `file_path` = `/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md`
- Outcome, verbatim: `Claude requested permissions to read from /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md, but you haven't granted it yet.`
```

permission_denials: `[{"file_path": "/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md"}, {"file_path": "/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md"}]`

## C-own-dir

Flags: `--permission-mode default --allowedTools Skill`

permissionMode: `default`

```
The skill loaded, but neither Read call got through: permission to read either file was not granted.

**1. `probe:visible` skill call:** It returned `Launching skill: probe:visible` and loaded this token:
```
VISIBLE-TOKEN: V6L4T
```
The skill text asked for its substitution check lines to be copied verbatim, so here they are:
```
- plugin-root form: /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md
- plugin-data form: /Users/janlibs/.claude/plugins/data/probe-pstack-mkt-probe
- set_opt: [${user_config.set_opt}]
- unset_opt: [${user_config.unset_opt}]
- nodefault_opt: [${user_config.nodefault_opt}]
```
The path placeholders were filled in, but none of the three `user_config` placeholders were, including `set_opt`.

**2. Reading `skills/visible/SKILL.md`:** Error:
```
Claude requested permissions to read from /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/visible/SKILL.md, but you haven't granted it yet.
```

**3. Reading `skills/hidden/SKILL.md`:** Error:
```
Claude requested permissions to read from /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md, but you haven't granted it yet.
```
```

permission_denials: `[{"file_path": "/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/visible/SKILL.md"}, {"file_path": "/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md"}]`

## D-allow-rule

Flags: `--permission-mode default --allowedTools Skill Agent "Read(~/.claude/plugins/cache/pstack-mkt-probe/**)"`

permissionMode: `default`

```
All three steps worked, and none returned an error.

1. **Skill `probe:visible`:** it returned `VISIBLE-TOKEN: V6L4T`. Its plugin-root line was `/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md`.
2. **Read on that path:** the file opened. Line 7, verbatim:
   ```
   HIDDEN-TOKEN: H8M2Q
   ```
   That file is the `hidden` skill, and its frontmatter sets `disable-model-invocation: true`. The Skill tool can't load it, but a direct Read opens it.
3. **`probe:prober` subagent (depth 1):** it read the same path and reported, verbatim:
   ```
   HIDDEN-TOKEN: H8M2Q
   ```
   It used one Read call and spawned no agents.

The hidden file mentions a playbook next to it at `playbooks/deep.md`. Neither I nor the subagent opened it, because the probe didn't ask for it.

The `probe:visible` output also had a substitution check. In it, `${user_config.set_opt}`, `${user_config.unset_opt}` and `${user_config.nodefault_opt}` came back as literal placeholders, not values. Even `set_opt` wasn't substituted.
```

permission_denials: `[]`

## F-allow-settings

Flags: `--permission-mode default --allowedTools Skill Agent; project settings.local.json permissions.allow = ["Read(~/.claude/plugins/cache/pstack-mkt-probe/**)"]`

permissionMode: `default`

```
Both reads worked and both returned the hidden token **H8M2Q**.

**1. Skill `probe:visible`.** It returned `VISIBLE-TOKEN: V6L4T`. Its substitution-check lines, verbatim:
- plugin-root form: /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md
- plugin-data form: /Users/janlibs/.claude/plugins/data/probe-pstack-mkt-probe
- set_opt: [${user_config.set_opt}]
- unset_opt: [${user_config.unset_opt}]
- nodefault_opt: [${user_config.nodefault_opt}]

The plugin-root and plugin-data paths were filled in. The three `user_config` placeholders came back as literal text, not values.

**2. My Read of the plugin-root path.** The file read fine and contains `HIDDEN-TOKEN: H8M2Q`. Its frontmatter is `name: hidden` with `disable-model-invocation: true`, so I reached it with a direct Read, not the Skill tool. The file also points to `playbooks/deep.md` next to it. I didn't open that, since it wasn't part of the steps.

**3. Agent `probe:prober`, depth 1.** It also reported **H8M2Q**. It read the same path with Read (not the Skill tool or preload), made one tool call and didn't spawn any agents.
```

permission_denials: `[]`

## E-hook

Flags: `bin/turns.py, two turns (user default mode: auto)`

permissionMode: `auto`

```
**ENTRY-TOKEN:** E7N3C. It came from the `probe:entry` skill text; I didn't open any file.

**Substitution lines, copied exactly:**
```
- entry plugin-root form: /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/hidden/SKILL.md
- entry set_opt: [${user_config.set_opt}]
- entry unset_opt: [${user_config.unset_opt}]
- entry nodefault_opt: [${user_config.nodefault_opt}]
```
The plugin-root path was filled in. All three `${user_config.*}` placeholders were left as literal text, including `set_opt`, even though that option should have a value.

**PROBE-REMINDER text, from the UserPromptSubmit hook:**
> PROBE-REMINDER R5T8: the full skill is at /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/entry/SKILL.md; end your reply with the word KUMQUAT.


KUMQUAT
```

permission_denials: `[]`

permissionMode: `auto`

```
> PROBE-REMINDER R5T8: the full skill is at /Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd/skills/entry/SKILL.md; end your reply with the word KUMQUAT.

KUMQUAT
```

permission_denials: `[]`

## Install outputs

```
$ claude plugin marketplace add 'janrizmlibres/claude-pstack#probe/marketplace-install' --scope local --json
{"command":"marketplace-add","outcome":"ok","marketplace":"pstack-mkt-probe","message":"Cloning via SSH: git@github.com:janrizmlibres/claude-pstack.git\nRefreshing marketplace cache (timeout: 120s)…\nCloning repository (timeout: 120s): git@github.com:janrizmlibres/claude-pstack.git (ref: probe/marketplace-install)\nClone complete, validating marketplace…\nCleaning up old marketplace cache…\nSuccessfully added marketplace: pstack-mkt-probe (declared in local settings)"}

$ claude plugin install probe@pstack-mkt-probe --scope local --json
{"command":"install","outcome":"ok","plugin":"probe@pstack-mkt-probe","pluginId":"probe@pstack-mkt-probe","scope":"local","message":"Successfully installed plugin: probe@pstack-mkt-probe (scope: local)\n3 userConfig options not yet set — run /plugin configure probe@pstack-mkt-probe in Claude Code, or pass --config KEY=VALUE."}
```

## Local hook log (run E)

```
2026-10-08T05:31:24Z HOOKFIRED UserPromptSubmit root=/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd envroot=/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd opt_set=UNSET opt_unset=UNSET
2026-10-08T05:31:31Z HOOKFIRED UserPromptSubmit root=/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd envroot=/Users/janlibs/.claude/plugins/cache/pstack-mkt-probe/probe/8a65843e2ecd opt_set=UNSET opt_unset=UNSET
```
