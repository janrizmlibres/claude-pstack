# Remote Control first-contact probe: findings

Question: can a cloud lead send a done message to the local entry point, with nobody watching either side?

Run 2026-10-07, 12:00–12:35Z, Claude Code 2.1.292 locally and in the cloud, Max account, environment "Mira". Two cloud leads, both started with `claude --permission-mode auto --cloud "<prompt>"` from this branch, and twelve local sessions on Remote Control, each in a detached tmux pane nobody watched. The leads' auto classifier refused to push a log to this public repo, so the lead side is recorded from each lead's final message, read in the claude.ai UI. The local side is recorded from the local transcripts and tmux panes.

## Answer

**No. In 2.1.292 a cloud session can't message a local session at all, whether as first contact or as a reply.** It can't see local sessions to address them, and when it holds a valid reply address its send is refused with an auth error. Messages travel one way only, local → cloud. A done status from a cloud lead has to come back some other way (a pushed branch, a PR or issue comment, or the local side polling).

## Run 1: first contact (lead `session_01KnAo9FfvBHZxxprKxKGTj6`)

Six local receivers started first, none of which ever messaged the lead: `rcp-default` (Auto), `rcp-bypass` (`bypassPermissions`), `rcp-bypass-accept` (bypass + `crossSessionInbound: "accept"`), `rcp-isolate` (`isolatePeerMachines: true`), `rcp-print` (`claude -p --remote-control`), and `rcp-offline` (started, then `/exit`ed before the send).

1. **The cloud session sees no other session.** Its `ListAgents` returned: "No reachable agents — no other Claude session is running on this machine right now (peer messaging itself is available; a session appears here once it is started)." Its own name was `claude-pstack-47 [8c293e]`. It lists only its own VM and has no Remote Control view of local or cloud sessions.
2. **Sending by name fails before it leaves.** All six `SendMessage` calls returned at once with `{"success":false,"message":"No agent named 'rcp-default' is reachable.\nUse ListAgents to see everyone you can message."}` (the same for each name), with no `[ref]` to retry.
3. **No receiver got anything.** No local transcript gained an entry after startup, and no pane showed a held-message dialog.

## Run 2: reply address (lead `session_01XsZ8nsCiGddwsYZyCNeHwC`, "rcp reply lead")

Six local senders, each launched with a prompt to `SendMessage` the lead once and then idle: `rcp-h-default`, `rcp-h-bypass`, `rcp-h-accept`, `rcp-h-isolate`, `rcp-h-print`, `rcp-h-offline` (the last one `/exit`ed right after its send). The lead was told to reply at once to every inbound message's `from` address.

4. **Local → cloud works, and the tool itself says it is one-way.** Local sessions on Remote Control list the cloud lead (`rcp reply lead [bf70ba]`) and `SendMessage` it by name. Every successful send returned: `{"success":true,"message":"… → rcp reply lead (a Claude session running in the cloud; not confirmed read — that session may hold it (usually a different permission mode) or refuse it, and this route reports nothing back; one-way for now: a cloud session cannot message other sessions back yet — do not ask it to reply here; its response appears in its own transcript at claude.ai/code)", …}`. The `ListAgents` tool description in 2.1.292 says the same.
5. **The reply address exists but is refused.** Messages arrived with `from` = `bridge:session_<the sender's Remote Control session id>`. The lead's `SendMessage` to that exact address returned: `{"success":false,"message":"Failed to send to bridge:session_01UDCrDkJF6pm9KU6HWUKv6b: auth: this cloud session cannot message other sessions yet — its credential is accepted for its own work but not for delivering to another session, so a reply from here is not possible; say so in your response instead of retrying"}`. The same happened for `rcp-h-offline`. No ack reached any local transcript.
6. **Bypass senders' messages didn't reach the Auto lead.** The lead received only the sends from `rcp-h-default` (Auto) and `rcp-h-offline` (Auto). The sends from `rcp-h-bypass` and `rcp-h-accept` (both `bypassPermissions`) reported success but never appeared. Inferred: the documented default held them, since a prompting receiver holds messages from a bypassing sender. `crossSessionInbound: "accept"` on the sender doesn't change that, because it governs inbound only.
7. **`isolatePeerMachines` stalls an unattended sender.** `rcp-h-isolate`'s send raised "isolatePeerMachines is enabled — cross-machine message requires explicit approval" in the terminal, mirrored in claude.ai as "Allow Claude to use SendMessage?". Nobody approved it, so it never went out.
8. **`claude -p --remote-control` doesn't connect to Remote Control.** `-p` accepts the flag silently, but `rcp-h-print`'s `ListAgents` listed only same-machine sessions, with no cloud rows, and its send failed with `No agent named 'session_01XsZ8nsCiGddwsYZyCNeHwC' is reachable.` Neither `-p` session appeared in the claude.ai session list, while every interactive one did.

## Smaller facts

- **Auto mode doesn't prompt for `SendMessage` in the cloud.** Every lead-side call returned immediately. All of them failed (name resolution or auth), so whether a successful send would be classified is untested.
- **The classifier refuses logs of session or environment details pushed to a public repo** ("Credential Exploration", then "Data Exfiltration"), even when the log holds variable names only.
- Run 1's lead ran on Opus 4.8 at medium effort, not on the launching CLI's model.
- Run 1's VM paused while idle: after ~16 min its `boot_id` had changed and uptime read 20 s.

## Not tested (moot while cloud → local is refused)

- Whether a reply address stays valid for hours and across VM pauses.
- Delivery to a local session that is offline at send time.
- How an unwatched local receiver treats a cloud reply under each inbound setting.

## Evidence

- Leads: run 1 `session_01KnAo9FfvBHZxxprKxKGTj6`, run 2 `session_01XsZ8nsCiGddwsYZyCNeHwC`. Their final messages hold the logs. Nothing was pushed from either.
- Local Remote Control sessions (run 2): `rcp-h-default` `session_01UDCrDkJF6pm9KU6HWUKv6b`, `rcp-h-offline` `session_01EwVbh1UVdC6kRhszpDU71u`, `rcp-h-isolate` `session_012h4AFAUCYomwaZjcFtWQom`, `rcp-h-accept` `session_01Nf2USig1FEnAC3agqB5vkz`.
- Local Remote Control sessions (run 1): `rcp-default` `session_01LSpU8AZbTr7fqpFNAPSdpR`, `rcp-bypass` `session_014Wzmv2B96bHGjh44kwZQN8`, `rcp-bypass-accept` `session_01QcCEZDDFJPThy8ii6xid6F`, `rcp-isolate` `session_01JBEgmeLdHQDBJ5DXQiSTg6`, `rcp-offline` `session_0131EkUPudh18VdXcYEJACKU`, `rcp-observer` `session_01DERCzprGpe2NM2YkL6X229`.
- All of these sessions are safe to archive.
- Brief: `LEAD.md` in this directory. Run 1 followed it with the environment capture and pushes dropped. Run 2's instructions were its launch prompt.
