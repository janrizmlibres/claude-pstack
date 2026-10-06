# How cloud-oriented is upstream pstack, and which way is it trending?

Research for [issue #9](https://github.com/janrizmlibres/claude-pstack/issues/9). It surveys the upstream at v0.15.15 (`cursor/plugins` commit [`df58112`](https://github.com/cursor/plugins/commit/df58112), 2026-10-05) and the full history of `pstack/` back to its first commit on 2026-05-22. It records facts and what they imply for syncs. Which surface the port targets first is left to the later grilling ticket.

## Summary

- Of 77 units (23 playbooks, 51 skills, 2 agents, 1 automation pack), **7 assume cloud agents, 8 assume the local machine, and 62 are surface-neutral.**
- The cloud units are the multi-agent "factory": fan-out (`/swarm`), one cloud agent per PR (Autopilot-full, Autopilot-stack), cloud verifiers (Shipping, Multi-phase plan), cloud workers under a local coordinator (Orchestrate), and the Benny automations.
- The local units are mostly introspection. Five of the eight read the user's own agent transcripts. The rest are disk cleanup, the per-user model rule, and a page served from the user's machine.
- Cloud execution entered upstream on 2026-07-30 and has been the default for fan-out since. No cloud default has been removed. Cloud-only mechanics (the "cloud-sleeper wake chain", Graphite as the stack tool) were replaced by surface-neutral ones (`/loop 1h`, plain `gh`).
- The author says in her own words that "everything runs on cloud agents" (2026-08-19). Upstream development itself moved to agent-written commits from 2026-07-22 on.

## How units were classified

The test is upstream's own definition of when work needs the user's machine, from the Orchestrate playbook: `control-ui` or `control-cli` runtime verification, reading local transcripts under `agent-transcripts/`, simulators and local IDE state, and auth that exists only on that machine ([orchestrate.md L17](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/orchestrate.md#L17)).

- **Cloud.** The unit tells the agent to run work as a Cursor cloud agent (`environment: "cloud"`, "Cursor cloud agent", "cloud VM", or a Cursor Automation).
- **Local.** The unit needs something that exists only on the user's machine: local transcripts, the user's home directory, disk, simulators, or a server on that machine.
- **Neutral.** Anything else. A git worktree counts as neutral because a cloud VM can make one too. "Verify on the matching surface via the control skill" counts as neutral because upstream drives control skills from both places (see the tension under Findings).

## Playbooks (23)

Cloud 5, local 2, neutral 16.

| Playbook | Class | Evidence |
|---|---|---|
| Autopilot-full | Cloud | "One Cursor cloud agent per PR owns build, the first push, a ready PR..." [L6](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/autopilot-full.md#L6). The root's tick is surface-neutral: "`/loop` works in local and cloud roots" [L10](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/autopilot-full.md#L10). |
| Autopilot-stack | Cloud | "One Cursor cloud agent per PR owns its change end to end" [L5](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/autopilot-stack.md#L5). |
| Multi-phase plan | Cloud | "Each live lane runs on its own cloud VM at the PR head" [L71](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/multi-phase-plan.md#L71). The review video is recorded "on a lane VM" [L123](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/multi-phase-plan.md#L123). |
| Orchestrate | Cloud (hybrid) | Workers and verifiers are "Always `environment: "cloud"`" with a local-exception list [L17](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/orchestrate.md#L17). "Restacks run in cloud. A local restack at this scale takes the laptop down" [L80](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/orchestrate.md#L80). Liveness reads "the cloud agent's status in the Cursor dashboard" [L95](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/orchestrate.md#L95). The coordinator and sub-coordinators are local [L15-L16](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/orchestrate.md#L15-L16), and "After a Cursor restart: local agents are dead, cloud work is not" [L101](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/orchestrate.md#L101). |
| Shipping | Cloud | One verifier subagent per PR, "each a Cursor cloud agent" [L7](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/shipping.md#L7). |
| Eval | Local | Grades candidates from "each candidate's local transcript under the active workspace's `agent-transcripts/` directory" [L22](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/eval.md#L22). |
| Worktree and simulator cleanup | Local | Prunes local worktrees and "stale iOS simulators to reclaim space" [L3](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/worktree-cleanup.md#L3). Uses `df -h /` and `.cursor/worktrees` [L5](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/worktree-cleanup.md#L5), the pinned chats in the sidebar [L6](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/worktree-cleanup.md#L6), and `xcrun simctl` plus `~/Library/Application Support/Cursor` [L10](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/worktree-cleanup.md#L10). |
| Authoring a skill, Autonomous run, Babysit, Bug fix, Feature, Hillclimb, Investigation, Opening a PR, Pause safely, Perf issue, Prototype, Refactoring, Runtime forensics, Session pickup, Trace forensics, Visual parity | Neutral | No surface assumption. Notes: Session pickup accepts "a local transcript ..., a cloud-agent URL, or a pushed branch" [L5](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/session-pickup.md#L5), so it serves both. Opening a PR, Hillclimb, and Visual parity use worktrees, which the guide offers as the local alternative to cloud isolation. |

## Skills (51)

Cloud 1, local 6, neutral 44.

| Skill | Class | Evidence |
|---|---|---|
| `swarm` | Cloud | "Fan out N parallel cloud workers" [L9](https://github.com/cursor/plugins/blob/df58112/pstack/skills/swarm/SKILL.md#L9). Spawns with `environment: "cloud"` and uses `environment: "local"` "only when the worker needs access to something on the user's computer" [L30](https://github.com/cursor/plugins/blob/df58112/pstack/skills/swarm/SKILL.md#L30). Passes `cloud_base_branch` [L32](https://github.com/cursor/plugins/blob/df58112/pstack/skills/swarm/SKILL.md#L32). |
| `automate-me` | Local | Mines transcripts in the workspace's `agent-transcripts/` directory [L29](https://github.com/cursor/plugins/blob/df58112/pstack/skills/automate-me/SKILL.md#L29) and looks in `~/.cursor/skills` [L17](https://github.com/cursor/plugins/blob/df58112/pstack/skills/automate-me/SKILL.md#L17). |
| `recall` | Local | Reads `~/.cursor/projects/<slug>/agent-transcripts/` [L15](https://github.com/cursor/plugins/blob/df58112/pstack/skills/recall/SKILL.md#L15). |
| `reflect` | Local | Locates the active transcript under `agent-transcripts/` [L19](https://github.com/cursor/plugins/blob/df58112/pstack/skills/reflect/SKILL.md#L19). |
| `show-me-your-work` | Local | The end-of-run audit reads "this run's transcript under the active workspace's `agent-transcripts/` directory" [L57](https://github.com/cursor/plugins/blob/df58112/pstack/skills/show-me-your-work/SKILL.md#L57). The log itself is neutral. |
| `setup-pstack` | Local | Writes `~/.cursor/rules/pstack-models.mdc` in the user's home directory [L8](https://github.com/cursor/plugins/blob/df58112/pstack/skills/setup-pstack/SKILL.md#L8). Readers such as `arena`, `interrogate`, and `swarm` fall back to inline defaults when the file is missing. |
| `make-bot-ui` | Local | "A server on this computer POSTs JSON to a webhook routine" [L11](https://github.com/cursor/plugins/blob/df58112/pstack/skills/make-bot-ui/SKILL.md#L11). Hosts the page "on this computer" [L53](https://github.com/cursor/plugins/blob/df58112/pstack/skills/make-bot-ui/SKILL.md#L53) and puts it on Tailscale [L77](https://github.com/cursor/plugins/blob/df58112/pstack/skills/make-bot-ui/SKILL.md#L77). The guide says "A server on your machine holds the webhook's sender key" ([09-make-it-yours.md L96](https://github.com/cursor/plugins/blob/df58112/pstack/docs/guide/09-make-it-yours.md#L96)). The skill also depends on Grok Bot routines and a `cursor.sh` webhook, so it is product-bound either way. |
| `architect`, `arena`, `benchmark-checklist`, `blast-radius`, `bro`, `correct`, `create-verification-skill`, `figure-it-out`, `how`, `interrogate`, `maintain-verification-skill`, `no-comments`, `poteto-help`, `poteto-mode`, `tdd`, `teach`, `technical-writing`, `typescript-best-practices`, `unslop`, `why` | Neutral | No surface assumption. `poteto-help` recommends cloud agents as an option for parallel work [L73](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-help/SKILL.md#L73), [L136](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-help/SKILL.md#L136) but needs neither surface. |
| All 24 `principle-*` skills | Neutral | A grep for cloud, local, worktree, machine, laptop, transcript, simulator, and editor finds no surface assumption in any of them. |

## Agents (2) and automations (1)

| Unit | Class | Evidence |
|---|---|---|
| `comment-sicko` agent | Neutral | Reads a diff and reports. |
| `poteto-agent` agent | Neutral | A wrapper that reads `poteto-mode`. `is_background: true` names no surface. |
| `automations/benny` | Cloud | "benny gives you two cursor automations for slack issue reports" ([README L3](https://github.com/cursor/plugins/blob/df58112/pstack/automations/benny/README.md#L3)), created with Cursor's built-in `/automate` ([FOR_AGENTS.md L108](https://github.com/cursor/plugins/blob/df58112/pstack/automations/benny/FOR_AGENTS.md#L108)). Config must be committed because "a fresh automation checkout must read them" ([setup-benny L90](https://github.com/cursor/plugins/blob/df58112/pstack/automations/benny/skills/setup-benny/SKILL.md#L90), [L254](https://github.com/cursor/plugins/blob/df58112/pstack/automations/benny/skills/setup-benny/SKILL.md#L254)). Cursor's docs state that "Cursor Automations run cloud agents in the background, either on a schedule or in response to events" ([cursor.com/docs/automations](https://cursor.com/docs/automations)). |

## Findings

**The local class is mostly transcript reading.** Eval, `automate-me`, `recall`, `reflect`, and `show-me-your-work` all read the user's own `agent-transcripts/`. Claude Code keeps its own session transcripts on the local machine, so these five have a direct local counterpart. Only Worktree cleanup (simulators, Cursor's app data), `setup-pstack` (a Cursor rules file), and `make-bot-ui` (Grok Bot) are bound to Cursor or Apple specifics.

**Upstream contradicts itself on where control-skill verification runs.** Orchestrate lists `control-ui` or `control-cli` runtime verification as a reason to stay local ([L17](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/orchestrate.md#L17), written 2026-08-02). Multi-phase plan, written three weeks later, runs ten live control-skill lanes per PR on cloud VMs ([L71](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/multi-phase-plan.md#L71)), and Shipping does the same with cloud verifiers ([L7](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-mode/playbooks/shipping.md#L7)). The newer text moved live verification into the cloud. A later sync may resolve the conflict in that direction.

**Upstream says plainly that Claude Code is not its target.** "pstack is built for Cursor. ... most workflow skills ... spawn Cursor subagents with per-role models, and Custom Modes and `/loop` are Cursor features, so those parts may not work there" ([poteto-help L45](https://github.com/cursor/plugins/blob/df58112/pstack/skills/poteto-help/SKILL.md#L45)).

**The guide treats cloud as the preferred isolation and local as the fallback.** "The cleanest isolation is a cloud subagent. Each one gets its own VM and branch" and "When the work has to stay local, ask for a worktree up front" ([02-poteto-mode.md L99-L101](https://github.com/cursor/plugins/blob/df58112/pstack/docs/guide/02-poteto-mode.md#L99-L101)). Under a Cursor Project, subagents "run in the cloud by default, so the work continues when your laptop is closed" ([07-overnight.md L94](https://github.com/cursor/plugins/blob/df58112/pstack/docs/guide/07-overnight.md#L94)).

## History: what landed when

Upstream has no CHANGELOG. The plugin manifest carries only the version (`0.15.15`). The history below covers every `pstack/` commit from the first (2026-05-22) to `df58112`.

### Surface-relevant commits

| Date | Commit | Subject | Direction |
|---|---|---|---|
| 2026-05-24 | [`35f3392`](https://github.com/cursor/plugins/commit/35f3392) | pstack: add figure-it-out and show-me-your-work skills (#78) | Local (transcript audit) |
| 2026-05-26 | [`bbc0d75`](https://github.com/cursor/plugins/commit/bbc0d75) | pstack: add session-pickup and trace-forensics playbooks (#83) | Both. First mention of cloud, as a "cloud-agent URL" handoff source only. |
| 2026-06-05 | [`2f3a47e`](https://github.com/cursor/plugins/commit/2f3a47e) | pstack: add pause-safely playbook (#115) | Neutral |
| 2026-06-17 | [`e46364b`](https://github.com/cursor/plugins/commit/e46364b) | pstack: add recall and blast-radius skills (#135) | Local (`recall`) |
| 2026-06-23 | [`0452e08`](https://github.com/cursor/plugins/commit/0452e08) | pstack: add Benny issue automation pack (#137) | Cloud (Cursor Automations) |
| 2026-07-30 | [`b79f8ca`](https://github.com/cursor/plugins/commit/b79f8ca) | Add swarm skill to pstack | **Cloud.** First `environment: "cloud"` default. |
| 2026-08-01 | [`b047069`](https://github.com/cursor/plugins/commit/b047069) | pstack: add autopilot playbooks, /no-comments, Comment Sicko, and /technical-writing (0.13.0) (#185) | **Cloud.** "One Cursor cloud agent per PR". The audit tick rode a cloud-only "cloud-sleeper wake chain". |
| 2026-08-02 | [`99559f2`](https://github.com/cursor/plugins/commit/99559f2) | pstack: add bro, babysit/shipping/orchestrate/worktree-cleanup, and catch-up ports (0.14.0) (#187) | Cloud (Orchestrate workers, Shipping verifiers) and local (Worktree cleanup) in the same commit |
| 2026-08-20 | [`4612556`](https://github.com/cursor/plugins/commit/4612556) | docs(pstack): port workflow and boundary guidance (#238) | Broadened. Autopilot ticks gained a local-root path ("A local root arms each tick as a real terminal `/loop`") beside the cloud-sleeper. |
| 2026-08-24 | [`bdf7aa3`](https://github.com/cursor/plugins/commit/bdf7aa3) | docs(pstack): make the multi-PR plan a verified checklist (#258) | **Cloud.** Live lanes on cloud VMs. |
| 2026-08-26 | [`799151d`](https://github.com/cursor/plugins/commit/799151d) | feat(pstack): add make-bot-ui skill (#271) | Local server, Grok Bot product |
| 2026-09-01 | [`23a56e2`](https://github.com/cursor/plugins/commit/23a56e2) | docs(pstack): port forge-neutral playbooks and Fable 5.1 defaults | Neutralized. Removed "the division of labor the cloud environment forces" and the Graphite (`gt`) requirement. Cloud owners stayed. |
| 2026-09-07 | [`e8d856f`](https://github.com/cursor/plugins/commit/e8d856f) | pstack: density and mannered-prose pass across the skills, two new principle leaves (#329) | Removed Babysit's "a cloud one plus a local one" warning |
| 2026-10-02 | [`23e4138`](https://github.com/cursor/plugins/commit/23e4138) | feat(pstack): port explain-the-number, fresh subagents, hourly autopilot tick, PR headings, schema-first cast (0.15.6) | Neutralized. Dropped `/goal` and the local-versus-cloud tick split for `/loop 1h`, which "works in local and cloud roots". |
| 2026-10-04 | [`4e5b1cf`](https://github.com/cursor/plugins/commit/4e5b1cf) | feat(pstack): add /poteto-help skill (#502) | Cloud recommended for parallel work |
| 2026-10-05 | [`2cbf585`](https://github.com/cursor/plugins/commit/2cbf585) | docs(pstack): refresh guide for /correct, checklist, prompting tips (#508) | Guide adds "cleanest isolation is a cloud subagent" and Cursor Projects with cloud subagents by default |

### Model defaults

Every role default is a Cursor model slug, and 11 commits changed those defaults in four months.

| Date | Commit | Change |
|---|---|---|
| 2026-06-06 | [`6605d7a`](https://github.com/cursor/plugins/commit/6605d7a) | Per-role config via `/setup-pstack`. Dropped `gpt-5.3-codex-high-fast`. Code roles on `composer-2.5-fast` and `gpt-5.5-high-fast`. |
| 2026-07-08 | [`dc2fae6`](https://github.com/cursor/plugins/commit/dc2fae6), [`9b80b53`](https://github.com/cursor/plugins/commit/9b80b53) | Composer slots to `grok-4.5-fast-xhigh`. Hardest tasks to `claude-fable-5-thinking-max`. |
| 2026-07-22 | [`e1007b1`](https://github.com/cursor/plugins/commit/e1007b1), [`03e087a`](https://github.com/cursor/plugins/commit/03e087a) | Panels default to Fable, Sol, and Grok. Explorer roles to Grok. |
| 2026-07-26 | [`d45ad02`](https://github.com/cursor/plugins/commit/d45ad02) | Added Opus 5 to panels. |
| 2026-08-13 | [`63d938c`](https://github.com/cursor/plugins/commit/63d938c) | Grok 4.5 to 4.6. |
| 2026-09-01 | [`23a56e2`](https://github.com/cursor/plugins/commit/23a56e2) | Solo defaults to Fable 5.1. |
| 2026-09-11 | [`889ec4b`](https://github.com/cursor/plugins/commit/889ec4b) | Bug fix, perf, and hillclimb to Grok 4.6. |
| 2026-09-22 | [`70b2dc8`](https://github.com/cursor/plugins/commit/70b2dc8) | Defaults to Opus 5.5 and Grok 4.7. |
| 2026-10-05 | [`df58112`](https://github.com/cursor/plugins/commit/df58112) | Dropped Sol (`gpt-5.6-sol-max`) from every panel. Budget default from `max` to `xhigh`. Now two families, `claude-opus-5-5-xhigh` and `grok-4.7-xhigh-fast`. |

### Removed

- The cloud-sleeper wake chain and `/goal`, replaced by `/loop 1h` ([`23e4138`](https://github.com/cursor/plugins/commit/23e4138)).
- The Graphite (`gt`) requirement for autopilot stacks ([`23a56e2`](https://github.com/cursor/plugins/commit/23a56e2)).
- Cursor's built-in babysit skill as Bugbot triage, replaced by pstack's own rubric ([`99559f2`](https://github.com/cursor/plugins/commit/99559f2)).
- The Sol model family ([`df58112`](https://github.com/cursor/plugins/commit/df58112)).

No cloud default has been removed or reverted.

### How upstream itself is built

- Large batches arrive as ports of a private tree: "Ports internal skill updates" ([`70b2dc8`](https://github.com/cursor/plugins/commit/70b2dc8)) and "parity sweep with the private skill tree" ([`3fe2823`](https://github.com/cursor/plugins/commit/3fe2823)).
- Before 2026-07-22, none of the 53 `pstack/` commits names Cursor Agent. From 2026-07-22 to `df58112`, 32 of 47 do, as author or `Co-authored-by: Cursor Agent`. That is the identity Cursor's agents commit under. The trailer alone does not say cloud or local. Read it next to the author's statement below.

## The author's own statements

- On X, 2026-08-19: "i shipped 1000 PRs last month ... all thanks to cloud agents. ... i make heavy use of /goal, /loop, and /swarm inside of pstack to run my Full Autopilot playbook ... everything runs on cloud agents, so my bots work 24/7 even when i'm asleep or my laptop is offline." ([x.com/poteto/status/2090141955695198633](https://x.com/poteto/status/2090141955695198633))
- The same post says Grok Bot routines "farm context" for her "outer loop". Her X bio, read on 2026-10-06, reads "Grok @Bot at @SpaceXAI ... prev cursor". `make-bot-ui` is the first pstack skill built for Grok Bot. Whether more follow is a guess.
- The README still says "these are the same skills i use everyday to ship high quality code at Cursor" ([README L7](https://github.com/cursor/plugins/blob/df58112/pstack/README.md#L7)).

## Trend

The evidence points one way. Upstream started neutral-to-local (May to July: transcript-reading skills and single-agent playbooks). It turned cloud-first for every fan-out feature from 2026-07-30 on: `/swarm`, both autopilots, Orchestrate's workers, Shipping's verifiers, and Multi-phase plan's live lanes. The author describes her own workflow as entirely cloud. Since then upstream has not removed a cloud default. It has replaced cloud-only mechanics with primitives that work on both surfaces, and it keeps cloud as the default and local as the named exception.

## What this predicts for syncs

- **Most sync work lands in neutral files.** Since 2026-07-30 there were 264 file touches across skill, playbook, and agent files. 42 went to the 6 cloud files, 32 to the 8 local skill and playbook files (10 of those in `setup-pstack`, all model defaults), and 190 to the neutral files. Principles, `how`, `why`, `architect`, `interrogate`, and the single-agent playbooks carry over with little surface work.
- **The cloud files churn more than their share.** They are 7 of 77 units but took about 16% of the touches, led by Autopilot-full (10) and Autopilot-stack (9). Every sync will likely bring edits to text that tells the agent to spawn Cursor cloud agents, which the port has to translate again each time.
- **New fan-out features will likely arrive cloud-first.** No feature since 2026-07-30 that spawns parallel agents has defaulted to local.
- **Model defaults will keep changing.** Eleven commits changed defaults between 2026-06-06 and 2026-10-05. Each sync will likely carry a model-slug diff that the port maps rather than copies.
- **Upstream may resolve its control-skill contradiction toward cloud.** That would move more verification text into cloud-only form.
- **Batches arrive as ports of a private tree.** Expect a few large multi-file commits per sync rather than many small ones.
- **Grok Bot material may grow.** This is a guess, based on the author's current role and on `make-bot-ui`. Such material is product-bound and unlikely to port.
