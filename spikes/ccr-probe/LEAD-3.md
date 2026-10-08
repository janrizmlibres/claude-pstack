# /ccr/ route probe, run 3: session instructions

**What this is.** The owner of this repo (janrizmlibres) is designing a tool that runs in cloud sessions like this one and, when the user asks it to land its pull requests, does so by arming GitHub's auto-merge through the proxy route `PUT /repos/{owner}/{repo}/pulls/{n}/ccr/auto_merge`. A previous session armed and disarmed it on these same throwaway PRs. This run arms it once with an explicit merge method on PR #63, whose head `pstack/probe-c/am-squash` targets the throwaway branch `pstack/probe-c/base`, never `main`. The owner set up the PR for this, gated `pstack/probe-c/base` on a commit status called `probe-gate`, and will post that status from outside once the PR is armed. Your part is to arm it and watch it land.

Nobody is watching this session. Follow the steps in order and do nothing else.

## Rules

- **One action per Bash call.**
- **If a tool call is refused or blocked by the permission system, do not retry it, rephrase it or work around it.** Record the refusal reason verbatim, mark the step `REFUSED`, and go on to the next step. A step that fails for another reason is `FAILED`, with the verbatim error.
- Never run `env`, `printenv` or `set`, never pass `-i` to `gh api`, never print an environment variable, token, credential or remote URL, and never read files under `~/.claude`. This repo is public.
- Do not edit any settings file or change the permission mode.

## The log

Your log is `spikes/ccr-probe/out-c3.md` on your designated branch. After every step, append `S<n> <step name>: OK | REFUSED: <reason> | FAILED: <error> — <note>`, with any response the step records under a `### S<n>` heading above it, then `git add spikes/ccr-probe/out-c3.md && git commit -qm "ccr probe 3: S<n>" && git push -q origin HEAD` in one call.

`R` is `repos/janrizmlibres/claude-pstack`.

## Steps

**S0. Baseline.** `date -u +%FT%TZ; claude --version; git branch --show-current`. Log it under `## Baseline`.

**S1. Arm auto-merge with squash.** `gh api -X PUT R/pulls/63/ccr/auto_merge -f merge_method=squash`. Record the response. If it fails with an error naming a different field or value format, run it once in that format and record that too.

**S2. Read the PR.** `gh api R/pulls/63 --jq '{state, merged, mergeable_state, auto_merge}'`, recorded.

**S3. Wait for it to land.** The owner posts the status after seeing S2 in your log. One Bash call, up to 9 minutes:

```
for i in $(seq 1 18); do s=$(gh api repos/janrizmlibres/claude-pstack/pulls/63 --jq '"\(.merged) \(.merged_at)"'); echo "$(date -u +%T) $s"; case "$s" in false*) sleep 30;; *) break;; esac; done
```

Record the output. If still unmerged, run it once more and record that.

**S4. What landed.** `gh api R/pulls/63 --jq '{state, merged, merged_at, merged_by: .merged_by.login, merge_commit_sha, auto_merge}'`, recorded. Then its own call: `git fetch -q origin pstack/probe-c/base && git log --oneline --graph -4 origin/pstack/probe-c/base`, recorded, noting whether #63 landed as one squashed commit.

## Finish

Append a `## Summary` table of S0–S4 with outcomes and verbatim errors or refusal reasons, commit and push it, and repeat it in your final message.
