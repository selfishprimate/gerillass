# `columnizer` on `gap`

Moved out of `todos/fix-plan.md`, where it was B3, on 15 September 2026. The
maintainer asked for each remaining 3.0.0 item to be examined and tested on its
own rather than done as a batch.

**Status.** Done for 4.0.0 on the `columnizer-gap` branch, 17 September 2026,
after testing every scenario below in Chrome 152, Firefox 156 and Safari
26.6.2. **What was measured and built** at the end has the results; the
sections in between are the proposal as it was written.

## What the mixin does today

`columnizer($columns, $gutter, $fill)` lays out the children of an element as
equal flexbox columns. Compiled today, `@include columnizer(2, 32px)` inside a
breakpoint writes:

```css
@media (min-width: 768px) {
  .f { display: flex; flex-wrap: wrap; }
  .f, .f::before, .f::after,
  .f *, .f *::before, .f *::after { box-sizing: border-box; }
  .f > * {
    flex-grow: 0;
    flex-shrink: 0;
    flex-basis: calc((100% - (2 - 1) * 32px) / 2);
    margin-bottom: 32px;
  }
  .f > *:not(:last-child) { margin-right: 32px; }
  .f > *:nth-child(2n) { margin-right: 0; }
}
```

The gutter is made of margins: a right margin on every column but the last in
each row, which `:nth-child(#{$columns}n)` resets, and a bottom margin on every
column. The fill flag sets `flex-grow: 1`, so the last row stretches.

## What goes wrong

Found by the three agent trials recorded in `todos/agent-trials.md`:

1. **`box-sizing` on every descendant.** `.f *` reaches everything inside the
   columns, not only the columns, and the block is written again in every
   breakpoint the mixin is called in. (T1, T2, T3)
2. **Margins and `gap` add up.** A caller who also writes `gap` gets columns
   that overflow. T1 and T2 both wrote `gap: 0` before calling it. (T1, T2)
3. **The margin has a side.** `margin-right` is on the outer edge in a
   right-to-left page. (T3)
4. **The last row keeps its bottom margin**, and `display: flex` is repeated in
   every call. (T2)

Found while reviewing the item on 15 September 2026, not in the plan:

5. **A `var()` column count fails with a gutter.** The documentation says the
   count may be a CSS function, and `columnizer(var(--cols))` works. But
   `columnizer(var(--cols), 20px)` stops the build with Sass's own error,
   `Expected "n"`, because the reset selector becomes
   `:nth-child(var(--cols)n)`, which cannot be written. The audit did not catch
   it because it varies one argument at a time.

## The proposal from the fix plan

`gap` does what the margins and the `:nth-child` reset imitate, has no side, and
adds nothing below the last row:

```css
.f { display: flex; flex-wrap: wrap; gap: 32px; }
.f > * {
  box-sizing: border-box;
  flex: 0 0 calc((100% - (2 - 1) * 32px) / 2);
}
```

With the fill flag, `flex-grow` becomes 1. A mobile-first chain of calls would
then override only `gap` and `flex-basis`. Having no `:nth-child`, it also
removes problem 5.

The plan stays on flexbox rather than grid because the fill flag, a last row
that stretches, is a flexbox behaviour.

## What it would change for existing users

- The descendants of the container lose `box-sizing: border-box`. A card whose
  padding or border was sized on that assumption can change size.
- The columns lose their margins. A layout that styled or relied on those
  margins changes.
- The container gains `gap`, so a caller's own `gap` is no longer added on top.

Both losses have to be named in `MIGRATION.md`. It is a 3.0.0 change.

## What was measured

In Chrome 152 only, one case: three columns with a 30px gutter in a 300px box.
Today, under `dir="rtl"` the first row ends 30px short of the right edge, and
two rows of 20px make a box 100px tall because the last row keeps its bottom
margin. The `gap` version was flush in both directions and 70px tall.

## To test before planning

- Chrome and Safari; Firefox if it can be installed.
- The fill flag with a partial last row, at several column counts.
- A 1, 2, 3 column chain across breakpoints, and what a later call has to
  override.
- Right-to-left.
- A `var()` count, with and without a gutter, and a `var()` gutter.
- A realistic card layout whose inner elements have padding and borders, to see
  what losing the universal `box-sizing` does.
- A caller's own `gap` and margins on the columns.
- Nested `columnizer` calls.
- Whether the `var()` count with a gutter should be fixed before 3.0.0, since
  it is an error today, not a behaviour anyone relies on.

## Touches

`scss/library/_columnizer.scss`; the three tests in
`test/library/columnizer.spec.scss` and the one added in 2.3.1; the manifest
snapshots; the documentation page; `MIGRATION.md`.

## What was measured and built, 17 September 2026

Chrome and Firefox headless, Safari in one batch. The old output was compiled
from the library before the change, the new from the branch.

