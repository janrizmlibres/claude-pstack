# Probe: plugin mechanics on a marketplace and cloud install

Throwaway probe for the wayfinder ticket "Marketplace and cloud plugin-install probe". Results live on that ticket and on `research/marketplace-install`; this branch only holds what produced them.

- `/.claude-plugin/marketplace.json`: marketplace `pstack-mkt-probe` with one relative-path plugin, `probe`, at `./spikes/marketplace-install/plugin` (no `version`, as the port decided).
- `plugin/`: skills `hidden` (disable-model-invocation, `playbooks/deep.md` beside it), `visible` (prints `${CLAUDE_PLUGIN_ROOT}` and `${user_config.*}` forms), `entry` (disable-model-invocation, frontmatter `UserPromptSubmit` reminder hook whose command uses `${CLAUDE_PLUGIN_ROOT}`); agent `prober` (body carries the same forms). `userConfig`: `set_opt` and `unset_opt` with defaults, `nodefault_opt` without.
- `cloud-install.sh`: the setup-line installer, a copy of the decided `scripts/cloud-install.sh` shape plus the `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=3` user-settings env.
- `bin/run.sh`, `bin/turns.py`: local headless drivers.

Tokens: `H8M2Q` hidden, `D3X9R` deep, `V6L4T` visible, `E7N3C` entry, `P5K7W` prober, `R5T8` reminder.
