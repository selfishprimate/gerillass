# Migrating to Gerillass 4.0.0

Written while 4.0.0 is being prepared, and added to as its changes land. So far
it covers `hide`, where breakpoint ranges end, `columnizer`, `before` and
`after`, `font-face`, `all-text-inputs`, `aspect-ratio`, `counter`, `text-shadow`, `text-stroke`, the background patterns,
`escape-to-parent`, `sprite`, four of the utility functions, the device maps,
`responsive-image`, `border-box`, `antialias`, `center`, `all-buttons`,
`loadify`, `stretched-link`, `text-gradient`, `text-image`, `placeholder` and
the removal of `clearfix`, `adaptive`, `reset-css`, the `$of` argument on
`only` and `except`, and `truncate`. The 3.0.0 and
2.0.0 guides follow below, unchanged.

Every claim here was checked by compiling the old call against 3.0.0's source
and the new one against 4.0.0's, and the CSS each produces was measured in
Chrome 152, Firefox 156 and Safari 26.6.2.

---

## The short version

| | |
|---|---|
| `hide(unhide)` was removed | breaking, loud |
| `hide(focusable)` was added | not breaking |
| a range or `max` ending at a breakpoint name ends just under it | breaking, silent |
| `columnizer` writes its gutter as `gap` | breaking, silent |
| `columnizer` refuses a percentage or negative gutter | breaking, loud |
| `before` and `after` with no argument write an empty `content` | breaking, silent |
| `font-face` lists only `woff2` unless told otherwise | breaking, silent |
| `all-text-inputs` excludes the non-text types instead of listing the text ones | breaking, silent |
| `aspect-ratio` holds its ratio on an element with a `height` attribute | fixes rendering; breaks only a call that relied on the attribute |
| `counter` numbers the children of its element and reads no classes | breaking, silent |
| `counter` takes `$name`, `$continue`, `$start` and `$items` | not breaking |
| `text-shadow` puts a diagonal the same distance away as a straight one | breaking, silent |
| `text-shadow` refuses a direction, colour, distance or blur a browser drops | breaking, loud |
| `text-shadow` takes an angle, a `var()` distance and `$step` | not breaking |
| `text-stroke` takes `$width` first and a `$style` | breaking, loud |
| `text-stroke` with no arguments outlines in `currentColor`, not black | breaking, silent |
| `background-dots` and `background-stripes` became `background-pattern` | breaking, loud |
| `escape-to-parent` attaches its selector to every branch of the parent | breaking, silent |
| `escape-to-parent` refuses an argument that cannot be attached | breaking, loud |
| `sprite` takes an image in any format, and reads one argument as a position | fixes refused calls; breaking, silent for a single `var()` |
| `pixelify` converts the unit instead of replacing it | breaking, silent |
| `convertToEm` returns a number rather than a string | not breaking in CSS |
| `isNumber` and `shorthandProperty` raise where they used to crash | breaking, loud |
| the phone and tablet maps hold two lengths per device, not a nested map | breaking, loud, and only for a map you replaced |
| `responsive-image` fits an image without upscaling it | breaking, silent |
| `border-box` and `antialias` write their descendants inside `:where()` | fixes a cascade defect; silent |
| `center` offsets with `translate` rather than `transform` | breaking, silent, and only if you touched its transform |
| `all-buttons` selects the input types with `input`, and adds the image button | breaking, silent |
| `loadify` leaves the element visible and only fades it in | fixes a disappearing-content defect; silent |
| `stretched-link` drops an IE10 line and writes `inset: 0` | not breaking |
| `text-gradient` and `text-image` keep their text in forced colours | not breaking |
| `text-image` takes a `$fallback` colour | not breaking |
| `placeholder` writes one rule instead of five | breaking only before 2017 |
| `clearfix` was removed | breaking, loud |
| `adaptive` skips a zero breakpoint by value, not by the name `xsmall` | fixes a lost container; no change with the default map |
| `adaptive`'s gutter defaults to `0` rather than `30px` | breaking, silent: every container is 60px wider at each step |
| `reset-css` is a modern reset rather than Meyer's 2011 one | breaking, silent, and visible |
| `only` and `except` take `$of`, the selector to count by | not breaking |
| `ellipsis` and `line-clamp` became `truncate` | breaking, loud |
| `isTime` refuses a unitless `0` and answers a list | breaking, loud |
| `loadify` refuses `0` and a second time in one argument | breaking, loud |
| `$map-for-breakpoints` has an `xxl` key at 1400px | not breaking; `adaptive` writes one more step |
| `fillNulls`'s second argument is `$separation` | not breaking; the old spelling warns |
| `tint` and `shade` refuse a list with their own message | breaking, loud, where Sass raised before |
| the length-unit and anchor pseudo-class lists gained entries | not breaking |
| a range that runs backwards or is empty stops the build | breaking, loud |
| `auto-grid` is new | not breaking |
| `reveal` is new | not breaking |
| `background-image` takes `$size`, `$position` and `$repeat` | not breaking |
| `background-image` writes no overlay when there is no filter | fixes a pointless layer; silent |
| `background-image`'s filter layer takes `pointer-events: none` | fixes text selection; silent |
| `background-image`'s filter layer follows the element's `border-radius` | fixes square corners; silent |
| `background-image` lifts the children inside `:where()` | fixes a cascade defect; silent |
| `background-image(none)` writes `none`, not `url(none)` | fixes a 404 request; silent |
| `background-image` warns on a direction with one colour | not breaking |
| `background-pattern` takes `$style: line` for the isometric grid | not breaking |

The first break stops the build with a message naming both replacements. The
second compiles and changes where a query stops, so read its section. To find
every call either one touches:

```bash
grep -rn "unhide" --include=*.scss .
grep -rnE "(breakpoint|remove|container-query)\(" --include=*.scss .
grep -rn "columnizer(" --include=*.scss .
grep -rnE "include (gls-)?(before|after)( |;|\{|\(\))" --include=*.scss .
grep -rn "font-face(" --include=*.scss .
grep -rn "all-text-inputs\|list-of-text-inputs" --include=*.scss .
grep -rn "counter(" --include=*.scss .
grep -rn "counter-start\|counter-continue\|counter-item" .
grep -rn "text-shadow(" --include=*.scss .
grep -rn "text-stroke(" --include=*.scss .
grep -rn "background-dots\|background-stripes" --include=*.scss .
```

---

## Break: `hide(unhide)` was removed

`unhide` undid `hide` by writing `position: static`, `width: auto`,
`height: auto` and the rest back. It could not give back what `hide` had
overwritten, so every call to it lost the element's own position, padding and
border. There are two cases it was used for, and each has a replacement that
overwrites nothing.

### Shown on keyboard focus

```scss
// 3.x
.skip-link {
  @include hide;

  &:focus {
    @include hide(unhide);
    position: fixed;
    top: 1rem;
    left: 1rem;
    padding: 0.75rem 1rem;
  }
}

// 4.0.0
.skip-link {
  position: fixed;
  top: 1rem;
  left: 1rem;
  padding: 0.75rem 1rem;
  @include hide(focusable);
}
```

`focusable` hides the element only while neither it nor anything inside it has
focus, as `.skip-link:not(:focus-within):not(:active)`, so the element's own
styles apply untouched once it has. Two things change in the result, and both
were measured:

- **A click on the revealed link now works in Safari.** Safari does not focus
  a link on click, so with the 3.x form the link hid again on mouse-down and
  the click was lost. `:active` holds it open. Chrome and Firefox behaved the
  same with either form.
- **A container of skip links can be revealed as a whole**, because
  `:focus-within` matches while any link inside has focus. `unhide` on
  `:focus` never showed a container, since the container itself is not what
  gets focus.

Without the declarations written again after `unhide`, the 3.x form showed the
link `static`, with no padding or border, and pushed the page down; in the
measurement, by 22px. The 4.0.0 form has nothing to write again.

### Hidden only at some widths

```scss
// 3.x
.nav-label {
  padding: 4px 8px;
  @include hide;

  @media (min-width: 600px) {
    @include hide(unhide);
  }
}

// 4.0.0
.nav-label {
  padding: 4px 8px;

  @media (max-width: 599.98px) {
    @include hide;
  }
}
```

Put the hiding inside the query for the widths where the element is hidden,
instead of hiding it everywhere and undoing it outside them. With the 3.x form
the label came back at 600px and wider with no padding, no border and
`position: static`, in all three browsers; with the 4.0.0 form it keeps its
own styles, since nothing overwrote them. The query is the opposite of the old
one, so check its boundary: `max-width: 599.98px` ends just under the
`min-width: 600px` that used to start the undo.

---

## Break: a range or `max` ending at a breakpoint name ends just under it

This changes what compiles without an error, so it is the one to read even if
the build passes. It affects `breakpoint`, `remove`, which is built on it, and
`container-query`, and only where a range, or `max`, ends at a name from
`$map-for-breakpoints`. `min`, `only`, one size on its own, and any length you
wrote yourself compile as before.

| Call | 3.x | 4.0.0 |
|---|---|---|
| `breakpoint(max, medium)` | `(max-width: 768px)` | `(max-width: 767.98px)` |
| `breakpoint(small, medium)` | `(min-width: 576px) and (max-width: 767px)` | `(min-width: 576px) and (max-width: 767.98px)` |
| `breakpoint(between, 500px large)` | `... and (max-width: 991px)` | `... and (max-width: 991.98px)` |
| the same with a `rem` map | `(max-width: 47rem)` | `(max-width: 47.99rem)` |
| `remove(max, medium)`, `remove(small, medium)` | as `breakpoint` | as `breakpoint` |
| `container-query(max, medium)` | `(max-width: 768px)` | `(width < 768px)` |
| `container-query(small, medium)` | `(min-width: 576px) and (max-width: 768px)` | `(min-width: 576px) and (width < 768px)` |
| `breakpoint(max, 768px)`, `container-query(max, 399px)` | unchanged | unchanged |
| `breakpoint(max, xsmall)`, where the name is `0` | unchanged | unchanged |

### Why

Measured in Chrome 152, Firefox 156 and Safari 26.6.2, at viewport and
container widths from 575px to 1000px with fractions near every name, and at
real fractional viewports with the display scaled from 110% to 175% in Chrome
and Firefox:

- **`max` and `min` at the same name both applied at that width**, in all
  three browsers, for `@media` and `@container`.
- **A range ending 1 below a name left gaps.** Chrome and Firefox lay out
  fractional viewports, and at 767.5px, or 767.27px with the display scaled to
  110%, neither `small, medium` nor `medium, large` applied. Safari rounds
  viewports to whole pixels and showed no gap.
- **With a `rem` map, 1 below `48rem` is `47rem`, 16px short**, and nothing
  applied from 752px to 768px in all three.
- **`container-query` subtracted nothing**, so neighbouring ranges both
  applied to a container exactly at a name.

With the 4.0.0 output, compiled from the library and tested the same way, no
range overlapped and none left a gap in any of the three, with one exception:
Chrome treats container widths within about 1/64px of a boundary as equal, so
a container 767.984375px wide matches both ranges there. No way of writing
the end avoids that.

`@media` subtracts 0.02px (0.01 of a unit in `rem` or `em`) rather than using
range syntax, which measured as clean too, because Safari only supports range
syntax in media queries from 16.4 and drops the whole rule before that.
`@container` uses range syntax, which every browser has had since it shipped
container queries, because containers are laid out in 1/60px steps in Firefox
and 1/64px in Safari, and a `767.98px` end left a container between it and
768px in no range.

### What to check

