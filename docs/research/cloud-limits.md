# Cloud session length and idle limits

Research for issue #7: how long a Claude Code cloud session can run, what idling does to it, whether a follow-up revives it, and how parallel sessions share limits. These bound how long one pstack run can be in the port.

Researched 2026-10-06 against Claude Code docs as published that day (newest changelog entry: v2.1.291, 2026-10-06). Behaviour of cloud sessions changes often; recheck the cited pages before relying on a number.

## Evidence grades

- **documented**: stated on an official Anthropic page (code.claude.com docs, its changelog, platform.claude.com, support.claude.com).
- **staff-confirmed**: stated by an Anthropic staff member (GitHub `collaborator`) in an `anthropics/claude-code` issue.
- **anecdotal**: user reports in GitHub issues or third-party pages. Not verified by Anthropic.
- **inferred**: my reading of documented facts, not stated outright.
- **unknown**: no source found.

## Answers at a glance

| Question | Answer | Grade |
| - | - | - |
| Maximum wall-clock of a cloud session | No cap is published. The changelog fixes bugs in sessions running more than 6 and 8 hours, so a cap, if any, sits above 8 hours. One user kept a Projects container alive past 24 hours. | unknown (no published cap); >8 h documented; >24 h anecdotal |
| Idle threshold | Two stages. After "a few minutes" without activity the VM **pauses** with its files saved. Later, a paused VM can be **reclaimed**. Neither interval is published. Users report the pause after about 2 minutes and a reclaim after anywhere from under 10 minutes to days. | documented (two stages, no numbers); anecdotal (numbers) |
| What a pause kills | Nothing in the documented sense: the same VM, with its files, comes back on the next message, and Claude Code restarts in it. Environment variables are re-read and the setup script does not rerun. | documented |
| What a reclaim kills | The whole VM: working-tree files that were not pushed, plus running background work (subagents, shell commands). Only the conversation history comes back, in a fresh VM. | documented + staff-confirmed |
| Does the idle timer wait for running background subagents? | Unknown for Anthropic-hosted sessions. The changelog shows a container *can* restart between turns while a background agent, shell or monitor is still running, and that this work is lost. | documented that it can happen; threshold unknown |
| Does `claude -p "<msg>" --cloud <id>` revive a paused session? | Yes: "Your next message restores the same VM." | documented |
| Does it revive a reclaimed session? | The docs only say to reopen the session from claude.ai/code to provision a fresh VM. The CLI rejects only missing and archived sessions, so a queued message to a reclaimed session is very likely accepted and rebuilds the VM, but this isn't stated. One user saw the CLI return `ok:true` for a session the web UI called "ended". | inferred; anecdotal |
| Archived sessions | Reject `--cloud` follow-ups. Users report long sessions getting auto-archived without their action, including cloud sessions. | documented (rejection); anecdotal (auto-archive) |
| Routine run length | No run-length limit is published. Each run is a full cloud session, so the cloud session limits above apply. Starting runs is capped per hour. | unknown (length); documented (start caps) |
| Rate limits across parallel sessions | Shared with every other Claude and Claude Code use on the account: a 5-hour session window and a weekly window, both on Max. Parallel sessions drain them proportionately faster. No documented cap on how many cloud sessions run at once. | documented |
| Burst throttle when many sessions start together | A separate server throttle ("not your usage limit") exists and is retried automatically since v2.1.199. Users on Max 20x report hitting it at around 4 to 6 concurrent sessions, or when spawning about 10 back to back. | documented (exists); anecdotal (thresholds) |

## 1. Lifecycle of an Anthropic-hosted cloud session

The docs describe two idle stages, which the issue's earlier notes merged into one "idle expiry".

1. **Pause.** "After a few minutes without activity, a session's VM pauses with its files saved. Your next message restores the same VM and starts Claude Code again." The session cannot be paused by hand. [cloud-environments, Set environment variables][ce-env] — documented.
2. **Reclaim.** "A paused VM can later be reclaimed." [cloud-environments, Time limits][ce-time] — documented. "Cloud sessions stop after a period of inactivity and the session's VM is reclaimed." [claude-code-on-the-web, Environment expired][web-expired] — documented.

Neither page gives the pause interval or the reclaim interval.

What counts as inactivity:

