# Cursor-ism check: detectors in code, rules cite them by id

## Problem

The check script must flag leftover Cursor-isms in the port, and its detection must not drift from the conversion rules doc that Claude reads as prose. In this shape the two halves live in their natural languages: rules are prose in `docs/conversion-rules.md`, and detectors are code in the check script. A citation line in each rule links them. Linking them is not enough on its own, because a rule's prose can change while the detector it cites stays the same. That is still silent drift, so the design also has to catch content changes, not only broken links. Constraints from grounding: check-only; runs under `bash/git/node/python3/jq` with no installs; is run by the weekly sync before it opens a PR and can be run by CI on every PR; a new rule arrives in the same PR as the sync that needed it, with the PR as the only review point; false-positive escapes must be narrow and carry a reason; the next contributor is an agent that copies the nearest example.

## Usage (caller's view)

**Conversion rules doc** (`docs/conversion-rules.md`). Each `###` under `## Rules` is one rule, and it ends in exactly one `Detected by:` line:

```md
## Rules

Every rule ends with `Detected by:` naming detectors in `scripts/check.mjs`.
`node scripts/check.mjs` fails until each rule cites a detector, each detector
is cited by exactly one rule, and each detector's `pin` matches its rule's text.

### Model lines become role names
`pstack-models.mdc` model lines become role names resolved by the port's config.
No model IDs in translated files.

Detected by: `model-id`, `models-mdc`

### Task tool becomes Agent
Cursor's `Task` tool becomes Claude Code's `Agent` tool; keep `run_in_background`.

Detected by: `task-tool`
```

**Syncing agent meets an uncovered Cursor-ism (e.g. Bugbot).** It copies the last rule block and gives the copy a `Detected by: \`bugbot\`` line. It then copies the last entry in `DETECTORS` and leaves `pin: ''`.

```
$ node scripts/check.mjs
docs/conversion-rules.md:58: rule "Bugbot becomes code review": detector `bugbot` pin is '' — rule text hashes to '9c41e07ab2d3'; check the detector matches the rule, then set pin: '9c41e07ab2d3'
exit 2
```

Once the pin is set, the agent runs the check again and gets exit 1 with one finding per leftover. It fixes them, and exit 0 means the PR can open. Rule, detector and pin all land in that PR's diff.

**Maintainer rewords a rule (re-translation).** The edit changes the rule's hash, so every detector the rule cites now fails its pin with exit 2. The maintainer updates the detector (if the rule now means something else) and its pin. The next run's findings list exactly the translated files the re-translation PR has to patch:

```
$ node scripts/check.mjs
pstack/skills/arena/SKILL.md:41:12: [model-id] "grok-4.7-xhigh-fast" — rule "Model lines become role names"
pstack/skills/how/SKILL.md:9:1: [sibling-skill-read] "run the **why** skill" — rule "Sibling skills are read by path"
exit 1
```

**Legitimate mention.** Put a marker on the same line or the line above, in whatever comment syntax the file uses:

```md
<!-- not-a-cursorism: model-id — quotes upstream's runner list verbatim for comparison -->
```

**CI / sync step:** `node scripts/check.mjs` (whole of `pstack/`) or `node scripts/check.mjs <paths…>` (scan only these; consistency and self-test always run).

## Shape

**Data.** There are two sources of truth, one per concern, and every link between them is verified, not synced (per *hand-synced list*: lists that cannot be derived must fail the build when they disagree).

- *Rule* (prose, parsed): `{ title, line, body, cites: string[] }`. `body` is the heading plus the prose with the `Detected by:` line removed and whitespace collapsed. Adding a detector to a rule therefore does not invalidate its siblings' pins.
- *Detector* (code): `{ id, pin, find, hits, misses }`. `find` is a function, not a regex. That is the advantage of this shape: rules like "a sibling-skill mention must have a `read …/SKILL.md` nearby" or "`/how` but not `/pstack:how`, for real skill names" are short code but cannot be written as a pattern. Most detectors are `re(/…/g)`.
- *Pin*: the first 12 hex digits of `sha256(rule.body)`, stored on the detector. This is the load-bearing decision. Citations prove that a link exists, and the pin proves that someone looked at the detector the last time the rule's meaning could have changed. Without it, the shape would only guarantee links.

**Invariants (all checked, exit 2):** every rule has exactly one `Detected by:` line citing ≥1 id; every cited id exists; every detector is cited by exactly one rule, which keeps the pin unambiguous; detector ids are unique; `pin === hash(citing rule body)`; every `hits` sample matches and every `misses` sample doesn't (self-test, per *encode-lessons-in-structure*: a detector carries its own proof); every escape marker names a known detector, has a non-empty reason, and suppresses at least one match (a stale escape is an error).

