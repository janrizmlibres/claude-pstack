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
