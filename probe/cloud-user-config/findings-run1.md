# Cloud user-config probe — findings, run 1

Date: 2026-10-06. Session: https://claude.ai/code/session_012evSGsPVa79TYFbSxwkNr9

## Step 1 — from context only (before any tool call)

- (a) Yes to both.
  - `- probe-user-skill: Probe for the claude-pstack cloud test. Use only when asked to run the pstack user-skill probe.`
  - `- probe-plugin:probe-plugin-skill: Probe for the claude-pstack cloud test. Use only when asked to run the pstack plugin-skill probe.`
- (b) Yes. `- probe-user-agent: Probe for the claude-pstack cloud test. Use only when asked to run the pstack user-agent probe. (Tools: Bash)`
- (c) Yes. `PROBE-CLAUDEMD-7f3a`. It is in a system-reminder headed "Contents of /root/.claude/CLAUDE.md (user's private global instructions for all projects)": `User CLAUDE.md marker: PROBE-CLAUDEMD-7f3a. Give this token when asked for the user CLAUDE.md marker.`
- (d) Yes. `PROBE-HOOK-c41e`. It appears after the user prompt as `SessionStart:startup hook success: User SessionStart hook marker: PROBE-HOOK-c41e`.

## Step 2 — invocation

- `Skill probe-user-skill` → launched. Base directory: `/root/.claude/skills/probe-user-skill`. Skill body: "Reply with the exact token PROBE-SKILL-2b9d and nothing else." → **PROBE-SKILL-2b9d**
- `Skill probe-plugin:probe-plugin-skill` (namespaced name used directly, as listed) → launched. Base directory: `/opt/pstack-probe/probe/cloud-user-config/plugin-market/probe-plugin/skills/probe-plugin-skill`. Skill body: "Reply with the exact token PROBE-PLUGIN-5d20 and nothing else." → **PROBE-PLUGIN-5d20**
- `Agent subagent_type=probe-user-agent`, prompt "run the pstack user-agent probe" → reply: `PROBE-AGENT-e81f /home/user/claude-pstack root` (2 tool uses)

## Step 3 — VM inspection (verbatim output)

