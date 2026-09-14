# Modernising `counter`

Measured 14 September 2026 in Chrome 152. Not decided and not planned: the
maintainer asked for more testing and evaluation before this becomes work. It
replaces the reasoning in B9 of `todos/fix-plan.md`, which turned out to be
incomplete.

## Why B9 was not enough

B9 proposed moving `counter-increment` from `.counter-item::before` to
`.counter-item`, so numbering survives when items are size containers. It was
measured on one list only. The mixin's `counter-continue` class, a list that
carries on numbering after other content, was never tried, and neither was a
container on the list wrapper rather than on the items.

## What `counter-continue` actually relies on

Continuing is not done by the classes. A counter reset on one element stays in
scope for that element's following siblings and their descendants, so a second
wrapper after the first sees the same counter and keeps counting. The classes
only choose which wrapper resets (`counter-start`) and which does not
(`counter-continue`), and which children are numbered (`counter-item`).

## The measurement

Two lists of three items, the second meant to continue from the first, so the
target is 01 to 06. Each case was rendered and read off the screen.

| # | Setup | Result |
|---|---|---|
| 1 | today's mixin output, no containers | 01 02 03, 04 05 06 |
| 2 | today, items are containers | 01 01 01, 01 01 01 |
| 3 | today, wrappers are containers | 01 01 01, 01 01 01 |
| 4 | B9's fix, increment on the item, no containers | 01 02 03, 04 05 06 |
| 5 | B9's fix, items are containers | 01 02 03, 04 05 06 |
| 6 | B9's fix, wrappers are containers | 01 02 03, 01 02 03 |
| 7 | today, middle item hidden with `::before { content: none }` | 01, blank, 02, then 03 04 05 |
| 8 | B9's fix, the same hidden item | 01, blank, 03, then 04 05 06 |
| 9 | no classes: reset on the first wrapper, increment on `> *`, no containers | 01 02 03, 04 05 06 |
| 10 | no classes, items are containers | 01 02 03, 04 05 06 |
| 11 | no classes, wrappers are containers | 01 02 03, 01 02 03 |
| 12 | reset on a common ancestor, wrappers are containers | 01 02 03, 01 02 03 |
| 13 | the second wrapper resets to 3 itself, wrappers are containers | 01 02 03, 01 02 03 |
| 14 | `counter-set: name 4` on the second list's first item, wrappers are containers | 01 02 03, 04 05 06 |
| 15 | two `<ol>`, second `start="4"`, `::marker`, the lists are containers | 01 02 03, 01 02 03 |
| 16 | two `<ol>`, second `start="4"`, `::marker`, items are containers | 01 02 03, 04 05 06 |
| 17 | two `<ol>`, second `start="4"`, `::marker`, no containers | 01 02 03, 04 05 06 |

What it shows:

- B9's fix is right for containers on the items, and continuing still works
  with it (5).
- **Nothing continues a count across wrappers that are themselves containers**
  (6, 11, 12, 13), not even a native `<ol start>` (15). Style containment keeps
  each container's counters inside it. The one thing that worked is naming the
  start number explicitly on the first item inside the container (14).
- B9's fix changes skipping. Today a hidden item's number is not used (7); with
  the fix it is (8). A way to skip an item would have to be provided and
  measured, such as `counter-increment: none` on the item. Not measured.

## A class-free design to evaluate

The mixin would number the element it is called on, with no classes in the
markup:

```scss
.list   { @include counter(decimal-leading-zero); }                  // starts a count
.list-2 { @include counter(decimal-leading-zero, $continue: true); } // carries on from the list before
.list-3 { @include counter(decimal-leading-zero, $start: 4); }      // starts at 4; the only way through a container wrapper
```

- `counter-reset` on `&`, `counter-increment` on `& > *` and the content on
  `& > *::before`. Cases 9 and 10 show this numbers and continues without
  classes.
- `$continue: true` leaves out the reset, relying on sibling scope as today.
- `$start` writes `counter-set` on `& > :first-child`, from case 14. It is the
  only form that survives a container wrapper, and it has to be a number the
  caller knows.
- `$name` for the counter, so nested and independent lists do not share
  `glsCounter`. Trial 2 claimed two nested independent counters are impossible
  today; that was never tested.
- Possibly an `$items` selector for when the numbered children are not direct
  children.

Removing the classes breaks every existing call, so this is 3.0.0 work. One
path is to keep the class-based output for a release with a `@warn`.

## Still to test and decide

- Firefox and Safari. Everything above is Chrome only.
- How to skip an item under an increment on the item, and whether that is
  worth keeping at all.
- `$start` together with `$continue`, and with lists that are not siblings.
- Whether `::marker` on real list items should be the recommended path instead
  of `::before`, for accessibility: a `::before` number is read as text by
  screen readers, a marker is announced as a list number. Needs a screen
  reader to check.
- Nested lists with separate `$name`s.
- Whether the `@content` block still belongs on `::before`, and what a
  migration from `counter-start`/`counter-item` looks like in `MIGRATION.md`.
