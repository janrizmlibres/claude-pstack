# claude-pstack

A Claude Code port of pstack, Lauren Tan's Cursor plugin of agent workflows, kept in step with its upstream.

## Language

### Source and port

**Upstream**:
The pstack plugin as published in `cursor/plugins`, the source this repo ports from.
_Avoid_: original, source plugin, Cursor version

**Snapshot**:
The verbatim copy of upstream, at one recorded upstream commit, that the current port was made from. Never edited by hand; only a sync advances it.
_Avoid_: vendor copy, mirror, base

**Port**:
The Claude Code edition of pstack that this repo publishes.
_Avoid_: fork, conversion, adaptation

**Translated file**:
A port file made from its upstream counterpart by applying the conversion rules. A sync re-translates it when its counterpart changes.
_Avoid_: generated file, converted file

**Conversion rule**:
A rule every translation and re-translation applies to turn an upstream mechanic into its Claude Code form, such as converting a multi-model step to one model family.
_Avoid_: mapping, transform

**Override**:
A port file written by hand for Claude Code in place of translating its upstream counterpart. A sync never re-translates it; a change to its counterpart flags it for reconsideration.
_Avoid_: patch, customization, fork

**Port-only file**:
A port file with no upstream counterpart, such as a manifest or a hook the port adds.
_Avoid_: extra, addition

**Dropped file**:
An upstream file the port deliberately leaves out because the effort rules it out, not merely because it is Cursor-specific: a Cursor-only file with a Claude Code equivalent is translated or overridden instead. A sync lists changes to it and otherwise ignores them.
_Avoid_: skipped file, excluded file, unsupported file

**Sync**:
Bringing the port up to a newer upstream: diff upstream against the snapshot, carry each change into the port, then advance the snapshot.
_Avoid_: update, merge, rebase

**Re-translation**:
Carrying a change in the conversion rules into every translated file it touches, with the snapshot left where it is. Not a sync: upstream has not moved.
_Avoid_: re-port, resync

### Execution

**Surface**:
Where a Claude Code session executes: **local** (the user's machine — CLI, desktop or IDE) or **cloud** (a claude.ai/code session on an Anthropic VM). Decided by where the session runs, not where it was launched: `claude --cloud` typed in a local terminal starts a cloud session.
_Avoid_: environment (a cloud environment is the setup-script and network config), platform, host

**Lead**:
The session a run is handed to (a spec, or a task verbatim). It plans the fan-out, starts the workers and integrates what they return. Has a surface of its own, independent of its workers'.
_Avoid_: coordinator (reserved for upstream's `orchestrate`), orchestrator, parent

**Worker**:
A session or subagent a lead starts to carry out one piece of a run.
_Avoid_: child, agent

**Role**:
The job a worker does in a run: delegate, runner, reviewer, judge or synthesizer. A role, not a worker, is what a model and effort setting attaches to.
_Avoid_: seat, tier, slot

**Volume role**:
A role whose results come from the number of attempts or pages read rather than the depth of each, such as the workers of a race any single success wins.
_Avoid_: cheap role, bulk worker

**Direction**:
The whole shape one arena runner is told to build, distinct from every other runner's. One of the two ways a fan-out gets breadth from prompts rather than models.
_Avoid_: approach, variant, persona

**Lens**:
The part of a review rubric one reviewer owns. The other way a fan-out gets breadth from prompts: reviewers split the rubric instead of each applying all of it.
_Avoid_: angle, focus, perspective

**Entry point**:
The session where the user starts a run, on either surface. It is the run's lead unless the user hands the run off.
_Avoid_: launcher, front end

**Hand-off**:
An entry point passing a run to a lead on the other surface, when the user chooses to. The input (a spec, a file, or the task verbatim) is pushed first; the entry point keeps no control afterwards.
_Avoid_: delegation (a lead giving work to its workers), dispatch
