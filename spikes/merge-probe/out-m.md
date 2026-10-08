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
