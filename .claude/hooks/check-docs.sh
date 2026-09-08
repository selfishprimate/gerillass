#!/usr/bin/env bash
#
# PostToolUse: keep the documentation honest about the repository.
#
# Two jobs, deliberately separated by how certain they are.
#
# The first is deterministic and blocking: tools/check-docs.js compares the
# counts the docs claim against the counts the repository has. This class of
# error has happened repeatedly -- CLAUDE.md said 31 of 51 mixins validated when
# it was 27, /new-mixin said 16 long after it was 35 -- and nothing ever caught
# it, because a wrong number in prose breaks no test.
#
# The second is a judgement call and only a reminder: when the tooling, the test
# setup or the agent instructions change, the prose describing them usually needs
# to change too, and no script can decide that. It prints a note and exits clean.

set -euo pipefail

payload=$(cat)
file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')
[ -n "$file" ] || exit 0

dir=$(cd "$(dirname "$file")" 2>/dev/null && pwd) || exit 0
root=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null || echo "")
[ -n "$root" ] || exit 0
[ -f "$root/tools/check-docs.js" ] || exit 0

rel=${file#"$root"/}

# Anything that can change a documented count, or is itself documentation.
counts_affected=false
case "$rel" in
  scss/library/*|scss/utilities/*|package.json|.npmignore|meta/*|test/*) counts_affected=true ;;
  CLAUDE.md|README.md|CONTRIBUTING.md|.claude/skills/*) counts_affected=true ;;
esac

# Areas whose prose lives somewhere else and goes stale silently.
reminder=""
case "$rel" in
  tools/*)
    reminder="tools/ changed. CLAUDE.md documents what each generator does, and /audit-library and /new-mixin quote their commands." ;;
  test/*)
    reminder="the test setup changed. CONTRIBUTING.md tells contributors how to test, /sass-test describes the depths, and CLAUDE.md has the coverage table." ;;
  .claude/hooks/*|.claude/settings.json)
    reminder="the hooks changed. CLAUDE.md's \"Repo tooling\" section lists them and CONTRIBUTING.md tells contributors what runs automatically." ;;
  scss/library/*|scss/utilities/*)
    reminder="the API changed. Check that meta/ has an entry for it and that CONTRIBUTING.md still describes the conventions correctly." ;;
esac

cd "$root"

if [ "$counts_affected" = true ]; then
  if ! output=$(node tools/check-docs.js 2>&1); then
    printf '%s\n\nUpdate the numbers, or if the count is right, correct the code.\n' "$output" >&2
    exit 2
  fi
fi

if [ -n "$reminder" ]; then
  printf '{"systemMessage":"Docs check passed. Note: %s","suppressOutput":true}\n' "$reminder"
fi
