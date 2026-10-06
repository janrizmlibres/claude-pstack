# Claude Code equivalents of pstack's Cursor-only features

Research for [issue #6](https://github.com/janrizmlibres/claude-pstack/issues/6). This file records facts and porting implications. It makes no decisions; those belong to the grilling tickets this one blocks.

## Scope and sources

- **Upstream** here is pstack `0.15.15` at cursor/plugins commit [`df58112`](https://github.com/cursor/plugins/commit/df581122cde17e6e27686b5a448bde23e4ad4318) (2026-10-06). Every `path:line` below links to that commit.
- Claude Code facts come from the official docs at code.claude.com, read on 2026-10-06 when the latest release was 2.1.291 ([changelog](https://code.claude.com/docs/en/changelog)), and from Anthropic's GitHub repositories.
- Cursor facts come from cursor.com/docs and from the `cursor-team-kit` plugin in [cursor/plugins](https://github.com/cursor/plugins/tree/main/cursor-team-kit).
- Context7 was not used. Its MCP server needed an OAuth sign-in this session could not complete, so every page below was read directly from the source.

## Summary

| Cursor feature | Closest Claude Code counterpart | Fit |
| :- | :- | :- |
| `agent-transcripts/` | `~/.claude/projects/<project>/<session-id>.jsonl`, with subagents under `<session-id>/subagents/` | Close locally. The format is documented as internal and unstable. Cloud sessions can't read local history. |
| `/loop` | Bundled `/loop` (fixed interval, self-paced, or `loop.md`), plus `/goal`, cron tools and `Monitor` | Close. It is session-scoped, expires after 7 days, and won't run a `disable-model-invocation` skill. |
| Bugbot triage | GitHub comments read through `gh` work as before. Claude-side reviewers are Code Review, `claude-code-action` and `/code-review`. | Reading findings is tool-neutral. Producing them is a different, paid product. |
| Custom Modes, `mode: true`, `reminder:` | Output styles, skill or plugin `UserPromptSubmit` hooks, `agent` setting / `--agent` | No one-to-one match. `mode` and `reminder` are not in Cursor's public docs either. |
| `is_background: true` | Subagent frontmatter `background: true`. Background is already the default in interactive sessions. | Close. Background subagents get a reduced tool set. |
| `cursor-team-kit` (`deslop`, `control-ui`, `control-cli`) | `/simplify`, `/run` and `/verify`, Claude in Chrome, the Playwright MCP plugin, computer use | Partial. The kit itself is MIT-licensed. |

## 1. `agent-transcripts/`

### How upstream uses it

- `reflect` finds its own transcript before it fans out reviewers. It lists three layouts (`<id>.jsonl`, `<id>/<id>.jsonl`, `<parent>/subagents/<child>.jsonl`) and matches the right file by checking that `message.content[0].text` of the first JSONL line holds the opening prompt ([skills/reflect/SKILL.md:19-27](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/reflect/SKILL.md#L19-L27)).
- `session-pickup` reads a prior local transcript, a cloud-agent URL, or a pushed branch ([skills/poteto-mode/playbooks/session-pickup.md:5](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/playbooks/session-pickup.md#L5)).
- `recall` hardcodes `~/.cursor/projects/<slug>/agent-transcripts/<uuid>/<uuid>.jsonl`, where the slug drops the leading `/` and turns each `/` into `-` ([skills/recall/SKILL.md:15](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/recall/SKILL.md#L15)).
- `show-me-your-work`, `eval`, `orchestrate` and `automate-me` also read transcripts ([skills/show-me-your-work/SKILL.md:57](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/show-me-your-work/SKILL.md#L57), [playbooks/eval.md:22](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/playbooks/eval.md#L22), [playbooks/orchestrate.md:17](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/playbooks/orchestrate.md#L17), [skills/automate-me/SKILL.md:29](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/automate-me/SKILL.md#L29)).
- `worktree-audit.sh` builds the transcripts path from the main worktree's path ([skills/poteto-mode/scripts/worktree-audit.sh:25-27](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/scripts/worktree-audit.sh#L25-L27)).
- Several skills rely on "the system prompt names the active workspace's `agent-transcripts/` directory" (for example [skills/reflect/SKILL.md:19](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/reflect/SKILL.md#L19)).

### Claude Code counterpart

- **Location.** Transcripts are JSONL at `~/.claude/projects/<project>/<session-id>.jsonl`. `<project>` is the working directory path with every non-alphanumeric character replaced by `-`. Names over 200 characters are truncated and given a hash suffix ([sessions: Where transcripts are stored](https://code.claude.com/docs/en/sessions#where-transcripts-are-stored)).
- **Subagents.** Subagent transcripts sit in `projects/<project>/<session>/subagents/`, and large tool outputs in `<session>/tool-results/` ([.claude directory: application data](https://code.claude.com/docs/en/claude-directory#application-data)). Anthropic's own `session-report` plugin walks the same layout and reads `<project>/<sessionId>/subagents/*.jsonl` ([analyze-sessions.mjs](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/session-report/skills/session-report/analyze-sessions.mjs)). A local listing on 2.1.291 showed the same layout, with an `agent-<id>.meta.json` beside each subagent transcript.
- **Format.** Each line is a JSON object for a message, tool use, or metadata entry. The docs say: "The entry format is internal to Claude Code and changes between versions, so scripts that parse these files directly can break on any release." They point to `/export`, `claude -p --resume <id> --output-format json`, hook `transcript_path`, or the Agent SDK instead ([sessions: Access conversations from scripts](https://code.claude.com/docs/en/sessions#access-conversations-from-scripts)).
- **Finding the current transcript.**
  - Skills get a `${CLAUDE_SESSION_ID}` substitution ([skills: available string substitutions](https://code.claude.com/docs/en/skills#available-string-substitutions)).
  - Every hook receives `session_id` and `transcript_path` ([hooks: common input fields](https://code.claude.com/docs/en/hooks#common-input-fields)). The file is written asynchronously and "may not yet include the current turn's most recent messages" (same page).
- **Retention.** Transcripts are deleted after 30 days by default. `cleanupPeriodDays` changes that, and `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_PROJECT_DIR_NAME` and `CLAUDE_CODE_SKIP_PROMPT_HISTORY` change location or writing ([sessions](https://code.claude.com/docs/en/sessions#where-transcripts-are-stored), [data usage](https://code.claude.com/docs/en/data-usage)).
- **Worktrees.** When Claude enters or leaves a worktree that Claude Code created, the transcript moves to the session's new working directory ([worktrees](https://code.claude.com/docs/en/worktrees#resume-a-worktree-session)). Transcripts are keyed by working directory, not by repository.
- **Cloud sessions.**
  - A cloud session runs in a fresh VM that clones the GitHub remote, not your local checkout ([Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web)).
  - Anthropic stores the cloud session's own transcript so you can return to it ([data usage: cloud execution](https://code.claude.com/docs/en/data-usage#cloud-execution-data-flow-and-dependencies)).
  - `--teleport` pulls a cloud session's history into a local terminal. `--resume` reads only this machine's local history and doesn't list cloud sessions ([Claude Code on the web: from cloud to terminal](https://code.claude.com/docs/en/claude-code-on-the-web#from-cloud-to-terminal)).
  - Cross-session messaging can send text to other sessions, including cloud ones. It never sends conversation history ([cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging)).

### Gaps

- No doc says Claude Code's system prompt names the transcripts directory. Upstream's "the system prompt names the path" assumption does not carry over. The path has to be derived from the working directory and `${CLAUDE_SESSION_ID}`, or taken from a hook's `transcript_path`.
- The slug rule differs. Cursor drops the leading `/` and maps only `/` to `-`. Claude Code maps every non-alphanumeric character, so the slug starts with `-`, and long paths are truncated with a hash.
- `reflect` matches on `message.content[0].text`. Claude Code documents the entry schema as internal and unstable.
- Worktree sessions write under the worktree's slug. `worktree-audit.sh` looks only at the main worktree's slug, so its last-chat column would come up empty for Claude Code worktree sessions.
- Unconfirmed: no doc describes a way for a cloud session to read the transcripts of earlier sessions, local or cloud. Nothing found says it can.

### Porting implication

Transcript-reading skills (`reflect`, `recall`, `session-pickup`, `show-me-your-work`, `eval`, `automate-me`, `worktree-audit.sh`) can be pointed at `~/.claude/projects/`, but each needs new path rules. Their parsing is coupled to a format Anthropic says can change in any release. In cloud sessions they have no local history to read.

## 2. Cursor `/loop`

### How upstream uses it

- `/loop` is the wake mechanism for long runs. An event to watch gets a watcher subagent plus a long time-based heartbeat. With no event, a fixed-interval heartbeat is used ([playbooks/autonomous-run.md:6](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/playbooks/autonomous-run.md#L6)).
- Programs arm an hourly audit tick, `/loop 1h` ([playbooks/multi-phase-plan.md:41](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/playbooks/multi-phase-plan.md#L41), [playbooks/autopilot-stack.md:6](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/playbooks/autopilot-stack.md#L6)). A plan linter checks for the literal string `"/loop 1h"` ([scripts/check-plan.mjs:20](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/scripts/check-plan.mjs#L20)).
- Users are told to write "/loop until done" with a checkable predicate ([docs/guide/07-overnight.md:26](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/docs/guide/07-overnight.md#L26), [:35](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/docs/guide/07-overnight.md#L35), [:118](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/docs/guide/07-overnight.md#L118), [skills/poteto-help/references/recipes.md:42](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-help/references/recipes.md#L42)).
- `visual-parity` loops per component until the pixel diff is zero ([playbooks/visual-parity.md:8](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/playbooks/visual-parity.md#L8)).
- `poteto-help` names `/loop` as a Cursor built-in ([skills/poteto-help/SKILL.md:107](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-help/SKILL.md#L107)).
- In Cursor, `/loop` "runs a prompt or skill repeatedly at a specified interval", and without a fixed interval "the agent chooses when to wake" ([Cursor skills: built-in skills](https://cursor.com/docs/skills), [Cursor agent overview](https://cursor.com/docs/agent/overview)).

### Claude Code counterpart

- **Bundled `/loop`** ([scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks)):
  - `/loop 5m <prompt>` runs on a fixed cron interval.
  - `/loop <prompt>` is self-paced: Claude picks a delay of 1 minute to 1 hour after each iteration and can end the loop itself through `ScheduleWakeup` with `stop: true`.
  - A bare `/loop` runs a built-in maintenance prompt (continue unfinished work, tend the branch's PR, cleanup passes), or `.claude/loop.md` / `~/.claude/loop.md` when one exists.
  - In a self-paced loop Claude may use the `Monitor` tool instead of polling.
  - `/loop` was added in 2.1.71 ([changelog](https://code.claude.com/docs/en/changelog)).
- **`/goal <condition>`** keeps starting turns until a small fast model judges the condition met or impossible. It is implemented as a session-scoped prompt-based Stop hook, and it works in `-p`, Desktop, and Remote Control ([goal](https://code.claude.com/docs/en/goal)). This fits "until done" better than an interval. Cursor also has `/goal` ([Cursor agent overview](https://cursor.com/docs/agent/overview)).
- **Cron tools** `CronCreate`, `CronList` and `CronDelete` back `/loop` and one-shot reminders ([scheduled tasks: manage scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks#manage-scheduled-tasks)).
- **Event wake-ups.**
  - `Monitor` streams a background script's output lines back to Claude ([tools reference](https://code.claude.com/docs/en/tools-reference)).
  - A background subagent's result arrives as a completion notification in a later turn ([sub-agents: foreground or background](https://code.claude.com/docs/en/sub-agents#run-subagents-in-foreground-or-background)).
  - Channels can push CI events into a session ([scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks)).
- **Durable scheduling.** Cloud routines (minimum interval 1 hour), Desktop scheduled tasks, and GitHub Actions run independently of any session ([scheduled tasks: compare scheduling options](https://code.claude.com/docs/en/scheduled-tasks#compare-scheduling-options)).

### Gaps

- **Session-scoped.** Tasks fire only while Claude Code is running and idle. Recurring tasks expire after 7 days. A self-paced `/loop` is not restored on `--resume` ([scheduled tasks: limitations](https://code.claude.com/docs/en/scheduled-tasks#limitations)).
- **Jitter.** Recurring tasks fire up to 30 minutes late, or up to half the interval for sub-hourly tasks ([scheduled tasks: jitter](https://code.claude.com/docs/en/scheduled-tasks#jitter)). That matters for a `/loop 1h` audit cadence.
- **Skills inside `/loop`.** A scheduled fire runs only skills Claude may invoke itself. A skill with `disable-model-invocation: true` arrives as plain text ([scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks#run-a-prompt-repeatedly-with-%2Floop)). `poteto-mode` sets that flag ([skills/poteto-mode/SKILL.md:4](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/SKILL.md#L4)), so `/loop 1h /poteto-mode …` would not run the skill.
- **Subagents.** Every subagent loses `ScheduleWakeup`. Background subagents also lose the cron tools, because their built-in tool list does not include them ([sub-agents: available tools](https://code.claude.com/docs/en/sub-agents#available-tools)). Only the main thread can arm a loop.
- **Cloud sessions.** 2.1.172 "stopped promoting `/loop` in remote sessions, where pending loops don't keep the container alive" ([changelog](https://code.claude.com/docs/en/changelog)).
- **Unconfirmed.** Cursor's exact `/loop` semantics (expiry, jitter, persistence) are not documented beyond the one-line descriptions cited above, so a feature-for-feature diff is not possible.

### Porting implication

`/loop 1h` and "/loop until X" have direct Claude Code spellings: `/loop 1h <tick prompt>` and `/goal <predicate>`. The playbooks, the `check-plan.mjs` marker and the guide prose need rewording for the 7-day expiry, jitter, the `disable-model-invocation` rule, and the main-thread-only rule.

## 3. Bugbot triage

### How upstream uses it

- `poteto-mode` routes "address the bugbot comments" to the Babysit playbook and requires a skeptical fix / dismiss / ask triage ([skills/poteto-mode/SKILL.md:32-34](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/SKILL.md#L32-L34), [playbooks/babysit.md:22](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/playbooks/babysit.md#L22), [references/bugbot-triage.md:1-13](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/references/bugbot-triage.md#L1-L13)).
- The `watch-pr` script reads review threads through GitHub GraphQL. It flags a thread as Bugbot when the author login contains `bugbot`, or when the author is `cursor` and the body holds markers such as `cursor_automation_id` or `agentic security review`. It counts review passes from `RUN_ID:` / `CURSOR_AUTOMATION_ID:` markers ([scripts/watch-pr/github.ts:333-358](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/scripts/watch-pr/github.ts#L333-L358), [:387-399](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/scripts/watch-pr/github.ts#L387-L399)).

### Facts

- **Bugbot is not tied to the editor.** It is a Cursor service connected to the repository through the Cursor dashboard. It reviews PR diffs, posts a `Cursor Bugbot` check, and can be triggered by commenting `cursor review` or `bugbot run` ([Cursor Bugbot docs](https://cursor.com/docs/bugbot)). A repository with Bugbot enabled gets its comments whatever tool the author uses, so `gh`-based triage works the same from Claude Code. Under the Individual plan settings, the docs add that "Bugbot runs only on PRs you author" ([Cursor Bugbot docs](https://cursor.com/docs/bugbot)).
- **Claude-side reviewers that post GitHub findings:**
  - **Code Review** (managed). Research preview for Team and Enterprise. It posts inline comments tagged 🔴 Important / 🟡 Nit / 🟣 Pre-existing, plus a `Claude Code Review` check run that always concludes neutral. Machine-readable severity counts sit in the check output (`bughunter-severity:`). It is triggered on open, on push, or by commenting `@claude review` / `@claude review always`. Push-triggered runs auto-resolve fixed threads. Reviews average $15-25 each ([Code Review](https://code.claude.com/docs/en/code-review)).
  - **`claude-code-action`** runs Claude in your own GitHub Actions. Its review workflow posts inline comments or one summary comment ([GitHub Actions](https://code.claude.com/docs/en/github-actions), [anthropics/claude-code-action](https://github.com/anthropics/claude-code-action)).
  - **`/code-review`** runs a local review, and `--comment` posts the findings on the PR ([commands](https://code.claude.com/docs/en/commands)). **`/code-review ultra`** (ultrareview) runs a verified multi-agent review in a cloud sandbox and needs claude.ai sign-in ([ultrareview](https://code.claude.com/docs/en/ultrareview)).
- **Claude-side automated responder.** Auto-fix in Claude Code on the web subscribes to a PR and responds to CI failures and review comments ([Claude Code on the web: auto-fix pull requests](https://code.claude.com/docs/en/claude-code-on-the-web#auto-fix-pull-requests)). It is a counterpart to the Babysit loop rather than to Bugbot.

### Gaps

- `watch-pr`'s `isBugbot` and `passKey` heuristics match only Cursor's logins and markers. They would not classify Claude Code Review comments.
- Unconfirmed: the GitHub login that Code Review and `claude-code-action` comments appear under. The docs say comments go through the shared Claude GitHub App ([GitHub Actions: Claude GitHub App](https://code.claude.com/docs/en/github-actions)) but don't give the bot login, and no live PR was checked.
- Code Review needs a Team or Enterprise plan and is billed per review. It is not available with ZDR or HIPAA ([Code Review](https://code.claude.com/docs/en/code-review)).

### Porting implication

The triage rubric and the `gh`-based reading carry over unchanged. Which reviewer's comments to classify (Bugbot only, Claude Code Review, both, or any bot) is the open choice. It decides how `isBugbot` / `passKey` and the `bugbot-triage.md` wording change.

## 4. Cursor modes and the per-turn `reminder:`

### How upstream uses it

- `poteto-mode`'s frontmatter sets `disable-model-invocation: true`, `mode: true`, `icon: crown`, `color: yellow`, and `reminder: New task? Playbook match or rigor needed -> apply /poteto-mode. Casual turn or user opts out -> don't.` ([skills/poteto-mode/SKILL.md:4-8](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/SKILL.md#L4-L8)).
- Users are told that Option/Alt+Enter turns `/poteto-mode` into a Custom Mode that "stays in context every turn … and stays out of the way otherwise" ([README.md:91](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/README.md#L91), [docs/guide/01-setup.md:60](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/docs/guide/01-setup.md#L60), [skills/poteto-help/SKILL.md:50-55](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-help/SKILL.md#L50-L55)).
- Cursor's docs: a skill used as a Custom Mode "keeps the skill in context for the whole session", is available in the Agents Window and the CLI, and is styled by `icon` and `color` ([Cursor skills: Using a skill as a Custom Mode](https://cursor.com/docs/skills), [Cursor prompting: Custom Modes](https://cursor.com/docs/agent/prompting)).
- **Unconfirmed:** `mode:` and `reminder:` appear in neither page. Their exact Cursor semantics (whether `mode: true` is required to offer "Use as Mode", and whether `reminder` is injected every turn) are inferred from the upstream prose, not documented.

### Claude Code counterparts

None of these is a one-to-one match. Each covers part of the behavior.

- **Output styles.**
  - Instructions sent with every request for the whole session. They can be shipped by a plugin in `output-styles/`. A plugin style with `force-for-plugin: true` applies automatically whenever the plugin is enabled.
  - Custom styles drop Claude Code's software-engineering instructions unless `keep-coding-instructions: true` is set.
  - Styles apply to the main thread and to forks, not to other subagents.
  - Switching takes effect on the next message. A style file edited mid-session needs a restart.
  - Source: [output styles](https://code.claude.com/docs/en/output-styles).
- **`UserPromptSubmit` hook.**
  - Runs before every prompt. Plain stdout or `hookSpecificOutput.additionalContext` is injected as a system reminder, capped at 10,000 characters.
  - It also fires on `/loop` iterations, background-subagent reports, and cross-session messages ([hooks: UserPromptSubmit](https://code.claude.com/docs/en/hooks#userpromptsubmit)).
  - Plugins can ship hooks in `hooks/hooks.json` ([plugin components](https://code.claude.com/docs/en/plugins/components)). Anthropic's `explanatory-output-style` plugin uses a `SessionStart` hook the same way to inject per-session instructions ([claude-plugins-official](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/explanatory-output-style)).
- **Skill-scoped hooks.** A skill's frontmatter `hooks` are registered when the skill is invoked and "keep running for the rest of the session, on turns after the skill's own turn as well" ([hooks: Hooks in skills and agents](https://code.claude.com/docs/en/hooks#hooks-in-skills-and-agents), [skills: frontmatter reference](https://code.claude.com/docs/en/skills#frontmatter-reference)). Of the mechanisms found, this one is closest to "invoke once, stays on".
- **Agent as main thread.**
  - `claude --agent <name>`, or the `agent` setting, runs the whole session as a subagent definition. Its system prompt replaces the default Claude Code system prompt, and the choice persists on resume ([sub-agents](https://code.claude.com/docs/en/sub-agents)).
  - A plugin's root `settings.json` can set `agent` (one of only two keys honored from a plugin) to make its own agent the main thread whenever the plugin is enabled ([plugin components: default settings](https://code.claude.com/docs/en/plugins/components)).
- **Skill frontmatter.** Claude Code ignores frontmatter fields it doesn't recognize without an error. There is no `mode`, `reminder`, or `icon` field. `disable-model-invocation` exists with the same meaning ([skills: frontmatter reference](https://code.claude.com/docs/en/skills#frontmatter-reference)).

### Gaps

- **No conditional application.** No Claude Code mechanism applies only when relevant. An output style, a forced plugin style, or a plugin `agent` setting is always on while selected or enabled. The Cursor reminder's "casual turn → don't" judgment would have to live in the injected text.
- **No toggle.** No documented command exits a skill-registered hook, unlike exiting a Cursor mode. The only documented exception is `once: true`, which removes the hook after its first successful run.
- **Plugin skills.** Unconfirmed whether frontmatter `hooks` in a plugin-shipped skill are honored. Plugin subagents ignore `hooks`, `mcpServers` and `permissionMode` ([sub-agents](https://code.claude.com/docs/en/sub-agents#choose-the-subagent-scope)), but no equivalent statement was found for plugin skills.
- **`--agent` replaces the system prompt.** It also applies to the whole session, unlike Cursor's mode, which adds a skill to the default agent.

### Porting implication

The persistent `poteto-mode` has several candidate shapes: a plugin `UserPromptSubmit` hook carrying the reminder text, a hook the skill registers when invoked, an output style, or a plugin `agent`. They differ in whether the mode is opt-in, whether it can be switched off, and how much of the default system prompt survives. That choice belongs to a grilling ticket.

## 5. `is_background: true` agents

### How upstream uses it

- `agents/poteto-agent.md` sets `is_background: true` ([agents/poteto-agent.md:4](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/agents/poteto-agent.md#L4)).
- `poteto-mode` tells every `Task` call to use `subagent_type: "poteto-agent"` and `run_in_background: true` ([skills/poteto-mode/SKILL.md:93-95](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/SKILL.md#L93-L95)).
- It prefers fresh subagents and resumes only agents that hold local state ([skills/poteto-mode/SKILL.md:99](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/SKILL.md#L99)).
- In Cursor, `is_background: true` means "the subagent runs in the background without blocking the parent". Background subagents write output to `~/.cursor/subagents/` and can be resumed ([Cursor subagents](https://cursor.com/docs/subagents)).

### Claude Code counterpart

- Subagent frontmatter `background: true` keeps a subagent in the background "even when Claude asks to run it in the foreground" ([sub-agents: supported frontmatter fields](https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields)).
- In interactive sessions, fork mode is on by default (2.1.232+). Every subagent Claude spawns then runs in the background, and the Agent tool's `run_in_background` parameter is removed. In `-p` and the Agent SDK, fork mode is off, and Claude chooses unless `background: true` is set ([sub-agents: turn fork mode on or off](https://code.claude.com/docs/en/sub-agents#turn-fork-mode-on-or-off), [foreground or background](https://code.claude.com/docs/en/sub-agents#run-subagents-in-foreground-or-background)).
- Results arrive as a completion notification in a later turn. Permission prompts surface in the main session. Subagents can be named, messaged, and resumed ([sub-agents](https://code.claude.com/docs/en/sub-agents#resume-subagents)).
- Plugins ship agents in `agents/`. They are addressed as `plugin:name` ([sub-agents](https://code.claude.com/docs/en/sub-agents)).

### Gaps

- **Reduced tool set.** A background subagent keeps every MCP tool but only these built-ins: `Read`, `Grep`, `Glob`, `LSP`, `Bash`, `PowerShell`, `Edit`, `Write`, `NotebookEdit`, `WebFetch`, `WebSearch`, `TodoWrite`, `Skill`, `ToolSearch`, `EnterWorktree`, `ExitWorktree`, `Monitor`, `TaskStop`, `SendMessage`, `Artifact` (and `SubagentHandback`). `AskUserQuestion`, `ScheduleWakeup` and others are removed from all subagents ([sub-agents: available tools](https://code.claude.com/docs/en/sub-agents#available-tools)).
- **Plugin agent restrictions.** A plugin-shipped `poteto-agent` cannot use `hooks`, `mcpServers`, or `permissionMode` frontmatter ([sub-agents](https://code.claude.com/docs/en/sub-agents#choose-the-subagent-scope)).
- **Teams.** A teammate in an in-process agent team cannot spawn a `background: true` subagent and gets an error ([sub-agents](https://code.claude.com/docs/en/sub-agents#run-subagents-in-foreground-or-background)).

### Porting implication

`is_background: true` becomes `background: true` with little change. The `run_in_background: true` instruction in `poteto-mode` is redundant in interactive sessions, where the parameter is removed. The playbooks should be checked for anything a background subagent can't do, such as asking the user or arming a loop.

## 6. `cursor-team-kit` skills (`deslop`, `control-ui`, `control-cli`)

### How upstream uses them

- **`/deslop`** runs before every commit ([skills/poteto-mode/SKILL.md:28](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/SKILL.md#L28), [playbooks/opening-a-pr.md:9](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/playbooks/opening-a-pr.md#L9), [:36](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/playbooks/opening-a-pr.md#L36), [playbooks/multi-phase-plan.md:59](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/playbooks/multi-phase-plan.md#L59), [docs/guide/05-build-and-clean.md:59](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/docs/guide/05-build-and-clean.md#L59)).
- **`control-ui` and `control-cli`** are "the control skill" that bug-fix, perf, runtime-forensics, prototype, refactoring, visual-parity and multi-phase plans verify through ([skills/poteto-mode/SKILL.md:30](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/SKILL.md#L30), [playbooks/bug-fix.md:7](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/playbooks/bug-fix.md#L7), [playbooks/multi-phase-plan.md:15](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/playbooks/multi-phase-plan.md#L15)).
- Upstream does not bundle them and tells users to install `cursor-team-kit` alongside ([README.md:235-243](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/README.md#L235-L243)).

### What the kit's skills are

All three are plain SKILL.md files in [cursor/plugins/cursor-team-kit](https://github.com/cursor/plugins/tree/main/cursor-team-kit/skills), under an MIT license ("Copyright (c) 2026 Cursor", [LICENSE](https://github.com/cursor/plugins/blob/main/cursor-team-kit/LICENSE)). They use no Cursor-only frontmatter.

- **`deslop`** (22 lines): diff against main and remove AI slop: narrating comments, abnormal defensive checks, `any` casts, deep nesting. Behavior stays unchanged ([SKILL.md](https://github.com/cursor/plugins/blob/main/cursor-team-kit/skills/deslop/SKILL.md)).
- **`control-ui`**: reuse the repo's Playwright, browser or Electron harness, or build a temporary one. It connects to Chromium over CDP and runs a snapshot → one action → snapshot loop ([SKILL.md](https://github.com/cursor/plugins/blob/main/cursor-team-kit/skills/control-ui/SKILL.md)).
- **`control-cli`**: reuse the repo's harness, or drive the CLI or TUI through `tmux` `send-keys` / `capture-pane`, a PTY probe, or a runtime inspector ([SKILL.md](https://github.com/cursor/plugins/blob/main/cursor-team-kit/skills/control-cli/SKILL.md)).

### Claude Code counterparts

- **For `deslop`:**
  - Bundled `/simplify` reviews changed code for reuse, simplification, efficiency and abstraction level, applies the fixes, and does not look for bugs ([commands](https://code.claude.com/docs/en/commands)).
  - The official `code-simplifier` plugin ships a simplifier agent ([claude-plugins-official](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-simplifier)).
  - When a session starts with a skill named `verify` or `simplify` in place, Claude Code's commit instructions tell Claude to run it before each commit. This needs 2.1.286 or later, and it does not count plugin skills or bundled `/simplify` ([skills: run your checks before each commit](https://code.claude.com/docs/en/skills#run-your-checks-before-each-commit)).
- **For `control-ui`:**
  - Claude in Chrome (`/chrome`) drives a visible Chrome or Edge window with your login state ([Chrome](https://code.claude.com/docs/en/chrome)).
  - The official marketplace's `playwright` plugin wraps `@playwright/mcp` ([claude-plugins-official](https://github.com/anthropics/claude-plugins-official/tree/main/external_plugins/playwright)).
  - Computer use is a macOS research preview for Pro and Max plans, needs an interactive session, and is not available on Team or Enterprise ([computer use](https://code.claude.com/docs/en/computer-use)).
  - Bundled `/run` and `/verify` launch and drive the app ([skills: run and verify your app](https://code.claude.com/docs/en/skills#run-and-verify-your-app)).
- **For `control-cli`:** bundled `/run` and `/verify` infer how to launch CLI, server, TUI and browser-driven projects. `/run-skill-generator` records a per-project recipe ([skills: run and verify your app](https://code.claude.com/docs/en/skills#run-and-verify-your-app)). No Anthropic-published tmux/PTY harness skill was found.
- **Packaging.** A Claude Code plugin can declare dependencies on other plugins, including ones from another marketplace. A cross-marketplace dependency installs only when the root marketplace's `allowCrossMarketplaceDependenciesOn` allows it ([plugin dependencies](https://code.claude.com/docs/en/plugins/dependencies)).

### Gaps

- `/simplify` is a four-agent parallel review with a different checklist from `deslop`. It is not a drop-in replacement.
- No Claude Code built-in matches `control-cli`'s explicit tmux harness loop.
- Claude in Chrome runs headed and shares the user's logins. Computer use is plan-gated and excludes Team and Enterprise. `control-ui`'s headless Playwright/CDP harness has no single built-in equivalent.
- `cursor-team-kit` is not published as a Claude Code plugin. Unconfirmed whether any Claude Code marketplace carries a port of it.

### Porting implication

The three skills are small, MIT-licensed, and use no Cursor-only features. The port can vendor them with attribution, map them to `/simplify`, `/run`, `/verify`, Chrome and Playwright, or declare a dependency. Each choice changes how much of `poteto-mode`'s "before commit" and "control skill" wording has to change.

## Unresolved

1. The GitHub login under which Claude Code Review and `claude-code-action` comments appear. It is needed to extend `isBugbot`.
2. Whether frontmatter `hooks` in a plugin-shipped skill are honored, as they are for project and user skills.
3. The exact Cursor semantics of `mode: true` and `reminder:`. Neither is in Cursor's public docs.
4. Whether a cloud session has any documented route to earlier sessions' transcripts. None was found.
5. Cursor `/loop` details (expiry, jitter, persistence), for a feature-for-feature comparison.

## Adjacent findings, outside this ticket

- Upstream's per-role `model` slugs (`claude-opus-5-5-xhigh`, `grok-4.7-xhigh-fast`) set reasoning effort inside the slug ([skills/poteto-mode/SKILL.md:95](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/SKILL.md#L95)). Claude Code subagents take `sonnet`, `opus`, `haiku`, `fable`, a full Claude model ID, or `inherit`, with a separate `effort` field ([sub-agents: supported frontmatter fields](https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields)). Grok models have no counterpart.
- `swarm` and `orchestrate` spawn workers with `environment: "cloud"` ([skills/swarm/SKILL.md:30](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/swarm/SKILL.md#L30), [playbooks/orchestrate.md:17](https://github.com/cursor/plugins/blob/df581122cde17e6e27686b5a448bde23e4ad4318/pstack/skills/poteto-mode/playbooks/orchestrate.md#L17)). The Claude Code docs read for this ticket document worktree isolation for subagents and `claude --cloud` for whole sessions, but no per-subagent cloud environment.
