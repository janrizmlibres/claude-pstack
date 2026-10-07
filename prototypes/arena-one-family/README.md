# PROTOTYPE — arena and architect on one model family

Throwaway, never merged. The primary source for the ticket "Arena and architect: shape on one model family". The verdict lives on that ticket.

## What was run

An architect arena on a real design question from this repo: how the Cursor-ism check script gets its patterns from the conversion rules doc so the two can't drift (`grounding.md`). It ran four runners, all `opus` at the session's effort, with briefs from `briefs.md`:

| File | Brief | Shape returned |
|---|---|---|
| `candidate-1.md` | Direction A: patterns in the prose doc | per-rule `cursorism` block, `before`/`after` self-test, inline allow markers |
| `candidate-2.md` | Direction B: structured rules, generated prose | `conversion-rules.json` → generated Markdown, hash-checked freshness, `pending` rules |
| `candidate-3.md` | Direction C: detectors in code, rules cite ids | JS detectors with `hits`/`misses`, rules cite ids, a hash **pin** of the rule text on each detector |
| `candidate-4.md` | Open seat, blind to the directions | near-copy of A; allows kept in the doc instead of inline |

No runner returned `DIRECTION FAILS`.

## Scores (rubric in `briefs.md`)

| Candidate | R1 | R2 | R3 | R4 | R5 | Total |
|---|---|---|---|---|---|---|
| Parent: A | 1 | 2 | 2 | 2 | 2 | 9 |
| Parent: open seat | 1 | 2 | 1 | 2 | 2 | 8 |
| Parent: B | 1 | 1 | 2 | 1 | 2 | 7 |
| Parent: C | 2 | 0 | 2 | 1 | 2 | 7 |
| Blind judge: open seat (X) | 1 | 2 | 2 | 2 | 2 | 9 |
| Blind judge: A (Y) | 2 | 2 | 1 | 2 | 2 | 9 |

The tiebreak fired (top two within 1). The judge picked the open seat as base and would graft A's dead-pattern check (every pattern must hit one of its rule's `before` lines). It caught two things the parent missed: inline markers can't live in JSON files and may not survive re-translation; the open seat never checks for dead patterns.

## What it showed

1. Assigned whole-shape directions on one model family give real breadth: A, B and C are structurally distinct, none hedged, each named its own residual weakness.
2. A blind open seat converges on the parent's most obvious direction (both A and the open seat invented the same `before`/`after` self-test unprompted).
3. A within-one-point tiebreak can fire between two copies of one shape and never show the judge the strongest outlier (C's pin).
4. A fresh-context judge on the same family catches flaws the parent, who wrote the directions and rubric, misses.
5. An Agent call sets the model but not the effort: the judge ran at session effort, not `high`.
