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
