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

**Override**:
A port file written by hand for Claude Code in place of translating its upstream counterpart. A sync never re-translates it; a change to its counterpart flags it for reconsideration.
_Avoid_: patch, customization, fork

**Port-only file**:
A port file with no upstream counterpart, such as a manifest or a hook the port adds.
_Avoid_: extra, addition

**Sync**:
Bringing the port up to a newer upstream: diff upstream against the snapshot, carry each change into the port, then advance the snapshot.
_Avoid_: update, merge, rebase

### Execution

**Surface**:
Where a Claude Code session executes: **local** (the user's machine — CLI, desktop or IDE) or **cloud** (a claude.ai/code session on an Anthropic VM). Decided by where the session runs, not where it was launched: `claude --cloud` typed in a local terminal starts a cloud session.
_Avoid_: environment (a cloud environment is the setup-script and network config), platform, host

**Primary surface**:
The surface whose constraints win where the two pull apart.

**Lead**:
The session a run is handed to (a spec, or a task verbatim). It plans the fan-out, starts the workers and integrates what they return. Has a surface of its own, independent of its workers'.
_Avoid_: coordinator (reserved for upstream's `orchestrate`), orchestrator, parent

**Worker**:
A session or subagent a lead starts to carry out one piece of a run.
_Avoid_: child, agent

**Entry point**:
The session where the user starts a run. Often not the lead: a local entry point usually hands off to a cloud lead.
_Avoid_: launcher, front end

**Hand-off**:
An entry point passing a run to a lead on another surface. The spec is pushed first; the entry point keeps no control afterwards.
_Avoid_: delegation (a lead giving work to its workers), dispatch
