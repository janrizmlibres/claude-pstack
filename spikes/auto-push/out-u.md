# Auto-push probe, arm u

## Baseline

```
2026-10-08T04:53:35Z
2.1.293 (Claude Code)
claude/branch-push-probe-n7tfin
bb3d933 Add restart and resume note to glossary
gh version 2.89.0 (2026-03-26)
```

## Steps

S0 baseline + push to designated branch: OK — log committed and pushed in this call
S1 unit branch push: OK — pstack/probe-u/unit-a pushed from /tmp/units worktree
S2 stacked branch push: OK — pstack/probe-u/unit-b (on unit-a) pushed
S3 parent fast-forward push: OK — unit-a advanced by one commit
S4 restack child force-with-lease push: OK — unit-b rebased onto new unit-a and force-pushed with lease
S5 orphan data branch push: OK — commit eca111c pushed to pstack/probe-u/store; stderr showed "fatal: expected 'acknowledgments', received 'packfile'" / "warning: push negotiation failed; proceeding anyway with push" but push succeeded (ls-remote confirms)
S6 data branch fast-forward push: OK — commit 09ea32d (parent eca111c) pushed to pstack/probe-u/store
S7 push from subagent: OK (push) / prep FAILED: "/bin/bash: line 1: /tmp/units/probe-u/c.txt: No such file or directory" — probe script bug (probe-u/ dir absent on origin/main, no mkdir); subagent push of pstack/probe-u/unit-c was not refused and succeeded, but the branch equals origin/main (no probe commit)
S8 open parent PR (REST): OK — PR #41 unit-a -> main
S9 open stacked PR (REST): OK — PR #43 unit-b -> unit-a
S10 retarget stacked PR (REST): OK — PR #43 base now main
S11 close both PRs (REST): OK — #41 closed, #43 closed
S12 delete probe branches: FAILED: "fatal: --negotiate-only needs one or more --negotiation-tip=* / warning: push negotiation failed; proceeding anyway with push / error: RPC failed; HTTP 403 curl 22 The requested URL returned error: 403 / send-pack: unexpected disconnect while reading sideband packet" — not a permission-system refusal; the git transport returned 403 for a multi-ref delete. Not retried. All four pstack/probe-u/* branches still exist on origin (store, unit-a, unit-b, unit-c).

## Summary

| Step | What | Outcome | Notes / verbatim text |
|---|---|---|---|
| S0 | Baseline + push designated branch | OK | |
| S1 | Push unit-a (new branch) | OK | |
| S2 | Push stacked unit-b | OK | |
| S3 | Fast-forward push unit-a | OK | |
| S4 | Restack unit-b, `--force-with-lease` push | OK | |
| S5 | Orphan store branch via plumbing | OK | stderr: "fatal: expected 'acknowledgments', received 'packfile'" + "warning: push negotiation failed; proceeding anyway with push", ref landed (ls-remote confirmed) |
| S6 | Store fast-forward | OK | |
| S7 | Push from subagent | push OK, prep FAILED | prep: "/bin/bash: line 1: /tmp/units/probe-u/c.txt: No such file or directory" (probe script lacks `mkdir -p` after checking out origin/main). Push of unit-c not refused; branch == origin/main |
| S8 | Open parent PR (gh api POST) | OK | PR #41 |
| S9 | Open stacked PR (gh api POST) | OK | PR #43, base unit-a |
| S10 | Retarget PR (gh api PATCH) | OK | #43 base -> main |
| S11 | Close both PRs (gh api PATCH) | OK | #41, #43 closed |
| S12 | Delete probe branches (`push --delete`, 4 refs) | FAILED | "error: RPC failed; HTTP 403 curl 22 The requested URL returned error: 403". All 4 branches remain |

- Permission mode: auto. No step was REFUSED by the permission system; no permission prompts or delays observed.
- Surprising: (1) every push to non-designated `pstack/probe-u/*` branches, including force-with-lease and orphan refs, went through, but the branch **deletion** got HTTP 403 at the git transport. Possibly the proxy rejects ref deletes or multi-ref deletes. A single-ref delete was not tried because the rules forbid retrying. (2) `gh` CLI REST calls (create/patch PR) worked from this session. (3) Push-negotiation warnings appeared on S5 and S12 and were harmless on S5.
- Cleanup needed by owner: delete `pstack/probe-u/{unit-a,unit-b,unit-c,store}` on origin. PRs #41 and #43 are closed. The local worktree at /tmp/units is left in place.
