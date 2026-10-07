# Candidate 4: the rule is its own test

## Problem

The check script flags leftover Cursor-isms, and its patterns must come from the conversion rules doc so that a rule and its detection can't drift apart. Keeping both in one file isn't enough. A pattern sitting next to prose can still disagree with that prose: it can miss the upstream text the rule rewrites, or flag the text the rule produces. The people editing rules are mostly agents in the middle of a sync. They see only the files they open, nobody reviews their work before the PR, and they copy the nearest example. Constraints: the tool is check-only. It runs only on `bash`/`git`/`node`/`python3`/`jq`, with no installs. Some mentions are legitimate (the README credits Cursor, and a file may quote upstream), so the escape has to be narrow and carry a reason. Translated files are regenerated from upstream on every sync and re-translation, so anything written into a translated file by hand is lost the next time it is regenerated.

## Usage (caller's view)

Each rule is one `##` section of `docs/conversion-rules.md`. The heading is the rule id. Under it come the prose Claude follows when translating, then exactly one fenced `rule` block that the script parses. The block's worked example is the rule's test: every `before` line must match a pattern, and no rule in the doc may flag any `after` line.

````markdown
## task-tool

Cursor's `Task` tool becomes Claude Code's `Agent` tool. Keep `run_in_background` and its meaning unchanged.

```rule
pattern: \bTask tool\b
pattern: \bTask\(
before: Launch each runner with the Task tool, run_in_background: true.
after:  Launch each runner with the Agent tool, run_in_background: true.
```

## model-ids

No model IDs in shipped files. A model line becomes a role name that the port's config resolves.

```rule
pattern: \bclaude-(opus|sonnet|haiku)-\d
pattern: \bgrok-\d
pattern: pstack-models\.mdc
before: If the rule is missing, use `claude-opus-5-5-xhigh` and `grok-4.7-xhigh-fast`.
after:  If no model is configured for the runner role, use the session's model.
allow:  pstack/config/roles.json | * | the one file where roles resolve to model IDs
```

## cursor-name
...
allow:  pstack/README.md | Lauren Tan's Cursor plugin | credits upstream by name
````

Maintainer or CI, from the repo root:

```
$ scripts/check-port
pstack/skills/arena/SKILL.md:42:31: task-tool: "Task tool"  (rule at docs/conversion-rules.md:57)
docs/conversion-rules.md:88:1: model-ids: stale allow, suppresses nothing: pstack/config/roles.json | *
2 problems
$ echo $?
1
```

A syncing agent that runs into a Cursor-ism no rule covers adds a new `##` section in the same PR. It pastes the upstream line it met as `before` and its own rewrite as `after`, then fixes the file. The check passes only when the new pattern catches the text it was written for and doesn't catch the rewrite. Re-translation uses the same tool to build its worklist:

```
$ scripts/check-port --rule task-tool upstream/    # upstream lines this rule touches; patch their pstack/ counterparts
$ scripts/check-port --rule task-tool              # then confirm pstack/ is clean for it
```

## Shape

**One file, one unit.** A rule is a `##` heading plus its prose plus one `rule` block. The id comes from the heading, so it is never typed twice (single source of truth). Every `##` in the doc must be a rule, and anything else goes in the preamble above the first `##`. That lets the parser reject a section that has no block. This is the case of an agent adding a rule as prose only, which is the main way drift gets in.

**Block grammar.** One `key: value` per line, values raw with no escaping, so a regex is pasted exactly as written. Keys:
- `pattern`, one or more: a Python `re` regex, matched against each line separately.
- `before`, one or more when patterns exist.
- `after`, any number.
- `allow`, any number: `path-glob | literal substring or * | reason`.
- `undetectable: reason`: replaces patterns for a rule no line-level check can see. It has to be declared, so it can't be a quiet omission.

