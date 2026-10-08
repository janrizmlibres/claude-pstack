> **PROTOTYPE — throwaway.** A rough draft of the repo-root `README.md`, made to react to for
> "README: a rough draft to react to". Not the real README. Choices to react to are marked
> **[choice]**; facts not yet verified are marked **[verify]**.

# pstack for Claude Code

A Claude Code port of [pstack](https://github.com/cursor/plugins/tree/main/pstack), Lauren Tan's
Cursor plugin of agent workflows, kept in step with upstream.

**Tracks upstream pstack v0.15.15** (`cursor/plugins@df58112`). <!-- [choice] generated from upstream/snapshot.json; a sync PR rewrites this line -->
pstack is © Lauren Tan, MIT. This port is MIT too; see [License and credit](#license-and-credit).

<!-- [choice] Credit sits in the first lines, not only at the bottom: a reader should know at
once whose work this is and which upstream version they are getting. -->

---

## What it is

Type `/pstack:poteto-mode` with a task, an issue, or a spec. pstack picks a playbook (Feature,
Bug fix, Refactoring, Orchestrate…), runs it with parallel workers and review panels, and opens
the PRs. It runs the same way on your machine and in a Claude Code cloud session.

## Install (local)

**Prerequisites**
- Claude Code **[verify: minimum version]**
- `gh`, signed in
- **Bun, or Node ≥ 22.18** — needed for orchestrate, babysitting PRs, shipping and multi-phase
  plans. Without one, those steps stop and say so.

**Install**

```
/plugin marketplace add janrizmlibres/claude-pstack
/plugin install pstack@claude-pstack
```

**Turn on auto-update.** Claude Code leaves it off for third-party marketplaces: `/plugin` →
Marketplaces → `claude-pstack` → Enable auto-update. Every merge to `main` is a release, so
without auto-update you stay on the commit you installed. (`/plugin` shows a commit SHA, not a
version number; the upstream version you're on is the line at the top of this README.)

**Pick models** (optional) — `/config` → pstack:

| Setting | Runs | Default | Effort (fixed) |
|---|---|---|---|
| Work | code delegates, arena runners | `opus` | medium |
| Judgement | judges, reviewers, hardest tasks | `opus` | high |
| Volume | swarm and race workers, bulk readers | `sonnet` | high |

`/pstack:setup-pstack` shows your current settings and prints the cloud setup line for them.

**Worktrees.** A local run gives each parallel code-writing worker its own git worktree under
`.claude/worktrees/` (arena and architect runners, prototypes, figure-it-out and visual-parity
workers), and each PR works from a worktree off its base. Your own checkout is left alone.
- Worktrees hold tracked files only. List gitignored files workers need, such as `.env`, in a
  `.worktreeinclude` at your repo root; a worker missing one stops with `BLOCKED: missing <file>`.
- `worktree.symlinkDirectories` (e.g. for `node_modules`) is yours to opt into; pstack never sets
  it, since one worktree's install would then change every other.
- Worktrees cost disk. The lead removes workers' worktrees once integrated and keeps the
  branches; ask for "worktree cleanup" to reclaim strays.

## Cloud workers from a local run

A local lead sends **swarm workers, orchestrate units and autopilot owners** to cloud sessions
by default. That needs:
1. **Auto mode** on your account (the lead starts cloud workers with
   `claude --cloud --permission-mode auto`). Every other mode stops on a click per worker.
2. A **default cloud environment** that carries the setup line (next section) — cloud workers
   launch there. Set it with `/remote-env` **[verify]**.

Say **"local only"** in a request to keep everything on your machine; the big fan-outs then run
in parallel local worktrees. If the lead can't start cloud workers, it falls back to local-only
and says so once.

## Install (cloud)

The cloud surface has no `/plugin`, so pstack gets there through the environment's **Setup
script**. Paste this **setup line** in (or copy it from `/pstack:setup-pstack`, which fills in
your model settings):

```
git clone --depth 1 https://github.com/janrizmlibres/claude-pstack /opt/claude-pstack && bash /opt/claude-pstack/scripts/cloud-install.sh --config work_model=opus --config judgement_model=opus --config volume_model=sonnet
```

It installs the plugin, best-effort installs Chromium for browser checks, and adds a session-start
hook that pulls the latest pstack, so cloud sessions stay current without editing the setup line.
Changing a model means editing the line.

- Put the line in **every environment that should carry pstack.**
- **One environment per repo**, e.g. `Mira` for one project: set
  `"remote": { "defaultEnvironmentId": "<id>" }` **[verify key and where the id comes from]** in
  that repo's `.claude/settings.local.json`. Then `claude --cloud` and a local lead's cloud workers
  use it there without naming it each run.

<!-- [choice] Cloud install comes after local and the cloud-workers section, since most users
start locally. Alternative: one "Setup" section with Local / Cloud subsections side by side. -->

## Running it

```
/pstack:poteto-mode fix the flaky retry test in src/net
/pstack:poteto-mode build #42
```

**Run a spec in the cloud** — plan locally (e.g. `/to-spec`), then start a cloud session with:

```
/pstack:poteto-mode build https://github.com/<you>/<repo>/issues/42
```

- Handing pstack a spec is the go to **execute** it. Say **"plan only"** to stop after the plan.
- **Landing (merging) stays with you** unless the request grants it ("…and land it").
- "Hand this off" from a local run passes it to a cloud lead and exits with the session link.

## What a run costs

A Feature can run up to three panels:

| Panel | Workers |
|---|---|
| architect (an arena) | 3 Work runners + 1 Judgement judge |
| implementation arena | 3 Work runners + 1 Judgement judge |
| interrogate | 3 Judgement reviewers |

On the defaults that is up to **13 Opus agents** for one feature **[verify: table sums to 11]**.
Most bug fixes run no panel. To spend less, waive a panel in the request ("skip the arena") or in
your `CLAUDE.md`; the run records it as `skip: user waived`. pstack never skips one on its own.

Heavy commands (tests, builds, dev servers, browsers) run **one at a time per machine**, across
every pstack session on it, so a wide fan-out is bounded by your test and build time, not by the
number of workers.

## Your rules win

Your request and your `CLAUDE.md` outrank pstack's text, its Non-negotiables included: commit
attribution, TDD, merge method, PR title style, test caps. pstack's defaults (squash merges,
Conventional Commits, hand-chained stacks) apply only where you say nothing. For example, to use
`gh stack` for stacked PRs, say so in your `CLAUDE.md`.

In cloud, your user-level `CLAUDE.md` is not there: rules come from the request and the repo's own
`CLAUDE.md`.

## How this port differs from upstream

<!-- [choice] Two layers. The prose below is hand-written: the handful of deviations a user
feels. The table after it is generated from port.json by a script and checked in CI, so it
can't drift; a reader who wants file-level detail gets it there. Alternative A: table only
(accurate, but says nothing about *why it feels different*). Alternative B: prose only (drifts
on every sync). -->

- **Claude models only.** Upstream mixes model families for breadth; the port gets breadth from
  distinct prompts instead — arena runners get different directions, interrogate's reviewers
  split the rubric into lenses — and judges are blind to the reasoning they judge.
- **Three settings, not a per-role model map.** Work, Judgement, Volume (above).
- **No Cursor dependencies.** Cursor's CLI, Bugbot, Origin and modes are replaced or dropped;
  review-bot triage covers any review bot.
- **Cloud is a second surface, not the default.** Upstream sends big fan-outs to Cursor cloud
  agents; the port sends the same ones to Claude Code cloud sessions, and only under Auto.
- **Added by the port:** the cloud setup line, the entry reminder hook, the machine lock, the
  hand-off playbook, and recovery after context compaction.
- **Left out:** `automations/benny` (Cursor Slack automations), external models, native mobile
  verification.

### File by file

<!-- BEGIN generated from port.json — do not edit by hand -->
| File | Kind | Why |
|---|---|---|
| `skills/setup-pstack/SKILL.md` | override | shows settings, prints the cloud setup line |
| `skills/interrogate/SKILL.md` | override | lens reviewers on one model family |
| `skills/eval/eval.md` | override | blind samples, one judge |
| `skills/poteto-mode/scripts/check-plan.mjs` | override | markers follow the port's wording |
| `agents/work.md` … `agents/volume-reader.md` | port-only | one agent per setting and access |
| `playbooks/hand-off.md` | port-only | passing a run to the other surface |
| `automations/benny/` | dropped | Cursor Slack automations |
| … | | |

Every file not listed is translated from upstream at the same path.
<!-- END generated -->
<!-- rows here are illustrative, not the real list -->

## Keeping up with upstream

A weekly GitHub Action checks upstream. When it has moved, Claude opens one sync PR that brings the
port up to date, with a row per upstream change and ⚠️ on the calls it was unsure of. Nothing
merges itself. The verbatim upstream copy lives in `upstream/`; `CONTEXT.md` and `docs/adr/`
explain the port's vocabulary and decisions.

## License and credit

pstack is by **Lauren Tan**, published in [cursor/plugins](https://github.com/cursor/plugins)
under the MIT License. This port keeps upstream's copyright notice in
[`pstack/LICENSE`](pstack/LICENSE) **[choice: alongside, or merged into one root LICENSE with
both notices?]** and is itself released under MIT.

Not affiliated with Cursor or Anthropic. <!-- [choice] keep or drop -->