**Files checked:** every text file under `pstack/`. That includes translated files, overrides and port-only files. A `Task` tool reference in a hand-written override is the same bug for users as one in a translated file, and covering everything means the script never reads `port.json`, so it doesn't depend on the file classification. It does not check `upstream/` (verbatim by definition), the rules doc (made of Cursor-isms) or the repo-root README (credits Cursor by design).

**Interface depth.** The public surface is one command, an optional path list, and three exit codes: 0 clean, 1 Cursor-isms found (fix files), 2 rules/detectors/escapes inconsistent (fix the rules side). The command hides rule parsing, hashing, cross-reference checks, self-test and escape validation. The only extension point is the `DETECTORS` array at the top of the one file. An agent adds an entry by copying the previous one, and the error message tells it the pin.

**Not done:** no auto-fix, no `--repin` writer (the script never writes), no JSON output, no per-file-kind detector scoping.

### Sketch

```
docs/conversion-rules.md   # prose rules; each ### under "## Rules" ends in "Detected by: `id`, …"
scripts/check.mjs          # DETECTORS table (top) + engine (below); node LTS, no deps
.github/workflows/check.yml  # optional: `node scripts/check.mjs` on PRs touching pstack/, docs/conversion-rules.md, scripts/check.mjs
```

```js
#!/usr/bin/env node
// scripts/check.mjs: flags leftover Cursor-isms under pstack/. Check-only; writes nothing.
// Each detector is cited by exactly one rule in docs/conversion-rules.md ("Detected by:").
// `pin` is the hash of that rule's text: when the rule changes, re-check this detector, then update the pin.

/** @typedef {{ start: number, end: number }} Span */
/** @typedef {{ skills: ReadonlySet<string> }} ScanContext  // skill dir names under pstack/skills/ */
/** @typedef {{
 *   id: string,                                     // kebab-case, unique
 *   pin: string,                                    // 12 hex; '' on a new detector (the check prints the value)
 *   find: (text: string, ctx: ScanContext) => Span[],
 *   hits: string[],                                 // each must yield ≥1 span
 *   misses: string[],                               // each must yield 0 spans
 * }} Detector */

/** Wrap a global regex as a Detector.find. */
const re = (pattern) => (text, _ctx) => { throw new Error('not implemented'); };

/** @type {Detector[]} */
const DETECTORS = [
  { id: 'model-id', pin: '3f9a0c1d2e4b',
    find: re(/\b(?:claude-(?:opus|sonnet|haiku|fable)-[\w.-]+|grok-[\w.-]+|gpt-[\w.-]+)\b/g),
    hits: ['runners: `claude-opus-5-5-xhigh`', 'grok-4.7-xhigh-fast'], misses: ['the runner role'] },
  { id: 'models-mdc', pin: '3f9a0c1d2e4b', find: re(/pstack-models\.mdc/g),
    hits: ['the `pstack-models.mdc` rule'], misses: ['the models config'] },
  { id: 'task-tool', pin: 'b7e21a90c4f3', find: re(/\bTask tool\b|\bTask\(/g),
    hits: ['launch it with the Task tool'], misses: ['Open a task list', 'the Agent tool'] },
  { id: 'cursor-path', pin: '0d5c88e1a7b2', find: re(/(?:~\/|\b)\.cursor\//g),
    hits: ['~/.cursor/rules/x.mdc'], misses: ['.claude/settings.json'] },
  { id: 'sibling-skill-read', pin: '61aa3fe09d7c',
    // TODO: each "run the **X** skill" (X in ctx.skills) whose paragraph lacks `${CLAUDE_PLUGIN_ROOT}/skills/X/SKILL.md`
    find: (text, ctx) => { throw new Error('not implemented'); },
    hits: ['Run the **how** skill.'], misses: ['Run the **how** skill: read `${CLAUDE_PLUGIN_ROOT}/skills/how/SKILL.md`.'] },
  { id: 'bare-slash-command', pin: '61aa3fe09d7c',
    // TODO: `/X` where X in ctx.skills, not preceded by `pstack:` and not part of a path
    find: (text, ctx) => { throw new Error('not implemented'); },
    hits: ['type `/how`'], misses: ['type `/pstack:how`', 'skills/how/SKILL.md'] },
];

// ---- engine: nothing below changes when a rule is added ----

/** @typedef {{ title: string, line: number, body: string, cites: string[] }} Rule */
/** @typedef {{ path: string, line: number, col: number, detector: string, text: string, rule: string }} Finding */
/** @typedef {{ path: string, line: number, message: string }} Problem  // exit-2 class */

const RULES_DOC = 'docs/conversion-rules.md';
const SCAN_ROOT = 'pstack';
const ESCAPE = /not-a-cursorism:\s*([a-z0-9-]+)\s+(?:—|--)\s*(\S.*?)\s*(?:-->|\*\/)?\s*$/;

/** Parse "### " sections under "## Rules"; body excludes the Detected-by line, whitespace-collapsed. */
function parseRules(markdown) { throw new Error('not implemented'); }

/** sha256(body), first 12 hex. */
function pinOf(rule) { throw new Error('not implemented'); }

/** Cross-reference rules and detectors: missing/empty citations, unknown ids, uncited or
 *  multiply-cited detectors, duplicate ids, stale pins (message carries the expected pin). */
function checkConsistency(rules, detectors) { throw new Error('not implemented'); }

/** Run each detector's hits/misses samples. */
function selfTest(detectors, ctx) { throw new Error('not implemented'); }

/** Scan files; apply escapes (same line or line above); report findings plus escape problems
 *  (unknown id, empty reason, suppresses nothing). @returns {{ findings: Finding[], problems: Problem[] }} */
function scan(paths, detectors, rules, ctx) { throw new Error('not implemented'); }

/** argv: [] → every text file under pstack/; [paths…] → only those. Prints problems then findings,
 *  one `path:line[:col]: …` per line. Exit 2 if any problem, else 1 if any finding, else 0. */
function main(argv) { throw new Error('not implemented'); }

process.exitCode = main(process.argv.slice(2));
```

