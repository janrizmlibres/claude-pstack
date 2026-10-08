# /ccr/ route probe, run 4: session instructions

**What this is.** The owner of this repo (janrizmlibres) is designing a tool that runs in cloud sessions like this one and opens its own pull requests as drafts, marking them ready for review when its work is done. The session's GitHub proxy blocks GraphQL, so the tool would use the proxy routes `POST /repos/{owner}/{repo}/pulls/{n}/ccr/convert_to_draft` and `…/ccr/ready_for_review`. This run toggles one throwaway PR the owner set up for it, #60 (head `pstack/probe-c/draft`, base `pstack/probe-c/open`, never `main`), to draft and back, and records what the routes return.

Nobody is watching this session. Follow the steps in order and do nothing else.

## Rules

- **One action per Bash call.**
- **If a tool call is refused or blocked by the permission system, do not retry it, rephrase it or work around it.** Record the refusal reason verbatim, mark the step `REFUSED`, and go on to the next step. A step that fails for another reason is `FAILED`, with the verbatim error.
- Never run `env`, `printenv` or `set`, never pass `-i` to `gh api`, never print an environment variable, token, credential or remote URL, and never read files under `~/.claude`. This repo is public.
- Do not edit any settings file or change the permission mode.

## The log

Your log is `spikes/ccr-probe/out-c4.md` on your designated branch. After every step, append `S<n> <step name>: OK | REFUSED: <reason> | FAILED: <error> — <note>`, with any response the step records under a `### S<n>` heading above it, then `git add spikes/ccr-probe/out-c4.md && git commit -qm "ccr probe 4: S<n>" && git push -q origin HEAD` in one call.

`R` is `repos/janrizmlibres/claude-pstack`.

## Steps

**S0. Baseline.** `date -u +%FT%TZ; claude --version; git branch --show-current`. Log it under `## Baseline`.

**S1. Convert to draft.** `gh api -X POST R/pulls/60/ccr/convert_to_draft`. Record the response.

**S2. Read.** `gh api R/pulls/60 --jq '.draft'`, recorded.

**S3. Ready for review.** `gh api -X POST R/pulls/60/ccr/ready_for_review`. Record the response.

**S4. Read.** `gh api R/pulls/60 --jq '.draft'`, recorded.

## Finish

Append a `## Summary` table of S0–S4 with outcomes and verbatim errors or refusal reasons, commit and push it, and repeat it in your final message.
