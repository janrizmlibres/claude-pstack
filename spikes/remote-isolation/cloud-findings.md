# Probe: Is Agent `isolation: "remote"` available on this account? (from a cloud session)

Date: 2026-10-06 (UTC)

## Verdict

- The Agent tool **does expose** `isolation: "remote"`. Its schema is `enum: ["worktree", "remote"]`, described as *"launches the agent in a remote cloud environment (always runs in background; availability is gated)"*.
- The call was **accepted**: no error, no rejection, and nothing said remote was gated off.
- **But the subagent was not isolated.** It ran in the **same container and the same checkout** as the parent session. It was not a separate remote environment and not a worktree. Its `git checkout -b` switched the parent's working tree to `probe/remote-from-cloud`.
- Conclusion: from inside a cloud (CCR) session, `isolation: "remote"` acts like a plain background subagent that shares the filesystem. It gives no isolation. Don't rely on it for separation in a cloud session. For a truly separate environment, use `mcp__claude-code-remote__create_session` instead.

## 1. Parent session facts

| Item | Value |
|---|---|
| pwd | `/home/user/claude-pstack` |
| whoami | `root` |
| uname -a | `Linux vm 6.18.44-fc-v70 #1 SMP PREEMPT_DYNAMIC @0 x86_64 x86_64 x86_64 GNU/Linux` |
| hostname | `vm` |
| claude --version | `2.1.291 (Claude Code)` |
| git status -sb | `## claude/probe-agent-remote-isolation-6wbedm` (clean) |
| git log --oneline -3 | `412e0b5 Add agent skill docs and domain glossary` (only commit) |

## 2. Agent call

Call: `Agent(subagent_type: "general-purpose", isolation: "remote", description: "Remote isolation probe", prompt: <probe prompt from ticket>)`

Exact launch result (internal agent ID and local transcript path left out):

> Async agent launched successfully.
> The agent is working in the background. You will be notified automatically when it completes.

- Error text: **none**
- Session URL: **none returned**
- Worktree: **not mentioned in the launch result.** Afterwards, `git worktree list` showed only the main checkout, so no worktree was created.
- Completion: a task notification with status `completed` (~21 s, 3 tool uses, ~44k subagent tokens)

### Subagent's final report (summary of its exact values)

- pwd `/home/user/claude-pstack`, whoami `root`, hostname `vm`, the same `uname -a` as the parent
- git status -sb `## claude/probe-agent-remote-isolation-6wbedm`, log `412e0b5`. Both are identical to the parent.
- Tools: Artifact, Bash, Edit, Glob, Grep, Read, Skill, ToolSearch, Write, plus the full `mcp__claude-code-remote__*` set (create_session, send_message, …). Deferred: ArtifactComments, ArtifactData, EnterWorktree, ExitWorktree, ListPlugins, ListSkills, Monitor, NotebookEdit, SearchPlugins, SearchSkills, SendMessage, TaskStop, WebFetch, WebSearch, and about 60 `mcp__github__*` tools. **It had no Agent tool.**
- Commit `b1190d8 Add remote isolation probe file from cloud session` on `probe/remote-from-cloud`, file `spikes/remote-isolation/from-cloud-remote.txt`:
  ```
  Tue Oct  6 13:09:20 UTC 2026
  vm
  ```
- Push output (`git push -u origin probe/remote-from-cloud`), **exit code 0**:
  ```
  remote:
  remote: Create a pull request for 'probe/remote-from-cloud' on GitHub by visiting:
  remote:      https://github.com/janrizmlibres/claude-pstack/pull/new/probe/remote-from-cloud
  remote:
  To https://github.com/janrizmlibres/claude-pstack
   * [new branch]      probe/remote-from-cloud -> probe/remote-from-cloud
  branch 'probe/remote-from-cloud' set up to track 'origin/probe/remote-from-cloud'.
  ```

### Parent-side check after completion (evidence the subagent shared this container)

```
$ git status -sb
## probe/remote-from-cloud...origin/probe/remote-from-cloud
$ git worktree list
/home/user/claude-pstack  b1190d8 [probe/remote-from-cloud]
$ ls spikes/remote-isolation
from-cloud-remote.txt
```

The parent checkout was moved to the subagent's branch and held the subagent's file. Its hostname, pwd and kernel were identical to the parent's.

## 3. Schema / rejection

The `isolation` parameter exists and accepts `"remote"`. There was no rejection, so there is no error text to record.

## Notes

- The probe branch `probe/remote-from-cloud` stays on origin. No PR was opened.
- `main` was not changed. This file is on `research/remote-isolation-cloud`, branched from `main`.