**Validation runs on every invocation before scanning** (per boundary-discipline: parse into a `Rulebook`, and trust it from then on). Any of these exits 2 without scanning:
- a `##` with zero or two `rule` blocks
- an unknown key
- a regex that doesn't compile
- a `before` that no pattern of its rule matches
- an `after` that any pattern in the whole rulebook matches. This catches two rules whose outputs conflict.
- an `allow` with no reason, or a reason left empty

This self-test is the anti-drift mechanism. To change a pattern without also changing the example, or the other way round, an agent has to break one of them. Per encode-lessons-in-structure, the example *is* the test, not a comment beside it.

**False positives go in the rules doc and nowhere else.** An `allow` is scoped to one rule, one path glob and, optionally, one substring of the line that was hit. It always carries a reason. It never mentions a line number, so edits elsewhere in the file don't break it. An allow that suppresses nothing in a full run is reported as stale (exit 1), so allows don't pile up. Allows stay out of the checked files for three reasons: re-translation regenerates those files and would drop the markers, JSON can't hold a comment, and every exemption then shows up in the one diff a PR reviewer reads.

**Scope: every git-tracked file under `pstack/`.** That covers translated files, overrides and port-only files alike. The invariant is about what ships: a Cursor-ism in a hand-written override breaks a Claude Code user just as much as one in a translated file, and overrides are where an agent is most likely to paste upstream text. The script therefore never reads `port.json`, which leaves it one coupling fewer. Explicit `PATH` arguments replace the default scope (used for `upstream/` worklists). Stale-allow reporting runs only on a full default run.

**Interface depth.** The public surface is one command with three optional flags and three exit codes. Behind it sit doc parsing, structural validation, example self-tests, conflict detection across rules, scanning, allow matching and stale-allow detection. Callers never coordinate stages.

**Deliberately not done:** no rewriting (check-only, as decided), no detection across line breaks, no reading of `port.json` or `snapshot.json`, and no rule severity levels.

### File layout

```
docs/conversion-rules.md      # prose + rule blocks; the only place rules, patterns and allows live
scripts/check-port            # python3, stdlib only, executable; the whole check
scripts/check_port_test.py    # unittest, fixtures inline as strings
.github/workflows/check-port.yml   # on PRs touching pstack/** or docs/conversion-rules.md: run scripts/check-port
```

### Script sketch (`scripts/check-port`)

```python
#!/usr/bin/env python3
"""Flag Cursor-isms left in the port. Patterns, examples and allows come only
from docs/conversion-rules.md; a rule whose own before/after examples disagree
with its patterns fails the run before any file is scanned.

usage: check-port [--rules FILE] [--rule ID]... [PATH...]
  --rules  rules doc (default docs/conversion-rules.md); tests pass fixtures here
  --rule   check only these rule ids (validation still covers the whole doc)
  PATH     files/dirs to scan instead of git-tracked pstack/**
exit: 0 clean | 1 findings or stale allows | 2 rules doc invalid or bad usage
"""
from dataclasses import dataclass
import re

@dataclass(frozen=True)
class Allow:
    path_glob: str
    substring: str | None        # None means "*": the whole file for this rule
    reason: str                  # non-empty; enforced by parse_rulebook
    doc_line: int

@dataclass(frozen=True)
class Rule:
    id: str                      # the `##` heading text; never typed twice
    doc_line: int                # where the heading is, for pointing agents at the prose
    patterns: tuple[re.Pattern, ...]   # empty iff undetectable is set
    before: tuple[str, ...]
    after: tuple[str, ...]
    allows: tuple[Allow, ...]
    undetectable: str | None

@dataclass(frozen=True)
class Rulebook:
    """Only parse_rulebook builds one; holding it means every self-test passed."""
    rules: tuple[Rule, ...]

@dataclass(frozen=True)
class DocError:
    doc_line: int
    message: str

@dataclass(frozen=True)
class Finding:
    path: str
    line: int
    col: int
    rule: Rule
    text: str