- **A rule that relied on `max` including the name.** At exactly 768px,
  `breakpoint(max, medium)` no longer applies. If a stylesheet paired it with
  `min, medium`, that is the fix; if it expected the narrow styles at exactly
  768px, end the range with a length instead, `breakpoint(max, 768px)`.
- **Ends you corrected by hand.** A range such as `breakpoint(small, 767.98px)`
  or `breakpoint(max, 991.98px)`, written to work around the old output, still
  compiles as written and can go back to the name.
- **A length end in a range you wrote yourself** is not changed, so
  `breakpoint(between, small 1199px)` still leaves a gap just under 1200px,
  as a `767px` end did at 767.5px. Write `1199.98px`.

---

## Break: `columnizer` writes its gutter as `gap`

The layout it draws is the same, one to six columns measured, but it is built
differently, and three things around it behave differently.

```css
/* 3.x: @include columnizer(3, 20px) */
.grid { display: flex; flex-wrap: wrap; }
.grid, .grid::before, .grid::after,
.grid *, .grid *::before, .grid *::after { box-sizing: border-box; }
.grid > * { flex-grow: 0; flex-shrink: 0; flex-basis: calc((100% - (3 - 1) * 20px) / 3); margin-bottom: 20px; }
.grid > *:not(:last-child) { margin-right: 20px; }
.grid > *:nth-child(3n) { margin-right: 0; }

/* 4.0.0 */
.grid { display: flex; flex-wrap: wrap; gap: 20px; box-sizing: border-box; }
.grid > * { box-sizing: border-box; flex-grow: 0; flex-shrink: 0; min-inline-size: 0; flex-basis: calc((100% - (3 - 1) * 20px) / 3); }
:where(.grid)::before, :where(.grid)::after,
:where(.grid) *, :where(.grid) *::before, :where(.grid) *::after { box-sizing: border-box; }
```

### What it fixes

Measured in Chrome 152, Firefox 156 and Safari 26.6.2, on 432 calls from one to
six columns with every kind of gutter, at fractional container widths, left to
right and right to left, the 4.0.0 output lined every row up with both edges and
left nothing under the last row, in all three. The 3.x output:

- put the gutter on the wrong side in a right-to-left page, so rows started a
  gutter in from the edge;
- left a gutter under the last row, as a bottom margin;
- pushed a column onto the next row when the container also had a `gap`;
- misaligned every row after a hidden column, because `:nth-child` counts it;
- did not compile for `columnizer(var(--cols), 20px)`, with Sass's own
  `Expected "n"`, nor for an interpolated gutter such as `#{$n}px`;
- let one long word or wide image widen its column and push the row out of
  shape, in Chrome even for an image with `max-width: 100%`;
- laid out three per line as two in a vertical writing mode.

### What to check

- **A margin on the columns now adds to the gap.** The 3.x margins overrode a
  column's own `margin-bottom` or `margin-right` of the same specificity
  written before them. This site had exactly that: a list with a 64px bottom
  margin on its items showed 48px rows under 3.x and 112px under 4.0.0, until
  the margin was removed where `columnizer` applies. Remove column margins that
  were only there for spacing.
- **A `box-sizing` your page sets inside the columns is now kept.** Everything
  inside the columns is still border-box, so an input with `width: 100%` and
  padding still fits, but the rule is inside `:where()` and has no specificity.
  Until 4.0.0 `.grid *` overrode an `input { box-sizing: content-box }` rule, or
  a class written before the include, and now the page's rule wins. Measured
  the same in all three browsers.
- **Long content overflows its column instead of widening it.** Add
  `overflow-wrap: anywhere` to text or `max-width: 100%` to images where that
  shows.
- **A `gap` written after the include** replaces the gutter the widths were
  computed with, and rows end short of the edge. Pass the gutter to the mixin.

## Break: `columnizer` refuses a percentage or a negative gutter

Both worked through the margins. As a `gap`, a percentage row gap is a share of
the container's height, which a wrapping row does not have, so the rows touched
in all three browsers; a negative `gap` is invalid, the browser dropped it and
the columns no longer fitted their rows. Both now stop the build and say why.

| 3.x | 4.0.0 |
|---|---|
| `columnizer(3, 5%)` | a length, such as `columnizer(3, 2rem)`, or `3vw` to follow the viewport |
| `columnizer(3, -10px)` | no equivalent; overlapping columns need margins written by hand |

A custom property holding a percentage or a negative length is not checked,
since its value is only known in the browser.

---

## Break: `before` and `after` with no argument write an empty `content`

A pseudo-element with no `content` is not drawn, so until 4.0.0
`@include after { width: 8px; height: 8px; background: red; }` drew nothing.
With no argument, or `null`, both mixins now also write:

```css
:where(.a)::after { content: ""; }
```

`:where()` gives it only the pseudo-element's specificity, so it fills in when
nothing else sets `content` and loses to anything that does. A call with an
argument compiles as before: 184 calls with every kind of argument, with and
without a block, compiled the same, and only the 32 with no argument changed.

### What was measured

Chrome 152, Firefox 156 and Safari 26.6.2, identically, for both mixins. A block
of styles alone is now drawn. A `content` still wins when it is written in the
block, or in a rule for the element with a class or an element selector, before
or after the include, and `content: none` written elsewhere still hides it.

### What to check

- **`content` that comes only from another state.** A tooltip styled in the
  block, with its text added by `.a:hover::after { content: attr(data-tip); }`,
  or a label added inside a media query, was invisible the rest of the time. It
  is now drawn empty the rest of the time, with its padding and background.
  Measured: a 20px box appeared. Write `content: none` in the block, and the
  other state's rule, which is more specific, still sets it.
- **A `q` element.** The browser draws its quotation marks as `::before` and
  `::after`, and `q { @include before { color: red; } }` now replaces them
  with nothing. Write `content: open-quote` (or `close-quote` for `after`) in
  the block.
- **A bare `::after { content: ... }` rule** written before the include loses,
  since both have the same specificity and the later one wins. Written after
  the include, or with a class or element in front, it wins.

---

## Break: `font-face` lists only `woff2` unless told otherwise

`$file-formats` defaulted to `eot woff2 woff ttf svg`, and now defaults to
`woff2`. A call that passes formats compiles as before; of 36 calls compared,
only the 18 without formats changed.

```css
/* @include font-face("Inter", "/fonts/inter"); */

/* 3.x */
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter.eot");
  src: url("/fonts/inter.eot?#iefix") format("embedded-opentype"),
       url("/fonts/inter.woff2") format("woff2"),
       url("/fonts/inter.woff") format("woff"),
       url("/fonts/inter.ttf") format("truetype"),
       url("/fonts/inter.svg#Inter") format("svg");
  font-style: normal;
  font-weight: 400;
}

/* 4.0.0 */
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
}
```

### Why

Measured with one font converted to all five formats. In Chrome 152, Firefox
156 and Safari 26.6.2, none loaded the EOT, only Safari loaded the SVG font,
and given the five-format list all three requested the `.woff2` and nothing
else. With only a `.woff2` on disk, the five-format list made webpack 5,
esbuild 0.28 and Parcel 2.16 fail to build on the missing `.eot`, and Vite 7
built with four broken `url()`s left in the CSS. With `woff2` alone all four
built clean.

### What to check

- **A project that ships only `.woff` or `.ttf`** and passes no formats gets no
  font now. The old list fell back to them when the `.woff2` was missing, and
  all three browsers loaded the `.woff`; with `woff2` alone they loaded
  nothing, and nothing says so. Pass what you ship:
  `@include font-face("Inter", "/fonts/inter", $file-formats: woff2 woff);`.
- **A browser older than WOFF2**, before Chrome 36, Firefox 39 and Safari 10,
  gets the fallback font unless you list `woff` too.

---

## Break: `all-text-inputs` selects by exclusion

`$list-of-text-inputs`, and the selector `all-text-inputs` writes from it, used
to list fourteen `type` values, `input:not([type])` and `textarea`. It is now:

```css
:where(input):not([type=button], [type=checkbox], [type=color], [type=file],
  [type=hidden], [type=image], [type=radio], [type=range], [type=reset],
  [type=submit]),
textarea
```

### What was measured

Every kind of form control, 27 in all, given the same text-field styles in
Chrome 152, Firefox 156 and Safari 26.6.2, with the old selector and the
compiled new one:

- **`[type=color]` is no longer styled.** With the old list its swatch was
  stretched into a thin bar inside a text box in all three.
- **An `input` with a `type` the browser does not know is now styled.** All
  three draw `type="foo"` as a text field, and the old list missed it. The
  removed `datetime`, which the old list named, is covered the same way.
- **Every other control is unchanged**: the text types, the date and time
  pickers, an untyped input and `textarea` styled as before, and range, file,
  checkbox, radio, the buttons and `select` left alone as before. `:focus` and
  `:focus-visible` states followed the same split.

### What to check

- **A colour picker you styled on purpose** through the mixin needs a rule of
  its own now.
- **Specificity.** A typed input is matched at the same specificity as the old
  `[type='text']`, one attribute. An input with no `type` was `input:not([type])`,
  one element higher, and is now matched like the typed ones, so a rule of equal
  weight written later can win where it did not.
- **A `type` attribute on something other than an input**, such as a
  hypothetical `<div type="text">`, was matched by the old `[type='text']` and
  is not now.
- **A replaced `$list-of-text-inputs`** still works: the mixin writes whatever
  list you pass, and the output of a custom list is unchanged.

---

## Change: `aspect-ratio` holds its ratio against a `height` attribute

Every call gains one rule:

```css
:where(.thumb) { height: auto; }
```

An `<img width="1600" height="900">`, or an embed code's
`<iframe width="560" height="315">`, has a definite height from its attribute,
and with `width: 100%` the browser ignored the ratio. Measured in Chrome 152,
Firefox 156 and Safari 26.6.2, in a 300px box:

| Element | 3.x | 4.0.0 |
|---|---|---|
| `<img>` with `width` and `height`, ratio 4:3 | 300 × 900 | 300 × 225 |
| the same in `<picture>`, a flex item, a column flex item or a grid item | 300 × 900 | 300 × 225 |
| `<iframe width="560" height="315">`, ratio 16:9 | 300 × 315 | 300 × 169 |
| `<video width="640" height="480">`, ratio 16:9 | 300 × 480 | 300 × 169 |
| an element with no `height` attribute | unchanged | unchanged |

### What to check

- **A `height` your stylesheet sets is kept.** `:where()` has no specificity,
  so a height written before the include, after it, in an earlier rule or
  through an element selector wins, as before: a `<div>` with `height: 400px`
  stayed 400px tall in all three. A `max-height` still applies.
- **A `height` attribute meant to override the ratio** no longer does. Move
  that height into CSS.
- **`height: auto` written after the include** as a workaround can go.

---

## Break: `counter` numbers the children of its element, with no classes

3.x read three classes in the markup. 4.0.0 reads none: it numbers the direct
children of the element it is included in.

```css
/* 3.x, from .list { @include counter; } */
.list.counter-start { counter-reset: glsCounter; }
.list.counter-start .counter-item::before,
.list.counter-continue .counter-item::before {
  content: counter(glsCounter);
  counter-increment: glsCounter;
}

/* 4.0.0 */
.list { counter-reset: glsCounter; }
.list > * { counter-increment: glsCounter; }
.list > *::before { content: counter(glsCounter); }
```

The style and the text around the number are passed as before, and the block
still styles the `::before`.

### Why

