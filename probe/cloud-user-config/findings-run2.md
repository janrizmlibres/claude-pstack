# Cloud user-config probe — run 2 findings

Date: 2026-10-06. Claude Code 2.1.291, running as root, HOME=/root, CLAUDE_CONFIG_DIR unset.

## Step 1 — from context only (before any tool call)

- (a) `probe-user-skill`: **present**. Entry: `- probe-user-skill: Probe for the claude-pstack cloud test. Use only when asked to run the pstack user-skill probe.`
  `probe-plugin-skill`: **present** (namespaced). Entry: `- probe-plugin:probe-plugin-skill: Probe for the claude-pstack cloud test. Use only when asked to run the pstack plugin-skill probe.`
- (b) `probe-user-agent`: **present**. Entry: `- probe-user-agent: Probe for the claude-pstack cloud test. Use only when asked to run the pstack user-agent probe. (Tools: Bash)`
- (c) **Yes**: `PROBE-CLAUDEMD-7f3a`. It is in the system-reminder that loads `/root/.claude/CLAUDE.md` ("user's private global instructions for all projects"), on the line "User CLAUDE.md marker: PROBE-CLAUDEMD-7f3a."
- (d) **Yes**: `PROBE-HOOK-c41e`. It appears as "SessionStart:startup hook success: User SessionStart hook marker: PROBE-HOOK-c41e".

## Step 2 — invocations

- `Skill("probe-user-skill")` → succeeded. Base directory `/root/.claude/skills/probe-user-skill`; the skill body said to reply with `PROBE-SKILL-2b9d`.
- `Skill("probe-plugin-skill")` was not tried; the namespaced name was called directly because the list showed it that way. `Skill("probe-plugin:probe-plugin-skill")` → succeeded. Base directory `/opt/pstack-probe/probe/cloud-user-config/plugin-market/probe-plugin/skills/probe-plugin-skill`; the skill body said to reply with `PROBE-PLUGIN-5d20`.
- `Agent(subagent_type="probe-user-agent", prompt="run the pstack user-agent probe")` → succeeded. Reply: `PROBE-AGENT-e81f /home/user/claude-pstack root`

## Step 3 — VM inspection (verbatim)

