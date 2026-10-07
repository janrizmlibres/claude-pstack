# Grounding: the Cursor-ism check and the conversion rules doc

Phase A grounding for an architect run. Shared verbatim by every runner. Glossary: `CONTEXT.md` in this directory.

## The system

This repo ports pstack (a Cursor plugin of agent workflow skills, mostly Markdown `SKILL.md` files plus a few scripts) to Claude Code. Layout, decided:

- `upstream/` — verbatim sparse mirror of upstream at one commit, plus machine-written `upstream/snapshot.json`. Never hand-edited.
- `pstack/` — the port, a Claude Code plugin. Path identity with `upstream/`: `upstream/skills/arena/SKILL.md` ↔ `pstack/skills/arena/SKILL.md`.
- `port.json` (repo root) — lists only the exceptions: each **override**, **port-only file** and **dropped file**, each with a one-line `why`. Any path under `pstack/` not listed is a **translated file**.
- `scripts/` — `upstream-diff` (exists in plan) and the **check script** this design is about.
- A conversion rules doc (path not fixed; `docs/conversion-rules.md` is the working name) — the rules Claude applies when translating an upstream file, and again on every sync (patch-forward) and re-translation. Claude reads it as prose. Today it would hold rules like:
  - `~/.cursor/rules/pstack-models.mdc` model lines → role names resolved by the port's config (no model IDs in translated files: no `claude-opus-5-5-xhigh`, no `grok-*`).
  - Cursor's `Task` tool → Claude Code's `Agent` tool; `run_in_background` semantics kept.
  - A model-facing reference to a sibling skill ("run the **how** skill") gains `read ${CLAUDE_PLUGIN_ROOT}/skills/how/SKILL.md`; user-facing `/how` becomes `/pstack:how`.
  - `.cursor/` paths → their Claude Code locations; Cursor modes, Bugbot, cloud agents → their decided counterparts.
  - Multi-model steps → one model family per the multi-model conversion rule (roles, not models).

## The check script, as decided so far

- Check-only. It never rewrites. It flags leftover Cursor-isms in translated files.
- Its patterns are read from the conversion rules doc, **so the two can't drift**. How is the open design question.
- The weekly sync (a claude-code-action run of the repo skill `/sync-upstream`) runs it before opening the sync PR. Whether CI also runs it on every PR is undecided; design so it can.
- During a sync, when Claude meets a Cursor-ism no rule covers, it proposes the missing rule **in the same PR** as an edit to the conversion rules doc. Nobody is there to ask; the PR is the only review point.
- A re-translation (rules changed, upstream didn't) patches every translated file a changed rule touches, in its own PR.

## Constraints and facts

- Legitimate mentions exist: the README credits upstream and Cursor; a translated file may quote upstream on purpose. False positives need an escape that is narrow and carries a reason.
- Overrides are hand-written Claude Code files. Whether the check covers them is a design choice; say which and why.
- The runtime for repo scripts is not settled. Assume only what a GitHub Actions `ubuntu-latest` runner and a Claude Code cloud VM both have: `bash`, `git`, `node` (LTS), `python3`, `jq`. No package installs.
- Readers and editors of the rules are mostly agents mid-sync, seeing only the files they open. Design for the next contributor being an agent that copies the nearest example and takes the shortest path that passes.
- Small repo, one maintainer. Prefer few files and few concepts.

## The task

Design how the check script gets its patterns from the conversion rules, so a rule and its detection cannot silently diverge. Produce: the caller's usage (a maintainer and a syncing agent), the data shape of a rule, file layout, the check script's interface and exit behaviour, how false positives are allowed, and which files are checked.
