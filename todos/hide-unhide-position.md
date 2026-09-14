# `hide("unhide")` and `position`

Moved out of `todos/fix-plan.md`, where it was B4, on 15 September 2026. The
maintainer asked for each remaining 3.0.0 item to be examined and tested on its
own rather than done as a batch. Not planned.

## What the mixin does today

`hide` hides an element visually while keeping it available to screen readers;
`hide("unhide")` reverses that. Compiled today:

```css
/* @include hide; */
.a {
  position: absolute; width: 1px; height: 1px; padding: 0; border: 0;
  overflow: hidden; clip: rect(1px, 1px, 1px, 1px); clip-path: inset(100%);
  white-space: nowrap;
}

/* @include hide("unhide"); */
.a {
  position: static; width: auto; height: auto; overflow: visible;
  clip: auto; clip-path: none; white-space: inherit;
}
```

## What goes wrong

The usual reason to unhide is the skip link: a link hidden until it receives
keyboard focus, then shown at the top of the page. `unhide` writes
`position: static`, which puts the revealed link back into the page flow, so it
pushes the content down instead of sitting over it. T2 and T3 both had to write
`position: fixed` again after the call.

T3 also noted that `clip` in the hidden state is deprecated and does nothing
that `clip-path` beside it does not already do.

## The proposal from the fix plan

- Remove `position: static` from `unhide`, so the caller decides the position.
- Drop `clip` from both states and keep `clip-path`.

## What it would change for existing users

A declaration disappears from each state.

- Without `position: static`, an unhidden element keeps whatever position the
  cascade gives it. If the hidden state was applied by the same selector and
  unhidden on `:focus`, it stays `position: absolute` from the hidden state
  unless the caller sets a position, which is the point of the change but also
  the risk: an element that relied on returning to static flow now does not.
- Without `clip`, browsers that support only `clip` and not `clip-path` would no
  longer hide the element. Which browsers those are has to be checked.

## What was measured

Nothing in a browser. The problem comes from two agent trials and the proposal
from reading the output.

## To test before planning

- The skip-link pattern, hidden then unhidden on `:focus` and `:focus-visible`,
  in Chrome and Safari, with and without a caller's `position`.
- An element unhidden at a breakpoint rather than on focus, where returning to
  static flow may be exactly what is wanted.
- Whether an unhidden element should reset `position` to something else, such
  as `revert` or `unset`, instead of leaving it, and what each does after the
  hidden state set `absolute`.
- Screen reader behaviour of the hidden state with and without `clip`.
- Browser support for `clip-path: inset()` against the library's audience, to
  decide whether `clip` is really dead weight.

## Touches

`scss/library/_hide.scss`; `meta/hide.json`; the documentation page;
`MIGRATION.md`.
