# PR merge probe: session instructions

**What this is.** The owner of this repo (janrizmlibres) is designing a tool that runs in cloud sessions like this one and sometimes lands its own pull requests: it merges them through the GitHub REST API, and relies on GitHub to delete the merged head branch. This run performs that once on throwaway branches under `pstack/probe-m/` so the owner can see which steps work here. Every PR merges into a throwaway base branch, `pstack/probe-m/base`, never into `main`. The owner has turned on the repo's "Automatically delete head branches" setting for this run and will turn it off afterwards.

Nobody is watching this session. Follow the steps in order and do nothing else.

## Rules

- **One action per Bash call** where a step says so, so each outcome maps to one step.
- **If a tool call is refused or blocked by the permission system, do not retry it, rephrase it or work around it.** Copy the refusal text verbatim into the log, mark the step `REFUSED`, and go on to the next step. A step that fails for another reason (git or HTTP error) is `FAILED` with the first lines of the error.
- **Keep the log to outcomes.** Never run `env`, `printenv` or `set`, never print or log the value of any environment variable, token, credential or remote URL, and never read files under `~/.claude`. This repo is public.
- Do not edit any settings file or change the permission mode. Never pass `--delete-branch` to any command.

## The log

Your log is `spikes/merge-probe/out-m.md` in your main checkout, on the branch the session put you on (your designated branch). After **every** step, append one line to it:

```
S<n> <step name>: OK | REFUSED: <verbatim reason> | FAILED: <first error lines> — <one-line note with the recorded values>
```

then commit and push it to your designated branch, in one Bash call:

```
git add spikes/merge-probe/out-m.md && git commit -qm "merge probe: S<n>" && git push -q origin HEAD
```

If that log push is itself refused, record it in your final message and keep going; do not retry it.

`R` below is `repos/janrizmlibres/claude-pstack`. `P` is `pstack/probe-m`.

## Steps

**S0. Baseline.** One Bash call: `date -u +%FT%TZ; claude --version; git branch --show-current; git log --oneline -1; gh --version | head -1; gh api repos/janrizmlibres/claude-pstack --jq '{delete_branch_on_merge, allow_merge_commit, allow_squash_merge, allow_rebase_merge}'`. Write the output into the log under a `## Baseline` heading, then the S0 line, then commit and push the log.

**S1. Branches.**
- Prep (one Bash call):
  ```
  git fetch -q origin main && git worktree add -q -b pstack/probe-m/base /tmp/m origin/main && cd /tmp/m && for h in merge squash rebase stack-a ghcli; do git checkout -q -b pstack/probe-m/$h pstack/probe-m/base && mkdir -p probe-m && echo $h > probe-m/$h.txt && git add -A && git commit -qm "probe m: $h"; done && for h in stack-b stack-c; do git checkout -q -b pstack/probe-m/$h pstack/probe-m/stack-a && mkdir -p probe-m && echo $h > probe-m/$h.txt && git add -A && git commit -qm "probe m: $h on stack-a"; done && git branch --list 'pstack/probe-m/*'
  ```
- Push (its own Bash call): `git -C /tmp/m push -q -u origin pstack/probe-m/base pstack/probe-m/merge pstack/probe-m/squash pstack/probe-m/rebase pstack/probe-m/stack-a pstack/probe-m/stack-b pstack/probe-m/stack-c pstack/probe-m/ghcli`
- Check: `git ls-remote origin 'refs/heads/pstack/probe-m/*'` and note how many refs came back (expect 8).

**S2. Open the PRs (REST).** One call per PR: `gh api -X POST R/pulls -f title="[probe m] <head> (throwaway)" -f head=P/<head> -f base=<base> -f body="Throwaway PR from a merge probe. It merges into a throwaway base branch, never main." --jq '.number'` for these pairs, in order:

| head | base |
|---|---|
| `merge` | `P/base` |
| `squash` | `P/base` |
| `rebase` | `P/base` |
| `stack-a` | `P/base` |
| `stack-b` | `P/stack-a` |
| `stack-c` | `P/stack-a` |
| `ghcli` | `P/base` |

One log line with every PR number by head.

**S3. Close a stacked PR without retargeting it (REST).** `gh api -X PATCH R/pulls/<stack-c PR> -f state=closed --jq '{state, base: .base.ref}'`. Then its own call: `git ls-remote origin refs/heads/P/stack-c` and note whether the branch is still there.

**S4. Merge commit (REST).** `gh api -X PUT R/pulls/<merge PR>/merge -f merge_method=merge` (print the whole JSON response or error, verbatim, into the log under a `### S4 response` heading). Then its own call: `sleep 15; git ls-remote origin refs/heads/P/merge` — empty output means GitHub deleted the head.

**S5. Squash (REST).** Same as S4 with the `squash` PR and `-f merge_method=squash`, heading `### S5 response`, then the `ls-remote` check on `P/squash`.

**S6. Rebase (REST).** Same as S4 with the `rebase` PR and `-f merge_method=rebase`, heading `### S6 response`, then the `ls-remote` check on `P/rebase`.

**S7. Merge the parent of an open stacked PR (REST).** `gh api -X PUT R/pulls/<stack-a PR>/merge -f merge_method=squash`, heading `### S7 response`. Then, as separate calls:
- `sleep 15; git ls-remote origin refs/heads/P/stack-a`
- `gh api R/pulls/<stack-b PR> --jq '{state, base: .base.ref}'` — note whether GitHub retargeted `stack-b`'s PR to `P/base`
- `gh api R/pulls/<stack-c PR> --jq '{state, base: .base.ref}'` — the closed one from S3

**S8. Merge through the gh CLI.** `gh pr merge <ghcli PR> --squash` (no other flags). Record the output verbatim. If it failed, note whether the error mentions GraphQL.

**S9. Repo setting from the cloud (REST).** `gh api -X PATCH R -F delete_branch_on_merge=true --jq '.delete_branch_on_merge'`. The setting is already on, so a success changes nothing. Record the response or error verbatim.

**S10. What is left.** `git ls-remote origin 'refs/heads/pstack/probe-m/*'` and `gh api 'R/pulls?state=all&head=janrizmlibres:pstack/probe-m/ghcli' --jq '.[].state'`. List the remaining refs in the log. Do not try to delete any branch; the owner cleans up locally.

## Finish

Append a `## Summary` to the log: a table of S0–S10 with outcome, whether the head branch was deleted, and verbatim error or refusal text, plus your permission mode if you know it and anything surprising. Commit and push it to your designated branch. End with a final message that repeats the summary table.
