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
