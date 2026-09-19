# Migrating to Gerillass 4.0.0

Written while 4.0.0 is being prepared, and added to as its changes land. So far
it covers `hide`, where breakpoint ranges end, `columnizer`, `before` and
`after`, `font-face`, `all-text-inputs`, `aspect-ratio`, `counter`, `text-shadow`, `text-stroke`, the background patterns and
`escape-to-parent`. The 3.0.0 and
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
