#!/usr/bin/env bash
#
# Stop: before a turn ends, check that the documentation kept up with the work.
#
# The PostToolUse hooks only fire for edits made through the editor, and most
# edits in this repository are made by scripts. In one session CLAUDE.md fell
# two releases behind -- still counting 53 mixins and listing focus-ring as a
# member to write -- because nothing that was edited through the editor
# touched it. This runs when a turn ends instead, over everything the branch
# has changed against origin/main, however it was changed.
#
# Three checks, from certain to judgement:
#   1. gerillass.json, SKILL.md and llms.txt are rebuilt when scss/ or meta/
#      changed. If that changes them, they were stale, and the turn goes on.
#   2. tools/check-docs.js must agree with the repository's counts.
#   3. If the API, meta/, todos/, tools/, the hooks, the skills, the docs pages,
#      the wiki or package.json changed and CLAUDE.md did not, the turn goes on
#      once with the sections that usually need it. Deciding that nothing needs
#      to change is a valid answer, so the reminder is not repeated for the same
#      set of changed files.
#
# Exit 2 hands stderr back to Claude and keeps the turn going. When Claude
# Code is already continuing because of this hook, stop_hook_active is true and
# the hook stays quiet, so it cannot loop.

set -euo pipefail

payload=$(cat)
[ "$(printf '%s' "$payload" | jq -r '.stop_hook_active // false' 2>/dev/null)" = "true" ] && exit 0

root=$(git -C "${CLAUDE_PROJECT_DIR:-.}" rev-parse --show-toplevel 2>/dev/null || echo "")
[ -n "$root" ] && [ -f "$root/tools/check-docs.js" ] || exit 0
cd "$root"

base=$(git merge-base HEAD origin/main 2>/dev/null || echo "")
[ -n "$base" ] || exit 0
changed=$( { git diff --name-only "$base"; git ls-files --others --exclude-standard; } | sort -u )
[ -n "$changed" ] || exit 0

problems=""

# 1. Generated files.
if printf '%s\n' "$changed" | grep -qE '^(scss/(library|utilities)/|meta/)'; then
  before=$(git hash-object gerillass.json SKILL.md llms.txt)
  if ! out=$( { node tools/build-manifest.js && node tools/build-llms-txt.js && node tools/build-skill.js; } 2>&1 ); then
    problems+="Rebuilding gerillass.json, llms.txt and SKILL.md failed:
$out

"
  elif [ "$before" != "$(git hash-object gerillass.json SKILL.md llms.txt)" ]; then
    problems+="gerillass.json, SKILL.md or llms.txt was stale for this branch's scss/ or meta/ changes and has just been rebuilt. Include the rebuilt files with the change.

"
  fi
fi

# 2. Counts.
if ! out=$(node tools/check-docs.js 2>&1); then
  problems+="$out

"
fi

# 3. Prose.
if ! printf '%s\n' "$changed" | grep -qx 'CLAUDE.md'; then
  touched=$(printf '%s\n' "$changed" | grep -E '^(scss/(library|utilities)/|meta/|todos/|tools/|\.claude/(hooks|skills)/|\.claude/settings\.json|site/content/docs/|wiki/|package\.json$)' || true)
  if [ -n "$touched" ]; then
    marker="$(git rev-parse --git-dir)/claude-docs-reminded"
    key=$(printf '%s\n' "$touched" | git hash-object --stdin)
    if [ "$(cat "$marker" 2>/dev/null || true)" != "$key" ]; then
      printf '%s' "$key" > "$marker"
      list=$(printf '%s\n' "$touched" | head -8 | sed 's/^/  - /')
      more=$(printf '%s\n' "$touched" | wc -l | tr -d ' ')
      problems+="This branch changed files that CLAUDE.md describes, and CLAUDE.md did not change:
$list
  ($more file(s) in all)

Check these and update them in this branch, or say plainly that nothing needs to change:
  - the counts in the architecture table and Test depths, which tools/check-docs.js
    only checks where it recognises a number
  - Pending work: the Next list and New members worth adding
  - the section for any todos/ file that was added or changed, and \"Where it
    stands\" under fix-plan.md
  - Repo tooling, if a hook, a tool or a skill changed
  - .claude/skills/*/SKILL.md, if a workflow or a command they quote changed
"
    fi
  fi
fi

[ -z "$problems" ] && exit 0
printf '%s' "$problems" >&2
exit 2
