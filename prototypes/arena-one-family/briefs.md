# PROTOTYPE — arena and architect on one model family

Throwaway. Ticket: "Arena and architect: shape on one model family". Shows the leaning made concrete on a real design question (the Cursor-ism check), so it can be reacted to.

What changes from upstream, in one line each:
- Runners all run the **Work** role (`opus` · medium). Breadth comes from the brief, not the model.
- The parent assigns each runner but one a **whole-shape direction**. The last runner is the **open seat**: task only, no direction, blind to the others.
- A directed runner may return **DIRECTION FAILS** instead of a design, with evidence.
- No cross-family judge. The parent scores alone. A **blind tiebreak judge** (Judgement role, `opus` · high) runs only when the top two are within one rubric point.
- `architect` inherits all of this through arena; its runner prompt drops "each on a different model".

---

## 1. Directed runner brief (filled in for runner 1; runners 2 and 3 differ only in the Direction block)

> You are one runner in an architect arena. Read the **architect** skill (`${CLAUDE_PLUGIN_ROOT}/skills/architect/SKILL.md`) and its runner prompt (`references/runner-prompt.md`) for the discipline you work under. Grounding: `<grounding path>`. Write your design package, shaped per `references/rationale-template.md`, to `<output path>/design.md`.
>
> **Your direction.** The parent has assigned you one whole shape. Other runners have other shapes. Your job is the strongest possible version of *this* shape, not the best design overall. Don't drift toward a middle ground, and don't borrow another shape's load-bearing idea to patch a weakness; name the weakness instead.
>
> > **Direction A — the prose doc carries the patterns.** The conversion rules doc stays the single source. Each rule's section in the Markdown holds its own machine-readable detection block, and the check script parses the doc.
>
> **If the direction can't work.** Make a real attempt first. If the shape can't meet a hard constraint in the grounding, return this instead of a design, in `<output path>/design.md`:
>
> ```
> DIRECTION FAILS
> Constraint: <the grounding constraint it can't meet>
> Because: <the concrete mechanism, with an example>
> Nearest viable variant: <one line — what would have to change about the direction>
> ```
>
> A soft weakness is not a failure. Ship the design and list the weakness under "Tradeoffs accepted".

Direction blocks for the other two directed runners:

> **Direction B — structured rules, generated prose.** A structured file (JSON or YAML-in-JSON-compatible form) is the single source: each rule has an id, its prose, and its detection. The Markdown conversion rules doc is generated from it, and a check fails when the generated doc is stale.

> **Direction C — detectors in code, rules cite them by id.** The check script owns detectors as code. Each rule in the prose doc cites the detector ids that enforce it. A consistency check fails when a rule cites no detector, or a detector is cited by no rule.

## 2. Open-seat brief

> You are one runner in an architect arena. Read the **architect** skill and its runner prompt for the discipline you work under. Grounding: `<grounding path>`. Write your design package, shaped per `references/rationale-template.md`, to `<output path>/design.md`.
>
> Produce the best design you can for the task. Other runners are working the same task; produce your own best answer, not a hedge.

(The open seat isn't told the directions exist. That keeps it a sample of the model's natural answer, which tests whether the parent's directions missed the obvious one.)

## 3. Rubric (parent-held; runners never see it)

Each criterion scores 0 (fails), 1 (partly) or 2 (meets). Max 10.

| # | Criterion | 2 means |
|---|---|---|
| R1 | Can't drift | Adding, removing or changing a rule without its detection (or the reverse) fails a command that the sync and CI run, by structure, not by discipline. |
| R2 | Sync-time edit | A syncing agent proposing a new rule edits one place, and the PR diff shows the rule's intent and detection side by side. |
| R3 | Narrow allowances | A legitimate mention is allowed per occurrence or per file, with a reason, without weakening the rule elsewhere. |
| R4 | Small surface | Few files and concepts to learn; no runtime beyond the grounding's list; no hand-synced list (e.g. the checked-file set derives from `port.json`). |
| R5 | Right scope | Says which files are checked and why, and the choice holds for overrides, port-only files and the README. |

**Tiebreak trigger:** after the parent scores, if the top two totals are within 1 point, spawn the blind judge. Otherwise the parent picks, and the synthesis note records the scores.

## 4. Blind tiebreak judge brief (Judgement role)

> You are judging two candidate designs, labelled X and Y. Read the grounding at `<grounding path>`, then each candidate end to end. Score each against the rubric below, criterion by criterion, 0/1/2, citing the passage that earns the score. Then name the better **base** for a future maintainer to extend — the cleaner boundary or smaller interface when they're close — and one idea from the other worth grafting.
>
> `<rubric>`
>
> Return: a score table, the base, the graft, and two sentences of reasoning. Don't soften the call to a tie.

The judge sees no direction names, no parent scores and no hint of which candidate the parent prefers. Its job under the multi-model conversion rule is fresh context, not a second family.
