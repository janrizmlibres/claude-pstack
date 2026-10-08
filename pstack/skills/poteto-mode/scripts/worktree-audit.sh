#!/usr/bin/env bash
# Read-only worktree prune audit. Classifies every git worktree by size, merge
# state, uncommitted work, remote/PR state, and the most recent Claude Code
# transcript recorded in it. Emits a table sorted by size with a suggested
# bucket. Never deletes anything; deletion stays a human-gated step in the
# playbook.
#
# Usage: worktree-audit.sh [repo-path]   (defaults to the current repo)
set -u

repo="${1:-$(git rev-parse --show-toplevel 2>/dev/null)}"
[ -z "$repo" ] && { echo "not in a git repo; pass a repo path" >&2; exit 1; }
cd "$repo" || exit 1

# Main worktree is the first entry; everything else is a candidate.
main_wt=$(git worktree list --porcelain | awk '/^worktree /{sub(/^worktree /, ""); print; exit}')
worktrees=$(git worktree list --porcelain | awk '/^worktree /{sub(/^worktree /, ""); print}')

# origin/main drives the merge check. Best-effort; stale is fine for a first pass.
git fetch origin main --quiet 2>/dev/null || echo "warn: could not fetch origin/main; merged column may be stale" >&2

# PR state by branch, fetched once. Empty if gh is unavailable.
prs=$(mktemp)
cwds=$(mktemp)
trap 'rm -f "$prs" "$cwds"' EXIT
gh pr list --author "@me" --state all --limit 1000 \
	--json number,state,headRefName 2>/dev/null > "$prs" || echo "[]" > "$prs"

# Claude Code keeps a session's transcript under ~/.claude/projects/<slug>/,
# the slug being the session's starting directory with every character that
# isn't a letter or digit turned into "-", and its subagents' transcripts
# under <session-id>/subagents/. Every line records the cwd it ran in. A
# session started in this repo's main checkout or in one of its worktrees
# lands in that path's directory; nothing else is read, so no other
# project's transcripts are. One pass collects each transcript's cwds
# ("<cwd>\t<file>"), and a worktree claims a cwd that is its path or lies
# under it, so glint-482 does not match glint-482-r37 nor a message that
# merely names the path.
while IFS= read -r wt; do
	dir="$HOME/.claude/projects/$(printf '%s' "$wt" | sed 's/[^A-Za-z0-9]/-/g')"
	[ -d "$dir" ] && grep -rHo --include='*.jsonl' '"cwd":"[^"]*"' "$dir" 2>/dev/null
done <<< "$worktrees" | sed -E 's/^(.*\.jsonl):"cwd":"(.*)"$/\2\t\1/' | sort -u > "$cwds"

mtime() { stat -c '%Y' "$1" 2>/dev/null || stat -f '%m' "$1"; }
day() { date -d "@$1" '+%Y-%m-%d' 2>/dev/null || date -r "$1" '+%Y-%m-%d'; }

now=$(date +%s)

printf "SIZE\tAGE\tMERGED\tDIRTY\tREMOTE\tPR\tLAST_CHAT\tBUCKET\tWORKTREE\tTRANSCRIPT\n"

while IFS= read -r wt; do
	[ "$wt" = "$main_wt" ] && continue

	size=$(du -sh "$wt" 2>/dev/null | awk '{print $1}')
	head=$(git -C "$wt" rev-parse HEAD 2>/dev/null)
	head_ts=$(git -C "$wt" log -1 --format='%ct' HEAD 2>/dev/null || echo 0)
	age=$([ "$head_ts" -gt 0 ] 2>/dev/null && echo "$(( (now - head_ts) / 86400 ))d" || echo "?")

	# Squash-merged branches are not ancestors of main, so PR state is the
	# real signal; merge-base only catches fast-forward/rebase merges.
	git merge-base --is-ancestor "$head" origin/main 2>/dev/null && merged=YES || merged=no

	# Distinguish real WIP (tracked edits) from disposable untracked scratch.
	porcelain=$(git -C "$wt" status --porcelain 2>/dev/null)
	if [ -z "$porcelain" ]; then dirty=clean
	elif printf '%s\n' "$porcelain" | grep -qv '^??'; then
		dirty="wip:$(printf '%s\n' "$porcelain" | grep -cv '^??')"
	else dirty="scratch:$(printf '%s\n' "$porcelain" | grep -c '^??')"; fi

	branch=$(git -C "$wt" symbolic-ref --quiet --short HEAD 2>/dev/null || echo "")
	if [ -z "$branch" ]; then remote=detached
	elif git -C "$wt" show-ref --verify --quiet "refs/remotes/origin/$branch"; then
		[ "$(git -C "$wt" rev-parse "origin/$branch" 2>/dev/null)" = "$head" ] \
			&& remote=pushed \
			|| remote="ahead$(git -C "$wt" rev-list --count "origin/$branch..HEAD" 2>/dev/null)"
	else remote=no-remote; fi

	pr=$([ -n "$branch" ] && jq -r --arg b "$branch" \
		'.[] | select(.headRefName==$b) | "#\(.number)/\(.state)"' "$prs" 2>/dev/null | head -1)
	[ -z "$pr" ] && pr="-"

	# The newest transcript recorded in this worktree. None means no session
	# of this repo on record worked there: a stray.
	last="-"; last_ts=0; transcript="-"
	while IFS= read -r f; do
		ts=$(mtime "$f")
		[ "$ts" -gt "$last_ts" ] && { last_ts=$ts; transcript=$f; }
	done < <(awk -F'\t' -v wt="$wt" '$1 == wt || index($1, wt "/") == 1 { print $2 }' "$cwds" | sort -u)
	[ "$last_ts" -gt 0 ] && last=$(day "$last_ts")
	recent=$([ "$last_ts" -gt 0 ] && [ $(( (now - last_ts) / 86400 )) -le 4 ] && echo yes || echo no)

	case "$dirty" in wip:*) bucket=hold-wip ;; *)
		case "$pr" in *OPEN*) bucket=hold-open-pr ;; *)
			if [ "$recent" = yes ]; then bucket=verify-recent-chat
			elif [ "$merged" = YES ] || [ "$pr" != "-" ]; then bucket=safe
			elif [ "$transcript" = "-" ]; then bucket=stray
			else bucket=review; fi ;;
		esac ;;
	esac

	printf "%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n" \
		"$size" "$age" "$merged" "$dirty" "$remote" "$pr" "$last" "$bucket" "$wt" "$transcript"
done <<< "$worktrees" | sort -t$'\t' -k1,1 -rh
