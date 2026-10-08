# Conversion rules

The rules every translation, sync and re-translation applies to turn upstream pstack into the port. A translated file is its upstream counterpart with these rules applied and nothing else changed; overrides, port-only and dropped files are listed in `port.json` instead.

A sync that finds a missing rule proposes it in the same PR as an edit to this document.

**How the Cursor-ism check reads this document.** `scripts/check-cursorisms.ts` takes every pattern it checks from here. Every `##` heading is a rule, written `## <n>. <title>`, and every rule holds exactly one `detect` block of `key: value` lines, values written raw:

- `pattern: <regex>`: a JavaScript regular expression, matched against each line of every translated file. A rule may have several.
- `before: <line>`: a line the rule rewrites, usually upstream's own wording.
- `after: <line>`: what the rule makes of it.
- `allow: <port file> | <text on the line> | <reason>`: excuses this rule's matches on the one line of one port file that contains the text, such as a deliberate quote of upstream. Allowances are per occurrence: one whose text is on more than one line with a match is too wide, and one that excuses nothing is stale; the check reports both.
- `undetectable: <reason>`: instead of all of the above, for a rule no line pattern can see.

The check self-tests this document before it scans anything and stops with exit 2 when it fails: every pattern must match at least one of its rule's `before` lines (a pattern that matches none is dead), every `before` line must match one of its rule's patterns, and no `after` line may match any rule's pattern. So a pattern can't change without its examples, nor an example without its pattern.

To add a rule, copy the nearest rule, write its prose, paste the upstream line you met as `before` and your rewrite as `after`, and write a pattern that catches the first and not the second.

## 1. Sibling routing

Every model-facing reference to a sibling skill (bold name, slash name, relative link, repo path) keeps upstream's prose and adds `read ${CLAUDE_PLUGIN_ROOT}/skills/<name>/SKILL.md`, in skill and agent bodies. The verb is always "read", never "invoke" or "run". User-facing slash references become `/pstack:<name>`.

```detect
pattern: \b(?:[Ii]nvoke|[Rr]un) \$\{CLAUDE_PLUGIN_ROOT\}/skills/
pattern: (?<!\$\{CLAUDE_PLUGIN_ROOT\}/skills/.*)(?<![\w:/.~$}\]-])/(?:poteto-mode|poteto-help|setup-pstack|architect|arena|automate-me|benchmark-checklist|blast-radius|bro|correct|create-verification-skill|figure-it-out|how|interrogate|maintain-verification-skill|make-bot-ui|no-comments|recall|reflect|show-me-your-work|swarm|tdd|teach|technical-writing|typescript-best-practices|unslop|why|deslop|control-ui|control-cli|principle-[a-z-]+)(?![\w-])(?!.*\$\{CLAUDE_PLUGIN_ROOT\}/skills/)
before: Use the **arena** skill: invoke ${CLAUDE_PLUGIN_ROOT}/skills/arena/SKILL.md.
before: [`/poteto-mode`](./skills/poteto-mode/SKILL.md) and the agents route through the same wrapper.
before: Run /setup-pstack once, then /principle-fix-root-causes when a bug recurs.
before: Seed the hypotheses with /how over the affected subsystem.
after: Use the **arena** skill: read ${CLAUDE_PLUGIN_ROOT}/skills/arena/SKILL.md.
after: [`/pstack:poteto-mode`](./skills/poteto-mode/SKILL.md) and the agents route through the same wrapper.
after: Run /pstack:setup-pstack once, then /pstack:principle-fix-root-causes when a bug recurs.
after: Seed the hypotheses with /how over the affected subsystem (read ${CLAUDE_PLUGIN_ROOT}/skills/how/SKILL.md).
allow: pstack/docs/guide/02-poteto-mode.md | departure board listing | the image's alt text quotes the lettering in the picture
allow: pstack/docs/guide/03-understand.md | links clues under | the image's alt text quotes the lettering in the picture
allow: pstack/docs/guide/04-design.md | interrogate panels | the image's alt text quotes the lettering in the picture
allow: pstack/docs/guide/10-recipes-and-pitfalls.md | pinned cards reading | the image's alt text quotes the lettering in the picture
```

## 2. Frontmatter flags stay

Frontmatter flags stay as upstream sets them (`disable-model-invocation` on every skill but `setup-pstack`). Vendored `deslop`, `control-ui` and `control-cli` gain `disable-model-invocation: true`.

```detect
undetectable: a flag's presence is a property of a file's frontmatter, not of any one line
```

## 3. Multi-model steps

