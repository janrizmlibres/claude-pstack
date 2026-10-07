# Cursor-ism check: the rules doc carries its own detection (Direction A)

## Problem

The check script must flag leftover Cursor-isms in the port using patterns that cannot drift from the conversion rules Claude applies. The rules live in a prose doc Claude reads while translating. Its main editors are agents in the middle of a sync. They see only the files they open, copy the nearest rule, and take the shortest path that passes. The only review point is the sync PR. Drift happens in three ways: a rule is added with no detection, a pattern is left without a rule, or a pattern stops matching what its rule describes. The runtime is limited to `bash git node python3 jq` with no installs. Some mentions are legitimate (crediting upstream, quoting it on purpose), so false positives need a narrow escape that carries a reason.

## Usage (caller's view)

**Maintainer, locally or in CI** (no flags is the normal case):

```console
$ scripts/check-cursorisms
pstack/skills/arena/SKILL.md:42:31: task-tool: "Task tool"   [rule: docs/conversion-rules.md:58]
pstack/skills/how/SKILL.md:9:1: model-ids: "grok-4.7"        [rule: docs/conversion-rules.md:12]
pstack/README.md:7:1: stale allow for cursor-paths (suppresses nothing)
3 findings in 2 of 61 files; 4 allows in use
$ echo $?
1
```

CI step, identical to the sync's step: `run: scripts/check-cursorisms`.

**Syncing agent.** The `/sync-upstream` skill says:

> Before opening the PR, run `scripts/check-cursorisms`.
> - Exit 1: open the rule at the printed `docs/conversion-rules.md:N` and apply it to the flagged line. If the mention is deliberate, put `cursorism-ok <rule-id>: <reason>` on that line in a comment.
> - You met a Cursor-ism that no rule covers: copy the nearest `##` section in `docs/conversion-rules.md` and add the new rule in this PR. Its `before:` is the upstream line you met and its `after:` is what you wrote.
> - Exit 2: the rules doc is malformed or a rule fails its own examples. The message names the doc line.

**A rule, as an agent writes it** (in `docs/conversion-rules.md`):

````markdown
## task-tool: Cursor's Task tool becomes the Agent tool

Upstream starts workers with Cursor's `Task` tool. Write Claude Code's `Agent`
tool instead. Keep `run_in_background` as written; the semantics carry over.

```cursorism
match: \bTask tool\b
match: \bTask\(
before: Launch each runner with the Task tool, run_in_background: true.
after: Launch each runner with the Agent tool, run_in_background: true.
```
````

````markdown
## skill-pointer: a model-facing skill reference gains a read pointer

```cursorism
match: \*\*{skill}\*\* skill(?!.*CLAUDE_PLUGIN_ROOT)
before: Run the **how** skill over the relevant subsystems.
after: Run the **how** skill (read `${CLAUDE_PLUGIN_ROOT}/skills/how/SKILL.md`) over the relevant subsystems.
```
````

**A deliberate mention in a shipped file:**

```markdown
Ported from pstack, a Cursor plugin. <!-- cursorism-ok cursor-name: credits upstream -->
```

## Shape

**One file is the source.** `docs/conversion-rules.md` is the conversion rules doc. Every `##` heading in it is a rule, written as `## <rule-id>: <title>`, with a kebab-case id. Every rule section holds exactly one fenced block tagged `cursorism`. Intro prose sits above the first `##`. Ordinary code fences anywhere are ignored. A `cursorism` block outside a rule section is an error. So is a second block inside one. These structural invariants make two of the drift modes unrepresentable. A rule cannot exist without a detection statement, and a pattern cannot exist without a rule (per encode-lessons-in-structure). An agent that copies the nearest section copies the block with it.

**The block format is line-oriented.** Each line is `key: value`, and the value runs verbatim to the end of the line. There is no quoting and no escaping, so a regex is written exactly as Python's `re` reads it. JSON would double every backslash. The keys are:
- `match:` (1 or more): a Python regex, matched case-sensitively against one line at a time. One placeholder exists: the exact token `{skill}` expands to an alternation of the directory names under `upstream/skills/`. That keeps the skill list derived, not hand-synced, so a skill upstream adds is covered without editing the rule.
- `before:` (1 or more): upstream text the rule converts.
- `after:` (1 or more): the port's form of that text.
- `undetectable:` (exclusive, used alone): a rule no line pattern can catch, such as the multi-model rule. It needs a reason. Saying "no detection" is a deliberate statement, not something left out by accident.
- Any other key is an error, which catches typos.

