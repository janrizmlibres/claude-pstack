# Session-tools permission probe: findings

Question: how does a cloud lead get `mcp__claude-code-remote__create_session` / `send_message` pre-approved, so that fan-out runs with nobody clicking?

Run 2026-10-07, 02:06–02:40Z, Claude Code 2.1.292, Max account, environment "Mira". Six lead sessions, each started with `claude --cloud` from a probe branch. The leads followed `LEAD.md` (in this directory) and pushed a log before and after every remote-tool call, so a stall shows as an `ABOUT TO CALL` line with nothing after it. A human watched the claude.ai UI and clicked only where the arm called for it.

## Answer

**Only Auto mode works.** A lead started with `claude --cloud --permission-mode auto` called `create_session` and `send_message` with no prompt. Its child inherited Auto and called `send_message` with no prompt too. Every settings-based route failed: the prompt for these tools comes from claude.ai, and the session's permission rules don't reach it.

## Arms

| Arm | Launch | Project `.claude/settings.json` | `create_session` in the lead |
|---|---|---|---|
| C (control) | `claude --cloud` | allow Bash/Read/Write/Edit only | **prompted** (stalled from 02:07:46) |
| B1 | `claude --cloud … --allowedTools <4 remote tools>` | as C | **prompted** (stalled from 02:08:05). Mode `default` |
| B2 | `claude --cloud … --permission-mode auto` | as C | **ran, no prompt** (02:16:48 → 02:16:49). Mode `auto` |
| D | `claude --cloud` | allow 11 remote tools + `defaultMode: "dontAsk"` | **prompted** (asked twice: its worker restarted). Init reports `default`, not `dontAsk` |
| A | `claude --cloud` | allow 11 remote tools | **prompted** (02:12:22 → 02:14:19, waited for a click) |
| E | `claude --cloud` (after A's "Always allow") | as C | **prompted** (stalled from 02:33:27) |

## Findings

1. **Project allow rules don't stop the prompt.** Arm A's log shows `.claude/settings.json` with `mcp__claude-code-remote__create_session` in `permissions.allow`, yet the call raised claude.ai's "Allow Claude to use create session (claude-code-remote)?" dialog. The VM sets `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST`. Inferred: claude.ai owns the decision for these tools.
2. **`defaultMode` from project settings is ignored in cloud.** Arm D's init reports `permissionMode: "default"` with `"dontAsk"` committed. The docs say cloud honours only `acceptEdits` from settings, and that bypass is unavailable.
3. **`--allowedTools` doesn't reach the cloud session.** Arm B1 stalled exactly like the control.
4. **`--permission-mode auto` does reach it.** Arm B2's init, `get_session` (`permission_mode: PERMISSION_MODE_AUTO`) and a `set_permission_mode {mode: auto}` control request at session start all agree. None of its remote-tool calls raised a `can_use_tool`. Inferred from the empty control-request list: the classifier didn't stop any of them.
5. **A child inherits Auto, and in Auto it calls the tools freely.** B2's child X (created with `extra_allowed_tools`, no `permission_mode`) ran in `auto`, sent `send_message` to `@parent` 13 s after creation, and answered the lead's ping with no prompt. `permission_denials: []`.
6. **claude.ai "Always allow" is per session and per tool, and nothing inherits it.**
   - In the session where it was clicked, later calls of that tool ran without a prompt (A's second `create_session`: 10 s).
   - A child created with `extra_allowed_tools` holding a tool the lead had "Always allow"ed still prompted. Child Z prompted for `send_message` after the human clicked "Always allow" for `send_message` in A. So "Always allow" doesn't count as the pre-approval that `extra_allowed_tools` passes down.
   - A fresh session (E) prompted for `create_session` after A had "Always allow"ed it.
   - A prompt already pending in another session (C) wasn't released.
7. **Without a lead-side grant, `extra_allowed_tools` is dropped, as documented.** A's child X (grant listed, while the lead held only an "Allow once" for `send_message`) and child Y (no grant) both blocked on `send_message` the same way.
8. **A session fired by a Routine runs in Auto but can't fan out.** Arm A's `create_trigger` (`create_new_session_on_fire: true`) + `fire_trigger` produced a session in `auto`, with no repo, on Sonnet rather than the lead's model, and with **no `claude-code-remote` tools at all**. `create_trigger` warned that the Routine stores no connectors.
9. **A lead can see a child's stall but can't clear it.** `get_session` on a blocked session reads `SESSION_STATUS_REQUIRES_ACTION` / `BLOCKED` with `needs_action: "Approve or deny mcp__claude-code-remote__send_message"`. A lead also can't tell whether its *own* remote-tool calls prompted: A logged every one of them as "no prompt", even the two that waited on a click.

## Costs of Auto that a port must design around

- **The classifier refuses pushes to any branch but the session's designated `claude/…` branch** (`[Auto-Mode Bypass]`). B2's pushes to `probe/perms-b2-out` were refused. Its pushes to `claude/perms-probe-arm-b2-oobf3b` went through. Not tested: whether a child's `outcome_branch` counts as designated.
- **It refuses credential-adjacent reads.** An env dump got `[Credential Leakage]` and reading `~/.claude/settings.json` got `[Sensitive-Source Provenance]`.
- **Three consecutive refusals escalate to a human prompt.** The decision reason is "3 consecutive actions were blocked. Please review the transcript before continuing." That is a stall in an unattended tree. Worker prompts must avoid actions the classifier refuses, or a refused action stops the worker.
- **Allow rules don't skip the classifier in Auto.** Bash was allowed in settings, yet each Bash call was still checked (11–21 s per call).
- **Availability:** Auto appears only when the organisation allows it and the model supports it (docs). It was available on this Max account.

## Not tested

- **A session started from the claude.ai UI with Auto picked in the mode dropdown.** Inferred to match B2, since the dropdown offers Auto for cloud sessions (docs) and B2 shows the mode itself is what matters.
- **A user-level `~/.claude/settings.json` written by the environment setup script.** Project-level rules were ignored for these tools, so user-level rules are inferred to be ignored too, but the setup script is cached and can only be edited in the claude.ai UI.
- **`permission_mode: "auto"` passed explicitly to `create_session`.** It inherits Auto when omitted.
- **Deeper nesting under Auto than depth 1.**

## Incident

`LEAD.md` v1's env filter redacted by value, not by variable name, so arms C, D and B1 pushed `CLAUDE_CODE_MESSAGING_TOKEN`'s value to this public repo. The C and D log branches were deleted, D rebuilt its history without the value, and B1 amended and force-pushed. The current `LEAD.md` logs variable names only. Commits orphaned by these rewrites may still be reachable on GitHub by SHA, so archive sessions C, D and B1, which should end their tokens.

## Evidence

- Lead logs: `probe/perms-a-out` (A, steps 1–11), `claude/perms-probe-arm-b2-oobf3b` (B2, incl. exact block reasons), `probe/perms-b1-out`, `probe/perms-d-out`, `probe/perms-e-out`. C's log branch was deleted (token leak), and C's stall is confirmed by A's read of it and the screenshot.
- Probe branches: `probe/perms-none`, `probe/perms-allow`, `probe/perms-dontask`.
- Sessions: A `session_01HkRZDPY6n5Pgc5xfvQ15FP`, B1 `session_01JkZGetHpiGugT7Pqb9yn9i`, B2 `session_01SSGvGDAT5TguMNJVMcorvH`, C `session_018hFvmkPry3fB2RJZ4sAwF7`, D `session_01QGEo9uoTUYPW5u7UfhL6p7`, E `session_016mvTQWPCTMZA1bgmLkRqP8`; children A-X `session_01BAPuiRRt26Mo5KrdkwkTvY`, A-Y `session_01Ktc2jZExc1KPvpa7mpUQee`, A-Z, B2-X `session_01Hfj5VGEYHuw25JF8W33psA`. All are safe to archive.
