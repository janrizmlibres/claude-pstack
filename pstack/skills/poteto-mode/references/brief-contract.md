# Brief contract

Every brief a lead or sub-lead writes for a worker follows this contract, on both surfaces. Clauses 1 and 3 govern how you write the brief. The rest bind the worker, so carry each one into the brief, in a line of its own where the worker must act on it. A brief may add to the contract; it never loosens it.

1. **Entry and paths.** A separate-session worker's brief (a cloud worker, a `create_session` worker) opens with `/pstack:<skill>` as its first line. It names skills, never absolute paths: the other session's plugin root and checkout aren't yours. A same-session subagent may get paths with `${CLAUDE_PLUGIN_ROOT}` already substituted.
2. **Never ask the human.** No human is watching a worker, and a question stalls it for good. Return `BLOCKED` with the question and what each answer would change.
3. **The lead's voice.** Phrase the brief as your instruction to the worker, never "the user asked". The worker takes its orders from you.
4. **Own branch only.** Push only to your own branch: the `outcome_branch` your session was given, or the branch the brief designates. Never push to the base, another worker's branch or a shared branch.
5. **Start commit.** A worktree worker's brief names the commit it starts from, and its first step resets to it (`git reset --hard <sha>`), on both surfaces. The port never relies on `worktree.baseRef`, which the user's settings may point anywhere.
6. **Heavy commands.** Run every heavy command through pstack's machine-lock wrapper, `scripts/heavy -- <cmd>` in the pstack plugin, targeted to the files you own. A same-session subagent's brief gives the wrapper's substituted path; a separate-session worker takes it from its own poteto-mode reminder. Exit 75 means the lock stayed busy: that is backpressure, so do other work and re-run later. A failure already present at the start commit in a file you don't own is reported as `foreign failure: <file>`, never fixed.
7. **Missing files.** A gitignored file you need that isn't in your worktree (such as `.env`) is `BLOCKED: missing <file>`. Never copy it in from another checkout.
8. **Leaf workers never fan out.** Unless the brief makes you a sub-lead, you are a leaf worker: never start a panel, swarm or arena. At a panel trigger, return `BLOCKED: needs <panel>` with what the panel needs (the artifact, the question, the evidence so far). Your lead runs it.
9. **One skill per purpose.** When a playbook names a pstack skill, read that skill's `SKILL.md`. Don't also invoke a same-purpose skill unless `CLAUDE.md` or the brief names it.
10. **Report.** End on a final commit on your own branch, with the report in its body (`--allow-empty` if no code changed) and exactly these trailers, added explicitly so they survive `attribution.commit: ""`; request no other trailer:

    ```
    Pstack-Status: PASS|ISSUES|BLOCKED
    Claude-Session: <this session's URL>
    ```

    A same-session subagent also returns the report as its final message.

    How the lead reads it: a cloud worker's prompt opens with a nonce phrase the lead chose, so its branch is `claude/<nonce-slug>-*`. The lead finds it with `git ls-remote origin 'refs/heads/claude/<nonce-slug>-*'`, polls for it from a background loop, fetches it and reads `git log -1`. A local worktree worker's report is read from its branch with no push, and its work is integrated by cherry-pick or merge.
11. **Sub-lead timebox.** A sub-lead declares its own timebox when it starts: the sum of its plan's worker timeboxes plus its integration time. Its lead holds it to that declaration.