3.x incremented the counter inside each item's `::before`. Once the items were
containers (`container-type`), style containment kept that increment inside
the item, and every item showed 1. Measured in Chrome 152, Firefox 156 and
Safari 26.6.2. 4.0.0 increments on the item itself, which Chrome and Firefox
count correctly. Safari still does not: see the last point under **What to check**.

### Moving a list across

```scss
// 3.x: <div class="list counter-start"><div class="counter-item">…
.list { @include counter(decimal-leading-zero); }

// 4.0.0: <div class="list"><div>…
.list { @include counter(decimal-leading-zero); }
```

The Sass for a list that starts a count does not change. Markup whose items
are all direct children of that element keeps working with the classes still
in it, which was measured: they are read by nothing and can be removed.

A list that continued with `counter-continue` needs a name on the list it
continues, and `$continue` with that name:

```scss
// 3.x: <div class="list counter-start">…</div> <figure/> <div class="list counter-continue">…</div>
.list { @include counter; }

// 4.0.0: <ol class="tips">…</ol> <figure/> <ol class="tips-more">…</ol>
.tips      { @include counter($name: tips); }
.tips-more { @include counter($continue: tips); }
```

`$continue` takes a name rather than `true` on purpose. Every list without a
name shares one counter, so with two split lists interleaved on a page, the
second part of one carried on from the other: steps 1 2, notes 1 2 3, then
steps 4 5 instead of 3 4. With a name each, all three browsers counted every
part correctly, split once or three times.

### What to check

- **Every direct child is numbered now.** A heading, an image or an ad inside
  the list element, which 3.x skipped because it had no `counter-item`, takes a
  number. Pass `$items` with a selector for the items, such as
  `$items: ".step"`.
- **Items that were not direct children**, `counter-item` deeper inside the
  list element, are no longer numbered. Include the mixin on their own parent,
  or pass `$items`.
- **A hidden item still spends a number.** 3.x skipped an item whose `::before`
  had `content: none`; since the count now advances on the item, write
  `counter-increment: none` on it as well.
- **Parts in separate sections** restart at 1. Reset the
  counter on an element around all of them, `.article { counter-reset: tips; }`,
  and give every part `$continue: tips`.
- **A list that is a container** cannot carry a count on to the next one in any
  browser. Pass `$start` with the first number instead, which
  works there.
- **In Safari, an item that is itself a container** shows 0, where 3.x showed
  1. Put `container-type` on an element inside the item, which numbers
  correctly in all three browsers.

---

## Change: `text-shadow` measures every direction as an angle

A direction may now be an angle, and the eight keywords are the 45 degree steps
of that same circle, measured from the top and clockwise, as `gradient`
measures them. The offsets are the sine and cosine of the angle, so a shadow
sits the same distance from the text whichever way it points.

| Call | 3.x | 4.0.0 |
|---|---|---|
| `text-shadow(top red 5px)` | `0 -5px red` | unchanged |
| `text-shadow(bottom red 5px)` | `0 5px red` | unchanged |
| `text-shadow(left red 5px)` | `-5px 0 red` | unchanged |
| `text-shadow(right red 5px)` | `5px 0 red` | unchanged |
| `text-shadow(bottom-right red 5px)` | `5px 5px red` | `3.5355px 3.5355px red` |
| `text-shadow(top-left red 5px)` | `-5px -5px red` | `-3.5355px -3.5355px red` |
| `text-shadow(30deg red 10px)` | `Invalid index` | `5px -8.66px red` |

**Only the four diagonals change.** A diagonal used to write the distance on
both axes, which put the shadow 1.414 times further out than a straight one at
the same number. To keep the old look, multiply the distance by `0.7071`, or
write the diagonal as the angle it is and the distance you want.

```scss
// 3.x
.a { @include text-shadow(bottom-right rgb(0 0 0 / 0.35) 5px); }

// 4.0.0, same rendering
.a { @include text-shadow(bottom-right rgb(0 0 0 / 0.35) 7.071px); }
```

Filled shadows, `true`, follow the same line, so a long shadow drawn with a
diagonal is now shorter by the same factor.

## Change: a filled `text-shadow` steps in pixels

`true` fills the gap between the text and its shadow with one layer per step,
and the default step used to be one of the distance's own unit. In `px` that is
one pixel, which is what the mixin was written for. In anything else it is
nonsense: `2rem` drew two copies eleven pixels apart, `3ch` drew three, and
`1cm` drew a single layer, so a filled shadow in any unit but the pixel was a
row of ghosts rather than a block.

```scss
.title {
  @include text-shadow(bottom-right #f43f5e 2rem true);
}
```

That call wrote two layers and now writes forty. The default step is one pixel,
and a fortieth of the distance where the unit cannot be converted here, which
is the rule `long-shadow` uses. Sass converts between the absolute units, so
`pt`, `cm`, `in`, `mm`, `pc` and `Q` take the pixel as well; `rem`, `em`, `ch`,
`ex` and the viewport units take the fortieth.

**Nothing changes for a shadow measured in pixels.** Seventeen calls were
compiled before and after: the ten in `px`, the two that pass `$step`, the one
with a zero distance, the unfilled ones and the `gls-` twin came out byte for
byte identical, and the seven in another unit are the ones this fixes. All
seventeen were then read back in Chrome 152, Firefox 156 and Safari 26.6.2:
every declaration is kept and the three browsers agree on the layer count.

A call that wants the old, sparse look passes the step it wants:

```scss
.title {
  @include text-shadow(bottom-right #f43f5e 2rem true, $step: 1rem);
}
```

---

## Break: `text-shadow` refuses what a browser drops

One broken layer drops the whole `text-shadow` declaration, so these were
shadows that never appeared. Measured in Chrome 152, Firefox 156 and Safari
26.6.2: every value in the table computes to `none` in all three.

