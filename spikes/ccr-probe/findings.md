# What do the cloud proxy's /ccr/ pull-request routes do?

Run 2026-10-08 from 05:42Z, from four Auto cloud sessions (Claude Code 2.1.294 in the VM), each started locally with `claude --permission-mode auto --cloud "<prompt>"` from `research/ccr-probe` and following one brief:

| Run | Brief | Session | Log branch |
|---|---|---|---|
| 1 | `LEAD.md` | `session_01Jb52DoDGVSrqW6bMXrG88C` | `claude/ccr-probe-lead-yjswwv` (`out-c.md`) |
| 2 | `LEAD-2.md` | `session_01RKbwd66m9Zfq4rvk1PEjz5` | `claude/lead-2-ccr-probe-j4uh0z` (`out-c2.md`) |
| 3 | `LEAD-3.md` | `session_01RJ4ox361XZ2XyDHm9RHx89` | `claude/lead-3-ccr-probe-vglav4` (`out-c3.md`) |
| 4 | `LEAD-4.md` | `session_01EohVsqp6bxRhFyn8RW5Myn` | `claude/lead-4-ccr-probe-tytveb` (`out-c4.md`) |

The fixtures were set up locally with the owner's own `gh`: throwaway PRs #59–#64 under `pstack/probe-c/`, none targeting `main`. #59 carried three review threads. T1 was resolved and had a reply, T2 was unresolved, T3 was unresolved and outdated (its line changed in a later commit); GraphQL confirmed all three states. #62–#64 targeted `pstack/probe-c/base`, which a temporary ruleset gated on a commit status `probe-gate`, so auto-merge had something to wait for. The repo's "Allow auto-merge" setting was turned on for the run.

## Result

**Every route works through the proxy.** Every failure came from the Auto mode classifier, never from the proxy or GitHub.

### Review threads

`GET repos/{owner}/{repo}/pulls/{n}/ccr/review_threads` returns an array, one object per thread:

```json
[{"resolved":true,"outdated":false,"path":"probe-c/threads.txt","line":1,"comment_ids":[4215160454,4215161740]},
 {"resolved":false,"outdated":false,"path":"probe-c/threads.txt","line":3,"comment_ids":[4215160624]},
 {"resolved":false,"outdated":true,"path":"probe-c/threads.txt","line":null,"comment_ids":[4215160785]}]
```

It gives both resolution state and outdatedness. An outdated thread has `line: null`. The response has no thread node id, so a thread is identified by its REST comment ids. No comment bodies or authors are included; those come from `GET …/pulls/{n}/comments` by id.

`POST …/pulls/{n}/ccr/comments/{comment_id}/resolve` and `/unresolve` take no body. They return `{"comment_ids":[…],"resolved":true|false}`, and a re-read shows the change. Any comment in the thread works: unresolving T1 by its reply's id flipped the whole thread.

### Draft toggles

`POST …/pulls/{n}/ccr/convert_to_draft` returns `{"draft":true}`, and `POST …/pulls/{n}/ccr/ready_for_review` returns `{"draft":false}`. A REST `GET pulls/{n}` reads `.draft` back as `true`, then `false` (run 4).

### Auto-merge

`PUT …/pulls/{n}/ccr/auto_merge` with no body returned `{"enabled":true,"merge_method":"merge"}`. REST `GET pulls/{n}` then showed `auto_merge.merge_method: "merge"`, `enabled_by: janrizmlibres` (the token's user) and `mergeable_state: "blocked"`. `DELETE` on the same route returned `{"enabled":false}`, and `auto_merge` went back to `null` (run 2).

Untested: the request field that picks a merge method (`-f merge_method=…`), arming a PR that is already mergeable, and whether an armed PR merges on its own once its gate turns green. Every call that would have tested them was refused by the classifier. GitHub's own auto-merge would merge the PR once its requirements pass. The armed state the proxy produced is GitHub's own (`auto_merge` on the REST PR), but no armed PR was left to see it happen.

### The Auto classifier

| Call | Run | Outcome |
|---|---|---|
| `GET …/ccr/review_threads`, `resolve`, `unresolve` | 1 | allowed |
| `convert_to_draft` (4th write in the session) | 1 | refused `[External System Writes]` |
| `ready_for_review`, then a plain `GET pulls/60` | 1 | refused `[Auto-Mode Bypass]` |
| `PUT auto_merge` (no body), `DELETE auto_merge` (1st and 2nd writes) | 2 | allowed |
| `PUT auto_merge -f merge_method=merge` (3rd write) | 2 | refused `[Modify Shared Resources]` |
| `GET pulls/{62,63,64}` right after | 2 | refused `[Merge Without Review]` |
| `convert_to_draft` | 2 | refused `[Modify Shared Resources]` |
| `PUT auto_merge -f merge_method=squash` (1st write in the session) | 3 | refused `[Merge Without Review]` |
| `convert_to_draft`, `ready_for_review` (1st and 2nd writes) | 4 | allowed |

Arming auto-merge was refused in 2 of 3 attempts, once as a session's first write. After a refusal, the classifier refused even plain reads of the same PRs, which matches the session-history effect seen in the auto-push probe. Draft toggles went through as a session's first writes and were refused after other writes. The brief framed the task the same way each time: throwaway PRs, the owner's setup, never `main`.

## Not tested

- The `merge_method` request field, auto-merge on an already-mergeable PR, and an armed PR landing on its own (classifier refusals, above).
- Any `/ccr/` route outside Auto mode.
- The routes against a protected default branch.

## Leftovers

None on GitHub: PRs #59–#64 are closed, the `pstack/probe-c/*` branches are deleted, the temporary ruleset is removed and "Allow auto-merge" is back to off. The four log branches and sessions are safe to delete or archive.