**The matrix.** One to six columns; no gutter, `0`, `20px`, `1.5rem`, `5%`,
`calc(1rem + 4px)`, `var()` and `-10px`; fill on and off; left to right and
right to left; containers 333.333px, 767.5px and 1000.3px wide, with two full
rows and an orphan. Each call was checked for the count per row, both edges
flush, the column and row gaps, equal widths, nothing under the last row, the
orphan's width with and without fill, and overflow.

| | Chrome | Firefox | Safari |
|---|---|---|---|
| old, 576 calls | 432 with issues | 432 | 432 |
| new, 432 calls | 0 | 0 | 0 |

The old issues: in right to left every row started a gutter in and the gutter
sat on the wrong side; every call with a gutter left it under the last row; and
`-10px` overflowed in right to left. An early prototype that also wrote `gap`
for `5%` and `-10px` showed why those two are now refused: rows touched with
`5%` in all three, and `-10px` was dropped and broke the rows.

**The scenarios**, old against new, all three browsers alike unless said:

| Scenario | Old | New |
|---|---|---|
| container with its own `gap: 16px` | 2 per row, overflow | 3 per row, flush |
| `gap` written after the include | 2 per row | 3 per row, rows 8px short, the widths assume 20px |
| a hidden column (`display: none`) | rows 20px short of the edge | flush |
| columns with padding and a border | fit | fit |
| input with `width: 100%` and padding inside a column, no page reset | fit | fits; with no rule for the contents at all it overflowed by 24px |
| container with `width: 100%` and padding | fits | fits; without its box-sizing it overflowed by 44px (Chrome, Firefox) |
| long unbreakable word in a column | column 457px, rows 2/3/1 | 3/3, text overflows |
| 400px image, no max-width | column 400px, rows 2/3/1 | 3/3, image overflows |
| 400px image with `max-width: 100%` | Chrome 2/3/1; Firefox and Safari 3/3 | 3/3 everywhere |
| `margin: 8px` on the columns | 2 per row | 2 per row |
| `var(--cols)` with a gutter | does not compile | 4/4, flush |
| `var()` gutter, `clamp()` gutter, fill with orphans, nested, inline-flex and grid parents | right, gutter under the last row | right |
| vertical writing mode, 400px tall | 2 per line, 140px left over | 3 per line, flush |
| chains across 400, 800 and 1200px, mobile first, desktop first, fill then not | right, gutter under the last row | right |

`min-width: 0` was measured as a variant before it went in, in Chrome and
Firefox, and went in as `min-inline-size: 0` so it holds on the main axis in a
vertical writing mode; the branch's output with it was then measured in all
three. Dropping box-sizing from the container was measured the same way, in
Chrome and Firefox only, and kept.

**box-sizing inside the columns.** The first version of the branch dropped
the rule for the contents and an input overflowed, so the maintainer asked for
it back without the old rule's side effect. It is now
`:where(.grid) *` and the pseudo-elements, which have no specificity. Measured
in all three browsers, identically: with no page reset everything fits, as
before; `input { box-sizing: content-box }` and `.field { ... }` written before
the include now win, where `.grid *` overrode them; a component with its own
`content-box` keeps it, and with the `*, *::before, *::after { box-sizing:
inherit }` pattern its children inherit it when the pattern comes after the
include and do not when it comes before, since both selectors have no
specificity and source order decides. The old rule overrode all of these.

**The site** uses `columnizer` in the footer, the testimonials and the
benefits. Compared with gerillass.com at 400, 700, 1000 and 1300px, every
column is where it was, and the lists are shorter by the gutter that used to sit
under the last row, except the benefits, whose items' own 64px bottom margin
now added to the 48px gap. That margin is now removed where `columnizer`
applies.

**Calls compared**: 17 counts × 29 gutters × 3 fill values, 1479 calls. 72 start
raising, every one a percentage or negative gutter. 276 stop raising: a
`var()`, `env()`, `attr()` or `calc()` count with a gutter, which failed with
Sass's `Expected "n"`, `Expected "even"` or `expected ")"`, and an interpolated
gutter, which the old `isGutter` check refused with a message asking for exactly
that value.

**The documentation page** gained four interface examples: a two-column form
with `width: 100%` inputs, right-to-left cards, a `var(--cols)` count with a
gutter at two counts, and a long link. All nine examples on the page were
measured in all three browsers, Chrome and Firefox at 1280px and 375px wide and
Safari in its window: every full row flush with both edges, nothing under the
last row, inputs inside their columns, and the first right-to-left card against
the right edge. The frames on the page have a border-box reset of their own, so
the form example shows the result rather than the case without one, which the
box-sizing measurements above cover.

**Not covered**: a mobile browser; right to left combined with a vertical
writing mode; `order` on the columns; a custom property holding a percentage or
a negative gutter, which cannot be checked at compile time.
