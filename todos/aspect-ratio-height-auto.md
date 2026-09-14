# `aspect-ratio` on elements with a `height` attribute

Moved out of `todos/fix-plan.md`, where it was B8, on 15 September 2026. The
maintainer asked for each remaining 3.0.0 item to be examined and tested on its
own rather than done as a batch. Not planned.

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
