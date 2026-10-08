# /ccr/ route probe log (run C)

## Baseline

```
2026-10-08T05:42:21Z
2.1.294 (Claude Code)
claude/ccr-probe-lead-yjswwv
gh version 2.89.0 (2026-03-26)
{"allow_auto_merge":true,"delete_branch_on_merge":false}
```

S0 Baseline: OK — allow_auto_merge=true, delete_branch_on_merge=false, claude 2.1.294, gh 2.89.0

### S1 review_threads

```
[{"resolved":true,"outdated":false,"path":"probe-c/threads.txt","line":1,"comment_ids":[4215160454,4215161740]},{"resolved":false,"outdated":false,"path":"probe-c/threads.txt","line":3,"comment_ids":[4215160624]},{"resolved":false,"outdated":true,"path":"probe-c/threads.txt","line":null,"comment_ids":[4215160785]}]
```

S1 Read review threads: OK — JSON array of objects {resolved, outdated, path, line, comment_ids}; no thread node id. T1 resolved=true outdated=false; T2 resolved=false outdated=false; T3 resolved=false outdated=true (line=null). Resolution and outdatedness both readable per thread.
