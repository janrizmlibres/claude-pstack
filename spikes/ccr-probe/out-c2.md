# /ccr/ route probe, run 2: log

## Baseline

```
2026-10-08T05:50:40Z
2.1.294 (Claude Code)
claude/lead-2-ccr-probe-j4uh0z
gh version 2.89.0 (2026-03-26)
{"allow_auto_merge":true,"delete_branch_on_merge":false}
```

S0 Baseline: OK — allow_auto_merge=true, delete_branch_on_merge=false, gh 2.89.0, Claude Code 2.1.294

### S1 PUT pulls/63/ccr/auto_merge (no body)

```
{"enabled":true,"merge_method":"merge"}
```

### S1 read pulls/63

```
{"auto_merge":{"commit_message":null,"commit_title":null,"enabled_by":{"avatar_url":"https://avatars.githubusercontent.com/u/66321705?v=4","events_url":"https://api.github.com/users/janrizmlibres/events{/privacy}","followers_url":"https://api.github.com/users/janrizmlibres/followers","following_url":"https://api.github.com/users/janrizmlibres/following{/other_user}","gists_url":"https://api.github.com/users/janrizmlibres/gists{/gist_id}","gravatar_id":"","html_url":"https://github.com/janrizmlibres","id":66321705,"login":"janrizmlibres","node_id":"MDQ6VXNlcjY2MzIxNzA1","organizations_url":"https://api.github.com/users/janrizmlibres/orgs","received_events_url":"https://api.github.com/users/janrizmlibres/received_events","repos_url":"https://api.github.com/users/janrizmlibres/repos","site_admin":false,"starred_url":"https://api.github.com/users/janrizmlibres/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/janrizmlibres/subscriptions","type":"User","url":"https://api.github.com/users/janrizmlibres","user_view_type":"public"},"merge_method":"merge"},"mergeable_state":"blocked","merged":false,"state":"open"}
```

S1 Arm auto-merge, no body: OK — response {"enabled":true,"merge_method":"merge"}; PR #63 open, merged=false, mergeable_state=blocked, auto_merge.merge_method=merge, enabled_by=janrizmlibres

### S2 DELETE pulls/63/ccr/auto_merge

```
{"enabled":false}
```

### S2 read pulls/63

```
{"auto_merge":null,"mergeable_state":"blocked","merged":false,"state":"open"}
```

S2 Disarm auto-merge: OK — response {"enabled":false}; PR #63 auto_merge=null, open, blocked

### S3 PUT pulls/62/ccr/auto_merge -f merge_method=merge

```
REFUSED: Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Modify Shared Resources].
```

### S3 read pulls/62,63,64

```
REFUSED: Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Merge Without Review].
```

S3 Arm auto-merge with each merge method: REFUSED: Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Modify Shared Resources]. — #62 (merge) refused; #63 (squash) and #64 (rebase) not attempted per the no-retry/no-workaround rule; the follow-up read of #62–#64 was also refused: [Merge Without Review]

S4 Auto-merge on a PR that is already mergeable: REFUSED: not attempted — S3's auto-merge arm was refused by the auto mode classifier ([Modify Shared Resources], then [Merge Without Review]); issuing the same arm call on #61 would be working around that refusal
S5 Turn the gate green: REFUSED: not attempted — posting probe-gate only serves to let the refused auto-merges land ([Merge Without Review]); the owner posts the statuses from outside if wanted
S6 Wait for the merges: REFUSED: not attempted — nothing is armed (S1 arm was disarmed in S2, S3/S4 refused), so there are no merges to wait for

### S7 git log base/open

```
* e66df57 Add release and QA terms to glossary
* 84ec1bc Allow local worktrees in ADR 0001 and add local-only to glossary
* 18017b5 Add spec and plan to glossary
* c76f97c Make cloud workers a local lead's default in ADR 0001
* 37c8df6 Add program, store and stacker to glossary
* 81d232e Add heavy command, machine lock and full gate to glossary
* dbb02a4 Allow in-VM sub-leads in ADR 0001 and add leaf worker to glossary
* 2ddbb97 Settle worker backends in ADR 0001 and add sub-lead to glossary
e66df57 Add release and QA terms to glossary
84ec1bc Allow local worktrees in ADR 0001 and add local-only to glossary
18017b5 Add spec and plan to glossary
c76f97c Make cloud workers a local lead's default in ADR 0001
```

S7 What landed on the base: OK — both base and open sit at e66df57 (the fork point); nothing from #61–#64 landed, so no merge method to verify

### S8 POST pulls/60/ccr/convert_to_draft

```
REFUSED: Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Modify Shared Resources].
```

S8 Convert to draft: REFUSED: Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Modify Shared Resources]. — follow-up read of .draft not run
S9 Ready for review: REFUSED: not attempted — same category of write as the refused S8, and with S8 refused #60 is not a draft, so the call would test nothing

## Summary

| Step | Outcome | Verbatim error / refusal reason |
|---|---|---|
| S0 Baseline | OK | — (allow_auto_merge=true, delete_branch_on_merge=false) |
| S1 Arm auto-merge, no body (#63) | OK | — `{"enabled":true,"merge_method":"merge"}`; PR shows auto_merge.merge_method=merge, enabled_by=janrizmlibres |
| S2 Disarm auto-merge (#63) | OK | — `{"enabled":false}`; PR shows auto_merge=null |
| S3 Arm with each merge method | REFUSED | `Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Modify Shared Resources].` (#62 merge); read of #62–#64 then refused with `Reason: [Merge Without Review].` |
| S4 Auto-merge on mergeable PR (#61) | REFUSED (not attempted) | Same intent as the S3 refusal; not retried |
| S5 Turn the gate green | REFUSED (not attempted) | Only serves the refused merges; owner can post statuses from outside |
| S6 Wait for the merges | REFUSED (not attempted) | Nothing armed |
| S7 What landed on the base | OK | — base and open both at e66df57; nothing landed |
| S8 Convert to draft (#60) | REFUSED | `Permission for this action was denied by the Claude Code auto mode classifier. Reason: [Modify Shared Resources].` |
| S9 Ready for review (#60) | REFUSED (not attempted) | Same write category as S8; #60 isn't a draft |

**Request shapes that worked**
- Arm: `gh api -X PUT repos/{owner}/{repo}/pulls/{n}/ccr/auto_merge` with no body → `{"enabled":true,"merge_method":"merge"}` (default method `merge`). REST `GET pulls/{n}` then reflects it in `auto_merge`.
- Disarm: `gh api -X DELETE repos/{owner}/{repo}/pulls/{n}/ccr/auto_merge` → `{"enabled":false}`.
- The `merge_method` body format (`-f merge_method=merge`) is untested: the call never reached the proxy.
- convert_to_draft / ready_for_review: untested (refused before reaching the proxy).

**Permission mode:** auto mode (the refusals came from the Claude Code auto mode classifier).

**Surprising**
- The proxy accepted the /ccr/auto_merge routes; every failure came from the local auto-mode classifier, not from GitHub or the proxy.
- The classifier allowed S1 and S2 (arm and disarm on #63), then refused the next arm (#62, with merge_method) as [Modify Shared Resources]. After that it refused even a read-only `GET pulls/{62,63,64}` as [Merge Without Review]. So it appears to judge the whole session's direction, not just each single call.
- convert_to_draft (a reversible state flip on a throwaway PR) was also refused as [Modify Shared Resources].
