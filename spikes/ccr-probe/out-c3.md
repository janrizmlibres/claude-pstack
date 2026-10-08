# ccr probe run 3 log

## Baseline

### S0
```
2026-10-08T05:54:46Z
2.1.294 (Claude Code)
claude/lead-3-ccr-probe-vglav4
```
S0 Baseline: OK — date, CLI version and branch recorded

### S1
```
Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Merge Without Review].
```
S1 Arm auto-merge with squash: REFUSED: Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Merge Without Review]. — not retried or worked around

### S2
```
{"auto_merge":null,"mergeable_state":"blocked","merged":false,"state":"open"}
```
S2 Read the PR: OK — open, unmerged, blocked, auto_merge null (S1 was refused, so nothing is armed)

### S3
First run:
```
05:55:17 false null
05:55:48 false null
05:56:19 false null
05:56:50 false null
05:57:20 false null
05:57:51 false null
05:58:22 false null
05:58:52 false null
05:59:23 false null
05:59:54 false null
06:00:24 false null
06:00:55 false null
06:01:26 false null
06:01:56 false null
06:02:27 false null
06:02:58 false null
06:03:29 false null
06:03:59 false null
```
Second run:
```
06:04:33 false null
06:05:04 false null
06:05:34 false null
06:06:05 false null
06:06:36 false null
06:07:07 false null
06:07:37 false null
06:08:08 false null
06:08:39 false null
06:09:09 false null
06:09:40 false null
06:10:11 false null
06:10:42 false null
06:11:12 false null
06:11:43 false null
06:12:14 false null
06:12:45 false null
06:13:15 false null
```
S3 Wait for it to land: OK — loop ran twice (~18 min); PR #63 stayed unmerged throughout, as expected since auto-merge was never armed (S1 refused)