**Self-test before the scan.** This handles the third drift mode, a pattern that no longer fits its rule. Before scanning anything, `load_rules` checks the following:
- Every `match` compiles.
- Every `match` hits at least one of its rule's `before` lines, so no pattern is dead.
- Every `before` line is hit by at least one of its rule's `match` patterns, so every example is covered.
- No `after` line from any rule is hit by any rule's pattern. A converted form must not trip its own rule or anyone else's, which catches conflicts between rules.

If any of these fails, the script exits 2 before scanning. Running the examples as tests is what ties the regex to what the rule says. The `before`/`after` pairs are also the worked examples Claude reads while translating, so the machine data does double duty as prose.

**Scope: everything under `pstack/`.** That means every git-tracked text file under `pstack/`: translated files, overrides and port-only files alike. A Cursor-ism in an override or a manifest misleads Claude at runtime just as much as one in a translated file. The check does not read `port.json`, so it carries no coupling to the file classification. Files outside `pstack/` (the root README, `upstream/`, docs) are not shipped and are not checked. Passing `PATH...` narrows the scan; it never widens it past what the caller names.

**The false-positive escape is per occurrence, in the file.** The marker is the substring `cursorism-ok <rule-id>: <reason>`, placed in whatever comment syntax the file uses. It suppresses that rule on its own line and on the next line, and nothing else. The following are each reported as findings, so they exit 1:
- an empty reason
- an unknown rule id
- a marker that suppresses nothing (a stale allow)

The summary line reports a count of allows in use, so allow creep shows up in every PR.

**Exit codes.** 0 means clean. 1 means findings (Cursor-isms or bad allows). 2 means the rules doc is malformed or fails its self-test, which means the check can't be trusted. If both apply, 2 wins. The check is read-only and idempotent.

**Interface depth.** The public surface is one command, an optional `PATH...`, a `--rules` override that exists for test fixtures, and three exit codes. Behind it sit fence-aware Markdown parsing, section and block validation, placeholder expansion, the self-test, the scan and allow bookkeeping. Callers learn none of that.

### Sketch

```
docs/conversion-rules.md        # the single source: prose + one ```cursorism block per ## rule
scripts/check-cursorisms        # python3 stdlib, executable, no extension
scripts/check-cursorisms.test.py  # black-box CLI tests against fixture trees in a tmpdir
```

```python
#!/usr/bin/env python3
"""Flag leftover Cursor-isms in pstack/ using patterns parsed from the conversion rules doc.

Exit 0 clean, 1 findings, 2 rules doc malformed or failing its own examples."""
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, Union
import re

DEFAULT_RULES = Path("docs/conversion-rules.md")   # the only place the doc path is written
DEFAULT_SCOPE = Path("pstack")
ALLOW = re.compile(r"cursorism-ok ([a-z0-9-]+):\s*(.*)")

@dataclass(frozen=True)
class Patterns:
    matches: tuple[re.Pattern, ...]   # non-empty; {skill} already expanded
    before: tuple[str, ...]           # non-empty; each hit by some match
    after: tuple[str, ...]            # non-empty; hit by no rule's match

@dataclass(frozen=True)
class Undetectable:
    reason: str                       # non-empty

@dataclass(frozen=True)
class Rule:
    id: str                           # from "## <id>: <title>", unique
    title: str
    doc_line: int                     # heading line, printed as the pointer in findings
    detection: Union[Patterns, Undetectable]

@dataclass(frozen=True)
class Finding:
    path: str
    line: int
    col: int
    rule_id: str
    kind: Literal["cursorism", "unknown-allow", "stale-allow", "empty-reason"]
    text: str

class RulesDocError(Exception):
    """Malformed doc or failed self-test. Carries doc line; maps to exit 2."""
    def __init__(self, doc_line: int, message: str): raise NotImplementedError

