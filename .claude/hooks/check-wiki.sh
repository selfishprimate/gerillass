#!/usr/bin/env bash
#
# PostToolUse: do not let a release ship without its wiki page.
#
# gerillass.com and docs.gerillass.com are separate repositories. A session in
# either one cannot see this repository, and the playground's member menu does
# not update itself: it listed 50 of 53 mixins as of v2.1.0, because three
# releases added a mixin and nothing reminded anyone to go and add it there.
#
# The wiki is per released version, not per commit, so this only bites while a
# release is being prepared -- that is, once the version in package.json is
# ahead of the last tag. Between releases the page for the next version cannot
# exist, since its number is not decided yet, and the check stays quiet.
#
# It fires on package.json because that is where a release starts, and on the
# wiki and the API because those are what make a page necessary or complete.
# Like every hook here it only runs for edits made through the editor; the
# /release checklist runs tools/check-wiki.js by hand as well.

set -euo pipefail

payload=$(cat)
file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')
[ -n "$file" ] || exit 0

dir=$(cd "$(dirname "$file")" 2>/dev/null && pwd) || exit 0
root=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null || echo "")
[ -n "$root" ] || exit 0
[ -f "$root/tools/check-wiki.js" ] || exit 0

rel=${file#"$root"/}

case "$rel" in
  package.json|wiki/*|scss/library/*|scss/utilities/*|meta/*) ;;
  *) exit 0 ;;
esac

cd "$root"

if ! output=$(node tools/check-wiki.js 2>&1); then
  printf '%s\n\nWrite the page before tagging. wiki/README.md has the shape, and an\nexisting file has the tone.\n' "$output" >&2
  exit 2
fi