## Synthesis decision

## Tradeoffs accepted

- We accept that every rule edit, even a typo fix, forces a pin update in code, in exchange for rule meaning and detection never diverging without a visible code diff in the same PR.
- We accept that the pin proves a review was *forced*, not that it was *done well*: an agent can update the pin without rethinking the detector. In exchange, any drift is visible in the PR, which is the only review point. This is "not silent", not "impossible".
- We accept that every rule must cite a detector, so semantic rules (multi-model → one model family) are detected through proxies (`model-id`, `models-mdc`) and not their full meaning. In exchange, no rule is unenforced by omission.
- We accept that adding a rule means writing in two languages (prose and JS). An agent editing the doc can see the detector ids but not their patterns. In exchange, detectors can be real code (context-aware sibling-skill and slash-command checks), and each one carries self-tested samples.
- We accept that inline escape markers in translated files have to survive patch-forward and re-translation. In exchange, the escapes are line-local, carry a reason, and fail when they go stale.
- We accept that overrides and port-only files get the same scrutiny as translated files, with escapes for the rare legitimate mention. In exchange, the script doesn't read `port.json`.

## Alternatives considered

- **Citation links only, no pin.** It is simpler, but a rule reworded to forbid more (say, a new model family) keeps citing the old detector and passes. That is exactly the silent divergence the task forbids. Without the pin, this shape fails the constraint.
- **Detectors cite rules (each detector names its rule's heading).** It is the same graph pointed the other way, but an agent mid-sync reads the doc, not the script. The doc-side citation is what tells that agent a rule has a detector it must keep consistent.
- **Escape allowlist inside the detector (`allow: [{path, text, why}]`).** It keeps all escapes in one file, but the entries are keyed by path and text far from the line they excuse. They go stale silently when a sync moves or removes text, and they invite broad entries. The inline marker is narrower and checked for staleness.
- **One file per detector (`scripts/detectors/*.mjs`).** It looks tidier, but it adds a module boundary and an index to keep in sync. One maintainer and about ten detectors don't justify it.

## Open questions and risks

- Should the check also cover overrides and port-only files (as proposed), or only translated files so that overrides can mention Cursor freely?
- Is a 0/1/2 exit split worth it, or does the sync only need zero vs non-zero?
- Will agents treat pin updates as a rubber stamp? If so, should the failure message require the PR body to name each repinned detector?
- Does the patch-forward step in `/sync-upstream` reliably carry `not-a-cursorism` markers through when the surrounding upstream text changes?
- Should the scan cover the repo-root README (credits Cursor), or stay limited to `pstack/`?

## Next implementation step

Write `parseRules` and `checkConsistency` test-first against a fixture rules doc. The pin and citation invariants are the part of this shape that prevents drift.
