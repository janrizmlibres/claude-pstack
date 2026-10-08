---
name: setup-pstack
description: Show which models pstack's three settings (Work, Judgement, Volume) use, point to /config to change them, and print the cloud setup line filled in with them. Use for /pstack:setup-pstack, "configure pstack models", "pstack setup line", or changing pstack's model choices.
---

# Setup pstack

Show the user pstack's settings and the lines they paste themselves. This skill changes nothing: never write `settings.json` or any other settings file. A user who asks you to make a change gets the line to add or the place to set it.

## Steps

### 1. Read the settings

Claude Code filled in the configured models when it loaded this skill:

- Work: `${user_config.work_model}`
- Judgement: `${user_config.judgement_model}`
- Volume: `${user_config.volume_model}`

A value that is one of `opus`, `sonnet`, `haiku` or `fable` is configured. Any other value, a literal placeholder or an empty one, means the setting is unset, and it runs on its default: Work `opus`, Judgement `opus`, Volume `sonnet`. That is also the model its agents fall back to.

### 2. Show the settings

Show one table, marking each unset setting's model `(default)`:

| Setting | Model | Effort | Runs |
|---|---|---|---|
| Work | the Work model | medium | code delegates, arena runners, hillclimb, orchestrate unit workers, the stacker, sub-leads, how's explorers, reflect's reviewers |
| Judgement | the Judgement model | high | the hardest changes, every judge, interrogate's lenses, the show-me-your-work auditor, synthesizers, the second opinion, orchestrate's verifier and brief auditor |
| Volume | the Volume model | high | swarm and `first pass` race workers, why's investigators, recall's bulk readers, orchestrate's babysitter and retro watcher |

Say that pstack fixes each setting's effort, so only the model can change.

### 3. Point to `/config`

To change a model, the user opens `/config` and picks it in the pstack rows, or runs `/plugin configure pstack@claude-pstack`. Each setting takes `opus`, `sonnet`, `haiku` or `fable`. A rerun of `/pstack:setup-pstack` shows the new values and the setup line that matches them.

### 4. Print the setup line

Print the setup line with each setting's model from step 1, the default for an unset one, in a code block of its own:

```
git clone --depth 1 https://github.com/janrizmlibres/claude-pstack /opt/claude-pstack && bash /opt/claude-pstack/scripts/cloud-install.sh --config work_model=<Work model> --config judgement_model=<Judgement model> --config volume_model=<Volume model>
```

Tell the user to paste it into the setup script of every cloud environment that should carry pstack, so cloud sessions run on the same models as this machine. In cloud the settings come only from this line: to change a model there, edit the line, which rebuilds the environment's setup cache.

### 5. Show the `Read` rule

pstack's skills and agents reach sibling skills by reading their `SKILL.md` from the plugin's install directory. In default permission mode each of those reads prompts, and a subagent's is denied. Show the user the one rule that allows them, for the `permissions.allow` list of their user settings, `~/.claude/settings.json`:

```json
{
  "permissions": {
    "allow": ["Read(~/.claude/plugins/cache/claude-pstack/**)"]
  }
}
```

Say it matters only in default mode: other modes read without asking. They add it themselves.

### 6. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /pstack:create-verification-skill." On yes, read ${CLAUDE_PLUGIN_ROOT}/skills/create-verification-skill/SKILL.md and follow it. On no, move on without pushing.
