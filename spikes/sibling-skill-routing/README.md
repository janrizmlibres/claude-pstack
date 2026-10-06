# Spike: sibling-skill routing and plugin-skill hooks

Throwaway toy plugin for the wayfinder ticket "Can a nested subagent load a sibling plugin skill marked disable-model-invocation?". The results matrix lives on that ticket; this branch only holds what produced it.

- `probe-plugin/`: skills `hidden` (disable-model-invocation, with `playbooks/deep.md` beside it), `visible` (prints its `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_SKILL_DIR}` / relative forms), `hooked` (disable-model-invocation, frontmatter `UserPromptSubmit` + `PreToolUse` hooks), `hooked-auto` (model-invocable, frontmatter hook); agents `prober` (body carries a `${CLAUDE_PLUGIN_ROOT}` path) and `preloader` / `preload-*` (`skills:` preload variants).
- `bin/run.sh <name> "<prompt>"`: one headless turn with the plugin loaded via `--plugin-dir`, output in `runs/<name>.jsonl`.
- `bin/turns.py <out.jsonl> "<turn>"...`: one process, turns sent one at a time (each waits for the previous `result`), for the hook tests. Hooks append to `hook.log`.
- `bin/summ.py <run.jsonl>`: prints tool calls and results by subagent depth. Stream-json carries depth 0 and 1 only; depth-2 behaviour comes from the relayed report.

Tokens (`H7Q3X`, `D5W1N`, `V9K2M`, `K4P1Z`, `KUMQUAT`) mark which content reached which context.

Ran on Claude Code 2.1.291, plugin loaded with `--plugin-dir` (not installed from a marketplace).
