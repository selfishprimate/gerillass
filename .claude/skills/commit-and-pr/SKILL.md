---
name: commit-and-pr
description: Write a Gerillass commit message and a pull request title and description to the house standard. Use whenever committing, and whenever a branch is pushed and handed over for a pull request.
---

# Commits and pull requests

One standard, every time, so that every commit and every pull request explains
itself the same way when someone reads the history later. A hook enforces the
commit half: `.claude/hooks/check-commit-message.js` refuses a `git commit`
whose message breaks the rules below.

## The commit message

```
Add /lab, a dev-server workbench for developing mixins

The public playground compiles a published version from jsDelivr, which
cannot show a change to a mixin before it is released. The lab compiles
the working tree's scss/ and renders each case beside its source.

- Routed only on the dev server, so a build contains none of it.
- Saves go through a dev-server-only endpoint that writes existing
  files under scss/ and site/lab/cases, and nothing else.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

- **Subject:** at most 72 characters, in the imperative ("Add", "Fix",
  "Document"), with no full stop at the end. It says what the commit does,
  not which files it touched.
- **A blank line, then the body.** Always present. It says what changed and
  why: the reason a reader cannot get from the diff. Wrap it at 72 characters;
  short paragraphs or bullets.
- **Trailers last,** after another blank line: the `Co-Authored-By` line.
  A trailer is not a body; a message with only a subject and a trailer is
  refused.

Write the message with a heredoc, so the hook can read it and the shell does
not eat a quote or a backtick:

```bash
git commit -F - <<'EOF'
Subject line

Body.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
```

Do not build the message from a shell variable (`-m "$MESSAGE"`): the hook
cannot see what the variable holds, so it refuses the commit rather than
guess. That is how commits without a body got through before.

One commit per concern. When a branch holds unrelated work, split it into
commits a reader can follow, each with its own body.

## The pull request

The maintainer opens and merges pull requests. Do not run `gh pr create` or
merge anything; push the branch and hand over a title and a description ready
to paste.

**Title:** a one-sentence summary of the change, like a commit subject. Never a
single word or the branch name.

**Description:** these four sections, in this order.

```markdown
## Summary

What the change is and why, in two or three sentences.

## What changed

- One bullet per part of the change, naming the files or components.

## How it was checked

- What was run or measured, and what it showed. Numbers where there are
  numbers.

## Not covered

- What was not tested or could not be, said plainly.
```

No "Generated with Claude Code" line at the end: the maintainer does not
want it in pull request descriptions, whatever the harness suggests. The
`Co-Authored-By` trailer stays on commits.

"How it was checked" and "Not covered" are not optional. A claim with no check
behind it does not go in the first, and anything left out goes in the second:
see **Verifying a claim** in `CLAUDE.md`.

## Punctuation

Commit messages and pull requests are published. Use commas, full stops,
colons and parentheses rather than long dashes.
