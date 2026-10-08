#!/usr/bin/env bash
# The setup line's installer: puts pstack on a cloud environment's VM.
#
#   cloud-install.sh [ref] [--config KEY=VALUE]...
#
# Run from the clone the setup line makes. It checks the clone out at ref (a
# branch, default main), adds the clone as a directory marketplace and installs
# pstack from it at user scope with the --config values. A directory
# marketplace is read in place, so every session loads the clone's current
# files. It then merges, never replaces, into the VM's user settings: subagent
# spawn depth 3, a Read rule for the plugin's files, and a SessionStart hook
# that fast-forwards the clone on ref. Last, it installs Playwright Chromium,
# warning but still exiting 0 when that fails.
set -euo pipefail

usage() {
  echo "usage: cloud-install.sh [ref] [--config KEY=VALUE]..." >&2
  exit 2
}

main() {
  local clone ref="" settings_dir settings pull hook
  local -a configs=()
  clone="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

  while (($#)); do
    case $1 in
      --config)
        (($# >= 2)) || usage
        configs+=(--config "$2")
        shift 2
        ;;
      -*) usage ;;
      *)
        [[ -z $ref ]] || usage
        ref=$1
        shift
        ;;
    esac
  done
  ref=${ref:-main}

  git -C "$clone" fetch -q --depth 1 origin "$ref"
  git -C "$clone" checkout -q -B "$ref" FETCH_HEAD

  claude plugin marketplace add "$clone" --scope user </dev/null
  claude plugin install pstack@claude-pstack --scope user ${configs[@]+"${configs[@]}"} </dev/null

  settings_dir="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
  settings="$settings_dir/settings.json"
  mkdir -p "$settings_dir"
  [[ -f $settings ]] || echo '{}' >"$settings"
  # The pull hook replaces any earlier one on this clone, so a run on another
  # ref leaves one hook. Its output goes nowhere, since a SessionStart hook's
  # stdout lands in the session's context.
  pull="git -C $(printf %q "$clone") pull"
  hook="$pull --ff-only -q origin $(printf %q "$ref") >/dev/null 2>&1 || true"
  jq --arg rule "Read(/$clone/pstack/**)" --arg pull "$pull " --arg hook "$hook" '
    .env = ((.env // {}) + {CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH: "3"})
    | .permissions.allow = ((.permissions.allow // []) | if any(. == $rule) then . else . + [$rule] end)
    | .hooks.SessionStart = [
        (.hooks.SessionStart // [])[]
        | .hooks |= map(select((.command // "") | startswith($pull) | not))
        | select(.hooks | length > 0)
      ] + [{hooks: [{type: "command", command: $hook, timeout: 15}]}]
  ' "$settings" >"$settings.tmp"
  mv "$settings.tmp" "$settings"

  if ! npx --yes playwright install --with-deps chromium </dev/null; then
    echo "cloud-install: warning: Playwright Chromium did not install; browser checks in this environment will fail until it does." >&2
  fi
}

main "$@"
