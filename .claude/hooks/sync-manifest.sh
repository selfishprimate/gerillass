#!/usr/bin/env bash
#
# PostToolUse sync: rebuild gerillass.json after the API or its metadata changes.
#
# gerillass.json is the machine-readable description agents load. It is committed
# build output: signatures come from scss/, everything else from meta/. A stale
# manifest is worse than none, because it is confidently wrong -- so the checked-in
# copy is regenerated here rather than relying on anyone remembering.
#
# test/manifest.spec.js fails if the committed file does not match a fresh build,
# so this hook is a convenience, not the guarantee.

set -euo pipefail

payload=$(cat)
file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')

[ -n "$file" ] || exit 0
case "$file" in
  */scss/library/*.scss|*/scss/utilities/*.scss|*/meta/*.json) ;;
  *) exit 0 ;;
esac

dir=$(cd "$(dirname "$file")" && pwd)
root=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null || echo "")
[ -n "$root" ] || exit 0
[ -f "$root/tools/build-manifest.js" ] || exit 0

cd "$root"
if ! output=$(node tools/build-manifest.js 2>&1); then
  printf 'Rebuilding gerillass.json failed:\n%s\n' "$output" >&2
  exit 2
fi

# SKILL.md is derived from the manifest, so it has to follow.
if ! skill=$(node tools/build-skill.js 2>&1); then
  printf 'Rebuilding SKILL.md failed:\n%s\n' "$skill" >&2
  exit 2
fi

printf '{"systemMessage":"Rebuilt gerillass.json and SKILL.md.","suppressOutput":true}\n'
