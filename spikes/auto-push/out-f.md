# Auto-push probe, arm f

## Baseline

```
2026-10-08T04:53:27Z
2.1.293 (Claude Code)
claude/auto-push-spike-qzdsj4
bb3d933 Add restart and resume note to glossary
gh version 2.89.0 (2026-03-26)
```

## Steps

S0 baseline + designated-branch push: OK — log commit pushed to claude/auto-push-spike-qzdsj4
S1 unit branch push: OK — pstack/probe-f/unit-a pushed from /tmp/units worktree
S2 stacked branch push: OK — pstack/probe-f/unit-b pushed
S3 parent fast-forward push: OK — unit-a advanced by one commit
S4 restack force-with-lease push: OK — unit-b rebased onto unit-a and force-with-lease pushed
S5 orphan data branch push: OK — store c975577 pushed; push printed 'fatal: expected 'acknowledgments', received 'packfile'' + 'push negotiation failed; proceeding anyway' but the ref was created
S6 data branch fast-forward push: OK — store advanced to d15b0e1 (parent c975577)
S7 subagent push: call 1 FAILED: '/bin/bash: line 1: /tmp/units/probe-f/c.txt: No such file or directory'; call 2 push OK — not refused; LEAD.md prep bug (probe-f/ dir absent on origin/main, needs mkdir -p), so unit-c was pushed identical to origin/main
S8 open parent PR (REST): OK — PR #40 (unit-a -> main)
S9 open stacked PR (REST): OK — PR #42 (unit-b -> unit-a)
S10 retarget stacked PR (REST): OK — PR #42 base now main
S11 close both PRs (REST): OK — #40 closed, #42 closed
S12 delete probe branches: FAILED: "fatal: --negotiate-only needs one or more --negotiation-tip=* / warning: push negotiation failed; proceeding anyway with push / error: RPC failed; HTTP 403 curl 22 The requested URL returned error: 403 / send-pack: unexpected disconnect while reading sideband packet" — branch deletion got HTTP 403 from the git proxy (not a permission-system refusal); not retried, so pstack/probe-f/{unit-a,unit-b,unit-c,store} are presumably still on origin

## Summary

| Step | What | Outcome | Notes / verbatim text |
|---|---|---|---|
| S0 | Baseline + designated-branch push | OK | CC 2.1.293, gh 2.89.0 |
| S1 | Push unit branch (new ref, worktree) | OK | |
| S2 | Push stacked branch | OK | |
| S3 | Parent fast-forward push | OK | |
| S4 | Restack child, `--force-with-lease` push | OK | |
| S5 | Orphan data branch via plumbing, push sha:ref | OK | Printed `fatal: expected 'acknowledgments', received 'packfile'` + `push negotiation failed; proceeding anyway`, ref still created |
| S6 | Data branch fast-forward | OK | |
| S7 | Push from a subagent | Push OK; prep FAILED | Prep: `/bin/bash: line 1: /tmp/units/probe-f/c.txt: No such file or directory` (LEAD.md prep lacks `mkdir -p`). Push not refused; unit-c pushed identical to main |
| S8 | Open PR via `gh api` POST | OK | #40 |
| S9 | Open stacked PR via `gh api` POST | OK | #42 |
| S10 | Retarget PR via `gh api` PATCH | OK | base → main |
| S11 | Close both PRs via `gh api` PATCH | OK | #40, #42 closed |
| S12 | `git push --delete` probe branches | FAILED | `error: RPC failed; HTTP 403 curl 22 The requested URL returned error: 403` |

- Permission mode: auto mode (per session notice). No step was REFUSED by the permission system; every tool call ran without a prompt and without noticeable delay.
- Surprising: ref creation, force-with-lease and pushes to arbitrary non-designated branches all succeeded, and `gh api` writes worked even though the session notes say `gh` isn't available. Only branch **deletion** was blocked, by an HTTP 403 from the git proxy. Cleanup therefore did not happen: four `pstack/probe-f/*` branches remain on origin and need manual deletion.
- The `--negotiate-only` / push-negotiation warnings show up on some pushes (S5, S12). They come from the proxy, and on their own they did not stop pushes.
- The `/tmp/units` worktree was left in place.
