# Remote Control first-contact probe: lead instructions

You are the cloud lead of a probe. Nobody is watching this session. If a tool call waits on a permission prompt, nobody will approve it. That is an expected outcome, and the log line you pushed before the call is how the outcome gets observed. So follow the push discipline below exactly.

**Goal:** find out whether a cloud session can send the **first** cross-session message to a local session that is connected to Remote Control and has never messaged it, and what happens to that message.

Do not change any settings file or permission mode. Do not open a PR. Do not create sessions. Record facts, not guesses. Mark anything inferred as inferred.

**This repo is public.** Never write the value of any token, secret, key or credential to the log. Log environment variable names only. From any `ListAgents` output, copy only this session's own-name line and rows whose name starts with `rcp-`. For every other row, log only its kind and status, never its name, title or directory.

## Push discipline

Keep one log file, `spikes/rc-first-contact/out-<RUN>.md`, where `<RUN>` comes from your launch prompt. After **every** numbered step below, and **immediately before** every `SendMessage` call, append a line to it, commit, and push to the branch this session is on:

```
git add -A && git commit -qm "rcp probe <RUN>: <step>" && git push -q origin HEAD
```

The line before a send reads `ABOUT TO SEND to <target> at <UTC time>`. The line after reads `RETURNED <target> at <UTC time>:` followed by the tool result verbatim in a fenced block.

## Inbound messages

At any point, if a cross-session message arrives in this session (it is wrapped as `<cross-session-message from="...">`), append `INBOUND at <UTC time> from <from attribute>:` and the message text in a fenced block to the log. Commit and push. **Do not reply to it.** If it started a new turn, end that turn after pushing.

## Phase 1 (your launch prompt says `PHASE 1` and lists `TARGETS`)

1. **Environment.** Run and log: `date -u +%FT%TZ`, `cat /proc/sys/kernel/random/boot_id`, `cat /proc/uptime`, `claude --version`, `git branch --show-current`, `git log --oneline -1`, `cat .claude/settings.json` (it may be absent), `cat ~/.claude/settings.json 2>/dev/null | grep -iE 'crossSession|isolatePeer|dialogExpiry|remoteControl'`, `env | grep -iE '^[^=]*(messaging|remote|session|permission)' | sed 's/=.*/=<value omitted>/'` (names only).
2. **Own mode and tools.** Run `ToolSearch` with query `select:ListAgents,SendMessage` (they may already be loaded). Log whether each is available. Run `ToolSearch` with query `+claude-code-remote get_session`, call `get_session {}` with no id, and log your session id, title and `permission_mode`.
3. **List.** Call `ListAgents`. Log this session's own-name line and every `rcp-` row verbatim, plus the counts of other rows by kind and status (see the public-repo rule above).
4. **Send first.** For each name in `TARGETS`, in order: push the `ABOUT TO SEND` line, then call `SendMessage` with `to` = the bare name and this `message` (fill in the brackets):

   ```
   rcp probe: first contact from the cloud lead to <target> at <UTC time>.
   Reply to this message with the single word ack. Do nothing else.
   ```

   Then push the `RETURNED` line. If `to` fails because the name is ambiguous or unknown, log the error verbatim and retry once with the `[ref]` the listing or error shows. Don't try any other route.
5. **Wait for replies.** Run in Bash: `sleep 90`. If foreground sleep is blocked, use `Monitor` with an until-loop that exits after 90 s. Then log every inbound message so far (see above), or `NO INBOUND` if none.
6. **Summary.** Append `## Phase 1 summary`: for each target, whether it was listed and with what status, what `SendMessage` returned, and whether an `ack` came back. Also note whether any call seemed to wait on a prompt (long gap between `ABOUT TO SEND` and `RETURNED`). Commit, push, and end your turn.

## Phase 2 (a later message says `PHASE 2` and lists `TARGETS`)

Repeat steps 1, 3, 4 and 5 with the new targets. In step 4 write `second contact` instead of `first contact`. Then append `## Phase 2 summary` the same way as step 6, adding whether `boot_id` and uptime show that the VM restarted since phase 1. Commit, push, and end your turn.