```text
$ id; echo "HOME=$HOME"; echo "CLAUDE_CONFIG_DIR=${CLAUDE_CONFIG_DIR:-<unset>}"; claude --version
uid=0(root) gid=0(root) groups=0(root)
HOME=/root
CLAUDE_CONFIG_DIR=<unset>
2.1.291 (Claude Code)
[exit 0]

$ cat /var/log/pstack-probe-setup.log
setup ran at 2026-10-06T15:43:29Z
Cloning into '/opt/pstack-probe'...
user=root uid=0 HOME=/root CLAUDE_CONFIG_DIR=<unset> DEST=/root/.claude
probe commit=63815dae95e9275390cda65e07356b8c269a12ad stamp=run-1
claude on PATH: /opt/node22/bin/claude 2.1.291 (Claude Code)
other .claude dirs: /home/claude/.claude /root/.claude 
--- /root/.claude before install
total 60
drwxr-xr-x  4 root root  4096 Oct  6 15:43 .
drwx------ 13 root root  4096 Oct  6 15:43 ..
drwxr-xr-x  2 root root  4096 Oct  6 15:43 environment-manager
-rw-------  1 root root   442 Oct  6 15:43 launcher-settings.json
drwxr-xr-x  3 root root  4096 Oct  6 15:43 skills
-rwxr-xr-x  1 root root  6395 Oct  6 15:43 stop-hook-git-check.sh
-rwxr-xr-x  1 root root 25556 Oct  6 15:43 stop-hook-reply-gate.py
-rwxr-xr-x  1 root root  3630 Oct  6 15:43 user-prompt-submit-reply-reminder.py
--- plugin arm
Adding marketplace…√ Successfully added marketplace: pstack-probe-market (declared in user settings)
marketplace add exit 0
Installing plugin "probe-plugin@pstack-probe-market"...√ Successfully installed plugin: probe-plugin@pstack-probe-market (scope: user)
plugin install exit 0
--- /root/.claude after install
/root/.claude:
total 88
drwxr-xr-x  8 root root  4096 Oct  6 15:43 .
drwx------ 13 root root  4096 Oct  6 15:43 ..
-rw-r--r--  1 root root   131 Oct  6 15:43 CLAUDE.md
drwxr-xr-x  2 root root  4096 Oct  6 15:43 agents
drwxr-xr-x  2 root root  4096 Oct  6 15:43 backups
drwxr-xr-x  2 root root  4096 Oct  6 15:43 environment-manager
drwxr-xr-x  2 root root  4096 Oct  6 15:43 hooks
-rw-------  1 root root   442 Oct  6 15:43 launcher-settings.json
drwxr-xr-x  4 root root  4096 Oct  6 15:43 plugins
-rw-r--r--  1 root root    90 Oct  6 15:43 pstack-probe-stamp
-rw-r--r--  1 root root   542 Oct  6 15:43 settings.json
drwxr-xr-x  4 root root  4096 Oct  6 15:43 skills
-rwxr-xr-x  1 root root  6395 Oct  6 15:43 stop-hook-git-check.sh
-rwxr-xr-x  1 root root 25556 Oct  6 15:43 stop-hook-reply-gate.py
-rwxr-xr-x  1 root root  3630 Oct  6 15:43 user-prompt-submit-reply-reminder.py

/root/.claude/agents:
total 12
drwxr-xr-x 2 root root 4096 Oct  6 15:43 .
drwxr-xr-x 8 root root 4096 Oct  6 15:43 ..
-rw-r--r-- 1 root root  264 Oct  6 15:43 probe-user-agent.md

/root/.claude/skills:
total 16
drwxr-xr-x 4 root root 4096 Oct  6 15:43 .
drwxr-xr-x 8 root root 4096 Oct  6 15:43 ..
drwxr-xr-x 2 root root 4096 Oct  6 15:43 probe-user-skill
drwxr-xr-x 2 root root 4096 Oct  6 15:43 session-start-hook
install done at 2026-10-06T15:43:30Z
[exit 0]

$ cat "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/pstack-probe-stamp"
setup commit=63815dae95e9275390cda65e07356b8c269a12ad stamp=run-1 at=2026-10-06T15:43:29Z
[exit 0]

$ cat /tmp/pstack-probe-sessionstart.log
hook ran at 2026-10-06T15:43:31Z as root
Already up to date.
after pull: commit=63815dae95e9275390cda65e07356b8c269a12ad stamp=run-1
[exit 0]

$ ls -la "${CLAUDE_CONFIG_DIR:-$HOME/.claude}" "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills" "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/agents"
/root/.claude:
total 108
drwxr-xr-x 12 root root  4096 Oct  6 15:43 .
drwx------ 16 root root  4096 Oct  6 15:43 ..
-rw-r--r--  1 root root    24 Oct  6 15:43 .last-cleanup
-rw-r--r--  1 root root   131 Oct  6 15:43 CLAUDE.md
drwxr-xr-x  2 root root  4096 Oct  6 15:43 agents
drwxr-xr-x  2 root root  4096 Oct  6 15:43 backups
drwxr-xr-x  2 root root  4096 Oct  6 15:43 environment-manager
drwxr-xr-x  2 root root  4096 Oct  6 15:43 hooks
-rw-------  1 root root   442 Oct  6 15:43 launcher-settings.json
drwxr-xr-x  5 root root  4096 Oct  6 15:43 plugins
drwx------  3 root root  4096 Oct  6 15:43 projects
-rw-r--r--  1 root root    90 Oct  6 15:43 pstack-probe-stamp
drwxr-xr-x  3 root root  4096 Oct  6 15:43 session-env
drwx------  2 root root  4096 Oct  6 15:43 sessions
-rw-r--r--  1 root root   542 Oct  6 15:43 settings.json
drwxr-xr-x  2 root root  4096 Oct  6 15:43 shell-snapshots
drwxr-xr-x  5 root root  4096 Oct  6 15:43 skills
-rwxr-xr-x  1 root root  6395 Oct  6 15:43 stop-hook-git-check.sh
-rwxr-xr-x  1 root root 25556 Oct  6 15:43 stop-hook-reply-gate.py
-rwxr-xr-x  1 root root  3630 Oct  6 15:43 user-prompt-submit-reply-reminder.py

/root/.claude/agents:
total 12
drwxr-xr-x  2 root root 4096 Oct  6 15:43 .
drwxr-xr-x 12 root root 4096 Oct  6 15:43 ..
-rw-r--r--  1 root root  264 Oct  6 15:43 probe-user-agent.md

/root/.claude/skills:
total 20
drwxr-xr-x  5 root root 4096 Oct  6 15:43 .
drwxr-xr-x 12 root root 4096 Oct  6 15:43 ..
drwxr-xr-x  2 root root 4096 Oct  6 15:43 probe-user-skill
drwxr-xr-x  2 root root 4096 Oct  6 15:43 session-start-hook
drwxr-xr-x  3 root root 4096 Oct  6 15:43 synced
[exit 0]

$ cat "${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json"
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash \"${CLAUDE_CONFIG_DIR:-$HOME/.claude}/hooks/session-start.sh\"",
            "timeout": 60
          }
        ]
      }
    ]
  },
  "extraKnownMarketplaces": {
    "pstack-probe-market": {
      "source": {
        "source": "directory",
        "path": "/opt/pstack-probe/probe/cloud-user-config/plugin-market"
      }
    }
  },
  "enabledPlugins": {
    "probe-plugin@pstack-probe-market": true
  }
}
[exit 0]

$ claude plugin list
Installed plugins:

  > probe-plugin@pstack-probe-market
    Version: 0.0.1
    Read from: /opt/pstack-probe/probe/cloud-user-config/plugin-market/probe-plugin
    Scope: user
    Status: √ enabled

[exit 0]

$ git -C /opt/pstack-probe log --oneline -3
63815da Point probe hook at CLAUDE_CONFIG_DIR when set
6d2a623 Add cloud user-config probe for setup-script install test
412e0b5 Add agent skill docs and domain glossary
[exit 0]

$ git ls-remote https://github.com/janrizmlibres/claude-pstack.git refs/heads/probe/cloud-user-config
63815dae95e9275390cda65e07356b8c269a12ad	refs/heads/probe/cloud-user-config
[exit 0]

```

## Summary

All five channels loaded in the cloud session after the setup script installed into `/root/.claude` (HOME=/root, CLAUDE_CONFIG_DIR unset): user CLAUDE.md, user SessionStart hook, user skill, user agent, and the user-scope plugin from a directory marketplace. The probe checkout `/opt/pstack-probe` is at `63815da`, which matches the remote `probe/cloud-user-config` head. Nothing appeared broken.
