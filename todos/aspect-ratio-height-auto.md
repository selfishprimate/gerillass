# `aspect-ratio` on elements with a `height` attribute

Moved out of `todos/fix-plan.md`, where it was B8, on 15 September 2026. The
maintainer asked for each remaining 3.0.0 item to be examined and tested on its
own rather than done as a batch.

**Status.** Done for 4.0.0 on the `aspect-ratio-height` branch, 17 September
2026, with `height: auto` inside `:where()` rather than in the mixin's own rule.
**What was measured and built** at the end has the results.

## What the mixin does today

`aspect-ratio($ratio, $fit)` makes an element keep a ratio at full width.
Compiled today, `.thumb { @include aspect-ratio("16:9"); }` writes:

```css
.thumb { display: block; width: 100%; aspect-ratio: 16 / 9; border: 0; object-fit: cover; }
```

`CLAUDE.md` records the three browser measurements behind this design in 2.0.0:
`object-fit` for images, `border: 0` for iframes, and applying it to the
element itself rather than a wrapper.

## What goes wrong

Writing `width` and `height` attributes on an `<img>` is the standard advice
against layout shift. The `height` attribute becomes a definite CSS height, and
with both width and height definite the browser ignores `aspect-ratio`. The
mixin sets `width: 100%` and leaves the height alone, so the image renders at
its attribute height. All three 2.0.0 measurements used images without the
attributes, so this case was never seen. Found by T3.

Measured in Chrome 152: `@include aspect-ratio("4:3")`, a 1600×900 source, a
300px container.

| Markup | Rendered |
|---|---|
| `<img class="photo" width="1600" height="900">` | **300 × 900** |
| `<img class="photo">` | 300 × 225 |
| with the attributes, plus `height: auto` | 300 × 225 |

The same measurement found it affects iframes too: an
`<iframe width="560" height="315">`, which is what a YouTube embed code writes,
renders 300 × 315 today and 300 × 225 with `height: auto`.

## The proposal from the fix plan

Write `height: auto` beside `width: 100%`:

```scss
display: block;
width: 100%;
height: auto;
aspect-ratio: validateRatio($ratio);
border: 0;
```

and add it to the source comment as a fourth measured case.

## What it would change for existing users

Every call gains a declaration, and it does not only fix images. A height
written before the include in the same rule, or in an earlier rule, is now
overridden. Measured in Chrome 152: a `<div>` with `height: 400px` and the mixin
rendered 300 × 400 and renders 300 × 225 with the fix. A height written after
the include still wins.

Until it changes, the documentation page could say: on an element with a
`height` attribute, write `height: auto` after the include.

## What was measured

Chrome 152 only, the cases above, during the fix plan's validation. Firefox and
Safari were not tried.

## To test before planning

- Safari, and Firefox if it can be installed, for all the cases above.
- `<video>` with `width` and `height` attributes, and `<picture>`.
- An image inside a flex or grid item, where the item's own sizing may interact
  with `height: auto`.
- `$fit: null` on a plain element, where `height: auto` is the only new
  behaviour.
- A caller's `max-height` together with the fix.
- Whether the documentation note alone, without changing output, is enough
  until a major version.

## Touches

`scss/library/_aspect-ratio.scss`; `test/library/aspect-ratio.spec.scss`, all
four tests' expected blocks; the manifest snapshots; `MIGRATION.md`;
`site/content/docs/aspect-ratio.mdx`; the 2.0.0 measurement table in
`CLAUDE.md`.

## What was measured and built, 17 September 2026

The proposal's `height: auto` overrode a height set in a stylesheet. A `height`
attribute is a presentational hint, below any author rule, so a rule with no
specificity overrides the attribute and loses to every stylesheet height. The
branch writes `:where(&) { height: auto; }`.

Chrome 152 and Firefox 156 headless and Safari 26.6.2, identically, in a 300px
box, each case in its own frame, for the library before the change, the branch,
and the proposal's plain `height: auto`:

| Case | Old | `:where()` | Plain `height: auto` |
|---|---|---|---|
| img 1600×900 with attributes, 4:3 | 300×900 | 300×225 | 300×225 |
| img without attributes | 300×225 | 300×225 | 300×225 |
| iframe 560×315 with attributes, 16:9 | 300×315 | 300×169 | 300×169 |
| video 640×480 with attributes, 16:9 | 300×480 | 300×169 | 300×169 |
| img with attributes in `<picture>` | 300×900 | 300×225 | 300×225 |
| the same as a flex, column flex or grid item | 300×900 | 300×225 | 300×225 |
| div, `height: 400px` before the include | 300×400 | 300×400 | 300×225 |
| div, `height: 400px` in an earlier rule | 300×400 | 300×400 | 300×225 |
| div, `height: 400px` after the include | 300×400 | 300×400 | 300×400 |
| div, `div { height: 400px }` | 300×400 | 300×400 | 300×225 |
| img with attributes and `max-height: 150px` | 300×150 | 300×150 | 300×150 |
| div with `$fit: null` | 300×225 | 300×225 | 300×225 |

**Documentation**: a section on the attribute case with the table, the embed
example now uses the embed code's own `width` and `height`, and an image example
with its dimensions in the markup, both with the HTML shown first. The four
spec tests expect the new rule.

**Not covered**: a mobile browser; `object-fit` values other than the default
next to the attribute case; an SVG `<img>` without intrinsic dimensions.
