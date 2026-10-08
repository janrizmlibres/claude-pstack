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

### S2 resolve T2

```
{"comment_ids":[4215160624],"resolved":true}
```

S2 Resolve T2: OK — POST returns {comment_ids, resolved}; re-read (same shape) shows T2 resolved=true; T1/T3 unchanged.

### S3 unresolve T1 by reply id

```
{"comment_ids":[4215160454,4215161740],"resolved":false}
```

S3 Unresolve T1 by reply id: OK — reply id 4215161740 accepted (response lists both thread comment ids), so root-id fallback not needed; re-read shows T1 resolved=false.

### S4 convert_to_draft

```
Permission for this action was denied by the Claude Code auto mode classifier. Reason: [External System Writes]. If you have other tasks that don't depend on this action, continue working on those. IMPORTANT: You *may* attempt to accomplish this action using other tools that might naturally be used to accomplish this goal, e.g. using head instead of cat. But you *should not* attempt to work around this denial in malicious ways, e.g. do not use your ability to run tests to execute non-test actions. You should only try to work around this restriction in reasonable ways that do not attempt to bypass the intent behind this denial. If you believe this capability is essential to complete the user's request, first try a safer method. Get as much of the rest of the task done as you can, then STOP and explain to the user what you were trying to do and why you need this permission. Let the user decide how to proceed. To allow this type of action in the future, the user can add a permission rule for Bash to their settings.
```

S4 Convert to draft: REFUSED: Permission for this action was denied by the Claude Code auto mode classifier. Reason: [External System Writes]. — route never called; follow-up read `.draft` = false

### S5 ready_for_review

```
Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Auto-Mode Bypass]. If you have other tasks that don't depend on this action, continue working on those. IMPORTANT: You *may* attempt to accomplish this action using other tools that might naturally be used to accomplish this goal, e.g. using head instead of cat. But you *should not* attempt to work around this denial in malicious ways, e.g. do not use your ability to run tests to execute non-test actions. You should only try to work around this restriction in reasonable ways that do not attempt to bypass the intent behind this denial. If you believe this capability is essential to complete the user's request, first try a safer method. Get as much of the rest of the task done as you can, then STOP and explain to the user what you were trying to do and why you need this permission. Let the user decide how to proceed. To allow this type of action in the future, the user can add a permission rule for Bash to their settings.
```

The follow-up read `gh api R/pulls/60 --jq '.draft'` was refused with the same verbatim text (Reason: [Auto-Mode Bypass]).

S5 Ready for review: REFUSED: Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Auto-Mode Bypass]. — route never called; follow-up read also refused with the same reason

S6–S11: NOT RUN — after S4 (External System Writes) and S5 (Auto-Mode Bypass) were refused, and the classifier's refusal told the session to stop and let the user decide, the remaining GitHub writes (arming/disarming auto-merge, posting commit statuses, which would merge #61–#64) were not attempted. Left for the owner to decide.

### S12 base/open history

```
* e66df57 Add release and QA terms to glossary
* 84ec1bc Allow local worktrees in ADR 0001 and add local-only to glossary
* 18017b5 Add spec and plan to glossary
* c76f97c Make cloud workers a local lead's default in ADR 0001
* 37c8df6 Add program, store and stacker to glossary
* 81d232e Add heavy command, machine lock and full gate to glossary
* dbb02a4 Allow in-VM sub-leads in ADR 0001 and add leaf worker to glossary
* 2ddbb97 Settle worker backends in ADR 0001 and add sub-lead to glossary
* 2ea8e47 Add setup line to glossary
* e638eff Add panel to glossary
* 986e087 Add setting to glossary
* 5024842 Add sample and fresh-context review to glossary
e66df57 Add release and QA terms to glossary
84ec1bc Allow local worktrees in ADR 0001 and add local-only to glossary
18017b5 Add spec and plan to glossary
c76f97c Make cloud workers a local lead's default in ADR 0001
```

S12 What landed on the base: OK — `base` and `open` both at e66df57, linear history; nothing from #61–#64 landed (expected, since S8–S11 were not run). No merge-method evidence.

## Summary

| Step | Outcome | Verbatim error / refusal |
|---|---|---|
| S0 Baseline | OK | — |
| S1 Read review threads | OK | — |
| S2 Resolve T2 | OK | — |
| S3 Unresolve T1 by reply id | OK (root-id fallback not needed) | — |
| S4 Convert to draft | REFUSED | "Permission for this action was denied by the Claude Code auto mode classifier. Reason: [External System Writes]." (full text above) |
| S5 Ready for review | REFUSED (and its follow-up read) | "Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Auto-Mode Bypass]." (full text above) |
| S6 Arm auto-merge, no body | NOT RUN | stopped after classifier refusals |
| S7 Disarm auto-merge | NOT RUN | — |
| S8 Arm with each method | NOT RUN | — |
| S9 Auto-merge on mergeable PR | NOT RUN | — |
| S10 Post probe-gate statuses | NOT RUN | — |
| S11 Wait for merges | NOT RUN | — |
| S12 What landed on base | OK | base/open both at e66df57; no probe merges |

**Request shapes that worked**
- `GET R/pulls/{n}/ccr/review_threads` → array of `{resolved, outdated, path, line, comment_ids[]}` (outdated threads have `line: null`; no thread node ids).
- `POST R/pulls/{n}/ccr/comments/{comment_id}/resolve` (no body) → `{comment_ids, resolved: true}`.
- `POST R/pulls/{n}/ccr/comments/{comment_id}/unresolve` (no body) → `{comment_ids, resolved: false}`; any comment in the thread works, a reply id included.
- convert_to_draft / ready_for_review / auto_merge / statuses: untested (refused or not run).

**Permission mode:** auto mode (the refusals came from the auto mode classifier).

**Surprising**
- The proxy took the thread routes, but the auto mode classifier blocked `convert_to_draft` as an "External System Writes" action even though resolve/unresolve (also writes) went through.
- After one refusal, the classifier labelled the next distinct write "Auto-Mode Bypass", and then refused even a plain read (`gh api R/pulls/60 --jq .draft`). A single denial seems to taint later calls on the same target in auto mode, so a probe run of many write steps can't continue past its first refusal unattended.