def load_rules(doc: Path, skills: list[str]) -> list[Rule]:
    """Parse, validate structure, expand {skill}, run the self-test. Raises RulesDocError.
    TODO fence tracking per CommonMark: a fence closes only on the same char with length >= opener,
    so a ````markdown example containing ```cursorism is ignored; headings count only outside fences."""
    raise NotImplementedError

def upstream_skills(repo: Path) -> list[str]:
    """Directory names under upstream/skills/, sorted."""
    raise NotImplementedError

def scan(path: str, text: str, rules: list[Rule]) -> list[Finding]:
    """Pure. Per-line regex hits minus allows; reports bad and stale allows."""
    raise NotImplementedError

def shipped_files(paths: list[Path]) -> list[Path]:
    """git ls-files under the given paths (default pstack/), skipping files with NUL bytes."""
    raise NotImplementedError

def main(argv: list[str]) -> int:
    """check-cursorisms [--rules FILE] [PATH...] -> 0 | 1 | 2; grep-style lines + one summary line."""
    raise NotImplementedError
```

## Synthesis decision

## Tradeoffs accepted

- We accept about 50 lines of fence-aware Markdown parsing in the script in exchange for keeping each pattern in the same section, and the same diff hunk, as the prose it enforces.
- We accept that the prose itself is never checked. The self-test binds patterns to the `before`/`after` lines, which live in the block. A rule's prose can be reworded so that it says something different from its block, and only the PR reviewer would catch that. This is the shape's residual drift.
- We accept regex lines in a doc Claude reads as prose. That costs a few tokens of noise per rule, and the `before`/`after` lines pay it back as worked examples.
- We accept that the escape lives in the checked files rather than the doc. Exceptions are per occurrence and belong beside the occurrence. Allows listed by path in the doc would be too wide. The cost: a file with several deliberate mentions carries several markers.
- We accept that an allow marker is the cheapest way for an agent to make the check pass. The only guards are the required reason, stale-allow detection, the allows-in-use count, and visibility in the PR diff.
- We accept fixing the regex dialect to Python `re` and matching one line at a time. Rules can't be pasted into `grep`, and a Cursor-ism wrapped across two lines of Markdown is missed.
- We accept one placeholder concept (`{skill}`) in exchange for no hand-synced skill list inside regexes.
- We accept checking overrides and port-only files without telling the agent which kind a file is. The fix differs (hand-edit an override, re-translate a translated file), and the agent has to look it up in `port.json`.

## Alternatives considered

- **Detect from the prose itself**, for example by treating backticked spans under a "Never write" list as patterns. This hides the most from editors, but the formatting becomes load-bearing without anyone seeing it. An agent rewording a bullet breaks detection and gets no signal, which is the opposite of an explicit block that fails loudly.
- **One front-matter or YAML block at the top of the doc with every pattern.** It stays in one file, but it is a hand-synced list next to the rules: adding a rule means editing two distant places. It also needs a YAML parser the runtime doesn't have.
- **JSON inside each block.** It parses with no custom code, but every regex backslash has to be doubled. Agents get that wrong, and the self-test would then fail for reasons unrelated to the rule.

## Open questions and risks

- Should CI run the check on every PR? The interface allows it, and running it costs almost nothing. The recommendation is yes, so that a hand-edit outside a sync can't add a Cursor-ism.
- Re-translation: the check finds Cursor-isms that are left over. It does not find translations that went stale when a rule's *target* changed (say `Agent` becomes something else). Should `after` lines also feed a second "outdated port form" check, or does that stay the re-translation PR's job?
- Should `undetectable:` exist at all, or should every rule be forced to carry at least a weak pattern?
- Should allow markers in translated files require a fixed reason vocabulary, such as `quotes upstream`, to make abuse easier to spot?
- Is matching one line at a time enough for upstream's prose style? It holds if upstream keeps one paragraph per line. A paragraph-join mode would be the fix if it doesn't.

## Next implementation step

Write the first failing black-box test: a fixture rules doc whose `##` section has no `cursorism` block makes `scripts/check-cursorisms --rules <fixture>` exit 2 and name that heading's line.
