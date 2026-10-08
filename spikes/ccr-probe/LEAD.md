# /ccr/ route probe: session instructions

**What this is.** The owner of this repo (janrizmlibres) is designing a tool that runs in cloud sessions like this one and works with its own pull requests through the GitHub REST API. The session's GitHub proxy blocks GraphQL, and its error message names proxy-only replacement routes under `/pulls/{n}/ccr/`. This run calls each of those routes once on throwaway PRs, so the owner can see what they return. The owner set up every PR, branch and review comment beforehand. All of them sit under `pstack/probe-c/`, and none of them targets `main`.

Nobody is watching this session. Follow the steps in order and do nothing else.

## Rules

- **One action per Bash call** where a step says so, so each outcome maps to one step.
- **If a tool call is refused or blocked by the permission system, do not retry it, rephrase it or work around it.** Copy the refusal text verbatim into the log, mark the step `REFUSED`, and go on to the next step. A step that fails for another reason (an HTTP error, for example) is `FAILED`, with the verbatim error. The errors are the findings here, so record them in full.
- **Keep the log to outcomes.** Never run `env`, `printenv` or `set`, never pass `-i`/`--include` to `gh api`, never print or log the value of any environment variable, token, credential or remote URL, and never read files under `~/.claude`. This repo is public.
- Do not edit any settings file or change the permission mode. Do not merge, close or delete anything except where a step says so.

## The log

Your log is `spikes/ccr-probe/out-c.md` in your main checkout, on the branch the session put you on (your designated branch). After **every** step, append one line to it:

```
S<n> <step name>: OK | REFUSED: <verbatim reason> | FAILED: <verbatim error> — <one-line note with the recorded values>
```

Where a step says to record a response, put the whole response (JSON or error text, verbatim) under a `### S<n> <label>` heading above the step's line. Then commit and push the log to your designated branch, in one Bash call:

```
git add spikes/ccr-probe/out-c.md && git commit -qm "ccr probe: S<n>" && git push -q origin HEAD
```

If that log push is itself refused, record it in your final message and keep going; do not retry it.

`R` below is `repos/janrizmlibres/claude-pstack`.

## The fixtures

| PR | head → base | state when you start |
|---|---|---|
| #59 | `threads` → `open` | three review threads on `probe-c/threads.txt`: **T1** resolved, root comment `4215160454` with reply `4215161740`; **T2** unresolved, comment `4215160624`; **T3** unresolved and outdated, comment `4215160785` |
| #60 | `draft` → `open` | ready for review (not a draft) |
| #61 | `am-clean` → `open` | mergeable, nothing required |
| #62 | `am-merge` → `base` | blocked: `base` requires a commit status `probe-gate` that nobody has posted |
| #63 | `am-squash` → `base` | blocked the same way |
| #64 | `am-rebase` → `base` | blocked the same way |

Branch names above are short for `pstack/probe-c/<name>`.

## Steps

**S0. Baseline.** One Bash call: `date -u +%FT%TZ; claude --version; git branch --show-current; gh --version | head -1; gh api repos/janrizmlibres/claude-pstack --jq '{allow_auto_merge, delete_branch_on_merge}'`. Write the output into the log under a `## Baseline` heading, then the S0 line, then commit and push the log.

**S1. Read review threads.** `gh api R/pulls/59/ccr/review_threads`. Record the response. In the step line, note its shape (array or object, the field names) and whether you can tell, for each of T1–T3, if it is resolved and if it is outdated.

**S2. Resolve T2.** `gh api -X POST R/pulls/59/ccr/comments/4215160624/resolve`. Record the response. Then, as its own call, repeat the S1 read and note T2's resolution state in the step line (no need to record the full JSON again unless it differs in shape).

**S3. Unresolve T1 by its reply's id.** `gh api -X POST R/pulls/59/ccr/comments/4215161740/unresolve`. Record the response. If it failed, run its own call with the root comment instead: `gh api -X POST R/pulls/59/ccr/comments/4215160454/unresolve`, and record that response too. Then repeat the S1 read and note T1's state.

**S4. Convert to draft.** `gh api -X POST R/pulls/60/ccr/convert_to_draft`. Record the response. Then its own call: `gh api R/pulls/60 --jq '.draft'`.

**S5. Ready for review.** `gh api -X POST R/pulls/60/ccr/ready_for_review`. Record the response. Then its own call: `gh api R/pulls/60 --jq '.draft'`.

**S6. Arm auto-merge, no body.** `gh api -X PUT R/pulls/63/ccr/auto_merge`. Record the response. Then its own call: `gh api R/pulls/63 --jq '{state, merged, mergeable_state, auto_merge}'`, and record that too.

**S7. Disarm auto-merge.** `gh api -X DELETE R/pulls/63/ccr/auto_merge`. Record the response. Then the same read as S6, recorded.

**S8. Arm auto-merge with each merge method.** One call per PR, each response recorded:

- `gh api -X PUT R/pulls/62/ccr/auto_merge -f merge_method=merge`
- `gh api -X PUT R/pulls/63/ccr/auto_merge -f merge_method=squash`
- `gh api -X PUT R/pulls/64/ccr/auto_merge -f merge_method=rebase`

If the first call fails with an error that names a different field or value format (for example uppercase `MERGE`, or a field called something else), use that format for all three instead, once, and note it. Then one call: `for n in 62 63 64; do gh api R/pulls/$n --jq '{number, state, merged, auto_merge}'; done`, recorded.

**S9. Auto-merge on a PR that is already mergeable.** `gh api -X PUT R/pulls/61/ccr/auto_merge -f merge_method=squash` (in the format that worked in S8). Record the response. Then its own call: `sleep 20; gh api R/pulls/61 --jq '{state, merged, merged_at, auto_merge}'`, recorded.

**S10. Turn the gate green.** For each of #62, #63, #64, one call: `gh api -X POST R/statuses/$(gh api R/pulls/<n> --jq .head.sha) -f state=success -f context=probe-gate --jq '{state, context}'`. Record each response. If the first is refused or gets a 403, record it, skip the other two, and go on: the owner will post the statuses from outside.

**S11. Wait for the merges.** One Bash call (it takes up to 9 minutes):

```
for i in $(seq 1 18); do s=$(for n in 62 63 64; do gh api repos/janrizmlibres/claude-pstack/pulls/$n --jq '"\(.number)=\(.merged)"'; done | tr '\n' ' '); echo "$(date -u +%T) $s"; case "$s" in *false*) sleep 30;; *) break;; esac; done
```

Record the output. Then one call: `for n in 62 63 64; do gh api R/pulls/$n --jq '{number, state, merged, merged_at, merged_by: .merged_by.login, merge_commit_sha, auto_merge}'; done`, recorded. If any is still unmerged, run the S11 loop once more and record it.

**S12. What landed on the base.** `git fetch -q origin pstack/probe-c/base pstack/probe-c/open && git log --oneline --graph -12 origin/pstack/probe-c/base && git log --oneline -4 origin/pstack/probe-c/open`. Record the output and note, for each of #62–#64, whether the commits show the requested method (a merge commit, one squashed commit, rebased commits).

## Finish

Append a `## Summary` to the log: a table of S0–S12 with outcome and the verbatim error or refusal text, plus the request shape that worked for each route, your permission mode if you know it, and anything surprising. Commit and push it to your designated branch. End with a final message that repeats the summary table.
