# Cloud session prompt

Paste everything below the line as the first message of the cloud session. Replace `<RUN>` with `run1` or `run2`.

---

This is a probe for the claude-pstack ticket "Does a cloud environment setup script that installs the port into ~/.claude load it as user skills and agents?". Work through the steps in order and record every answer verbatim. Don't fix anything you find broken; just report it.

**Step 1: answer from your context only, before running any tool.**
- (a) Is a skill named `probe-user-skill` in your available skills list? Is `probe-plugin-skill` (any namespace)? Quote the list entries if present.
- (b) Is `probe-user-agent` among the agent types you can spawn? Quote the entry if present.
- (c) Does your context hold a token starting `PROBE-CLAUDEMD-`? Quote it, and say where in your context it appears.
- (d) Does your context hold a token starting `PROBE-HOOK-`? Quote it.

**Step 2: invoke.**
- Call the Skill tool with `probe-user-skill`, then with `probe-plugin-skill` (try `probe-plugin:probe-plugin-skill` if the bare name fails). Record each result or error.
- Spawn the Agent tool with subagent type `probe-user-agent` and prompt "run the pstack user-agent probe". Record its reply or error.

**Step 3: inspect the VM.** Run each command and record its output:
```
id; echo "HOME=$HOME"; echo "CLAUDE_CONFIG_DIR=${CLAUDE_CONFIG_DIR:-<unset>}"; claude --version
cat /var/log/pstack-probe-setup.log
cat "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/pstack-probe-stamp"
cat /tmp/pstack-probe-sessionstart.log
ls -la "${CLAUDE_CONFIG_DIR:-$HOME/.claude}" "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills" "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/agents"
cat "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json"
claude plugin list
git -C /opt/pstack-probe log --oneline -3
git ls-remote https://github.com/janrizmlibres/claude-pstack.git refs/heads/probe/cloud-user-config
```

**Step 4: report.** Write all answers and outputs to `probe/cloud-user-config/findings-<RUN>.md`, commit it on a new branch `probe/cloud-user-config-<RUN>`, and push that branch to origin. Reply with the branch name when done.
