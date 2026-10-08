# Branch-push workflow probe: session instructions

You are one **arm** of a probe. Your launch prompt names your `ARM` (`u` or `f`). Below, `<X>` means your ARM letter.

**What this is.** The owner of this repo (janrizmlibres) is designing a tool that runs in cloud sessions like this one and pushes several git branches per run: unit branches stacked on each other, restacked with `--force-with-lease`, a data branch with no shared history, and pull requests opened and retargeted through the GitHub REST API. This run performs that workflow once on throwaway branches under `pstack/probe-<X>/` so the owner can see which steps work here. Every branch, PR and file it creates is disposable, and the last steps delete them.

Nobody is watching this session. Follow the steps in order and do nothing else.

## Rules

- **One action per Bash call** where a step says so, so each outcome maps to one step.
- **If a tool call is refused or blocked by the permission system, do not retry it, rephrase it or work around it.** Copy the refusal text verbatim into the log, mark the step `REFUSED`, and go on to the next step. A step that fails for another reason (git or HTTP error) is `FAILED` with the first lines of the error.
- **Keep the log to outcomes.** Never run `env`, `printenv` or `set`, never print or log the value of any environment variable, token, credential or remote URL, and never read files under `~/.claude`. This repo is public.
- Do not edit any settings file or change the permission mode.

## The log

Your log is `spikes/auto-push/out-<X>.md` in your main checkout, on the branch the session put you on (your designated branch). After **every** step, append one line to it:

```
S<n> <step name>: OK | REFUSED: <verbatim reason> | FAILED: <first error lines> — <one-line note>
```

then commit and push it to your designated branch, in one Bash call:

```
git add spikes/auto-push/out-<X>.md && git commit -qm "auto-push probe <X>: S<n>" && git push -q origin HEAD
```

If that log push is itself refused, record it in your final message and keep going; do not retry it.

## Steps

**S0. Baseline.** One Bash call: `date -u +%FT%TZ; claude --version; git branch --show-current; git log --oneline -1; gh --version | head -1`. Write the output into the log under a `## Baseline` heading, then the S0 line, then commit and push the log as above. (S0 is the push to your designated branch.)

**S1. Unit branch.**
- Prep (one Bash call): `git fetch -q origin main && git worktree add -q -b pstack/probe-<X>/unit-a /tmp/units origin/main && mkdir -p /tmp/units/probe-<X> && echo a1 > /tmp/units/probe-<X>/a.txt && git -C /tmp/units add -A && git -C /tmp/units commit -qm "probe <X>: unit-a"`
- Push (its own Bash call): `git -C /tmp/units push -q -u origin pstack/probe-<X>/unit-a`

**S2. Stacked branch.**
- Prep: `git -C /tmp/units checkout -q -b pstack/probe-<X>/unit-b && echo b1 > /tmp/units/probe-<X>/b.txt && git -C /tmp/units add -A && git -C /tmp/units commit -qm "probe <X>: unit-b on unit-a"`
- Push: `git -C /tmp/units push -q -u origin pstack/probe-<X>/unit-b`

**S3. Parent moves (fast-forward push).**
- Prep: `git -C /tmp/units checkout -q pstack/probe-<X>/unit-a && echo a2 >> /tmp/units/probe-<X>/a.txt && git -C /tmp/units commit -qam "probe <X>: unit-a second commit"`
- Push: `git -C /tmp/units push -q origin pstack/probe-<X>/unit-a`

**S4. Restack the child (force-with-lease).**
- Prep: `git -C /tmp/units checkout -q pstack/probe-<X>/unit-b && git -C /tmp/units rebase -q pstack/probe-<X>/unit-a`
- Push: `git -C /tmp/units push -q --force-with-lease=pstack/probe-<X>/unit-b origin pstack/probe-<X>/unit-b`

**S5. Orphan data branch, built by plumbing with no checkout.**
- Prep (one Bash call, prints the commit id): `cd /tmp/units && b=$(echo '{"probe":"<X>","n":1}' | git hash-object -w --stdin) && t=$(printf '100644 blob %s\tstore.json\n' "$b" | git mktree) && git commit-tree "$t" -m "probe <X>: store init"`
- Push: `git -C /tmp/units push -q origin <commit id>:refs/heads/pstack/probe-<X>/store`

**S6. Data branch update (fast-forward on the orphan line).**
- Prep: same as S5 with `"n":2` and `-p <S5 commit id>` added to `git commit-tree`, message `probe <X>: store update`.
- Push: `git -C /tmp/units push -q origin <new commit id>:refs/heads/pstack/probe-<X>/store`

**S7. Push from a subagent.** Spawn one subagent with the Agent tool (no isolation option) and this prompt, then log what it reports:

> In /tmp/units run, as separate Bash calls: (1) `git -C /tmp/units checkout -q -b pstack/probe-<X>/unit-c origin/main && echo c1 > /tmp/units/probe-<X>/c.txt && git -C /tmp/units add -A && git -C /tmp/units commit -qm "probe <X>: unit-c from a subagent"` (2) `git -C /tmp/units push -q -u origin pstack/probe-<X>/unit-c`. If a call is refused or blocked by the permission system, do not retry or work around it. Report each call as OK, REFUSED with the verbatim refusal text, or FAILED with the first error lines. Do nothing else.

**S8. Open the parent PR (REST).** `gh api -X POST repos/janrizmlibres/claude-pstack/pulls -f title="[probe <X>] unit-a (throwaway)" -f head=pstack/probe-<X>/unit-a -f base=main -f body="Throwaway PR from a branch-push probe. It is closed by the same run." --jq '.number'`

**S9. Open the stacked PR on the parent (REST).** Same, with `title="[probe <X>] unit-b on unit-a (throwaway)"`, `head=pstack/probe-<X>/unit-b`, `base=pstack/probe-<X>/unit-a`.

**S10. Retarget the stacked PR (REST).** `gh api -X PATCH repos/janrizmlibres/claude-pstack/pulls/<S9 number> -f base=main --jq '.base.ref'`

**S11. Close both PRs (REST).** Two calls: `gh api -X PATCH repos/janrizmlibres/claude-pstack/pulls/<n> -f state=closed --jq '.state'` for the S8 and S9 numbers. One log line for both.

**S12. Delete the probe branches.** `git -C /tmp/units push -q origin --delete pstack/probe-<X>/unit-a pstack/probe-<X>/unit-b pstack/probe-<X>/unit-c pstack/probe-<X>/store` (leave out any branch whose push failed).

## Finish

Append a `## Summary` to the log: a table of S0–S12 with outcome and verbatim refusal text, your permission mode if you know it, how long refused steps took if you noticed, and anything surprising. Commit and push it to your designated branch. End with a final message that repeats the summary table.