def parse_rulebook(doc_text: str) -> Rulebook | list[DocError]:
    """Split on `##`, require exactly one ```rule block per section, parse keys,
    compile patterns, then self-test: every `before` hit by its own rule,
    no `after` hit by any rule, every allow carries a reason."""
    raise NotImplementedError

def scan(book: Rulebook, files: dict[str, str], only: set[str] | None) -> list[Finding]:
    """Pure. Per file, per line, per rule (filtered by `only`), every pattern match."""
    raise NotImplementedError

def apply_allows(book: Rulebook, findings: list[Finding]) -> tuple[list[Finding], list[Allow]]:
    """Pure. Drop findings an allow covers (rule match, glob match, substring in line).
    Return (kept findings, allows that covered nothing)."""
    raise NotImplementedError

def default_scope() -> list[str]:
    """`git ls-files pstack/`: translated files, overrides and port-only files alike."""
    raise NotImplementedError

def main(argv: list[str]) -> int:
    """Thin shell: read the doc, parse_rulebook (errors -> print, return 2), read the
    files, scan, apply_allows (stale allows count only on a full default run),
    print `path:line:col: rule-id: "text"  (rule at doc:line)`, return 0 or 1."""
    raise NotImplementedError
```

## Synthesis decision

## Tradeoffs accepted

- We accept a small custom block grammar (the `key: value` lines) in exchange for regexes that are pasted raw. With JSON or YAML they'd need escaping, and there'd be a parser dependency.
- We accept that every rule with patterns must have a worked `before` example in exchange for drift being a hard failure instead of something a reviewer has to notice.
- We accept allows that live away from the line they excuse, in exchange for exemptions that survive re-translation, work in JSON, and all appear in one reviewed diff.
- We accept checking overrides and port-only files (and sometimes adding an allow for them) in exchange for one scope rule with no dependency on `port.json`.
- We accept line-at-a-time matching, which misses a Cursor-ism split across a line break, in exchange for exact `file:line:col` output an agent can act on.
- We accept tying regex syntax to Python `re`, which keeps the whole tool to one stdlib file.

## Alternatives considered

- **Rules as structured data (`rules.json`) with prose generated from it, or kept beside it.** It loses because it means two artifacts or a build step. An agent that opens the prose edits the prose. A cross-check by id only catches a missing entry, not a pattern that no longer does what its rule says.
- **Patterns in the doc, false positives as inline `port-allow:` markers in the checked files.** The escape is narrower, but re-translation wipes markers out of translated files, JSON can't carry them, and exemptions end up scattered where the PR reviewer doesn't look.
- **Patterns embedded in the prose itself (for example, every backticked Cursor term becomes a pattern).** This needs no separate block, but the parser has to guess which spans are patterns, and nothing tests whether the rule's rewrite is clean.
- **Scope = translated files only (derived from `port.json`).** It matches the literal brief, but it couples the check to `port.json` and leaves hand-written overrides, the files most likely to carry pasted Cursor text, unchecked.

## Open questions and risks

- Is Python acceptable as the repo-script language, given that `upstream-diff` might pick Node? If not, the same design ports to Node with JS regex syntax, but the rules doc has to name one flavor.
- Should `undetectable` rules exist at all, or should every rule be required to name at least one detectable token? Allowing them is honest, but it is an escape hatch an agent could reach for.
- Does the role-resolving config ship under `pstack/`, and if so, is a whole-file `allow` the right way to exempt it, or should model IDs live outside the checked scope?
- Should CI run the check on every PR? I'd say yes, since it's cheap and catches a human edit to an override. The sync run alone wouldn't see edits made between syncs.
- Risk: an agent fixes a failing self-test by weakening the `before` example instead of the pattern. Only the PR reviewer can catch that.

## Next implementation step

Write `parse_rulebook` test-first against an inline fixture holding `task-tool` and `model-ids`. Test cases: a `before` that no pattern matches, an `after` that another rule matches, and a section with no `rule` block. Each one must come back as a `DocError`.
