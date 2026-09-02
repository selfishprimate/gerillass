#!/usr/bin/env bash
#
# PostToolUse sync: regenerate the gls- prefixed bundle after a mixin changes.
#
# scss/_gerillass-prefix.scss is build output -- Gulp concatenates
# scss/library/**/*.scss and rewrites "@mixin " to "@mixin gls-". It is
# committed, so editing a mixin without re-running the task leaves the entire
# prefixed half of the public API silently stale.

set -euo pipefail

payload=$(cat)
file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')

[ -n "$file" ] || exit 0
case "$file" in
  */scss/library/*.scss) ;;
  *) exit 0 ;;
esac

dir=$(cd "$(dirname "$file")" && pwd)
root=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null || echo "")
[ -n "$root" ] || exit 0

cd "$root"
if ! output=$(npx gulp start 2>&1); then
  printf 'gulp start failed while regenerating scss/_gerillass-prefix.scss:\n%s\n' "$output" >&2
  exit 2
fi

printf '{"systemMessage":"Regenerated scss/_gerillass-prefix.scss (gls- bundle) after the library change.","suppressOutput":true}\n'