Classify each multi-model step by the job left on one family: breadth or fresh context. Drop a step only when what remains duplicates another. Breadth comes from distinct prompts (directions, lenses). Identical briefs only in `first pass` races; `best-of` and `rank all` need distinct arms. Model races stay opt-in and are labelled a cost check. Volume roles never escalate quietly: when none returns `PASS`, the report says so and the parent may rerun on `opus`. A failed worker retries once on the same model and effort; a second failure is `BLOCKED` with evidence (orchestrate's override refines this).

```detect
pattern: \b[Dd]ifferent models\b
pattern: \bon a different model\b(?! famil)
pattern: \b[Mm]odel diversity\b
before: Ask more than one model the same question and merge the answers. Different models catch different real bugs.
before: Network-drop, retry as-is. Tool-error, retry on a different model.
before: Model diversity is the point.
after: Give each reviewer its own lens and merge the answers. Different lenses catch different real bugs.
after: Network drop, retry as-is. Tool error, retry once on the same model and effort.
after: Distinct lenses are the point.
```

## 4. Roles, not model IDs

Text names a setting (Work, Judgement, Volume), never a model ID or `pstack-models.mdc`. `subagent_type: poteto-agent` and `generalPurpose` (with or without `readonly`) map to the matching setting agent. A spawn passes `model:` only when `${user_config.<setting>_model}` resolved to one of `opus`, `sonnet`, `haiku`, `fable`; a literal placeholder or empty value means no `model:` and the agent's default applies.

```detect
pattern: \bclaude-(?:opus|sonnet|haiku|fable)-\d
pattern: \bgrok-\d
pattern: \bpstack-models\.mdc\b
pattern: \bpoteto-agent\b
pattern: \bgeneralPurpose\b
pattern: \binherit-parent\b
pattern: \b[Gg]rok\b(?!-\d| [Bb]ot)
pattern: \b(?:[Oo]pus|[Ss]onnet|[Hh]aiku|[Ff]able) \d
before: | Reviewer A | `claude-opus-5-5-xhigh` |
before: | Reviewer B | `grok-4.7-xhigh-fast` |
before: Use the `interrogate reviewers` line in `~/.cursor/rules/pstack-models.mdc`, one reviewer per entry.
before: **Use `subagent_type: "poteto-agent"` for any subagent you spawn inside a playbook step**
before: One message, three calls, `subagent_type: generalPurpose`, and the model left unset for `auto` or `inherit-parent`.
before: code delegates (feature, refactoring, bug fix, perf, hillclimb) go to grok, while the hardest changes, prose, and judgment go to opus 5.5.
after: | Breakage | `judgement-reader` |
after: | Fit | `judgement-reader` |
after: Spawn one reviewer per lens on the `judgement-reader` agent.
after: **Use the `work` agent for any subagent you spawn inside a playbook step**
after: One message, three calls on the `work-reader` agent, with `model:` passed only when `${user_config.judgement_model}` resolved.
after: code delegates (feature, refactoring, bug fix, perf, hillclimb) run on Work, while the hardest changes, prose, and judgment run on Judgement.
```

## 5. Cross-family review becomes a fresh-context review

Cross-family review becomes a fresh-context review in the Judgement role (or the step's own role), briefed with the artifacts and never the reasoning that produced them. poteto-mode's "diverse-model review" becomes "lens- or source-partitioned review"; its second opinion stays, recast: agreement rules out a fluke, not a shared blind spot.

```detect
pattern: \bdifferent model famil(?:y|ies)\b
pattern: \bdiverse-model\b
pattern: \bagainst a different model\b
before: Before handing back, spawn a subagent on a different model family from the one that did the work.
before: Routed workflow skills set their own `subagent_type` for diverse-model review.
before: A second opinion is the same prompt against a different model. Agreement is high-signal.
after: Before handing back, spawn a fresh-context review on `judgement-reader`, given the trail and transcript paths and never your reasoning.
after: Routed workflow skills set their own agents for lens- or source-partitioned review.
after: A second opinion is the same prompt in a fresh context. Agreement rules out a fluke, not a shared blind spot.
```

## 6. Cursor tools and paths

`Task` → `Agent` (with `isolation: "worktree"` wherever upstream says a worker gets its own worktree); `is_background` → `run_in_background`; `AskQuestion` → `AskUserQuestion`; `environment` dropped in favour of the worker rules. `.cursor/skills/` → `.claude/skills/`, `~/.cursor/skills/` → `~/.claude/skills/`, `~/.cursor/plugins/` → `~/.claude/plugins/`. `reflect` counts `Skill` tool calls as skill loads alongside `Read`s of a `SKILL.md`.

```detect
pattern: \bTask tool\b
pattern: `Task`
pattern: \bTask (?:subagent|schema|`model`)
pattern: \bAskQuestion\b
pattern: \bis_background\b
pattern: \benvironment: "(?:cloud|local)"
pattern: \.cursor/
before: Launch all reviewers in a single message using the Task tool.
before: One message, three `Task` calls, one per reviewer.
before: Spawn one Task subagent that explores and explains.
before: Prefer AskQuestion over free text.
before: is_background: true
before: Spawn all N workers in one message with `environment: "cloud"` and `run_in_background: true`.
before: It writes `.cursor/skills/verify-<app>/`, agent-facing instructions.
after: Launch all reviewers in a single message using the Agent tool.
after: One message, three `Agent` calls, one per reviewer.
after: Spawn one Agent that explores and explains.
after: Prefer AskUserQuestion over free text.
after: run_in_background: true
after: Spawn all N workers in one message with `run_in_background: true`.
after: It writes `.claude/skills/verify-<app>/`, agent-facing instructions.
```

## 7. Transcripts

`agent-transcripts/` → `~/.claude/projects/<slug>/${CLAUDE_SESSION_ID}.jsonl`, subagents under `<id>/subagents/`; upstream's "never glob across projects" guard stays; `recall`'s slug rule becomes Claude Code's. Surface line in `recall` and `session-pickup`: in cloud, earlier sessions' transcripts aren't available, so fall back to the git trail and pushed branches.

```detect
pattern: \bagent-transcripts\b
before: Read this run's transcript under the active workspace's `agent-transcripts/` directory (the system prompt names the path).
after: Read this run's transcript at `~/.claude/projects/<slug>/${CLAUDE_SESSION_ID}.jsonl`.
```

## 8. Forge

`gh` is the only forge: every Origin branch and Origin-only flag is deleted, as is the "built-in PR tool" branch. `gh pr`/`gh issue` stay as written, with a surface line in poteto-mode: in cloud they fail (GraphQL blocked), so do the same operation with `gh api` REST; draft toggles use the proxy's `…/pulls/{n}/ccr/ready_for_review` and `…/ccr/convert_to_draft`. Stacks stay upstream's hand-chained base branches; the port never names `gh stack`.

```detect
pattern: \bcommand -v origin\b
pattern: \borigin pr\b
pattern: \bOrigin\b
pattern: \bbuilt-in PR tool\b
pattern: \bgh stack\b
pattern: `gt`
pattern: \bno gt\b
before: If `command -v origin` succeeds and Origin can resolve the repository, use `origin pr` for every PR operation.
before: Use the run's built-in PR tool when it has one, else `gh pr create --base <base-branch>`.
before: Open the stack with `gh stack`.
before: Recompute `frontier.json` from `gt` after every merge and stack mutation.
before: FORBIDDEN    no gt, no rebase, no force-push
after: GitHub CLI (`gh`) is the forge; in cloud, do the same operation with `gh api` REST.
after: Open the PR with `gh pr create --base <base-branch>`.
after: Open the stack as hand-chained base branches.
after: Recompute `frontier.json` from the stacker's declared order after every merge and stack mutation.
after: FORBIDDEN    no rebase, no force-push
```

## 9. Review bots

Bugbot and "the agentic security review" become "review bots (e.g. Claude Code Review, Bugbot, Copilot)" and "security-review bots".

```detect
pattern: (?<!Claude Code Review, )\bBugbot\b
pattern: \bagentic security review\b
before: Bugbot or the agentic security review commented → skeptical posture.
after: Review bots (e.g. Claude Code Review, Bugbot, Copilot) or security-review bots commented → skeptical posture.
```

## 10. Loops

User-facing "/loop until X" → "type `/goal X`" (trigger phrases accept both). A lead's wake becomes a watcher subagent or Monitor for events, and `/loop <interval> <prompt>` through the Skill tool for cadence; a loop prompt reads poteto-mode by path, since a scheduled fire can't run a hidden skill. visual-parity's "`/loop` per component" → "repeat until the diff is zero". Surface line in autonomous-run and autopilot: in cloud, cadence runs from a background wait, since a pending loop won't wake a paused VM.

```detect
pattern: /loop until\b
pattern: `/loop` per component\b
pattern: \b[Gg]ives? `/loop`
before: A long task to drive to completion without stopping ("run until done", "/loop until X").
before: Investigate the pixel delta. `/loop` per component until the diff is zero.
before: Write done as checks every iteration can run, and give `/loop` that predicate.
after: A long task to drive to completion without stopping ("run until done", or type `/goal X`).
after: Investigate the pixel delta. Repeat until the diff is zero.
after: Write done as checks every iteration can run, and give `/goal` that condition.
```

## 11. Other Cursor built-ins

Cursor's `create-skill` → "a skill-authoring skill if one is installed (such as `skill-creator`); otherwise write the SKILL.md directly". `why`'s `mcps/` scan → list MCP servers from your own tool list. Built-ins with no counterpart (Plan Mode, babysit skill, dashboard) are dropped; "a Cursor restart" → "a Claude Code restart".

```detect
pattern: \b[Cc]ursor(?:'s| built-in)
pattern: \bCursor restart\b
pattern: \brestart Cursor\b
pattern: \b[Pp]lan [Mm]ode\b
pattern: \bcreate-skill\b
pattern: \bmcps/
before: Use Cursor's built-in `create-skill` skill to author the skill.
before: Suspending in-flight work cleanly on an explicit pause, going offline, or a Cursor restart.
before: pstack has no planning skill. Plan Mode works alongside it.
before: cursor already has a great plan mode which works great with pstack.
before: Tell the agent you're about to go offline or restart Cursor.
before: Otherwise inspect the `mcps/` directory for enabled MCP servers.
before: `/loop` is a Cursor built-in wake mechanism, not a pstack skill.
after: Use a skill-authoring skill if one is installed (such as `skill-creator`); otherwise write the SKILL.md directly.
after: Suspending in-flight work cleanly on an explicit pause, going offline, or a Claude Code restart.
after: pstack has no planning skill.
after: If you want a plan, ask `/pstack:poteto-mode` for one.
after: Tell the agent you're about to go offline or restart Claude Code.
after: List the MCP servers from your own tool list.
after: `/loop` is a Claude Code built-in, not a pstack skill.
```

## 12. Compaction

Drop "imminent context compaction" from poteto-mode's Pause safely triggers and the "For the compaction trigger…" sentence from Pause safely step 4. Pause safely writes the resume note into the `wip:` commit's body (`--allow-empty` on a clean tree) instead of `/tmp`, and in cloud pushes that commit to the session's own branch.

```detect
pattern: \bimminent context compaction\b
pattern: \bcompaction trigger\b
pattern: /tmp/[^\s`]*resume
before: Suspending in-flight work cleanly so it can be resumed, on an explicit pause, going offline, or imminent context compaction.
before: For the compaction trigger write it to a file like `/tmp/<slug>-resume.md`.
after: Suspending in-flight work cleanly so it can be resumed, on an explicit pause or going offline.
after: Write it into the `wip:` commit's body (`--allow-empty` on a clean tree).
```

## 13. Landing and leftover branches

In cloud, `gh pr merge <pr> --squash` → `gh api -X PUT repos/{owner}/{repo}/pulls/<n>/merge -f merge_method=squash`; `--auto` (merge-when-ready) → watch-then-merge from a background wait, never `/ccr/auto_merge`. At every merge step, the first refused merge stops that PR at merge-ready, with the refusal recorded as a gate; no retry, no workaround. Every landing playbook's Reply (Shipping, Autopilot-full, Orchestrate's Close) lists the leftover branches the run pushed (merged heads still present, closed or abandoned unit branches; open-PR heads left out; a store branch listed as kept) and one `git push origin --delete …` line for the user to run locally. No lead deletes a remote branch on either surface.

```detect
pattern: /ccr/auto_merge\b
before: In cloud, arm merge-when-ready with `gh api -X PUT repos/{owner}/{repo}/pulls/<n>/ccr/auto_merge`.
after: In cloud, for merge-when-ready, watch the checks from a background wait, then merge.
```

## 14. Agent descriptions

Agent descriptions of translated agents (Comment Sicko) end with "Spawned only by pstack playbooks."

```detect
undetectable: a missing ending is an absence in an agent's frontmatter, which no line pattern can see
```

## 15. poteto-mode-scoped rules

These keep `skills/poteto-mode/SKILL.md` translated:

- frontmatter gains the reminder hook;
- one line, once: pstack skills are reached by reading their `SKILL.md`; the Skill tool refuses them by design, so a read is the intended route, not a workaround;
- the router names `playbooks/hand-off.md` in one line, read by path;
- the router's "work the user steps away from goes to `figure-it-out`" clause is narrowed: being handed off doesn't count as stepping away.

```detect
undetectable: each asks for a line to be present in poteto-mode's SKILL.md, and an absence is not a line a pattern can match
```

## 16. Install and settings

`/add-plugin pstack` becomes the two `/plugin` commands, `/plugin marketplace add janrizmlibres/claude-pstack` then `/plugin install pstack@claude-pstack`, with the marketplace's auto-update on. `setup-pstack`'s model rule, its reasoning budgets and the `auto` and `inherit-parent` values become the three settings: the user picks each setting's model in `/config` (in cloud, with the setup line's `--config`), the port fixes each setting's effort, and `/pstack:setup-pstack` shows them. A changed setting reaches the sessions started after it.

```detect
pattern: (?<![\w-])/add-plugin\b
pattern: \breasoning budgets?\b
before: Install with `/add-plugin pstack` in chat, or from Customize in the sidebar.
before: run /setup-pstack, pick a reasoning budget, and choose which models you want.
after: Install with `/plugin marketplace add janrizmlibres/claude-pstack`, then `/plugin install pstack@claude-pstack`.
after: Pick a model for each of the three settings in `/config`, and run /pstack:setup-pstack to see them.
```

## 17. Staying in the mode

A Custom Mode (Option+Enter or Alt+Enter on the slash menu, or Use as Mode) has no counterpart and needs none: a typed `/pstack:poteto-mode` keeps itself on for the rest of the session through its reminder hook, worker results and loop fires included, and stays out of casual turns. The user opts out by saying so. `--resume` drops the hook, so after a resume the user types `/pstack:poteto-mode` again. A mention of the Agents Window goes with its Custom Mode sentence.

```detect
pattern: \b[Cc]ustom [Mm]odes?\b
pattern: \b(?:[Oo]ption|[Aa]lt)\+[Ee]nter\b
pattern: \bAgents Window\b
before: To keep `/poteto-mode` on for the whole chat, pick it from the `/` menu with Option+Enter (Mac) or Alt+Enter (Windows) instead of Enter.
before: That makes it a Custom Mode, which stays in context on every turn until you exit it. Custom Modes are available in the Agents Window and the CLI.
after: `/pstack:poteto-mode` stays on for the rest of the session: its reminder hook brings it back on every turn.
after: After `--resume`, type `/pstack:poteto-mode` again, because a resume drops the hook.
```

## 18. Cloud workers and other Cursor products

Cursor as the product pstack runs in becomes Claude Code. Cursor cloud agents, cloud subagents and the `/in-cloud` command become cloud workers, placed as ADR 0001 places them: a local lead sends swarm workers, orchestrate units and autopilot owners to cloud workers by default (Auto on the account and a default cloud environment), "local only" keeps them in local worktrees, and "hand this off" moves the whole run to a cloud lead. A Cursor Project becomes one lead session per body of work, local or handed off. Cursor automations become routines (`/schedule`). A link to cursor.com becomes the matching Claude Code docs page, or goes when none matches.

```detect
pattern: \bCursor cloud agents?\b
pattern: \bcloud subagents?\b
pattern: (?<![\w-])/in-cloud\b
pattern: \bCursor Projects?\b
pattern: \bcursor\.com\b
before: The cleanest isolation is a [cloud subagent](https://cursor.com/docs/subagents#cloud-subagents).
before: Type `/in-cloud` before the task, or ask the parent chat to hand work to cloud subagents.
before: A [Cursor Project](https://cursor.com/blog/projects) gives one coordinator agent a persistent thread.
before: One Cursor cloud agent per PR owns build, the first verification round, and merge.
after: The cleanest isolation is a [cloud worker](https://code.claude.com/docs/en/claude-code-on-the-web), a cloud session on its own VM and branch.
after: Say "local only" to keep a run's workers in local worktrees, or "hand this off" to move the whole run to a cloud lead.
after: Give each body of work its own lead session, local or handed off to the cloud.
after: One cloud worker per PR owns build, the first verification round, and merge.
```

## 19. Vendored and dropped files

`deslop`, `control-ui` and `control-cli` ship inside the port, vendored from `cursor-team-kit` and hidden by rule 2, so a line saying they ship in that plugin, or telling the user to install it, says they ship with pstack instead. A reference to a dropped file (`automations/benny`) goes with its sentence, or with its section when the section is about that file.

```detect
pattern: \bships? in (?:the )?`cursor-team-kit`
pattern: \binstall `cursor-team-kit`
pattern: \b[Bb]enny\b
before: `/deslop` ships in the `cursor-team-kit` plugin, not in pstack.
before: install `cursor-team-kit` alongside pstack if you want the full set.
before: pstack also ships a dormant [benny automation pack](./automations/benny/).
after: `/pstack:deslop` ships with pstack, vendored from the `cursor-team-kit` plugin and hidden until you type it.
after: `control-cli` and `control-ui` ship with pstack too.
```
