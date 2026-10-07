# Candidate 2: structured rules, generated prose

## Problem

The conversion rules have two readers who want different forms of the same rule. Claude, translating or syncing, reads prose. The check script needs patterns it can run. If each form is written by hand, they drift: someone adds a sentence and no regex, or tightens a regex and leaves the prose describing the old behaviour. The authors are mostly agents in the middle of a sync. They see only the files they open, copy the nearest example and stop at the first green run, and the sync PR is the only review. Constraints from grounding: the check is check-only; the only runtimes are `bash`, `git`, `node`, `python3` and `jq`, with no installs; legitimate mentions of Cursor need a narrow escape that carries a reason; a sync may add a rule in its own PR, but re-translating the existing files that rule covers belongs in a separate PR; the check must be runnable both by the sync and by CI on every PR.

## Usage (caller's view)

**Doc header** (the first line of `docs/conversion-rules.md`, which Claude reads):

```markdown
<!-- GENERATED from docs/conversion-rules.json by `scripts/check-cursorisms --write-doc`. Edit the JSON, never this file. body-sha256: 3f9a…c1 -->
```

**Syncing agent, `/sync-upstream` step "Check"** (as written in the repo skill):

> Run `scripts/check-cursorisms`. For each finding `path:line:col rule-id`, apply that rule from `docs/conversion-rules.md`. If the line is a deliberate quote of upstream, add an `allow` entry to that rule in `docs/conversion-rules.json` with a `why`. If you found a Cursor-ism that no rule covers, copy the nearest rule object in the JSON, write its prose, an `upstream`/`port` example pair and a pattern, set `"pending": true` if files you did not translate still contain the Cursor-ism, then run `scripts/check-cursorisms --write-doc`. Open the PR only when the check exits 0.

```console
$ scripts/check-cursorisms
pstack/skills/arena/SKILL.md:42:17      task-tool       Cursor `Task` tool; Claude Code uses `Agent`
pstack/skills/how/SKILL.md:88:5         model-ids       a Grok model ID
docs/conversion-rules.json              model-ids       example 2: upstream form matched by no pattern
docs/conversion-rules.json              readme-credit   allow pstack/README.md "ported from Cursor" suppressed nothing (stale)
docs/conversion-rules.md                                stale: JSON changed since last render; run scripts/check-cursorisms --write-doc
pending  plan-mode-names  3 findings in 2 files (not failing; re-translation owed)
check-cursorisms: 5 problems
$ echo $?
1
```

**Maintainer, re-translation PR**: delete `"pending": true` from the rule, then run `scripts/check-cursorisms`. The findings it lists are the re-translation's worklist. The PR is done when the check exits 0.

**CI** (`.github/workflows/check.yml`, one step): `run: scripts/check-cursorisms`.

## Shape

