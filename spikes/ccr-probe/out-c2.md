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
