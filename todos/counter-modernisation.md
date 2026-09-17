# Modernising `counter`

Measured 14 September 2026 in Chrome 152. It replaces the reasoning in B9 of
`todos/fix-plan.md`, which turned out to be incomplete.

**Done for 4.0.0 on the `counter` branch, 17 September 2026**, after measuring
again in Chrome 152, Firefox 156 and Safari 26.6.2. See **What was done** at the
end; the sections before it are the original research.

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

## What was done

The class-free design, with one change to it: `$continue` takes the `$name` of
the list to carry on from instead of `true`.

```scss
.tips      { @include counter(upper-roman, $name: tips); }
.tips-more { @include counter(upper-roman, $continue: tips); }
.results   { @include counter($start: var(--first)); }
.faq       { @include counter("Q", decimal, $items: ".question"); }
```

- `counter-reset` on `&` unless `$continue`, `counter-increment` on
  `& > #{$items}`, the content and the block on `& > #{$items}::before`.
- `$start` writes `counter-set` on `& > *:first-child`, or
  `& > :nth-child(1 of #{$items})` with `$items`, and takes a whole number, an
  interpolated one, `var()` or a calculation.
- `$name` and `$continue` are one CSS identifier. `true`, `false`, reserved
  words, a leading digit, punctuation, a name and a different continue are all
  refused, as is an unknown keyword argument.

### Why `$continue` takes a name

With `$continue: true`, every list shared `glsCounter`. Two lists split and
interleaved on one page, A1 B1 A2 B2, gave A2 the count B1 left: 1 2, 1 2 3,
4 5, 6 7, identical in all three browsers. A reset on a sibling replaces the
earlier sibling's counter of the same name. With a name per list the same page
counted 1 2, 1 2 3, 3 4, 4 5.

### Measured, identical in all three browsers unless noted

| Case | Result |
|---|---|
| items are containers | 1 2 3 4 in Chrome and Firefox; **0 0 0 0 in Safari** |
| a container on an element inside each item | 1 2 3 4 |
| the list is a container | 1 2 3 4 |
| `$continue`, lists are containers | 1 2 3, 1 2 3 |
| `$start: 4`, lists are containers | 1 2 3, 4 5 6 |
| `$start: var(--s)` with 7, `calc(var(--s) + 1)` | 7 8 9, 8 9 10 |
| `$items`, a heading first, with and without `$start: 4` | 4 5 6, 1 2 3 |
| nested lists, own `$name` or the same | outer 1 2 3, inner 1 2 |
| an item with `counter-increment: none` | 1, none, 2 3 |
| 3.x markup with its classes, items direct children | 1 2 3 |
| A1 B1 A2 B2 with names | 12, 123, 34, 45 |
| A1 B1 C1 C2 B2 A2 | 12, 123, 1, 23, 45, 34 |
| A1 followed by three A2 parts | 1 to 8 |
| an unnamed list between A1 and A2 | A 12 34, unnamed 123 |
| A1 and A2 in separate sections | 12, 12 |
| the same with `counter-reset` on an ancestor and `$continue` on every part | 12, 123, 34, 45 |
| A2 inside a wrapper after A1 | 12 34 |
| A2 with `$start: 10` | 12, 10 11 |
| a list nested in A1's item, then A2 | 1 2 (inner 1 2) 3 4 |
| A2 before A1 in the page | 12, 12 |

Every example on the documentation page was rendered in all three browsers.

### Not covered

- Screen readers. A `::before` number is text, not a list marker; `::marker`
  was not adopted because Safari ignores `content` on it.
- A counter style defined with `@counter-style` by the user, beyond the one
  used to read the values.
