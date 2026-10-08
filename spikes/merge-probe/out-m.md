# Merge probe log (m)

## Baseline

```
2026-10-08T05:15:23Z
2.1.293 (Claude Code)
claude/merge-probe-spike-m4u1un
ca468dd Add PR merge probe brief
gh version 2.89.0 (2026-03-26)
{"allow_merge_commit":true,"allow_rebase_merge":true,"allow_squash_merge":true,"delete_branch_on_merge":true}
```

## Steps

S0 Baseline: OK — gh api works; delete_branch_on_merge=true, all three merge methods allowed
S1 Branches: FAILED: prep: `/bin/bash: line 1: probe-m/squash.txt: No such file or directory` (same for rebase, stack-a, ghcli); push: `error: src refspec pstack/probe-m/stack-b does not match any` / `error: src refspec pstack/probe-m/stack-c does not match any` / `error: failed to push some refs` — prep script bug: `mkdir -p probe-m` creates an empty dir that git removes on `git checkout pstack/probe-m/base`, so only `merge` got its commit; squash/rebase/stack-a/ghcli were created with no commit, stack-b/stack-c never created; push sent nothing; ls-remote returned 0 refs (expected 8)
S2 Open the PRs (REST): FAILED: `{"message":"Validation Failed","errors":[{"resource":"PullRequest","field":"base","code":"invalid"},{"resource":"PullRequest","field":"head","code":"invalid"}],...,"status":"422"} gh: Validation Failed (HTTP 422)` — identical 422 for all 7 (merge, squash, rebase, stack-a, stack-b, stack-c, ghcli); no PRs created because no probe branches exist on the remote (S1)
S3 Close stacked PR (REST): FAILED: not run — no stack-c PR number (S2 created no PRs)
S4 Merge commit (REST): FAILED: not run — no merge PR number (S2)
S5 Squash (REST): FAILED: not run — no squash PR number (S2)
S6 Rebase (REST): FAILED: not run — no rebase PR number (S2)
S7 Merge parent of open stack (REST): FAILED: not run — no stack-a/stack-b/stack-c PR numbers (S2)
S8 Merge through gh CLI: FAILED: not run — no ghcli PR number (S2)
S9 Repo setting from the cloud (REST): FAILED: `{"message":"Repository settings writes are not permitted through this proxy.","documentation_url":"https://docs.anthropic.com/en/docs/claude-code/github-actions"} gh: Repository settings writes are not permitted through this proxy. (HTTP 403)` — blocked by the session's agent proxy (HTTP 403), not by the permission system
S10 What is left: OK — remote `refs/heads/pstack/probe-m/*`: none (0 refs); PRs with head pstack/probe-m/ghcli: none. Local-only leftovers in this container: worktree /tmp/m and local branches pstack/probe-m/{base,merge,squash,rebase,stack-a,ghcli} (never pushed)

## Summary

| Step | Outcome | Head branch deleted? | Verbatim error / refusal |
|---|---|---|---|
| S0 Baseline | OK | n/a | — (delete_branch_on_merge=true; merge/squash/rebase all allowed) |
| S1 Branches | FAILED | n/a | `/bin/bash: line 1: probe-m/squash.txt: No such file or directory` (also rebase, stack-a, ghcli); push: `error: src refspec pstack/probe-m/stack-b does not match any`, `error: src refspec pstack/probe-m/stack-c does not match any`, `error: failed to push some refs`; 0 of 8 refs on remote |
| S2 Open PRs (REST) | FAILED | n/a | `Validation Failed` 422: base invalid, head invalid (all 7) |
| S3 Close stacked PR | FAILED (not run) | n/a | no PR number from S2 |
| S4 Merge commit | FAILED (not run) | n/a | no PR number from S2 |
| S5 Squash | FAILED (not run) | n/a | no PR number from S2 |
| S6 Rebase | FAILED (not run) | n/a | no PR number from S2 |
| S7 Merge stack parent | FAILED (not run) | n/a | no PR numbers from S2 |
| S8 gh pr merge | FAILED (not run) | n/a | no PR number from S2 |
| S9 Repo setting PATCH | FAILED (HTTP 403) | n/a | `Repository settings writes are not permitted through this proxy.` |
| S10 What is left | OK | n/a | no remote probe refs, no probe PRs |

Permission mode: auto. No tool call was refused by the permission system.

Surprising / notes:
- Root cause of the cascade is a bug in the S1 prep script: `mkdir -p probe-m` runs once, but the empty directory is removed by git when the loop does `git checkout -q -b pstack/probe-m/<h> pstack/probe-m/base` after the first commit (the base has no tracked files under `probe-m/`). The first iteration (`merge`) succeeds; later `echo $h > probe-m/$h.txt` calls fail, and the trailing `&&` then skips the stack-b/stack-c loop. Fix: move `mkdir -p probe-m` inside the loop (before the `echo`).
- `gh api` reads (repo GET, pulls GET) and REST PR creation reached GitHub (422 was a real GitHub validation error). Repository settings writes are blocked by the session's agent proxy (403), separate from the permission system.
- Merge behaviour (S4–S8) and auto-deletion of head branches were never exercised; the probe needs a re-run with the fixed prep script.

# Run 2

LEAD from origin/research/merge-probe; the only change from run 1 is the S1 prep fix (`mkdir -p probe-m` moved inside both loops). S9 skipped per owner.

R2-S1 Branches: OK — prep created 8 local branches; push succeeded; ls-remote returned 8 refs (base 84ec1bc, merge 9b309f3, squash a5707cd, rebase 0ef827f, stack-a 91901b4, stack-b 92f0d66, stack-c fa59761, ghcli 466c142)