- A session counts as inactive while waiting for you to approve an MCP connector tool call or to sign in to an MCP server, and "can expire during that wait." [web-expired] — documented.
- If Claude asks a question and you leave, you can still answer "up to environment expiry, and the session continues from your answer." [claude-code-on-the-web, Send tasks from the CLI][web-cli] — documented.
- Closing the browser tab does not stop a session. It "continues running in the background until Claude finishes the current task, then idles." [web-quickstart, Session keeps running after closing the tab][wq-tab] — documented.
- Since v2.1.239 the remote worker keeps sending keep-alives while a long `SessionStart` or `Setup` hook runs "so the container is not idle-reaped mid-hook." [changelog 2.1.239][cl] — documented. This implies idle detection is driven by worker liveness signals rather than wall-clock alone.
- Whether a still-running **background** subagent or shell counts as activity is not stated for Anthropic-hosted sessions. For self-hosted runners the docs say a session "still mid-turn, including one holding a never-finishing background task ... doesn't count as idle." [self-hosted-environments-reference][sh-ref] — documented, but it applies to self-hosted runners only. On Anthropic-hosted VMs, v2.1.247 "Fixed cloud sessions going silent when the session's container restarts between turns while a background agent, shell, or monitor is still running — the resumed session now reports the lost work." [changelog 2.1.247][cl] — documented. So background work that outlives the main turn can be lost.

## 2. Maximum wall-clock

No page states a maximum session length for Anthropic-hosted cloud sessions. The cloud-environments **Time limits** section lists command timeouts, SessionStart hook timeouts, the setup-script cache budget and idle pausing, and nothing else. [ce-time] — unknown.

Lower bounds from the changelog:

- v2.1.268 (2026-09-10): "Fixed cloud sessions running longer than about six hours silently losing files saved to persisted session folders; saves now persist for up to a day." [cl] — documented. Sessions run past 6 hours by design.
- v2.1.280 (2026-09-22): "Fixed `gh` and GitHub API calls inside a cloud session on a GitHub Enterprise Server repository failing after about eight hours; the token now renews automatically." [cl] — documented. Sessions run past 8 hours by design.

Anecdotal:

- A user kept one Projects thread container busy for over 24 hours. The container stayed up, but its shared folder mount failed with EIO at 24h05m and never recovered. [anthropics/claude-code#99271][i99271] — anecdotal (Projects threads, not plain `--cloud` sessions).
- A third-party guide from October 2025 claims web sessions expire "after 24 hours of continuous use or 8 hours of inactivity". It cites no source and conflicts with the current docs, which pause idle VMs after a few minutes. [cursor-ide.com guide][cursor-ide] — anecdotal, likely outdated; do not rely on it.

Self-hosted runners have an optional wall-clock cap, `--kill-session-after-min` (off by default). From v2.1.260, reaching it releases the session "so it can resume on its user's next message". [sh-ref] — documented (self-hosted only).

Limits inside a session that do bound a long run:

- Foreground Bash: 2 minutes by default, up to 10 minutes. On timeout the command moves to the background instead of stopping. [ce-time] — documented.
- Background commands in a cloud session: 30 minutes by default, up to 2 hours when Claude passes a `timeout`. `BASH_DEFAULT_TIMEOUT_MS` and `BASH_MAX_TIMEOUT_MS` raise these. [tools-reference, Time limit for background commands][tr-bg] — documented.
- `SessionStart` command hooks: cancelled after 600 seconds unless `timeout` is set. [ce-time] — documented.

## 3. What idling kills

| Stage | VM | Working-tree files | Conversation | Running subagents and shell commands | Env vars and setup script |
| - | - | - | - | - | - |
| Pause, then next message | Same VM restored | Kept ("pauses with its files saved") | Kept | Not documented for a pause; Claude Code itself restarts in the VM, so treat in-process work as lost (inferred) | Env vars re-read; setup script does not rerun |
| Reclaim, then reopen | Fresh VM | Lost unless committed and pushed | Restored | "Not restored" | Setup script reruns (or cached snapshot used); env vars re-read |

Sources: [ce-env], [web-expired], [cloud-environments, Environment caching][ce-cache] — documented.

Staff confirmation: in [anthropics/claude-code#77669][i77669], Anthropic collaborator `bcherny` wrote that "cloud sessions stop after a period of inactivity and the environment is reclaimed. Reopening the session provisions a **fresh** environment with your conversation history restored — but not the filesystem," and that "the reliable way to carry work across a wait is to commit and push it to a branch." The same reply notes that nothing in the conversation tells Claude the environment was replaced. — staff-confirmed.

Related bugs that show the resume path is still rough:

- v2.1.216 fixed the in-flight message being dropped when the container restarts mid-turn; "the interrupted turn now re-runs on resume." [cl] — documented.
- After `/clear`, an idle wake-up can resume the pre-`/clear` conversation. The reporter saw a VM recycled after "under ~10 minutes" idle. [anthropics/claude-code#98910][i98910] — anecdotal, open.
- A pending `AskUserQuestion` answered after a long idle can be lost ("Tool permission stream closed before response received"). [anthropics/claude-code#72704][i72704] — anecdotal, closed as stale.

## 4. Does a queued follow-up revive the session?

- `claude -p "<msg>" --cloud <id>` "queues the message into the session and exits without waiting for a reply." [web-cli] — documented.
- Paused VM: "Your next message restores the same VM and starts Claude Code again." [ce-env] — documented. A CLI follow-up is a message, so it revives a paused session with its files intact (inferred from the documented wording, which does not single out the web UI).
- Reclaimed VM: the docs say "Reopen the session from claude.ai/code to provision a fresh VM." [web-expired] — documented. The CLI error table rejects only missing sessions and archived ones (`cloud session <id> is archived and cannot accept new messages`). [claude-code-on-the-web, Errors when sending to a cloud session][web-errors] — documented. It is therefore likely, but not stated, that a CLI follow-up to a reclaimed session is accepted and triggers a fresh VM with conversation only — inferred.
- One user reports that after an auto-archive and an unarchive, the web UI showed the session as ended, yet `claude -p ... --cloud <id> --output-format json` still returned `{"ok":true,...}`; the message was presumably dropped. [anthropics/claude-code#60043, comment of 2026-09-04][i60043] — anecdotal. `ok:true` therefore confirms delivery to the queue, not that the session will act on it.
- Archived sessions cannot be revived by a follow-up. [web-errors] — documented. Users report sessions auto-archiving mid-work with no opt-out (#60043, mostly desktop, one cloud report). — anecdotal.

## 5. Routines

- Routines "run autonomously as full Claude Code cloud sessions." [routines, Create a routine][rt] — documented. The session limits above apply to each run (inferred).
- No run-length limit is published. — unknown.
- Hourly start caps, none with overage: scheduled runs 100 per hour per account (over the limit, the run waits); **Run now**, API fires and one-off re-arms 30 per hour per routine; **Run now** 100 per hour per account; API fires 100 per hour per account. GitHub events have per-routine and per-account hourly caps (no numbers given), and extra events are dropped. [routines, Usage and limits][rt-usage] — documented. The fire endpoint returns `429 rate_limit_error` with `Retry-After`. [routines-fire API][rt-api] — documented.
- The minimum schedule interval is one hour. [routines, Add a schedule trigger][rt-sched] — documented.
- Runs draw down the same subscription usage as interactive sessions; past the subscription limit, extra runs are rejected unless usage credits are on. [rt-usage] — documented.
- A March 2026 report of "Your plan gets 3 daily cloud scheduled sessions" on Max 5x. [anthropics/claude-code#40124][i40124] — anecdotal, predates the current routines limits and is probably outdated.
- A scheduled routine that fired but did not start executing until someone opened its session in a browser. [anthropics/claude-code#88310][i88310] — anecdotal, open.

## 6. Rate limits and concurrency for parallel cloud sessions

Account-level usage:

- "Cloud sessions share rate limits with all other Claude and Claude Code usage within your account. Running multiple tasks in parallel consumes more rate limits proportionately. There is no separate compute charge for the cloud VM." [claude-code-on-the-web, Limitations][web-limits] — documented.
- Max plans: "Your session-based usage limit will reset every five hours," plus "a weekly usage limit that applies across all models," resetting at a fixed weekly time. Max 5x and Max 20x get 5 and 20 times Pro's per-session allowance. [What is the Max plan?][hc-max] — documented.
- Usage counts against the 5-hour and weekly allowances at once, and "a single burst of heavy activity, such as a large workflow fanout, can exhaust the weekly allowance before the session window resets." [errors, You've hit your session limit][err-limit] — documented.
- Projects threads that hit the 5-hour or weekly limit retry on their own and continue when it resets. [claude-projects, A thread hit the usage limit][proj-limit] — documented. Plain `--cloud` sessions are not documented to do the same.

Concurrent session count:

- No documented cap on how many cloud sessions an account can run at once. The docs show starting several with repeated `claude --cloud` calls that "all run simultaneously in separate sessions." [web-cli] — documented (no cap stated).
- A separate short-lived server throttle, `Server is temporarily limiting requests (not your usage limit)`, is "unrelated to your plan quota" and has been retried automatically with backoff since v2.1.199. [errors, Server is temporarily limiting requests][err-throttle] — documented.
- Users on Max 20x report this throttle at around 5 to 6 concurrent instances, and when spawning about 10 sessions back to back right after a reset (the first 3 or 4 succeed). Staggering starts by a few seconds helped them. [anthropics/claude-code#53922][i53922], [#62426][i62426] — anecdotal; both are local sessions, not cloud ones, and both closed as stale.
- One user ran 10 to 15 concurrent web sessions. [#72704][i72704] — anecdotal.

Concurrency inside one cloud session (relevant to pstack fan-outs):

- At most 20 subagents running at once per session by default (`Concurrent subagent limit reached`); `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` changes it. [sub-agents, Concurrent subagent limit][sa-limit] — documented.
- Dynamic workflows run up to 16 agents at once, "fewer when Claude Code has fewer CPUs available, including inside a CPU-limited container"; `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` (1 to 256, v2.1.269+) overrides it. [workflows][wf] — documented. On the 4-vCPU cloud VM a user measured the default as 2, from `min(16, max(2, cores - 2))` in the binary. [anthropics/claude-code#79561][i79561] — anecdotal; the override is now documented.
- `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY` caps read-only tools and subagents executing in parallel (default 10). [env-vars][env] — documented.

## 7. What this means for the port

- Only commits pushed to a branch survive a reclaim. A long pstack run in a cloud session should commit and push at each phase boundary, and on resume it should check whether the working tree is a fresh clone. Claude is not told the environment was replaced.
- Background subagents that outlive the main turn can be lost when the container restarts between turns. A run that fans out should keep the main turn open (foreground or awaited) until its subagents report, rather than end the turn and wait to be woken.
- No wall-clock cap is published and sessions are known to run past 8 hours, so the binding limits for a run are usage (5-hour and weekly windows) and the 30-minute / 2-hour background-command limit, not session length.
- Parallel cloud sessions are bounded by shared account usage and a burst throttle, not a session count. Starting sessions a few seconds apart is the reported mitigation.
- In-session fan-out on a cloud VM defaults to a small workflow concurrency (anecdotally 2). Set `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` in the cloud environment if the port uses workflows.

## Still unknown (candidates for a hands-on task ticket)

1. The pause interval and the reclaim interval for Anthropic-hosted VMs. Reports range from about 2 minutes (pause) to under 10 minutes or several days (reclaim).
2. Whether a running background subagent, `run_in_background` shell, or Monitor holds the VM awake once the main turn has ended.
3. Whether `claude -p "<msg>" --cloud <id>` to a **reclaimed** session provisions a fresh VM and acts on the message, or only queues it until someone opens claude.ai/code.
4. Any hard wall-clock cap above 8 hours, and how long a paused VM is kept before reclaim.
5. Whether plain `--cloud` sessions (not Projects threads) wait and continue after a usage limit resets, as Projects threads do.
6. The burst-throttle threshold for starting several cloud sessions at once on Max, and whether it differs from local sessions.
7. Whether routine runs have a run-length limit of their own.

A hands-on test would need: a throwaway repo, a cloud session that starts a 20-minute background `sleep` subagent and ends its turn, timed `claude -p --cloud` probes at increasing idle gaps, and a file written to the working tree (not pushed) to detect a reclaim.

## Method notes

- Context7 was not usable in this session (its tools required authentication), so the official docs were read directly from their Markdown sources on code.claude.com and with WebFetch.
- GitHub issues were searched in `anthropics/claude-code` with the `area:claude-code-web` label. Only #77669 had a staff answer on these topics.

## Sources

[ce-env]: https://code.claude.com/docs/en/cloud-environments#set-environment-variables
[ce-time]: https://code.claude.com/docs/en/cloud-environments#time-limits
[ce-cache]: https://code.claude.com/docs/en/cloud-environments#environment-caching
[web-cli]: https://code.claude.com/docs/en/claude-code-on-the-web#send-follow-ups-from-the-cli
[web-expired]: https://code.claude.com/docs/en/claude-code-on-the-web#environment-expired
[web-errors]: https://code.claude.com/docs/en/claude-code-on-the-web#errors-when-sending-to-a-cloud-session
[web-limits]: https://code.claude.com/docs/en/claude-code-on-the-web#limitations
[wq-tab]: https://code.claude.com/docs/en/web-quickstart#session-keeps-running-after-closing-the-tab
[tr-bg]: https://code.claude.com/docs/en/tools-reference#time-limit-for-background-commands
[sh-ref]: https://code.claude.com/docs/en/self-hosted-environments-reference#runner-cli-flags
[cl]: https://code.claude.com/docs/en/changelog
[rt]: https://code.claude.com/docs/en/routines#create-a-routine
[rt-sched]: https://code.claude.com/docs/en/routines#add-a-schedule-trigger
[rt-usage]: https://code.claude.com/docs/en/routines#usage-and-limits
[rt-api]: https://platform.claude.com/docs/en/api/claude-code/routines-fire
[hc-max]: https://support.claude.com/en/articles/11049741-what-is-the-max-plan
[err-limit]: https://code.claude.com/docs/en/errors#youve-hit-your-session-limit
[err-throttle]: https://code.claude.com/docs/en/errors#server-is-temporarily-limiting-requests
[proj-limit]: https://code.claude.com/docs/en/claude-projects#usage-limit-reached
[sa-limit]: https://code.claude.com/docs/en/sub-agents#concurrent-subagent-limit
[wf]: https://code.claude.com/docs/en/workflows
[env]: https://code.claude.com/docs/en/env-vars
[i77669]: https://github.com/anthropics/claude-code/issues/77669
[i98910]: https://github.com/anthropics/claude-code/issues/98910
[i72704]: https://github.com/anthropics/claude-code/issues/72704
[i60043]: https://github.com/anthropics/claude-code/issues/60043
[i99271]: https://github.com/anthropics/claude-code/issues/99271
[i40124]: https://github.com/anthropics/claude-code/issues/40124
[i88310]: https://github.com/anthropics/claude-code/issues/88310
[i53922]: https://github.com/anthropics/claude-code/issues/53922
[i62426]: https://github.com/anthropics/claude-code/issues/62426
[i79561]: https://github.com/anthropics/claude-code/issues/79561
[cursor-ide]: https://www.cursor-ide.com/blog/claude-code-on-the-web

| Ref | URL | Kind |
| - | - | - |
| cloud-environments | https://code.claude.com/docs/en/cloud-environments | official docs |
| claude-code-on-the-web | https://code.claude.com/docs/en/claude-code-on-the-web | official docs |
| web-quickstart | https://code.claude.com/docs/en/web-quickstart | official docs |
| tools-reference | https://code.claude.com/docs/en/tools-reference | official docs |
| self-hosted-environments-reference | https://code.claude.com/docs/en/self-hosted-environments-reference | official docs |
| changelog (v2.1.216, 2.1.239, 2.1.247, 2.1.268, 2.1.280) | https://code.claude.com/docs/en/changelog | official changelog |
| routines | https://code.claude.com/docs/en/routines | official docs |
| routines fire API | https://platform.claude.com/docs/en/api/claude-code/routines-fire | official docs |
| errors | https://code.claude.com/docs/en/errors | official docs |
| claude-projects | https://code.claude.com/docs/en/claude-projects | official docs |
| sub-agents | https://code.claude.com/docs/en/sub-agents | official docs |
| workflows | https://code.claude.com/docs/en/workflows | official docs |
| env-vars | https://code.claude.com/docs/en/env-vars | official docs |
| What is the Max plan? | https://support.claude.com/en/articles/11049741-what-is-the-max-plan | help center |
| #77669 | https://github.com/anthropics/claude-code/issues/77669 | staff answer (bcherny) |
| #98910, #72704, #60043, #99271, #40124, #88310, #53922, #62426, #79561 | see links above | user reports |
| cursor-ide.com guide | https://www.cursor-ide.com/blog/claude-code-on-the-web | third-party, uncited |