| Call | 3.x wrote | 4.0.0 |
|---|---|---|
| `text-shadow(top red -5px)` | `0 --5px red` | raises: point the shadow the other way |
| `text-shadow(top red 5)` | `0 -5 red` | raises: a unitless number is not a length |
| `text-shadow(top red 5px -2px)` | `0 -5px -2px red` | raises: a blur cannot be negative |
| `text-shadow(top notacolor 5px)` | `0 -5px notacolor` | raises: not a colour |
| `text-shadow(top red 5px, sideways blue 3px)` | `0 -5px red`, the second group dropped in silence | raises: names the directions |
| `text-shadow(sideways red 5px)` | Sass's `() isn't a valid CSS value` | raises with the library's message |
| `text-shadow(top red 5px 2px maybe)` | `0 -5px 2px red`, the flag ignored | raises: the fill flag must be `true` |
| `text-shadow()` | Sass's `Invalid index 1` | raises: it needs at least one shadow |

Three calls that used to fail now work: an upper-case keyword such as
`TOP red 5px`, a distance in a unit that does not divide into whole steps,
`top red 1.5rem true`, and a distance the browser resolves,
`top red var(--size)`, which is written as a `calc()` holding the sine and
cosine.

## Added: `$step`

A filled shadow draws one layer per step, and the step used to be one unit of
the distance's own unit: 40 layers for `40px`, three for `3em`. `$step` sets it,
in the same unit as the distance.

```scss
.a { @include text-shadow(bottom-right #fbbf24 3rem true, $step: 0.125rem); }
```

`$step` cannot fill a `var()` distance, since the layers are counted while the
stylesheet compiles, and a `$step` with no filled group raises rather than
doing nothing.

---

## Break: `text-stroke` takes the width first, and a `$style`

```scss
// 3.x
@mixin text-stroke($fallback-color: black, $color: transparent, $stroke-color: black, $stroke-width: 1px)

// 4.0.0
@mixin text-stroke($width: 1px, $color: currentColor, $style: hollow, $fill: null)
```

Every old call raises, since a colour in the first position is not a width, so
nothing changes silently except a call with no arguments at all.

| 3.x | 4.0.0 |
|---|---|
| `text-stroke(black, transparent, red, 2px)` | `text-stroke(2px, red, hollow, black)` |
| `text-stroke(#fde047, #fde047, #1d4ed8, 3px)` | `text-stroke(3px, #1d4ed8, center, #fde047)` |
| `text-stroke` | `text-stroke`, now `currentColor` rather than black |

The one silent change is that bare call: 3.x wrote `color: black`, so text that
inherited another colour turned black. 4.0.0 leaves the colour alone and
outlines in `currentColor`. Pass the colour if black was what you wanted:
`text-stroke(1px, black)`.

`center` is the old rendering of a filled call. The old mixin also wrote
`-webkit-text-fill-color` with the fill colour, where 4.0.0 writes `color`, so
an element that inherits a `-webkit-text-fill-color` from an ancestor needs
`$style: hollow` or its own fill.

## Added: `$style`, and an outline that keeps the letterform

`-webkit-text-stroke` centres the outline on the edge of the glyph, so half of
it is painted over the letter. Measured at 200px in Chrome 152, Firefox 156 and
Safari 26.6.2, with the ink counted on a canvas:

| Drawn | Letter's own ink | Outline's ink |
|---|---|---|
| no outline | 11213px | 0px |
| centred 20px | 3174px | 15915px |
| centred 40px | 0px | 28074px |
| outside 20px | 10517px | 8023px |
| outside 40px | 10517px | 17006px |

`$style: outside` writes `paint-order: stroke fill`, which all three support,
and doubles the width, since half of the outline is then hidden behind the
letter: the last row matches a centred 20px stroke's ink while the letter
survives whole.

```scss
.hero-title { @include text-stroke(3px, #0f172a, outside, #fff); }
```

A `var()` width is doubled in CSS, `calc(2 * var(--w))`, and a keyword width,
`thin`, `medium` or `thick`, raises with `outside`, since a keyword cannot be
doubled.

## Break: `text-stroke` refuses what a browser drops

Unchanged from 3.x, and now with the width in a new place: a colour that is not
a colour, a quoted colour, two colours side by side, a percentage, a negative
width and a unitless number all raise. `$style` is checked as well, so a typo
such as `inside` names the three that exist.

---

## Break: `background-dots` and `background-stripes` became `background-pattern`

Both are removed, as `linear-gradient` and `radial-gradient` were in 3.0.0, and
a call to either stops the build with Sass's `Undefined mixin`. One mixin now
draws twenty patterns, and its arguments are named rather than positional.

| 3.x | 4.0.0 |
|---|---|
| `background-dots` | `background-pattern(dots)` |
| `background-dots(red)` | `background-pattern(dots, $color: red)` |
| `background-dots(red, 4px, 20px)` | `background-pattern(dots, $color: red, $thickness: 4px, $size: 20px)` |
| `background-dots(red, 4px, 20px, false)` | `background-pattern(dots, $color: red, $thickness: 4px, $size: 20px, $stagger: false)` |
| `background-stripes(red, 12px)` | `background-pattern(stripes, $color: red, $thickness: 12px)` |
| `background-stripes(red, 12px, 90deg)` | `background-pattern(stripes, $color: red, $thickness: 12px, $angle: 90deg)` |
| `background-stripes(red, 12px, 45deg, "/a.jpg")` | `background-pattern(stripes, $color: red, $thickness: 12px, $angle: 45deg, $image: "/a.jpg")` |

**The names of the two size arguments swapped places.** In `background-dots`,
`$size` was the dot and `$gutter` the tile; here `$size` is the tile for every
pattern and `$thickness` is the dot, the line or the mortar inside it. Read an
old call right to left when you move it.

`$rotation` is `$angle`, and it still takes a unitless number as degrees.

**`stripes` now reads its line and its period apart.** `$thickness` is the
line, as `background-stripes`'s `$size` was, and `$size` is one line plus its
gap, so a 1px line on a 10px tile is `$size: 10px, $thickness: 1px`, which the
old mixin could not be asked for. A call that passes no `$size` keeps the even
stripe it drew.

### What else changed

- **An image now sits in the background layers.** `background-dots` put it in a
  `::before` at `z-index: -1`, where an ancestor's own background could cover
  it; `background-stripes` layered it as a second background. Both now write
  the image as the last layer, with `cover` and `center`, and no pseudo-element
  is created, so a `::before` of your own is free again.
- **Only longhands are written.** `background-image`, `background-size`,
  `background-position`, `background-repeat`, and `background-color` when
  `$background` is passed. Nothing resets a background colour set before the
  include.
- **The default colours follow the text.** Where the old mixins fell back to
  `rgba(0, 0, 0, 0.1)`, the new one uses `currentColor` mixed with
  transparency, which works on either colour scheme. Pass `$color` for the old
  look.
- **Dots are staggered by default**, as before, and the two layers now sit half
  a tile apart rather than at a half and a double offset, so the arrangement is
  even. `$stagger: false` is the old `$diagonal: false`.

### The eighteen new patterns

Fifteen that tile: `grid`, `checkerboard`, `crosshatch`, `zigzag`, `chevron`,
`triangles`, `isometric`, `honeycomb`, `brick`, `waves`, `houndstooth`,
`gingham`, `harlequin`, `sunburst` and `concentric`, each one include. And
three that light the whole box rather than tiling, which is what the premium
marketing pages put behind a hero: `glow`, one ellipse of light, `vignette`,
the same gradient turned round so the colour sits at the edges, and `mesh`,
three or four blobs of colour. Those three read `$origin`, where the light
comes from, and their `$size` is how far it reaches rather than a tile.
`sunburst` and `concentric` read `$origin` too, since they are drawn from a
point as well: from the top edge a sunburst is beams fanning down, and an
off-centre `concentric` reads as a contour map.

All twenty were drawn in Chrome 152, Firefox 156 and Safari 26.6.2, and the
three lay them out identically; Firefox draws a hard diagonal edge with visible
stair steps where the other two smooth it, which shows in `zigzag`, `chevron`
and `triangles`.

In forced colours mode a browser replaces `background-image` with `none` for
anything that is not a `url()`, so every pattern disappears there. This was true
of the old two as well, and it is now written down: a pattern is decoration.

---

## Break: `escape-to-parent` writes real selectors

Until 4.0.0 the whole mixin was one line, `@at-root #{$selector}#{&}`, which
reads the parent as text and pastes the argument onto the front of it. It now
parses both sides with `sass:selector`, so the argument reaches every branch of
the parent and lands on the element rather than beside it.

Three shapes change, and none of them raised before:

| The rule | 3.x wrote | 4.0.0 writes |
|---|---|---|
| `.c, .d { .b { … } }` with `".theme"` | `.theme.c .b, .d .b` | `.theme.c .b, .theme.d .b` |
| `ul li` with `".theme"` | `.themeul li` | `ul.theme li` |
| `.card` with `".theme, .other"` | `.theme, .other.card` | `.theme.card, .other.card` |

The first is the one to look for in a stylesheet: the second half of that list
applied with no theme at all, so a rule meant for one theme was painting every
page. The second matched nothing, since no element is called `themeul`. The
third left a bare `.theme` that painted every element carrying the class.

**A call that cannot be written now raises.** Two element selectors cannot
match the same element, so `ul li` with `"html"` or `"body.theme"` stops the
build rather than writing `htmlul li`. Pass a class or an id, or pass the
ancestor with it: `"body.theme .inner"` keeps its own ancestors and attaches
only its last part. An `&` in the argument, an empty string, a selector ending
in a combinator, a call with no argument and a call outside any rule raise as
well, each with a message naming what to pass.

To find every call:

```bash
grep -rn "escape-to-parent(" --include=*.scss .
```

Nothing changes for the ordinary case, a single class on a single parent:
`.a .b` with `".theme"` is `.theme.a .b` as before.

---

## Break: `sprite` tells an image from a position by what it is

With one argument the mixin has to decide whether it was given the sheet or a
position, and both can be strings. It used to read the last four characters and
take `.png`, `.jpg` or `.svg` as the path, which refused every other format a
browser loads.

These all raised in 3.x and work now:

```scss
.icon { @include sprite("/img/sprite.webp"); }
.icon { @include sprite("/img/sprite.avif"); }
.icon { @include sprite("/img/sprite.gif"); }
.icon { @include sprite("/img/sprite.jpeg"); }
.icon { @include sprite("/img/Sprite.PNG"); }
.icon { @include sprite("/img/sprite.png?v=2"); }
.icon { @include sprite("data:image/svg+xml;base64,…"); }
.icon { @include sprite(url("/img/sprite.png")); }
.icon { @include sprite(center); }
```

The one thing to check in an existing stylesheet is a **single `var()`**:
`sprite(var(--x))` was refused before and is now read as the position, since
that is what one `var()` usually is. For an image in a custom property, pass a
position with it:

```scss
.icon { @include sprite(var(--sprite), 0 0); }
```

A quoted position is unquoted rather than refused, because
`background-position: "center"` is dropped: measured in Chrome 152, Firefox 156
and Safari 26.6.2, all three fall back to `0% 0%`.

---

## Break: `pixelify` converts the unit

It used to throw the unit away and write `px` in its place, which was wrong for
every unit except `px` itself:

| Call | 3.x | 4.0.0 |
|---|---|---|
| `pixelify(24)` | `24px` | `24px` |
| `pixelify(2rem)` | `2px` | `32px` |
| `pixelify(1in)` | `1px` | `96px` |
| `pixelify(12pt)` | `12px` | `16px` |
| `pixelify(10mm)` | `10px` | `37.7952755906px` |
| `pixelify(2em)` | `2px` | raises |
| `pixelify(50%)` | `50px` | raises |
| `pixelify(10vw)` | `10px` | raises |
| `pixelify(10deg)` | `10px` | raises |

The absolute units are exact, and `rem` is converted against a 16px root, the
same assumption `remify` and `convertToEm` make. `em`, `%` and the viewport
units raise, since each is measured against something only the browser knows.
The three figures above were measured in Chrome 152, Firefox 156 and Safari
26.6.2, where `2rem` is 32px, `1in` is 96px and `12pt` is 16px in all three.

---

## Change: three utilities stop the build with a message

Each of these ended in Sass's own error, or in silence, and each now raises
with a message naming the argument:

| Call | 3.x | 4.0.0 |
|---|---|---|
| `isNumber("a")` | a warning, then `Function finished without @return` | the library's message |
| `shorthandProperty(())` | `Function finished without @return` | the library's message |
| `shorthandProperty((a: 1, b: 2))` | `a 1 b 2 a 1 b 2` | the library's message |
| `convertToEm(24px)` | the string `1.5em` | the number `1.5em` |

`convertToEm` writes the same CSS as before; what changes is that its result
can be used in arithmetic, as `remify`'s always could. A `null` passed to
`shorthandProperty` is still carried through, because `position` depends on it:
`position(absolute, null)` writes the position and no offsets.

---

## Break: the device maps hold the screen as two lengths

`$map-for-smartphones` and `$map-for-tablets` held a map per device:

```scss
"iPhone11": (
  width: 414px,
  height: 896px,
),
```

An entry is now the screen itself, which is one line per device and cannot
drift apart:

```scss
"iPhone11": 414px 896px,
```

**Every call is unchanged**, and so is the CSS: all 72 calls the old maps could
answer, both orientations, compile byte for byte as they did. This only reaches
you if you replaced or extended a map, in which case `smartphone` and `tablet`
stop the build naming the entry and the new shape.

`mapDeepGet`'s documented example used to read `$map-for-tablets`, since it was
the library's only nested map. Nothing the library ships is nested now, and the
example is a theme map of the kind a user writes.

### The lists are current again

Every iPhone from the 12 to the 17, the iPhone Air, and the current iPad, iPad
Air, iPad Pro and iPad mini are in, with sizes read from Xcode's own device
profiles. `iPad` and `iPadPro` keep the sizes they always had, the 7th to 9th
generation iPad and the 12.9-inch Pro, so a call written before 4.0.0 means
what it did; the current iPad is `iPad-A16` and the 11-inch Pro is
`iPadPro-11`.

Two things the documentation now says out loud, both measured. The query reads
the **screen**, not the window, so a desktop window resized to a phone's width
matches nothing: in Chrome 152, Firefox 156 and Safari 26.6.2 a query at the
screen's own size matched and the same query one pixel off did not. And a size
is not a model: seven phones share 390x844 and four share 393x852, so a rule
written for one of them applies to all of them.

---

### Android, since 20 September 2026

The maps carry twenty Android entries beside the Galaxy and Nexus ones they
always had: the Pixel line from the 6 to the 10, the Galaxy S20 Ultra, S24,
S25, A51 and A71, and the Galaxy Tab S4. Nothing existing changed, so this
breaks no call.

The sizes are Chrome's own, from the device list DevTools emulates, and a model
Chrome does not list is here only when Android Studio's device profile gives it
the same panel and density as one Chrome does. They are not computed from a
specification page: a Pixel 7 is 1080px at a scale of 2.625, and 411.43 rounds
to 411 while the device answers 412.

**An Android size is the default display setting.** Android's Display size
control changes the density the screen is measured in, so a phone whose owner
has moved that slider answers a different `device-width` and matches no entry.

Where sources disagree, nothing is written, and the test is to take a size back
to the panel it implies: Chrome's Galaxy A55, 360x800 at a scale of 2.25,
implies an 810x1800 screen and the phone is 1080x2340, so it is not here. The
same check left out the Moto G Power, and the Galaxy S24 Ultra went out because
one database says 384x832 and another 412x891. The budget A series, which leads
the usage charts, is absent for that reason: the query matches a screen exactly,
so a size one pixel out matches nothing at all. Folding phones are absent
because an entry holds one size and a fold has two screens.

## Break: `responsive-image` stops upscaling

It wrote `display: block; width: 100%`, which draws an image at the container's
width whatever its own size is. Measured in Chrome 152, Firefox 156 and Safari
26.6.2, all three agreeing:

| The image | 3.x | 4.0.0 |
|---|---|---|
| 100 x 50, in a 600px container | 600 x 300, six times its size | 100 x 50 |
| 1200 x 600, in a 600px container | 600 x 300 | 600 x 300 |
| 1200 x 600 with `width` and `height` attributes | 600 x 600, out of shape | 600 x 300 |
| the same, under `.card img { height: 200px }` | 600 x 200 | 600 x 200 |

Two declarations changed. `width: 100%` became `max-inline-size: 100%`, which
is what stops the upscaling and also fits the image to the line in a vertical
writing mode. And `height: auto` is written inside `:where()`, which overrides
the `height` attribute, since an attribute counts for less than any rule, while
losing to a `height` your own stylesheet sets.

**If a call was stretching a small image on purpose**, write the width beside
the include:

```scss
img {
  @include responsive-image;
  width: 100%;
}
```

`reset-figure` includes `responsive-image` for the image inside the figure, so
it follows.

---

## Change: `border-box` and `antialias` stop overriding your own rules

Called inside a selector with no argument, both wrote the element, its
pseudo-elements and `*` under it:

```css
.card, .card::before, .card::after,
.card *, .card *::before, .card *::after { box-sizing: border-box; }
```

`.card *` is (0,1,0), so it beat a component's own rule for something inside
it. Measured in Chrome 152, Firefox 156 and Safari 26.6.2, with
`.page-rule { box-sizing: content-box }` written before the include: the
element kept `border-box` in all three. The descendants now go through
`:where()`, which has no specificity, so the same page rule wins in all three
and an element with no rule of its own still gets `border-box`.

```css
.card { box-sizing: border-box; }
:where(.card)::before, :where(.card)::after,
:where(.card) *, :where(.card) *::before, :where(.card) *::after { box-sizing: border-box; }
```

This is the shape `columnizer` took for the same reason. At the root of a
stylesheet, `@include border-box;` still writes `*, *::before, *::after`,
which has no specificity of its own, and `border-box("only")` is unchanged.

**`antialias`'s description was backwards.** It said the mixin turned subpixel
antialiasing on; `-webkit-font-smoothing: antialiased` turns it off and draws
greyscale instead, which is what makes text look thinner. The CSS is the same
as before, and the manifest and the page now say what it does.

---

## Change: `center` offsets with `translate`

It wrote the offset into `transform`:

```css
.modal { top: 50%; left: 50%; transform: translateX(-50%) translateY(-50%); }
```

`transform` is one property, so the moment the element had a transform of its
own the centring was gone. This is the common case, and it is what a hover
does:

```scss
.modal {
  position: absolute;
  @include center;
}

.modal:hover {
  transform: scale(1.05);
}
```

Measured in Chrome 152, Firefox 156 and Safari 26.6.2, with a 100 by 50 element
centred in a 400 by 200 box: with `transform: rotate(10deg)` or
`transform: scale(1.5)` written after the include, the element sat 50px right
and 25px below the middle in all three. Written before the include, the
rotation was the thing dropped instead.

4.0.0 writes the individual property, which composes with `transform` rather
than replacing it, and the same measurement puts the element exactly in the
middle in all three browsers:

```css
.modal { top: 50%; left: 50%; translate: -50% -50%; }
```

One axis follows: `center("horizontal")` is `translate: -50% 0` and
`center("vertical")` is `translate: 0 -50%`, both at the same offsets as
before.

**What to check in a stylesheet**: a rule that overrode the mixin's
`transform` on purpose, and a `transition: transform` that was animating the
centring itself. Transitioning the centring now means `transition: translate`.

---

## Break: `all-buttons` selects buttons, and only buttons

`$list-of-buttons` wrote the three input types without `input`:

```css
button, [type=button], [type=reset], [type=submit] { … }
```

An attribute selector on its own matches any element carrying the attribute.
Measured in Chrome 152, Firefox 156 and Safari 26.6.2, these two took the
button styles in all three:

```html
<a type="button" href="/download">Download</a>
<x-btn type="button">A custom element</x-btn>
```

The list now names the element, and gains the button that was missing:

```css
button, input[type=button], input[type=reset], input[type=submit], input[type=image] { … }
```

`input[type=image]` is a submit button drawn as an image. It matched none of
the old entries, so it sat outside every rule the mixin wrote, and it is styled
now. This is the same fix `all-text-inputs` had for 4.0.0.

### `focus-visible` is available

`$pseudo` takes `focus-visible` and `focus-within` as well as the four it had.
Measured in Chrome 152 and Firefox 156: a mouse click matches `:focus` but not
`:focus-visible`, while arriving with the Tab key matches both. So a ring
written for `focus` is shown to everyone who clicks, and

```scss
@include all-buttons("focus-visible") {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

shows it to the people who need it. It could not be measured in Safari, where
macOS does not focus a button on click unless full keyboard access is on.

---

## Change: `loadify` no longer hides the element first

It wrote the element as invisible and let the animation reveal it:

```css
.item {
  opacity: 0;
  visibility: hidden;
  backface-visibility: hidden;
  animation-name: loadify;
  animation-fill-mode: forwards;
}
```

So anything that stopped the animation left the content invisible for good, and
`visibility: hidden` took it out of the accessibility tree too. One rule is
enough, and a component or a reset writes rules like it every day:

```css
.item { animation: none; }
```

Measured in Chrome 152, Firefox 156 and Safari 26.6.2: the element computed to
`opacity: 0` and `visibility: hidden` in all three. It now computes to
`opacity: 1` and `visible`.

4.0.0 turns it round. The keyframes start at `opacity: 0`, the element itself
carries no hidden state, and `backwards` applies the starting state during the
delay so the fade looks the same:

```css
@keyframes loadify { from { opacity: 0; } }

.item { animation: loadify 0.5s 0.2s backwards; }
@media (prefers-reduced-motion: reduce) {
  .item { animation: none; }
}
```

`visibility` and `backface-visibility` are not written at all any more.

### `init` is no longer load-bearing

The mixin used to define a `%loadify` placeholder and every call `@extend`ed
it. Under the module system a selector can only extend a placeholder from a
module it loads, so this perfectly ordinary setup did not build:

```scss
// entry.scss
@use "gerillass" as *;
@use "card";
@include loadify(init);

// card.scss
@use "gerillass" as *;
.card { @include loadify; }
```

```text
Error: The target selector was not found.
```

There is no placeholder now, so the same two files compile. `loadify(init)`
still writes the keyframes and should still be called once, but a stylesheet
that leaves it out builds with no fade instead of failing.

**What to check**: a rule of yours that set `visibility: visible` or
`opacity: 1` to undo the mixin by hand is no longer needed, and an
`animation-delay` or `animation-duration` written beside the include is now
overridden by the shorthand, so move those into the mixin's own arguments.

---

## Change: `stretched-link` loses an IE10 line

The overlay carried `background-color: rgba(0, 0, 0, 0)`, which is IE10's: a
pseudo-element with no background did not take the click there. It also wrote
the four offsets separately. Neither is needed:

```css
/* 3.x */
.card a::before { content: ""; position: absolute; pointer-events: auto; background-color: rgba(0, 0, 0, 0); top: 0; right: 0; bottom: 0; left: 0; z-index: 1; }

/* 4.0.0 */
.card a::before { content: ""; position: absolute; pointer-events: auto; inset: 0; z-index: 1; }
```

Measured in Chrome 152, Firefox 156 and Safari 26.6.2 by asking what a click in
the far corner of the card would hit: the link, with the old CSS and with the
new, in all three, and the computed offsets are the same four zeros.

`pointer-events: auto` stays, because it is the line that does something: with
an ancestor at `pointer-events: none`, the corner answers the link with it and
the body without it.

---

## Change: `text-gradient` and `text-image` stop losing their text

Both fill the letters with a background and make the letters themselves
transparent, so the background is the only thing painting them. Two things stop
it painting, and the text goes with it.

**Forced colours.** The browser forces `background-image: none` and forces
`color`, but `-webkit-text-fill-color` is not a forced property, so the
transparent fill survived and the heading disappeared. Both mixins now write:

```css
@media (forced-colors: active) {
  .title { -webkit-text-fill-color: revert; color: revert; background-image: none; }
}
```

Measured with forced colours on, in Chrome 152 and Firefox 156: the computed
fill colour was `rgba(0, 0, 0, 0)` before and is black now. Safari has no way
to turn forced colours on from automation, so it was not measured there.

**An image that does not arrive.** `text-image` takes a `$fallback` colour,
written as a `background-color` under the image, so the letters have something
to fall back to:

```scss
.title {
  @include text-image("/img/hero.jpg", $fallback: #b45309);
}
```

Measured in Chrome 152 with a path that 404s: without the fallback the box was
pixel for pixel one whose text is transparent and which has no background at
all, and with it the letters rendered in that colour. Nothing changes for a
call that passes no fallback, beyond the forced-colours block.

---

## Change: `placeholder` writes one rule

It wrote five: the standard rule and four prefixed ancestors.

```css
.field::-webkit-input-placeholder { color: gray; }
.field::-moz-placeholder { color: gray; }
.field:-ms-input-placeholder { color: gray; }
.field:-moz-placeholder { color: gray; }
.field::placeholder { color: gray; }
```

Measured in Chrome 152, Firefox 156 and Safari 26.6.2, by giving each selector
a colour of its own and asking what painted the placeholder:

| Selector | Chrome | Firefox | Safari |
|---|---|---|---|
| `::placeholder` | paints | paints | parses |
| `::-webkit-input-placeholder` | paints, as an alias | not parsed | parses |
| `::-moz-placeholder` | not parsed | paints, as an alias | not parsed |
| `:-ms-input-placeholder` | not parsed | not parsed | not parsed |
| `:-moz-placeholder` | not parsed | not parsed | not parsed |

Two of the four are dead everywhere, and the other two are their own engine's
alias for the rule that is written anyway. So the mixin writes
`&::placeholder` and nothing else. A browser that understands a prefixed alias
but not `::placeholder` is older than Chrome 57, Firefox 51 and Safari 10.1,
all from 2017.

Safari does not report pseudo-element styles through `getComputedStyle`, so
what was checked there is that the selector parses and that the rule changes
what is painted, which it does.

---

## Break: `clearfix` is removed

A call stops the build with Sass's `Undefined mixin`, as the gradients did in
3.0.0. What it wrote is one declaration now:

```scss
// 3.x
.row {
  @include clearfix;
}
```

```css
/* 4.0.0: write this */
.row {
  display: flow-root;
}
```

`display: flow-root` is supported by 96.46% of users on caniuse today, from
Chrome 58, Firefox 53, Safari 13 and Edge 79. Measured here in Chrome 152,
Firefox 156 and Safari 26.6.2, with a 60px floated child in a 420px box, all
three agreeing:

| | `clearfix` | `display: flow-root` |
|---|---|---|
| contains the floated child | box is 60px | box is 60px |
| a child's 40px top margin | box is 20px, the margin escapes | box is 60px, the margin stays in |
| beside a float outside the box | starts at x=1, 420 wide, runs under the float | starts at x=121, 300 wide, sits next to it |

So the replacement does the same job and fixes two things the hack never did.
Those two differences are also the reason the mixin was removed rather than
rewritten to emit `flow-root`: a call that relied on a margin escaping, or on
the box sliding under a float, would have changed without a word.

**If you support browsers older than 2018**, the hack still works and is two
lines to keep:

```scss
.row::after {
  content: "";
  display: block;
  clear: both;
}
```

`/docs/clearfix` now redirects to this section.

---

## Change: `adaptive` has no gutter by default

The gutter is subtracted from the maximum width at every breakpoint, and it
defaulted to `30px`, so a container called `xlarge` was 1140px rather than
1200px. It is `0` now: the container is exactly the width its breakpoint is
named after.

```scss
.main-container {
  @include adaptive;
}
```

```css
/* Before */
@media (min-width: 1200px) { .main-container { max-width: calc(1200px - 30px * 2); } }

/* After */
@media (min-width: 1200px) { .main-container { max-width: 1200px; } }
```

**Every container gets 60px wider at each step**, silently, which is the whole
of the change. Nothing else moves: the mixin still writes `margin: 0 auto`, it
still writes no query for the first breakpoint, and below `small` the container
still fills the screen, since there is no maximum there to subtract from.

To keep what you had, pass the gutter you were getting:

```scss
.main-container {
  @include adaptive(30px);
}
```

A zero gutter is also no longer written as a subtraction. `adaptive(0)` used to
compile to `calc(576px - 0px * 2)` and now writes `576px`; measured in Chrome
152, Firefox 156 and Safari 26.6.2, both forms compute to the same 576px, so
this half changes nothing but the stylesheet's size.

---

## Change: `adaptive` skips a zero breakpoint by value

The mixin builds one query per breakpoint, and the first entry of the map is
the width every screen already has, so it is not a query. It used to be dropped
by name:

```scss
$actual-breakpoints: map.remove($map-for-breakpoints, "xsmall");
```

`$map-for-breakpoints` is a `!default` variable, so a project can name its own
breakpoints. Then the zero entry stayed in the list:

```scss
$map-for-breakpoints: (
  "sm": 0px,
  "md": 700px,
);
```

```css
@media (min-width: 0px) {
  .wrap {
    max-width: calc(0px - 30px * 2);
  }
}
```

That computes to -60px, and a browser clamps a negative max-width to 0.
Measured in Chrome 152, Firefox 156 and Safari 26.6.2 with the map above: the
container was **0 pixels wide at every size**, and is the width of the screen
now. Written as an unitless `0` the calculation is invalid instead, and the
declaration is dropped, which is merely pointless.

The mixin now skips any breakpoint whose value is zero, with or without a unit.
**With the default map nothing changes**: 130 compiled calls over ten
breakpoint maps and thirteen gutters, before and after, differ only where a
zero entry was carrying a name other than `xsmall`.

---

## Break: `reset-css` is a modern reset

It was Eric Meyer's 2011 reset, unchanged, and it is now the shape modern
resets have settled on. A page that includes the mixin looks different, so this
is the section to read before upgrading.

What changed, measured in Chrome 152, Firefox 156 and Safari 26.6.2 with the
old reset and the new one on the same page, all three agreeing:

| | 3.x | 4.0.0 |
|---|---|---|
| `box-sizing` | not set, so `content-box`: a 100px box with 10px padding and a 5px border measured 130px | `border-box`, and the same box measures 100px |
| `body` line height | `1` | `1.5` |
| lists | `list-style: none` on every list, padding zeroed | markers kept; `role="list"` takes them off |
| images | `inline`, with a few pixels of descender space under them | `block`, and never wider than their container |
| form controls | the browser's own font, `Arial` in Chrome | the page's font, through `font: inherit` |
| long words in prose | `overflow-wrap: normal` | `break-word` |
| an empty `<textarea>` | two lines tall | at least ten |
| specificity | element selectors, beaten only by source order | every rule inside `:where()`, so your own rules always win |

The obsolete elements the old selector list carried, `applet`, `acronym`,
`center`, `big`, `strike` and `tt`, are gone with it.

### What to do

**A navigation or a card grid built from a `<ul>` needs `role="list"`** if it
is not to show markers:

```html
<ul role="list" class="card-grid">
  <li>…</li>
</ul>
```

That is not busywork: the old reset took the markers off every list, and a list
without markers is announced as a plain group of items by VoiceOver rather than
as a list. Asking for it per list keeps the semantics where the list is prose.

**Check anything that relied on `content-box`.** The reset now sets
`border-box` on everything, which is what the layout mixins here assume.

**To keep the old baseline**, the 2011 reset is public domain: copy it into
your own stylesheet. This project's own site took the other route, adding
`role="list"` to its twelve layout lists and deleting the rule it had for
putting markers back in prose.

---

## Added: `$of` on `only` and `except`

Both mixins counted with `:nth-of-type`, which counts an element's siblings
**of the same tag** rather than the things being picked. One stray element
moves every number:

```html
<div class="grid">
  <div class="note">On sale this week</div>
  <div class="card">A</div>
  <div class="card">B</div>
  <div class="card">C</div>
</div>
```

```scss
.card {
  @include only(1) {
    outline: 2px solid;
  }
}
```

That selects nothing, since the first `div` is the note, and `only(2)` selects
card A. Measured in Chrome 152, Firefox 156 and Safari 26.6.2, all three the
same.

`$of` names what to count, and the mixin writes `:nth-child(… of S)`:

```scss
.card {
  @include only(1, $of: ".card") {
    outline: 2px solid;
  }
}
```

```css
.card:nth-child(1 of .card) {
  outline: 2px solid;
}
```

It works with every form both mixins take: a position, a negative position
counted from the end, `first`, `last`, `odd`, `even`, and several positions at
once. `except` wraps the same selector in `:not()`.

**Nothing changes without it.** All 44 call shapes the two mixins accept were
compiled before and after, and every one is byte for byte what it was.

`:nth-child(… of S)` is in Chrome 111, Firefox 113 and Safari 9, and
`CSS.supports("selector(:nth-child(2 of .card))")` answers true in all three.

The two mixins stay separate. Merging them into one `nth($positions..., $not:
…)` was the proposal in `todos/library-review.md`, and the maintainer turned it
down: `only` and `except` read as English where a boolean flag does not.

---

## Break: `ellipsis` and `line-clamp` became `truncate`

Both are removed, and a call to either stops the build with Sass's
`Undefined mixin`. One mixin does both, and the line count picks the technique:

| 3.x | 4.0.0 |
|---|---|
| `ellipsis` | `truncate` |
| `ellipsis(40ch)` | `truncate(1, 40ch)` |
| `ellipsis(100%, block)` | `truncate(1, 100%, block)` |
| `line-clamp(3)` | `truncate(3)` |
| `line-clamp(none)` | `truncate(none)` |
| `line-clamp(var(--lines))` | `truncate(var(--lines))` |

**The CSS is unchanged.** `truncate` compiles to what `ellipsis` compiled to,
and `truncate(3)` to what `line-clamp(3)` compiled to, declaration for
declaration.

The argument order is the one thing to read twice: `$lines` comes first now, so
`ellipsis(40ch)` is `truncate(1, 40ch)` rather than `truncate(40ch)`, which
would be asking for a clamp of 40ch lines and raises.

### Why one mixin rather than two

They are two techniques for the same job, and which one you need depends only
on how many lines you want. Measured in Chrome 152, Firefox 156 and Safari
26.6.2 on a 320px box: at one line they look the same, an ellipsis at the end,
and the element differs, `inline-block` against Safari's `-webkit-box`. So the
call now says what you want, one line or three, and the mixin writes the CSS
that does it.

`$display` belongs to the one-line form and raises with a clamp, which takes
the display over. `/docs/ellipsis` and `/docs/line-clamp` redirect to
`/docs/truncate`.

---

## Break: `isTime` refuses a unitless `0`, and answers a list

`0` is not a time, and no browser reads it as one. Measured in Chrome 152,
Firefox 156 and Safari 26.6.2, each declaration written after a working `5s`,
so a dropped one leaves the `5s` standing:

| Written | What the browser does |
|---|---|
| `transition-duration: 0` | drops it |
| `animation-duration: 0` | drops it |
| `animation-delay: 0` | drops it |
| `animation: fade 0.5s 0 backwards` | keeps it, and reads the `0` as `animation-iteration-count`, so nothing runs |

The last row is what `loadify(0)` wrote. The fade never happened and nothing
said so.

```scss
// 3.x, compiled and did nothing
.panel { @include loadify(0); }

// 4.0.0
.panel { @include loadify(0s); }
```

Two things went the other way and are accepted now: a list of times, which
`transition-duration: 0.2s, 0.4s` really does take and which the old check
refused because it read the whole list rather than each time in it, and a
`var()`, `env()` or `calc()`, which the browser resolves.

```scss
.panel {
  transition-duration: isTime((0.2s, 0.4s));   // raised in 3.x
  animation-duration: isTime(var(--duration)); // raised in 3.x
}
```

`loadify` still takes one time per argument, and says so: a second one in the
`animation` shorthand made all three browsers drop the declaration.

```scss
.panel { @include loadify(0.2s 0.4s); }  // now raises
.panel { @include loadify(0.2s, 0.4s); } // a delay and a duration
```

To find the calls:

```bash
grep -rn "loadify(0)\|isTime(0)" --include=*.scss .
```

---

## Not breaking: `$map-for-breakpoints` has an `xxl` key

1400px, which is where Bootstrap has had its own since 2021. Every condition
mixin takes the name, `breakpoint(min, xxl)` included, and a range ending at it
ends at 1399.98px like the others.

One thing does change without being asked: `adaptive` walks the map, so it
writes a fifth `@media` block and a container goes on growing past 1200px
instead of stopping at 1140px. Measured in Chrome 152, Firefox 156 and Safari
26.6.2 in a 1400px frame: 1140px before, 1340px after. `breakpointer` gains a
step for the same reason.

The map is `!default`, so a project that sets its own is unaffected, and a
project that wants the old ceiling leaves `xxl` out of its map.

---

## Not breaking: `fillNulls` spells its second argument `$separation`

It was `$seperation`. The old spelling still works as a keyword argument and
prints a warning naming the new one; it is a fourth argument now, so nothing
passed by position moves.

```scss
margin: fillNulls(24px null, $seperation: space); // warns
margin: fillNulls(24px null, $separation: space); // the same result, no warning
margin: fillNulls(24px null, space);              // unchanged
```

---

## Change: `tint` and `shade` refuse a list with their own message

`isColor` answers a list, because `isColor(red blue)` is a fair question.
`color.mix` takes one colour, so `tint(red blue, 20%)` used to end the build
with Sass's `$color2: (red blue) is not a color`, which names neither the
function nor the argument. It now names both. Nothing that compiled before
stops compiling.

---

## Not breaking: the lists know more units and states

`$list-of-relative-length-units` went from nine entries to thirty-three: the
viewport units in their small, large and dynamic forms, the container units,
and the font-relative ones such as `cap`, `ic` and `rlh`. It is the set
`scss/internal/_is-condition-value.scss` already accepted.
`$list-of-anchor-pseudo-classes` gained `focus-visible` and `focus-within`, and
`$list-of-counter-styles` lost a `lower-alpha` it held twice. Nothing in the
library branches on the first two, so this only matters to a stylesheet reading
them.

---

## Break: a range that cannot match stops the build

`breakpoint` and `container-query` used to write any pair of sizes into a
query, whichever way round they were. Two shapes can never match, and both
compiled into valid CSS a browser keeps, so the styles inside never applied and
nothing said so:

```scss
// 3.x
.a { @include breakpoint(large, small) { color: red; } }
.b { @include breakpoint(medium, medium) { color: red; } }
```

```css
@media (min-width: 992px) and (max-width: 575.98px) { .a { color: red; } }
@media (min-width: 768px) and (max-width: 767.98px) { .b { color: red; } }
```

Measured in Chrome 152, Firefox 156 and Safari 26.6.2 at 320, 575, 576, 577,
768, 992, 1200 and 1400px: neither query matched at any width, in any browser,
while a real range, `(min-width: 576px) and (max-width: 991.98px)`, matched at
576, 577 and 768. Both raise now.

The second one is easy to write by accident, because a range ends just before
the key it names: naming the same key at both ends asks for at least 768px and
under 768px at once. A range of one width written **by hand** is a different
thing and still compiles, since a length ends at itself:

```scss
.a { @include breakpoint(768px, 768px) { color: red; } }   // applies at 768px
```

An 880 call matrix over every pair of keys and lengths compiled against 3.x and
against the branch: 655 calls unchanged, 225 refused, none newly accepted and
no CSS changed. Every one of the 225 was checked arithmetically as well: in all
of them the minimum sits above the maximum.

---

## Added: `auto-grid`

A grid that fits as many columns of `$min` as the container holds, with a
ceiling on the column count. Nothing else changed, so it breaks no call.

```scss
.cards {
  @include auto-grid(20rem, 1rem);
}

.team {
  @include auto-grid(10rem, 1rem, 4);
}
```

It exists because the line everyone writes overflows. Measured in Chrome 152,
Firefox 156 and Safari 26.6.2, in a 250px container:
`repeat(auto-fit, minmax(20rem, 1fr))` lays out a 320px column and runs 70px
past the container in all three, which on a phone is a horizontal scrollbar.
The mixin writes `minmax(min(100%, 20rem), 1fr)`, which lays out one 250px
column instead.

`$limit` is the other half, and the part a person does not write from memory: a
ceiling on the column count is not a property, it comes out of the track
minimum as `max($min, (100% - ($limit - 1) * $gap) / $limit)`, where the limit
appears twice and the gap once. Measured in a 1000px container with six items,
`$limit: 4` gives exactly four 238px columns in all three browsers, and the
same call in a 250px container gives one.

---

## Added: `reveal`

Entry and exit animation for something that is shown and hidden: a popover, a
`<dialog>`, or an element a class toggles. Nothing else changed, so it breaks
no call.

```scss
.tooltip {
  @include reveal;
}

.modal {
  @include reveal(dialog, 0.25s, none, 0.95);
}
```

`display: none` could not be transitioned, and the CSS that changes that has
two pieces which each do nothing on their own. Measured in Chrome 152, Firefox
156 and Safari 26.6.2 on all three shapes, reading the computed opacity 80ms
into each direction: without `@starting-style` nothing animates on the way in,
in any browser, and without `transition-behavior: allow-discrete` on `display`
nothing animates on the way out, in any browser. Neither says a word.
`@starting-style` also has to be written after the rule it starts from.

Firefox 156 does not run the exit at all, on any of the three shapes, although
it answers true for `CSS.supports("transition-behavior", "allow-discrete")`:
there the element animates in and closes at once. Under
`prefers-reduced-motion: reduce` the transition is shortened to 0.01ms rather
than removed, since `transition: none` would take the discrete part with it and
the element would never leave the page.

---

## Added: `long-shadow`

The long shadow of flat design, drawn as `box-shadow`: a solid block running
off the element, at any angle, optionally fading as it goes. Nothing else
changed, so it breaks no call.

```scss
.badge {
  @include long-shadow(#0f172a, 40px);
}

.card {
  @include long-shadow(#5bc0bb, 40px, bottom-right, transparent);
}
```

`box-shadow` draws one copy of the element, so the effect is the copies
themselves and their number is the length divided by the step, which is not a
number anyone types: the first call above writes forty layers. Shortening the
shadow by hand means rewriting every one of them.

`$step` is what decides whether the diagonal edge is clean, and it defaults to
a fortieth of the length. Measured in Chrome 152 at three times zoom, on a 70px
box with a 40px shadow: a step of 1px or 2px leaves a clean edge, 4px shows a
stair only when magnified, and 8px is visibly notched, since between two copies
the sweep leaves a tooth the size of the step. A step of one unit, which is
what `text-shadow`'s fill uses, would have been 16px in `rem`.

The cost is Safari's alone. Measured in a real window in Safari 26.6.2,
repainting the box each frame: 17ms at 40 and 120 layers, 38ms at 400 and 62ms
at 1000. Chrome 152 and Firefox 156 held the frame budget even at 2000, both
measured headless. The mixin stops at 500 layers and names `$step` in the
message.

Two things it cannot do anything about, both `box-shadow`'s own behaviour:
the shadow is drawn behind the element, so a translucent background shows every
layer through itself, and an ancestor that clips, such as a card with
`overflow: hidden`, cuts the shadow at its edge.

It shares its directions with `text-shadow`, through
`scss/internal/_shadow-direction.scss`, so `bottom-right` and `160deg` mean the
same thing in both. That move was checked by compiling eight `text-shadow`
calls before and after it, with identical output.

---

## Added: `glass`

A frosted glass panel: a tint, a blur of what is behind it, and the fallback a
browser without `backdrop-filter` shows instead. Nothing else changed, so it
breaks no call.

```scss
.panel {
  @include glass;
}

.card {
  @include glass(20px, rgb(255 255 255 / 0.12), 160%, rgb(255 255 255 / 0.3), rgb(30 41 59 / 0.92));
}
```

The blur is one declaration; what it needs around it is not. Measured in
Chrome 152, Firefox 156 and Safari 26.6.2, the last two in a real window
because headless Firefox paints no `backdrop-filter` at all: all three keep the
unprefixed property and only Safari answers for `-webkit-backdrop-filter`,
which is what a Safari before 18 understands, so both are written and both are
in the `@supports` condition. Without support the panel is whatever
`background` says, and a translucent tint over a photograph is unreadable, so
the tint sits inside `@supports` and the mixin writes the tint with its alpha
raised to 0.88 outside. An opaque tint is refused, since it blurs the backdrop
and then covers it.

Two things it cannot do anything about. An ancestor with a `transform`, a
`filter`, `opacity` below 1 or `will-change` becomes the backdrop root, so
nothing outside it is blurred, and the same ancestor is a stacking context, so
the panel cannot rise above a later sibling: measured in all three, the tint
stayed, the blur was gone and the decoration painted over the panel's text. And
the fallback keeps the tint's hue, so white text chosen for glass over a dark
photograph disappears into a white fallback; that call passes its own dark
`$fallback`.

It writes no `box-shadow`, so a drop shadow is still yours to add.

---

## Added: `$style: line` on `background-pattern`

`isometric` drew filled cubes and nothing else. `$style: line` draws the grid
they sit on instead, one upright family of lines and two at 30 degrees, which
is isometric graph paper, and `$thickness` is that line: a twentieth of the
tile by default rather than the eighth a filled pattern uses.

```scss
.sheet {
  @include background-pattern(isometric, $style: line, $color: #94a3b8, $size: 44px);
}
```

Lines leave gaps, so a lined pattern also takes an `$image` under it, which the
filled one refuses because the faces would hide it.

No other pattern has a `$style`, and the reason is worth writing down rather
than rediscovering: a hexagon's or a brick's outline needs its lines broken
along their own direction, and a gradient cannot break a line that way.
Stacking the filled pattern over an offset copy hides the lower one, since the
faces tile the plane with no gap, and thin conic spokes give lines that thicken
as they leave the centre of each tile. The outlines that were drawn with an
inline SVG tile went out in the same release that made every pattern gradients.

---

## Added: `$size`, `$position` and `$repeat` on `background-image`

The mixin always wrote `cover`, `center center` and `no-repeat`, which is right
for a photograph and wrong for everything else: a tiled watermark or a logo
held at `contain` had to be written by hand. They are arguments now, after the
three that were already there, and `null` leaves a declaration out.

```scss
.marks {
  @include background-image("/img/logo.svg", null, null, 56px, left top, repeat);
}
```

With a filter over the image there are two background layers, and one value for
both would shrink or tile the wash along with the photograph. The mixin writes
one value per layer instead, the gradient first:

```css
.marks-washed {
  background-image: linear-gradient(to top, rgba(102, 143, 128, 0.75), rgba(102, 143, 128, 0.75)), url("/img/logo.svg");
  background-position: center center, left top;
  background-repeat: no-repeat, repeat;
  background-size: cover, 56px;
}
```

Measured in Chrome 152, Firefox 156 and Safari 26.6.2: `background-size: cover,
40px` computes to `cover, 40px auto` in all three, and the other two layer the
same way. A call that leaves the three at their defaults compiles exactly as it
did.

A negative `background-size` is refused, since all three drop the declaration;
a negative position is kept, since it moves the image off the edge, which is
what it is for.

---

## Change: `background-image` writes an overlay only when there is a filter

`background-image(null)` with no filter colour used to write an `::after`
covering the element with nothing in it, `position: relative` on the element,
and `position: relative; z-index: 1` on every direct child. Nothing was
painted and the element's children were repositioned for no reason. It now
writes the three `background-*` declarations and nothing else, which is what a
call with an image in the markup and no filter was asking for.

---

## Change: the filter layer stops swallowing the caret

The `::after` that carries the filter takes `pointer-events: none`. Without it
the element's own text could not be selected: measured with
`caretPositionFromPoint` over that text, Chrome 152 answered with a different
node and Firefox 156 with the element, while Safari 26.6.2 was unaffected. With
the declaration all three answer with the text.

The children's rule moved inside `:where()` in the same pass, as `border-box`
and `antialias` did in this release, so a rule of your own on a child wins
where the mixin's used to tie with it and win on order.

The layer also carries `border-radius: inherit` now. An absolutely positioned
box does not inherit a radius and the element does not clip it, so on a rounded
card the filter painted square corners over it; measured in Chrome 152 and
Firefox 156 on an 18px radius, and not captured in Safari.

---

## Change: `background-image(none)` writes `none`

`none` is the CSS keyword for no background image. It used to compile to
`url(none)`, which asks the server for a file called `none` beside the
stylesheet: measured on a local server, Chrome 152, Firefox 156 and Safari
26.6.2 each requested it and painted nothing. A quoted `"none"` is still a
path, as every quoted string is.

---

## Not breaking: a direction with one colour warns

`$filter-direction` turns a gradient, and one colour is a flat wash with
nothing to turn. The value used to be dropped without a word; now the build
says it was left out. The CSS is unchanged.


---

# Migrating to Gerillass 3.0.0

Written while 3.0.0 is being prepared, and added to as its changes land. So far
it covers the gradients. The 2.0.0 guide follows below, unchanged.

Every claim here was checked by compiling the old call against 2.3.1's source
and the new one against 3.0.0's, and comparing the output.

---

## The short version

| | |
|---|---|
| `linear-gradient` and `radial-gradient` were removed, replaced by `gradient` | breaking, loud |
| `text-gradient` takes the colours first | breaking, loud |
| `text-gradient` and `background-image` take more directions | not breaking |

Both breaks stop the build, so nothing fails silently. The first one does not
say which mixin is missing, though: Sass reports only `Undefined mixin.`, with
the line. Search for the old names rather than waiting for the errors.

```bash
grep -rn "linear-gradient\|radial-gradient\|text-gradient" --include=*.scss .
```

That also finds the CSS functions `linear-gradient()` and `radial-gradient()`,
which are not affected. Only a line with `@include` in front of the name needs
changing.

---

## Break 1: `linear-gradient` and `radial-gradient` became `gradient`

`gradient` takes the colours first, then the type, then named arguments for the
rest. Every call to the old mixins has a `gradient` call that writes the same
gradient:

| 2.x | 3.0.0 |
|---|---|
| `@include linear-gradient(right, red blue);` | `@include gradient(red blue, $direction: right);` |
| `@include linear-gradient(45deg, (red 0 10%) (blue 10% 100%));` | `@include gradient((red 0 10%) (blue 10% 100%), $direction: 45deg);` |
| `@include radial-gradient(circle, center, red orange);` | `@include gradient(red orange, radial, $shape: circle, $position: center);` |
| `@include radial-gradient("circle 10px", top-left, red blue);` | `@include gradient(red blue, radial, $shape: "circle 10px", $position: top-left);` |
| `@include radial-gradient(ellipse, "closest-side", red blue);` | `@include gradient(red blue, radial, $shape: ellipse, $position: "closest-side");` |

The `gls-` forms follow the same pattern: `gls-linear-gradient` becomes
`gls-gradient`.

**One difference in the output.** The old mixins wrote the `background`
shorthand; `gradient` writes `background-image`. The gradient itself is
identical: the 22 calls in the old documentation, manifest and specs were
compiled both ways and their gradient values match. But the shorthand also
reset every other background property, so a rule that relied on that reset
behaves differently. Measured in Chrome 152, Firefox 156 and Safari 26.6.2, with the same result in each: with `background-color` and
`background-size` set before the call, the shorthand turned them into
`transparent` and `auto`, and `background-image` leaves them as they were. If
a stylesheet set a background colour earlier and counted on the gradient
clearing it, set `background-color` yourself.

What `gradient` adds, none of which an old call needs: conic gradients,
repeating gradients with `$repeating: true`, a colour space with `$in`, and
directions in any angle unit, `"to top"` or `var()`. The
[gradient page](https://gerillass.com/docs/gradient) has examples of each, and
the old documentation URLs redirect there.

---

## Break 2: `text-gradient` takes the colours first

`text-gradient` now takes the same arguments as `gradient`, in the same order.

| 2.x | 3.0.0 |
|---|---|
| `@include text-gradient(right, orange red purple);` | `@include text-gradient(orange red purple, $direction: right);` |
| `@include text-gradient($direction: top, $colors: red orange);` | unchanged: named arguments work in any order |

A call in the old order stops the build and writes out the new form:

```text
Error: `text-gradient` takes the colours first since 3.0.0. Write `text-gradient((red, blue), $direction: "top")`.
```

The output is the same as before for the same arguments: 15 calls compiled in
the old order and in the new were byte-identical. It still writes the
`background` shorthand.

---

## Not breaking: more directions

`text-gradient`'s `$direction` and `background-image`'s `$filter-direction`
used to accept a direction name or an angle in `deg`. They now also accept
`turn`, `rad` and `grad`, a unitless `0`, `"to top"` or `"to left top"`, and
`var()` or `calc()`. Calls that compiled before compile to the same CSS.

A gradient with a single colour now warns, in `gradient`, `gradientValue` and
`text-gradient`: browsers before Chrome 135, Firefox 136 and Safari 18.4 drop
it.

---

# Migrating to Gerillass 2.0.0

This document is written for someone updating a **project that documents or
uses Gerillass** — the marketing site, the documentation site, a demo, a
starter. It assumes no knowledge of the Gerillass repository itself.

Everything below was verified by compiling against the packed 2.0.0 tarball.
Where a claim is easy to get wrong, the check that establishes it is included
so you can re-run it rather than trust this file.

---

## The short version

Gerillass 2.0.0 moved to the Sass module system. **Two things break.** Almost
everything a docs site shows is unaffected, so the job is smaller than it
sounds — but one of the two breaks **fails silently**, which makes it the
first thing to fix.

| | |
|---|---|
| All 22 utility **functions** were renamed | breaking, and **silent** |
| `ratio-box` and `responsive-video` became `aspect-ratio` | breaking, loud |
| The other 49 mixin names | unchanged |
| The `gls-` prefix | unchanged, still works |
| `@import "gerillass"` | still compiles |

---

## Break 1 — every utility function was renamed

The `__` prefix is gone from all 22 utility functions.

**This is the urgent one.** Under the module system a name beginning with `_`
is private to its own file, so the old names no longer resolve — and Sass does
not raise an error for an unknown function. It emits the call as literal CSS:

```scss
@use "gerillass" as *;
.a { b: __remify(24px); }
```

```css
.a { b: __remify(24px); }   /* ← not an error. Just wrong CSS. */
```

Any page still showing a `__` name is teaching a reader something that will
break their stylesheet without telling them. Fix these before anything else.

### The full mapping

Nineteen of them just drop the prefix:

| 1.x | 2.0.0 |
|---|---|
| `__clearUnit` | `clearUnit` |
| `__clearWhitespace` | `clearWhitespace` |
| `__convertToEm` | `convertToEm` |
| `__convertToNumber` | `convertToNumber` |
| `__fontSizer` | `fontSizer` |
| `__fontSource` | `fontSource` |
| `__isColor` | `isColor` |
| `__isGutter` | `isGutter` |
| `__isNumber` | `isNumber` |
| `__isTime` | `isTime` |
| `__mapDeepGet` | `mapDeepGet` |
| `__pixelify` | `pixelify` |
| `__pseudoSelector` | `pseudoSelector` |
| `__remify` | `remify` |
| `__shorthandProperty` | `shorthandProperty` |
| `__validateBreakpoint` | `validateBreakpoint` |
| `__validateLength` | `validateLength` |
| `__validateRatio` | `validateRatio` |
| `__validateScissors` | `validateScissors` |

Three could not keep their bare name and were renamed. **A find-and-replace of
`__` will silently produce the wrong thing for these**, so handle them first:

| 1.x | 2.0.0 | Why |
|---|---|---|
| `__darken` | `shade` | `darken` is a Sass built-in. Shadowing it is silent and the results differ: Sass's `darken(red, 20%)` is `#990000`, this library's is `#cc0000`. |
| `__lighten` | `tint` | Same, for `lighten`. |
| `__null` | `fillNulls` | `null` is a Sass keyword and cannot be a function name. |

### What to do in a docs site

1. Rename `__darken` → `shade`, `__lighten` → `tint`, `__null` → `fillNulls`
   **first**, including page titles, URLs and any navigation entry.
2. Then replace the remaining `__` prefix everywhere.
3. Check for URLs. If a page lives at `/docs/__remify/` it should move to
   `/docs/remify/`, with a redirect from the old path.

```bash
# Find every remaining occurrence, code and prose alike.
grep -rn '__[a-zA-Z]' --include='*.md' --include='*.mdx' --include='*.html' \
  --include='*.scss' --include='*.js' --include='*.jsx' --include='*.ts' \
  --include='*.tsx' --include='*.json' .
```

---

## Break 2 — `ratio-box` and `responsive-video` became `aspect-ratio`

Both mixins are gone and a single new mixin, `aspect-ratio`, replaces them. They
held a ratio with a padding-top hack, a pseudo-element and an absolutely
positioned child; CSS `aspect-ratio` is Baseline Widely Available and made all
of that unnecessary, which left the two mixins byte-identical to each other.

The rename is mechanical. **What is not mechanical is where the mixin goes:**
the old ones were applied to a wrapping element, the new one goes on the
element itself.

```scss
.hero  { @include ratio-box("16/9"); }            // before, on a wrapper
.hero  { @include aspect-ratio("16/9"); }         // after, on the element

.video { @include responsive-video("16/9"); }     // before, on a wrapper
.video iframe { @include aspect-ratio("16/9"); }  // after, on the iframe
```

This matters and is easy to get wrong. `aspect-ratio` on a **wrapper** does not
size an `<iframe>` inside it — the iframe keeps its intrinsic 300×150. Measured
in a browser, 640px-wide container:

| | wrapper | iframe inside |
|---|---|---|
| ratio on the wrapper only | 640×360 ✅ | **304×154** ❌ |
| ratio on the iframe itself | no wrapper needed | 640×360 ✅ |

Any page that shows a wrapper `<div>` around a video embed should lose the
wrapper along with the mixin.

### What the new mixin emits

```scss
.thumb { @include aspect-ratio("16:9"); }
```
```css
.thumb {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 0;
  object-fit: cover;
}
```

It is deliberately opinionated, and each of the extra declarations answers a
measured failure: without `object-fit` an `<img>` given a ratio is **stretched**
rather than cropped, and without `border: 0` an `<iframe>` overflows its
container by 4px because of its 2px default border.

Arguments: `"16:9"`, `"16/9"` or a bare number, defaulting to 16/9; anything
else is refused. The second argument sets `object-fit` — `cover` by default,
and `null` leaves the property out entirely:

```scss
.tile  { @include aspect-ratio("1:1", contain); }
.plain { @include aspect-ratio(1.5, null); }   // just the ratio
```

`validateRatio` was also kept, for a ratio you want without the rest of the
mixin:

```scss
.hero { aspect-ratio: validateRatio("16:9"); }   // → aspect-ratio: 16 / 9
```

---

## What did *not* change

Do not rewrite these. Over-editing is the main risk in this migration.

- **Every mixin name except the two above.** `circle`, `columnizer`,
  `triangle`, `breakpoint`, `position` and the other 47 are untouched, as are their arguments and their
  output. Every documented example was snapshotted before and after the
  migration and had to stay byte-identical.
- **The `gls-` prefix.** `gls-circle(50px)` works exactly as before. Its
  implementation changed — a generated 1586-line file was replaced by one
  `@forward "library" as gls-*` line — but nothing user-facing did.
- **`@import "gerillass"`.** It still compiles, mixins and utilities alike.
  Pages showing `@import` are not broken. They should still be updated, because
  Dart Sass prints a deprecation warning and removes `@import` in 3.0.0, but
  this is not urgent and nothing is failing today.
- **Installation.** `npm install gerillass --save-dev` is unchanged, and the
  package still has zero runtime dependencies.

---

## Worth updating, though not broken

### Prefer `@use` over `@import` in examples

```scss
@import "gerillass";        // works, warns, removed in Dart Sass 3.0.0
@use "gerillass" as *;      // preferred
```

### There are now three ways to call a mixin

A docs site that only shows the first two is now incomplete. The namespace form
is new in the sense that it is now worth recommending, and it is the tidiest:
nothing enters the global scope, so a collision with Bootstrap or another
library is impossible.

```scss
@use "gerillass" as *;
.avatar { @include circle(50px); }        // bare

@use "gerillass" as *;
.avatar { @include gls-circle(50px); }    // prefixed

@use "gerillass" as gls;
.avatar { @include gls.circle(50px); }    // namespaced
```

All three emit identical CSS.

### Two machine-readable files ship with the package

If the site has a page about using Gerillass with an AI coding agent, these are
what it should point at. Both are generated from the sources and verified by the
test suite, so they cannot drift from the library:

- `gerillass.json` — every mixin and function, with signature, accepted values,
  worked examples, and inputs that are rejected.
- `SKILL.md` — the same material as an agent skill.

---

## Do not claim "zero deprecation warnings"

It would be a natural thing to write in a 2.0.0 announcement and it is not true.
`@import` and the global built-ins are gone from the library, but Sass has since
begun deprecating **its own `if()` function**, which Gerillass calls in 21
places. A recent Dart Sass prints 25 `if-function` warnings when it compiles the
library; Dart Sass 1.91 prints none.

Nothing is broken, and removal is not until Sass 3.0.0. It is being fixed in a
release of its own because the two obvious fixes are both wrong — the
replacement syntax requires a Dart Sass released weeks ago, and a helper
function cannot substitute for `if()`, which evaluates only the branch it takes.

Safe wording: *"the library no longer uses `@import` or the deprecated global
built-in functions."*

---

## Verifying your changes

Compiling is the only real check. A docs site can render a broken example
perfectly.

```bash
# In a scratch directory, against the real published package:
npm init -y && npm install gerillass@2.0.0

cat > check.scss <<'EOF'
@use "gerillass" as *;
.a { @include circle(50px); }
.b { @include gls-circle(50px); }
.c { aspect-ratio: validateRatio("16:9"); }
.d { font-size: remify(24px); }
EOF

npx sass --load-path=node_modules/gerillass/scss check.scss
```

Then, for every code sample you changed, check three things:

1. **It compiles.** Paste it into the file above and run it.
2. **It emits what the page says it emits.** A sample that compiles can still be
   wrong.
3. **It emits something.** An unknown function name does not error — it is
   passed through as literal CSS. If the output contains the function call
   itself, the name is wrong.

Point 3 is the one that catches a missed `__`.

---

## Reference

- Full changelog entry: `CHANGELOG.md`, section 2.0.0
- The library's own guidance for contributors: `CONTRIBUTING.md`
- Machine-readable API: `gerillass.json`, `SKILL.md`
