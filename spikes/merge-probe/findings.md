# Can a cloud session merge a PR through the GitHub proxy?

Run 2026-10-08 from 05:15Z, from one Auto cloud session (`session_017GP38U34Hx3KKym9an4j8w`, Claude Code 2.1.293 in the VM, environment "Mira"), started locally with `claude --permission-mode auto --cloud "<prompt>"` from `research/merge-probe`. The session followed `LEAD.md`. Its log is `spikes/merge-probe/out-m.md` on `claude/merge-probe-spike-m4u1un`. Run 1 failed at branch prep because of a bug in the brief (fixed in `6a47424`). Run 2 was sent as a follow-up with `claude -p "<msg>" --cloud <id>` and ran the whole probe. The repo's "Automatically delete head branches" setting was turned on locally before the run and turned off again afterwards. Every PR merged into a throwaway base cut from `main`, never into `main` itself.

## Result

**Yes. All three REST merge methods work through the proxy, and GitHub's auto-delete removes the merged head.** `gh api -X PUT repos/<owner>/<repo>/pulls/<n>/merge -f merge_method=<m>` returned `{"sha":"…","merged":true,"message":"Pull Request successfully merged"}` for `merge`, `squash` and `rebase`. Each head branch was gone from `ls-remote` 15 s later. Auto mode refused nothing.

**Stacks behave as GitHub does elsewhere.** Merging the parent of an open stacked PR deleted the parent's branch and retargeted the open child to the parent's base. A child closed earlier was not retargeted: it still points at the deleted branch. Closing a PR with `PATCH state=closed` worked on a stacked head that had not been retargeted, and left its branch in place.

**`gh pr merge` fails because the proxy blocks GraphQL.** The 403 body lists replacement routes that only the proxy serves:

> GitHub GraphQL is not available from Claude Code sessions; use the REST API (gh api repos/{owner}/{repo}/...). For review threads, auto-merge, and draft/ready-for-review use the CCR routes on api.github.com: GET /repos/{owner}/{repo}/pulls/{n}/ccr/review_threads, POST /repos/{owner}/{repo}/pulls/{n}/ccr/comments/{comment_id}/resolve (or /unresolve), PUT or DELETE /repos/{owner}/{repo}/pulls/{n}/ccr/auto_merge, POST /repos/{owner}/{repo}/pulls/{n}/ccr/ready_for_review, POST /repos/{owner}/{repo}/pulls/{n}/ccr/convert_to_draft.

These routes were not exercised.

**A cloud session cannot change repo settings.** `gh api -X PATCH repos/<owner>/<repo> -F delete_branch_on_merge=true` returned `Repository settings writes are not permitted through this proxy. (HTTP 403)`. So a cloud run cannot turn auto-delete on itself.

| Step | Action | Outcome | Head deleted? |
|---|---|---|---|
| S1 | Push 8 branches (base, 5 heads off base, 2 stacked on `stack-a`) | OK | — |
| S2 | Open 7 PRs with `gh api -X POST …/pulls` | OK (#49–#55) | — |
| S3 | `PATCH state=closed` on stacked #54 (base `stack-a`) | OK | No, as expected |
| S4 | `PUT …/merge` `merge` (#49) | OK | Yes |
| S5 | `PUT …/merge` `squash` (#50) | OK | Yes |
| S6 | `PUT …/merge` `rebase` (#51) | OK | Yes |
| S7 | `PUT …/merge` `squash` on stack parent #52 | OK | Yes. Open child #53 retargeted to base, closed #54 not |
| S8 | `gh pr merge 55 --squash` | 403 (GraphQL) | No |
| S9 | `PATCH repos/<owner>/<repo>` settings write | 403 (proxy, run 1) | — |

## Not tested

- A merge into the default branch. The proxy showed no sign of inspecting the base, but branch protection or rulesets on a real trunk could still refuse a merge. This repo has neither.
- The `/ccr/` routes, auto-merge among them.

## Leftovers

None on GitHub: PRs #53 and #55 were closed and branches `pstack/probe-m/{base,ghcli,stack-b,stack-c}` were deleted from a local checkout. `delete_branch_on_merge` is back to `false`. The log branch `claude/merge-probe-spike-m4u1un` and the session are safe to delete or archive.
