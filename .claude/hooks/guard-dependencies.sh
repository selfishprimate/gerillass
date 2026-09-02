#!/usr/bin/env bash
#
# PostToolUse guard: package.json must declare no runtime dependencies.
#
# Gerillass publishes only the scss/ directory, so it has nothing to require at
# runtime. Every name under "dependencies" is installed by everyone who installs
# the package -- that is what put jest, glob, sass-loader and sass-true into
# consumer projects and produced 24 Dependabot alerts before v1.3.3.
#
# Exit 2 makes this a blocking error whose stderr is fed back to Claude.

set -euo pipefail

payload=$(cat)
file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')

[ -n "$file" ] || exit 0
[ "$(basename "$file")" = "package.json" ] || exit 0
[ -f "$file" ] || exit 0

# Only the repository's own manifest, never a vendored one.
case "$file" in */node_modules/*) exit 0 ;; esac

dir=$(cd "$(dirname "$file")" && pwd)
root=$(git -C "$dir" rev-parse --show-toplevel 2>/dev/null || echo "")
[ -n "$root" ] && [ "$dir" = "$root" ] || exit 0

names=$(jq -r '(.dependencies // {}) | keys | join(", ")' "$file" 2>/dev/null || echo "")
[ -n "$names" ] || exit 0

cat >&2 <<EOF
package.json declares runtime dependencies: $names

Gerillass ships only scss/, so "dependencies" must stay empty -- anything listed
there is installed by every consumer of the package. This is the exact mistake
that caused 24 Dependabot alerts before v1.3.3.

Move these entries to "devDependencies". See the "What this project is" section
of CLAUDE.md.
EOF
exit 2
