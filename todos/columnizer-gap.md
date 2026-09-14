# `columnizer` on `gap`

Moved out of `todos/fix-plan.md`, where it was B3, on 15 September 2026. The
maintainer asked for each remaining 3.0.0 item to be examined and tested on its
own rather than done as a batch. Not planned.

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