```
$ id
uid=0(root) gid=0(root) groups=0(root)
[exit 0]

$ echo "HOME=$HOME"
HOME=/root
[exit 0]

$ echo "CLAUDE_CONFIG_DIR=${CLAUDE_CONFIG_DIR:-<unset>}"
CLAUDE_CONFIG_DIR=<unset>
[exit 0]

$ claude --version
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
install done at 2026-10-06T15:43:31Z
[exit 0]

$ cat "$C/pstack-probe-stamp"
setup commit=63815dae95e9275390cda65e07356b8c269a12ad stamp=run-1 at=2026-10-06T15:43:29Z
[exit 0]

$ cat /tmp/pstack-probe-sessionstart.log
hook ran at 2026-10-06T15:43:31Z as root
Already up to date.
after pull: commit=63815dae95e9275390cda65e07356b8c269a12ad stamp=run-1
hook ran at 2026-10-06T15:46:07Z as root
From https://github.com/janrizmlibres/claude-pstack
   63815da..fb3d32f  probe/cloud-user-config -> origin/probe/cloud-user-config
 * [new branch]      probe/cloud-user-config-run1 -> origin/probe/cloud-user-config-run1
Updating 63815da..fb3d32f
Fast-forward
 probe/cloud-user-config/STAMP | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
after pull: commit=fb3d32f62e25bb0bba18210880efd864be682bce stamp=run-2
[exit 0]

$ ls -la "$C" "$C/skills" "$C/agents"
/root/.claude:
total 108
drwxr-xr-x 12 root root  4096 Oct  6 15:46 .
drwx------ 16 root root  4096 Oct  6 15:46 ..
-rw-r--r--  1 root root    24 Oct  6 15:46 .last-cleanup
-rw-r--r--  1 root root   131 Oct  6 15:43 CLAUDE.md
drwxr-xr-x  2 root root  4096 Oct  6 15:43 agents
drwxr-xr-x  2 root root  4096 Oct  6 15:46 backups
drwxr-xr-x  2 root root  4096 Oct  6 15:46 environment-manager
drwxr-xr-x  2 root root  4096 Oct  6 15:43 hooks
-rw-------  1 root root   442 Oct  6 15:46 launcher-settings.json
drwxr-xr-x  5 root root  4096 Oct  6 15:46 plugins
drwx------  3 root root  4096 Oct  6 15:46 projects
-rw-r--r--  1 root root    90 Oct  6 15:43 pstack-probe-stamp
drwxr-xr-x  4 root root  4096 Oct  6 15:46 session-env
drwx------  2 root root  4096 Oct  6 15:46 sessions
-rw-r--r--  1 root root   542 Oct  6 15:43 settings.json
drwxr-xr-x  2 root root  4096 Oct  6 15:46 shell-snapshots
drwxr-xr-x  5 root root  4096 Oct  6 15:46 skills
-rwxr-xr-x  1 root root  6395 Oct  6 15:46 stop-hook-git-check.sh
-rwxr-xr-x  1 root root 25556 Oct  6 15:46 stop-hook-reply-gate.py
-rwxr-xr-x  1 root root  3630 Oct  6 15:46 user-prompt-submit-reply-reminder.py

/root/.claude/agents:
total 12
drwxr-xr-x  2 root root 4096 Oct  6 15:43 .
drwxr-xr-x 12 root root 4096 Oct  6 15:46 ..
-rw-r--r--  1 root root  264 Oct  6 15:43 probe-user-agent.md

/root/.claude/skills:
total 20
drwxr-xr-x  5 root root 4096 Oct  6 15:46 .
drwxr-xr-x 12 root root 4096 Oct  6 15:46 ..
drwxr-xr-x  2 root root 4096 Oct  6 15:43 probe-user-skill
drwxr-xr-x  2 root root 4096 Oct  6 15:43 session-start-hook
drwxr-xr-x  3 root root 4096 Oct  6 15:46 synced
[exit 0]

$ cat "$C/settings.json"
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
fb3d32f Bump probe stamp to run-2 for cache freshness test
63815da Point probe hook at CLAUDE_CONFIG_DIR when set
6d2a623 Add cloud user-config probe for setup-script install test
[exit 0]

$ git ls-remote https://github.com/janrizmlibres/claude-pstack.git refs/heads/probe/cloud-user-config
fb3d32f62e25bb0bba18210880efd864be682bce	refs/heads/probe/cloud-user-config
[exit 0]

```

## Observations (not fixed, report only)

- All four arms loaded in the cloud session: user CLAUDE.md, the user SessionStart hook, user skills and agents in `~/.claude`, and the user-scope plugin from a directory marketplace.
- **The setup script did not re-run for this session.** `/var/log/pstack-probe-setup.log` shows one run only (15:43:29Z, `stamp=run-1`). `~/.claude/pstack-probe-stamp` still says `stamp=run-1`. This session started about 15:46, so the environment, including `~/.claude`, appears to have been restored from a cached post-setup snapshot.
- The SessionStart hook log has two entries: 15:43:31Z, which is at setup/snapshot time and stayed at run-1, and 15:46:07Z, at this session's start. The second entry pulled `/opt/pstack-probe` up to `fb3d32f` (`stamp=run-2`), which matches the remote `probe/cloud-user-config` head. So only the hook brings the checkout up to date. Files the setup script copied into `~/.claude` stay as the cached run-1 versions until the setup script runs again.
- The plugin is read from `/opt/pstack-probe/...` (directory marketplace), so it follows the hook's `git pull`. The user skills and agents are copies in `~/.claude`, so they do not.
- New directory `~/.claude/skills/synced` appeared at 15:46. The harness created it; the probe did not.
