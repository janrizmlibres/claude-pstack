# /ccr/ route probe, run 4: log

## Baseline

```
2026-10-08T05:54:52Z
2.1.294 (Claude Code)
claude/lead-4-ccr-probe-tytveb
```

S0 Baseline: OK — date, CLI version and branch recorded

### S1

```
{"draft":true}
```

S1 Convert to draft: OK — proxy route returned {"draft":true}

### S2

```
true
```

S2 Read: OK — PR #60 reads draft=true

### S3

```
{"draft":false}
```

S3 Ready for review: OK — proxy route returned {"draft":false}
