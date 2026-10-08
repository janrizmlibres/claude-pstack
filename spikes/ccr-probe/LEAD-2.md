# /ccr/ route probe, run 2: session instructions

**What this is.** The owner of this repo (janrizmlibres) is designing a tool that runs in cloud sessions like this one and lands its own pull requests through the GitHub REST API when the user asks it to. The session's GitHub proxy blocks GraphQL, and its error message names proxy-only replacement routes under `/pulls/{n}/ccr/`, among them one that arms GitHub's auto-merge. This run arms auto-merge on throwaway PRs the owner set up for it, then lets them merge, so the owner can see whether that route works. Every PR here merges into a throwaway branch under `pstack/probe-c/`, never into `main`. The owner turned on the repo's "Allow auto-merge" setting for this run and gated `pstack/probe-c/base` on a commit status called `probe-gate`; both are removed afterwards.

Nobody is watching this session. Follow the steps in order and do nothing else.

## Rules

- **One action per Bash call** where a step says so, so each outcome maps to one step.
- **If a tool call is refused or blocked by the permission system, do not retry it, rephrase it or work around it.** Copy the refusal reason verbatim into the log, mark the step `REFUSED`, and go on to the next step. A step that fails for another reason (an HTTP error, for example) is `FAILED`, with the verbatim error. The errors are the findings here, so record them in full.
- **Keep the log to outcomes.** Never run `env`, `printenv` or `set`, never pass `-i`/`--include` to `gh api`, never print or log the value of any environment variable, token, credential or remote URL, and never read files under `~/.claude`. This repo is public.
- Do not edit any settings file or change the permission mode. Do not merge, close or delete anything except where a step says so.

## The log

Your log is `spikes/ccr-probe/out-c2.md` in your main checkout, on the branch the session put you on (your designated branch). After **every** step, append one line to it:

```
S<n> <step name>: OK | REFUSED: <verbatim reason> | FAILED: <verbatim error> — <one-line note with the recorded values>
```

Where a step says to record a response, put the whole response (JSON or error text, verbatim) under a `### S<n> <label>` heading above the step's line. A refusal is recorded as its one-line reason, not the whole message. Then commit and push the log to your designated branch, in one Bash call:

```
git add spikes/ccr-probe/out-c2.md && git commit -qm "ccr probe 2: S<n>" && git push -q origin HEAD
```

If that log push is itself refused, record it in your final message and keep going; do not retry it.

`R` below is `repos/janrizmlibres/claude-pstack`.

## The fixtures

| PR | head → base | state when you start |
|---|---|---|
| #60 | `draft` → `open` | ready for review (not a draft) |
| #61 | `am-clean` → `open` | mergeable, nothing required |
| #62 | `am-merge` → `base` | blocked: `base` requires a commit status `probe-gate` that nobody has posted |
| #63 | `am-squash` → `base` | blocked the same way |
| #64 | `am-rebase` → `base` | blocked the same way |

Branch names above are short for `pstack/probe-c/<name>`.

## Steps

**S0. Baseline.** One Bash call: `date -u +%FT%TZ; claude --version; git branch --show-current; gh --version | head -1; gh api repos/janrizmlibres/claude-pstack --jq '{allow_auto_merge, delete_branch_on_merge}'`. Write the output into the log under a `## Baseline` heading, then the S0 line, then commit and push the log.

**S1. Arm auto-merge, no body.** `gh api -X PUT R/pulls/63/ccr/auto_merge`. Record the response. Then its own call: `gh api R/pulls/63 --jq '{state, merged, mergeable_state, auto_merge}'`, and record that too.

**S2. Disarm auto-merge.** `gh api -X DELETE R/pulls/63/ccr/auto_merge`. Record the response. Then the same read as S1, recorded.

**S3. Arm auto-merge with each merge method.** One call per PR, each response recorded:

- `gh api -X PUT R/pulls/62/ccr/auto_merge -f merge_method=merge`
- `gh api -X PUT R/pulls/63/ccr/auto_merge -f merge_method=squash`
- `gh api -X PUT R/pulls/64/ccr/auto_merge -f merge_method=rebase`

If the first call fails with an error that names a different field or value format (for example uppercase `MERGE`, or a field called something else), use that format for all three instead, once, and note it. Then one call: `for n in 62 63 64; do gh api R/pulls/$n --jq '{number, state, merged, auto_merge}'; done`, recorded.

**S4. Auto-merge on a PR that is already mergeable.** `gh api -X PUT R/pulls/61/ccr/auto_merge -f merge_method=squash` (in the format that worked in S3). Record the response. Then its own call: `sleep 20; gh api R/pulls/61 --jq '{state, merged, merged_at, auto_merge}'`, recorded.

**S5. Turn the gate green.** For each of #62, #63, #64, one call: `gh api -X POST R/statuses/$(gh api R/pulls/<n> --jq .head.sha) -f state=success -f context=probe-gate --jq '{state, context}'`. Record each response. If the first is refused or gets a 403, record it, skip the other two, and go on: the owner posts the statuses from outside in that case.

**S6. Wait for the merges.** One Bash call (it takes up to 9 minutes):

```
for i in $(seq 1 18); do s=$(for n in 62 63 64; do gh api repos/janrizmlibres/claude-pstack/pulls/$n --jq '"\(.number)=\(.merged)"'; done | tr '\n' ' '); echo "$(date -u +%T) $s"; case "$s" in *false*) sleep 30;; *) break;; esac; done
```

Record the output. Then one call: `for n in 62 63 64; do gh api R/pulls/$n --jq '{number, state, merged, merged_at, merged_by: .merged_by.login, merge_commit_sha, auto_merge}'; done`, recorded. If any is still unmerged, run the S6 loop once more and record it.

**S7. What landed on the base.** `git fetch -q origin pstack/probe-c/base pstack/probe-c/open && git log --oneline --graph -8 origin/pstack/probe-c/base && git log --oneline -4 origin/pstack/probe-c/open`. Record the output and note, for each of #62–#64, whether the commits show the requested method (a merge commit, one squashed commit, rebased commits).

**S8. Convert to draft.** `gh api -X POST R/pulls/60/ccr/convert_to_draft`. Record the response. Then its own call: `gh api R/pulls/60 --jq '.draft'`.

**S9. Ready for review.** `gh api -X POST R/pulls/60/ccr/ready_for_review`. Record the response. Then its own call: `gh api R/pulls/60 --jq '.draft'`.

## Finish

Append a `## Summary` to the log: a table of S0–S9 with outcome and the verbatim error or refusal reason, plus the request shape that worked for each route, your permission mode if you know it, and anything surprising. Commit and push it to your designated branch. End with a final message that repeats the summary table.