**One source, one generated view.** `docs/conversion-rules.json` is the only file anyone edits. `docs/conversion-rules.md` is rendered from it and committed, so a reading agent never has to run a build (per single source of truth: derive, don't sync). The format is JSON rather than YAML because `node`, `python3` and `jq` all parse it without installing anything.

**Rule data shape** (validated once at load, then used as typed domain objects, per boundary-discipline):

```jsonc
{
  "version": 1,
  "preamble": ["Rules Claude applies when translating an upstream file, on every sync and on every re-translation.", ""],
  "rules": [
    {
      "id": "model-ids",                       // kebab-case, unique, cited in findings
      "title": "Model lines become role names",
      "prose": [                               // Markdown, one line per element, "" = blank line
        "Upstream names models from `~/.cursor/rules/pstack-models.mdc`. Replace each with the role",
        "the step fills; the port's config resolves roles to models. No model IDs in translated files."
      ],
      "examples": [                            // >= 1; rendered as Upstream/Port pairs AND used as test vectors
        { "upstream": "use `claude-opus-5-5-xhigh` and `grok-4.7-xhigh-fast`",
          "port":     "use the runner role for each candidate" }
      ],
      "detect": {                              // exactly one of: patterns | none
        "patterns": [
          { "regex": "\\bclaude-(opus|sonnet|haiku|fable)-\\d", "why": "a Claude model ID" },
          { "regex": "\\bgrok-\\d", "why": "a Grok model ID" }
        ],
        "misses": "Model names written out in prose (\"Opus\")."   // optional; rendered so the gap is visible
      },
      "pending": true,                         // optional; findings reported, but they don't fail the check
      "allow": [                               // optional; never rendered into the doc
        { "path": "pstack/skills/arena/references/upstream-notes.md",
          "text": "Cursor's `grok-4.7` runner", "why": "quotes upstream's runner list on purpose" }
      ]
    },
    {
      "id": "multi-model-steps",
      "title": "Multi-model steps become one model family",
      "prose": ["…"],
      "examples": [{ "upstream": "…", "port": "…" }],
      "detect": { "none": "Deciding that a step is multi-model takes reading the step, not matching a pattern." }
    }
  ]
}
```

**What ties prose to detection.** Each rule's examples serve twice: the generated doc renders them as the Before/After pairs Claude reads, and the check runs them as test vectors. The script enforces four invariants before it scans anything:

1. Every `upstream` example is matched by at least one of its own rule's patterns.
2. Every pattern matches at least one of its own rule's `upstream` examples, so no pattern is untested.
3. No rule's pattern, pending rules included, matches any rule's `port` example, so every "after" form the doc shows is clean.
4. A rule with no patterns must say why in `detect.none`, and the doc prints that reason as "Not checked mechanically".

As a result, a regex cannot be added without an example that appears in the doc, and the doc cannot show an example that the regex fails to catch.

**Doc freshness, two diagnoses.** The header records a `body-sha256` of the rendered body. The check reports a body that no longer matches its own hash as "hand-edited: move the change into the JSON". It reports a body that differs from `render(json)` as "stale: run --write-doc". `--write-doc` refuses to overwrite a hand-edited body, so an agent that edited the Markdown cannot lose that edit by regenerating blindly. Rendering is deterministic: rule order follows the JSON and allows are left out, so adding an allow never needs a regeneration.

**Which files are checked.** Every text file under `pstack/`: translated files, overrides and port-only files alike. The script never reads `port.json`. Overrides are included on purpose. No sync ever re-translates them, so a Cursor-ism in an override would otherwise survive forever. And the defect (a Cursor mechanic shipped in a Claude Code plugin) is the same whatever the file's classification. `upstream/` and `docs/` are never scanned. Matching works line by line; binary files (any file containing a NUL byte) are skipped.

**False positives.** An allow entry belongs to one rule. It suppresses that rule's findings only in one `path`, and only on lines that contain `text`, and it needs a non-empty `why`. An allow that suppresses nothing is itself a problem, so allows can't outlive the line they excuse. Allows sit next to the rule they weaken, in the file the sync PR already touches, which is where a reviewer looks.

**Pending rules.** A sync that adds a rule needs a green check, but other translated files may still contain the newly covered Cursor-ism, and that fix belongs in a separate re-translation PR. `pending: true` reports those findings without failing the check. The re-translation PR deletes the flag, and the check's output becomes its worklist. The doc renders a pending rule like any other, because new translations must apply it at once.

**Interface depth.** The public surface is one command with one flag. Behind it sit structural validation, the example self-test, rendering, hash-checked freshness, the scan, allow bookkeeping and stale-allow detection. Callers never order these stages: every run does all of them, and `--write-doc` only adds "render first".

**What it deliberately does not do:** rewrite files, read `port.json`, match across lines, scope a scan to a subset of files (stale-allow detection needs the full scan), or ship a JSON Schema file. A schema file would be a second, hand-synced list of the fields the validator already owns.

### Sketch

File layout:

```
docs/conversion-rules.json      # the only source; edit this
docs/conversion-rules.md        # generated + committed; Claude reads this
scripts/check-cursorisms        # node, CommonJS, no deps; the only code
scripts/check-cursorisms.test.js  # node:test, fixtures inline
.github/workflows/check.yml     # optional CI: runs scripts/check-cursorisms
```

Script interface:

```js
#!/usr/bin/env node
// scripts/check-cursorisms [--write-doc]
// Exit 0: no problems (pending-rule findings may be printed).
// Exit 1: problems: Cursor-isms, example self-test failures, stale or hand-edited doc, stale allows.
// Exit 2: rules file missing, not JSON, or structurally invalid; nothing was scanned.
'use strict';

const RULES = 'docs/conversion-rules.json';
const DOC = 'docs/conversion-rules.md';
const SCAN_ROOT = 'pstack';

/** @typedef {{ regex: RegExp, why: string }} Pattern */
/** @typedef {{ kind: 'patterns', patterns: Pattern[], misses?: string } | { kind: 'none', reason: string }} Detection */
/** @typedef {{ path: string, text: string, why: string }} Allow */
/** @typedef {{ upstream: string, port: string }} Example */
/** @typedef {{ id: string, title: string, prose: string[], examples: Example[], detect: Detection, pending: boolean, allow: Allow[] }} Rule */
/** @typedef {{ preamble: string[], rules: Rule[] }} RuleSet */
/** @typedef {{ path: string, line: number, col: number, ruleId: string, why: string, lineText: string }} Finding */
/** @typedef {{ where: string, ruleId?: string, message: string }} Problem */

/** Parse and validate the JSON into a RuleSet. Compiles regexes with flag 'u'. Throws RulesInvalid naming rule id + field. */
function parseRules(jsonText) { throw new Error('not implemented'); }

/** Invariants 1-4 over examples and patterns. Pure. */
function selfTest(ruleSet) { throw new Error('not implemented'); }

/** Deterministic Markdown: header with body-sha256, preamble, then per rule: title, id, prose, examples, detection line, pending note. Ignores allow. */
function renderDoc(ruleSet) { throw new Error('not implemented'); }

/** 'fresh' | 'stale' | 'hand-edited' — compares docText to its own header hash, then to renderDoc(ruleSet). */
function docState(ruleSet, docText) { throw new Error('not implemented'); }

/** All findings of all rules in one file's text, line by line. Pure. */
function scanText(path, text, ruleSet) { throw new Error('not implemented'); }

/** Split findings into suppressed and kept; return allows that suppressed nothing. Pure. */
function applyAllows(findings, ruleSet) { throw new Error('not implemented'); }

/** Shell: read files, run the above, write doc if --write-doc and not hand-edited, print, exit. */
function main(argv) {
  // TODO: parseRules (exit 2 on throw)
  // TODO: if --write-doc: docState === 'hand-edited' ? problem : write renderDoc
  // TODO: problems = selfTest + docState + scan(walk SCAN_ROOT, skip NUL-byte files) → applyAllows → stale allows
  // TODO: findings of pending rules print under "pending", never counted
  throw new Error('not implemented');
}

main(process.argv.slice(2));
```

## Synthesis decision

## Tradeoffs accepted

- We accept prose written as JSON arrays of lines, with escaped quotes and doubled backslashes in regexes, which is harder to write than Markdown, in exchange for a structural link from every pattern to an example the reader sees.
- We accept a generated file in git and a `--write-doc` step after every rule edit, in exchange for Claude reading plain Markdown without running anything.
- We accept that free prose can still promise more than the patterns catch. Only examples are bound to detection, and `misses` and `detect.none` make the known gaps visible rather than closing them.
- We accept that a pending rule leaves known Cursor-isms on `main` until the re-translation PR lands, in exchange for keeping the sync and the re-translation in separate PRs, as grounding requires.
- We accept allow entries for overrides and port-only files (the README credit, for example) in exchange for a check that does not depend on how `port.json` classifies a file.
- We accept JavaScript regex syntax as the rule format, which ties the rule file to `node`, in exchange for a single parser and regex engine.
- We accept matching one line at a time. A Cursor-ism that only shows up across two lines is a `misses` note, not a pattern.

## Alternatives considered

- **Inline suppression markers in checked files** (`<!-- cursorism-ok: task-tool, why -->`). Rejected because they add check-specific noise to model-facing prose, a re-translation can silently drop them, and they spread the exceptions across the tree with no single list to review. Central allows hide that from the files Claude reads.
- **Scope the scan by `port.json`** (translated files only). Rejected because it couples the check to classification, so the check would need to know three file kinds. It also exempts overrides, which are exactly the files no sync revisits.
- **Render the doc in CI and leave it out of git.** Rejected because a sync or translation session would then have to run a build before it could read its own instructions, and the PR diff would no longer show a reviewer the prose change.

## Open questions and risks

- Should a pending rule have a deadline, for example the check failing once a rule has stayed pending through a second sync? Otherwise, what stops `pending` from becoming a permanent mute?
- The shortest green path for an agent with an awkward Cursor-ism is `detect.none` with a weak reason, or an allow with a weak `why`. Is the PR review enough of a guard, or should the sync PR template list new `none` and `allow` entries explicitly?
- Should the `/sync-upstream` skill read the Markdown (the design assumes so) or the JSON directly? If it reads the JSON, the generated doc only serves humans.
- Allow `text` matches a substring of the current line. If a re-translation rewrites that line, the allow goes stale and fails the check. Is that the right pressure, or too noisy?
- Should CI run on every PR? The design supports it, and the stale-doc and self-test checks only catch something on PRs where they run.

## Next implementation step

Write `docs/conversion-rules.json` with today's five rules and their example pairs, then write `parseRules` and `selfTest` test-first in `scripts/check-cursorisms.test.js`, so the real rule file is the first fixture to pass.
