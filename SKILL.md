---
name: gerillass
description: Use the Gerillass Sass mixin library — loading it, the mixin catalogue, and the argument forms that are easy to get wrong. Use when writing SCSS in a project that has gerillass installed.
---

# Gerillass

A Sass mixin library: 54 mixins and 24 functions that emit CSS from
semantic declarations. It is Sass source only — there is no runtime and no
utility classes, so styles live in your stylesheet and your markup stays clean.

Full documentation: https://docs.gerillass.com
Machine-readable API: `gerillass.json` in this package.

## Loading it

Through a bundler (Vite, webpack and most others resolve the package by name):

```scss
@use "gerillass" as *;
```

Calling Dart Sass yourself, with its package importer
(`new NodePackageImporter()` or `sass --pkg-importer=node`):

```scss
@use "pkg:gerillass" as *;
```

Anything else, by pointing a load path at `node_modules/gerillass/scss`:

```scss
@use "gerillass" as *;
```

In a Ruby project, from the `gerillass` gem. Rails with `dartsass-rails` or
`dartsass-sprockets`, and Jekyll with the gem in its `:jekyll_plugins` group,
need no configuration. Plain Ruby passes the folder to `sass-embedded` with
`load_paths: [Gerillass.load_path]`. Then:

```scss
@use "gerillass" as *;  // the gerillass gem: Rails and Jekyll need no setup; plain Ruby passes Gerillass.load_path
```

Dart Sass only. LibSass and node-sass are not supported, which rules out
`sass-rails` and `sassc-rails` in Ruby.

## Two names for every mixin

Every mixin exists twice: bare (`circle`) and prefixed (`gls-circle`).
They are the same mixin. The prefix exists to avoid collisions with other
libraries. Pick one and stay with it; do not mix them in a file.

With the module system you can namespace instead, which is usually cleaner:

```scss
@use "gerillass" as gls;
.avatar { @include gls.circle(50px); }
```

## Getting arguments right

The conventions are not uniform across the library, so check before guessing.
A mixin that wants a string will not take a bare value:

```scss
.a { @include after(42) { color: red; } }    // wrong — errors
.a { @include after("→") { color: red; } }   // right
```

Mixins that reject bad input do so with a message naming what they accept. If
you get one, read it: it lists the valid values. Mixins not in the table below
mostly pass their arguments through to CSS, so a wrong value there shows up as
a dropped declaration rather than an error.

| Mixin | Rejects, for example |
|---|---|
| `adaptive` | `.wrap { @include adaptive(auto); }` |
| `after` | `.a { @include after(42) { color: red; } }` |
| `all-buttons` | `@include all-buttons(nonsense) { color: red; }` |
| `all-text-inputs` | `@include all-text-inputs(nonsense) { color: red; }` |
| `antialias` | `@include antialias(only);` |
| `aspect-ratio` | `.thumb { @include aspect-ratio("16:9", nonsense); }` |
| `background-image` | `.a { @include background-image("/img/a.png", (red, blue), sideways); }` |
| `background-pattern` | `.a { @include background-pattern(spiral); }` |
| `before` | `.a { @include before(42) { color: red; } }` |
| `border-box` | `@include border-box(only);` |
| `border-radius` | `.a { @include border-radius(1px, 2px, 3px); }` |
| `brand-logo` | `.logo { @include brand-logo(120px, 40px, "/img/a.svg" "/img/b.svg"); }` |
| `breakpoint` | `.a { @include breakpoint("between", "medium", "large") { color: red; } }` |
| `breakpointer` | `.a { @include breakpointer(42); }` |
| `center` | `.modal { @include center(diagonal); }` |
| `circle` | `.dot { @include circle(huge); }` |
| `columnizer` | `.grid { @include columnizer(3, 20px, true, 9); }` |
| `container-query` | `.title { @include container-query("min", 400px, 800px) { color: red; } }` |
| `container` | `.card { @include container("card", sideways); }` |
| `counter` | `.list { @include counter(decimal, $start: 1.5); }` |
| `ellipsis` | `.a { @include ellipsis(100%, huge); }` |
| `escape-to-parent` | `.a { @include escape-to-parent(42) { color: red; } }` |
| `except` | `.a { @include except(#ff0000) { margin: 0; } }` |
| `focus-ring` | `@include focus-ring;` |
| `font-face` | `.a { @include font-face("Inter", "/fonts/inter"); }` |
| `gradient` | `.a { @include gradient((red, blue), sideways); }` |
| `hide` | `.a { @include hide(nonsense); }` |
| `line-clamp` | `.a { @include line-clamp(0); }` |
| `loadify` | `@include loadify(nonsense);` |
| `motion-safe` | `.card { @include motion-safe; }` |
| `only` | `.a { @include only(#ff0000) { margin: 0; } }` |
| `position` | `.badge { @include position(absolute, 0, $logical: yes); }` |
| `remove` | `.a { @include remove(a, b, c); }` |
| `reset-css` | `.a { @include reset-css; }` |
| `resizable` | `.a { @include resizable(huge); }` |
| `scissors` | `.a { @include scissors(5px 10px); }` |
| `screen-agent` | `.a { @include screen-agent(var(--density)) { color: red; } }` |
| `sizer` | `.a { @include sizer(huge); }` |
| `smartphone` | `.a { @include smartphone(Nokia3310) { display: none; } }` |
| `sprite` | `.icon { @include sprite("/img/sprite.txt"); }` |
| `stretched-link` | `.card a { @include stretched-link(middle); }` |
| `tablet` | `.a { @include tablet(Surface) { display: none; } }` |
| `text-gradient` | `.a { @include text-gradient("top", (red, blue)); }` |
| `text-image` | `.a { @include text-image(16 9); }` |
| `text-selection` | `.a { @include text-selection(bogus) { background: yellow; } }` |
| `text-shadow` | `.a { @include text-shadow(42); }` |
| `text-stroke` | `.a { @include text-stroke(black, transparent, red, 2px); }` |
| `tokens` | `:root { @include tokens(#fff); }` |
| `triangle` | `.caret { @include triangle(sideways); }` |

## Traps a signature does not show

**`after`**

- With no argument the mixin also writes `content: ""` in a rule of its own, `:where(.a)::after`, so a block of styles alone draws the pseudo-element. A `content` written in the block, or by another rule for the element with a class or an element selector, still wins. Until 4.0.0 nothing was written and the pseudo-element was not drawn.
- If `content` comes only from another state, such as `.a:hover::after` or a media query, the pseudo-element is now drawn empty the rest of the time. Write `content: none` in the block.
- On a `q` element the default replaces the browser's quotation marks; pass `open-quote` or `close-quote` in the block to keep them. A bare `::after { content: ... }` rule written before the include loses to the default, since both have the same specificity.

**`all-text-inputs`**

- Matches `:where(input):not([type=button], [type=checkbox], [type=color], [type=file], [type=hidden], [type=image], [type=radio], [type=range], [type=reset], [type=submit])` and `textarea`, so an input with no type or a type the browser does not know, which it draws as a text field, is included. Until 4.0.0 it listed text types instead, which styled `[type=color]` and stretched its swatch, and missed unknown types.
- `select` is not matched. Style it in a rule of its own beside the mixin.

**`aspect-ratio`**

- An element with a `height` attribute, such as `<img width="1600" height="900">` or an embed code's `<iframe width="560" height="315">`, keeps the ratio: the mixin writes `height: auto` inside `:where()`, which overrides the attribute but loses to any `height` a stylesheet sets, before or after the include. Until 4.0.0 the attribute height won and the ratio was ignored.

**`background-pattern`**

- It replaces `background-dots` and `background-stripes`, which are removed in 4.0.0. `background-pattern(dots, ...)` and `background-pattern(stripes, ...)` take their place, with the arguments named rather than positional.
- A pattern is decorative. In forced colours mode a browser sets `background-image` to `none` for anything that is not a `url()`, so every pattern here disappears: never carry meaning in one.
- The colours default to `currentColor` mixed with transparency, so a pattern follows the text colour in either colour scheme. Pass `$color` for one to three colours, in the order the pattern layers them.
- Only `background-image`, `background-size`, `background-position`, `background-repeat` and, when asked for, `background-color` are written. The `background` shorthand would reset a `background-color` set before the include.
- A diagonal hard edge is drawn with stair steps in Firefox 156 and smoothly in Chrome 152 and Safari 26.6.2, which shows in `zigzag`, `chevron` and `triangles`. Feathering the stop by half a pixel was measured and did not change it.
- Each kind reads only the arguments it needs, and an argument it ignores raises rather than doing nothing: `$angle` belongs to `stripes`, `crosshatch`, `zigzag` and `triangles`, `$thickness` to `dots`, `stripes`, `grid`, `crosshatch`, `zigzag`, `brick` and `waves`, `$axis` to `grid`, `$stagger` to `dots`, and `$style` to `isometric`.
- `isometric` draws solid cube faces by default, and `$style: line` draws the same cubes as an outline. A gradient cannot draw that outline, since its lines have to break along their own direction, so the tile is written as an inline SVG data URI. That tile carries its own colour and its own line width, which a browser value cannot reach inside: with `$style: line` the colour must be a real colour rather than `currentColor`, `var()` or `color-mix()`, and the size and the thickness must be lengths this stylesheet can resolve. All of it raises rather than drawing nothing.

**`before`**

- With no argument the mixin also writes `content: ""` in a rule of its own, `:where(.a)::before`, so a block of styles alone draws the pseudo-element. A `content` written in the block, or by another rule for the element with a class or an element selector, still wins. Until 4.0.0 nothing was written and the pseudo-element was not drawn.
- If `content` comes only from another state, such as `.a:hover::before` or a media query, the pseudo-element is now drawn empty the rest of the time. Write `content: none` in the block.
- On a `q` element the default replaces the browser's quotation marks; pass `open-quote` or `close-quote` in the block to keep them. A bare `::before { content: ... }` rule written before the include loses to the default, since both have the same specificity.

**`breakpoint`**

- With one argument the query matches exactly that width, `(width: 768px)`, which is a single pixel, and the mixin prints a warning. Write `only` for that width, or `min`, `max` or a range for anything wider.
- A range that ends at a key from $map-for-breakpoints, and `max` with a key, end just under the key: `breakpoint(max, medium)` is `(max-width: 767.98px)` and `breakpoint(small, medium)` ends at `767.98px`, or `47.99rem` with a rem map. So `max` and `min` at the same key, and neighbouring ranges, neither overlap nor leave a gap, including at fractional viewport widths. A length written by hand is used as written, and a zero key is left alone. Until 4.0.0 `max` included the key and a range ended 1 below it, which overlapped at the key and left gaps.
- Declarations written after the include, in the same rule, are emitted after the `@media` block and win over it. Write them before the include.

**`columnizer`**

- The gutter is the container's `gap`. Since 4.0.0 a margin on the columns adds to it instead of being overridden by the mixin's own margins, so remove a column margin that was only there for spacing.
- The container and the columns are border-box. Everything inside the columns is too, through `:where()`, which has no specificity: a page with no border-box reset still has an input with `width: 100%` and padding fit its column, and a `box-sizing` the page sets, even on a bare `input` selector, wins. Until 4.0.0 `.grid *` overrode such a rule.
- A `gap` written after the include replaces the gutter the column widths were computed with, so the row no longer ends flush. Pass the gutter to the mixin instead.
- A percentage gutter is refused, because a row gap in % resolves against the container's height, which a wrapping row does not have, and a negative one because `gap` cannot be negative. A custom property holding either is not checked.

**`container-query`**

- A size on its own matches exactly that width, `(width: 400px)`, which is a single pixel, and the mixin prints a warning. Write `only` for that width, or `min`, `max` or a range for anything wider.
- A range that ends at a key from $map-for-breakpoints, and `max` with a key, end before the key in range syntax: `container-query(max, medium)` is `(width < 768px)` and `container-query(small, medium)` is `(min-width: 576px) and (width < 768px)`. So neighbouring ranges do not both apply at the key. A length written by hand is used as written, so `max, 399px` stays `(max-width: 399px)`, and a zero key is left alone. Until 4.0.0 both ended on the key and overlapped there.

**`container`**

- An element does not match a `@container` query that reads its own container, and nothing warns. Put the `container-query` on a descendant.

**`counter`**

- Since 4.0.0 the mixin numbers every direct child of the element it is included in. The `counter-start`, `counter-continue` and `counter-item` classes are no longer read. Pass `$items` to number only some children, such as `$items: "li"`.
- `$continue` takes the `$name` of the list to carry on from, not `true`. Lists with no `$name` share one counter, so give every list that is split a name of its own: with two split lists interleaved on a page, the second part of one would otherwise carry on from the other.
- A continued list must come after the named list, as a later sibling of it or of an element around it. Parts in separate `section`s restart at 1; reset the counter on an element around all of them, such as `.article { counter-reset: tips; }`, and pass `$continue: tips` to every part. Nothing carries a count into or out of a list that is a container (`container-type`); pass `$start` with the first number instead.
- In Safari the number reads 0 when a numbered child is itself a container, since the `::before` inside it cannot see the list's counter. Chrome and Firefox show the right number. Put `container-type` on an element inside the child instead.
- A child hidden with `content: none` on its `::before` still takes a number. Write `counter-increment: none` on it as well to skip it.

**`except`**

- An+B with an offset cannot be passed as a number: Sass does the arithmetic, so `except(2n+1)` becomes `3n` and excludes every third element, not the odd ones. Use `odd` or `even`, or a coefficient alone such as `3n`.

**`font-face`**

- `$file-formats` defaults to `woff2`. A project that ships only `.woff` or `.ttf` and passes no formats gets no font, silently, in Chrome, Firefox and Safari. Pass the formats you have files for. Until 4.0.0 the default was `eot woff2 woff ttf svg`, which made webpack, esbuild and Parcel fail on a missing `.eot`.
- Must be called at the root of a stylesheet, not inside a selector.

**`hide`**

- The hidden element is absolutely positioned. With no positioned ancestor it escapes a container that clips it, such as a horizontal carousel or a collapsed `height: 0; overflow: hidden` panel, and widens or lengthens the page in Chrome and Safari. Put `position: relative` on that container.
- `focusable` hides the element only while neither it nor anything inside it has focus, so the element's own styles, such as `position: fixed` and padding for a skip link, apply as they are once it is focused. Write them in the same rule.
- To hide an element only at some widths, put `@include hide` inside that media query. Hiding it everywhere and undoing it elsewhere cannot give back the position, padding and border `hide` overwrites, which is why `unhide` was removed in 4.0.0.
- An element with `display: contents` has no box to hide, so its children stay visible.

**`loadify`**

- `init` and every call must be in the same module, or the module with the call must `@use` the one that calls `init`. Otherwise Sass fails with "The target selector was not found".

**`motion-safe`**

- Keep the resting state outside the block. An element hidden in its base rule and revealed by an animation inside the block stays hidden for a user who asked for less motion; put the start state in the keyframes instead.

**`only`**

- An+B with an offset cannot be passed as a number: Sass does the arithmetic, so `only(2n+1)` becomes `3n` and selects every third element, not the odd ones. Use `odd` or `even`, or a coefficient alone such as `3n`.

**`remove`**

- With one argument the element is hidden at exactly that width, `(width: 768px)`, which is a single pixel, and the mixin prints a warning. Write `only` for that width, or `min`, `max` or a range for anything wider.
- `max` with a key, and a range ending at a key, end just under the key, as in `breakpoint`: `remove(max, medium)` hides below 768px, `(max-width: 767.98px)`, so it does not overlap `remove(min, medium)`.
- A `display` written after the include, in the same rule, is emitted after the `@media` block and wins over it. Write it before the include.

**`text-shadow`**

- Since 4.0.0 every direction is an angle: the eight keywords are the 45 degree steps, measured as `gradient` measures them, 0deg up and clockwise, and the offsets are the sine and cosine of that angle. A diagonal keyword used to write the distance on both axes, which placed it 1.414 times further out than a straight one; multiply an old diagonal distance by 0.7071 to keep the same look.
- `true` fills the gap between the text and the shadow with one layer per step, one unit of the distance's own unit by default. Pass `$step` for anything else, in the same unit as the distance. A distance of 40px therefore writes 40 layers unless `$step` says otherwise.
- A distance a browser resolves, such as `var()` or `calc()`, is written as a `calc()` holding the sine or cosine, which every engine resolves. It cannot be filled, since the number of layers has to be counted while the stylesheet compiles.
- A `text-shadow` transition, such as one between a resting state and `:hover`, only animates when both states hold the same number of layers. A filled shadow's layer count comes from the distance and `$step`, so change both together, or the shadow switches rather than moves.

**`text-stroke`**

- Since 4.0.0 the arguments are `$width, $color, $style, $fill`, and the old order, `$fallback-color, $color, $stroke-color, $stroke-width`, raises rather than compiling. `$style: hollow` is the default, which is the look 3.x wrote with no arguments, in `currentColor` rather than black.
- A bare `-webkit-text-stroke` is centred on the glyph outline, so half of it is painted over the letter: measured at 200px in Chrome 152, Firefox 156 and Safari 26.6.2, a 20px stroke cut the letter's own ink from 11213 to 3174 pixels and a 40px stroke left none. `$style: outside` writes `paint-order: stroke fill`, which keeps the letterform whole in all three.
- `$style: outside` doubles the width it writes, since half of the stroke is then hidden behind the letter: a 40px stroke drawn that way left 17006 pixels of ink against a centred 20px stroke's 15915. A keyword width, `thin`, `medium` or `thick`, cannot be doubled and raises; a `var()` width is doubled by the browser through `calc()`.
- Unprefixed `text-stroke` is supported by no engine, checked with `CSS.supports` in all three, so the mixin writes the `-webkit-` properties only. In an engine that has neither, `hollow` still shows solid text, because it writes `color` as well.

## Mixins

| Signature | What it does |
|---|---|
| `adaptive($gutter: 30px)` | Centred container whose max-width steps up at every breakpoint. |
| `after($content: null)` | Styles the ::after pseudo-element. A `data-` argument becomes an attr() content value. |
| `all-buttons($pseudo: null)` | Targets every button-like element at once, optionally in one pseudo-class state. |
| `all-text-inputs($pseudo: null)` | Targets every form control a browser draws as a text field, textarea included, optionally in one pseudo-class state. |
| `antialias($value: null)` | Turns on subpixel-antialiased text smoothing. |
| `aspect-ratio($ratio: null, $fit: cover)` | Holds an element to a ratio and adds what CSS aspect-ratio alone leaves out: object-fit so an image is cropped rather than stretched, and border: 0 so an iframe does not overflow its container by 4px. Apply it to the element itself, not to a wrapper. |
| `background-image($image-url: null, $filter-color: null, $filter-direction: null)` | Background image with an optional colour or gradient filter laid over it. |
| `background-pattern($kind: dots, $params...)` | Thirteen geometric background patterns drawn with gradients alone: dots, stripes, grid, checkerboard, crosshatch, zigzag, chevron, triangles, isometric, honeycomb, brick, waves and houndstooth. |
| `before($content: null)` | Styles the ::before pseudo-element. A `data-` argument becomes an attr() content value. |
| `border-box($value: null)` | Applies box-sizing: border-box. |
| `border-radius($args...)` | Rounds corners, either all of them, one named corner, or all four individually. |
| `brand-logo($width, $height, $image-url: null)` | Logo box with an image and an accessible stretched link over it. |
| `breakpoint($params...)` | Media query built from the breakpoint map, or from raw lengths. |
| `breakpointer($selector: null)` | Debug helper that prints the active breakpoint name into a pseudo-element. |
| `center($axis: "both")` | Absolutely centres an element inside its positioned parent. |
| `circle($size)` | Square element with a fully rounded border, i.e. a circle. |
| `clearfix` | Clears floated children using an ::after pseudo-element. |
| `columnizer($params...)` | Flexbox grid of equal columns, with an optional gutter written as gap and an optional fill for the last row. |
| `container-query($params...)` | A @container rule, taking the same argument shapes as breakpoint so the two read alike. Sizes may be a key from $map-for-breakpoints or a raw length, and a length is the common case because a container is usually narrower than the viewport. Nothing matches at all unless an ancestor was declared with the container mixin. |
| `container($name: null, $type: inline-size)` | Marks an element as a query container, so container-query can ask about its width instead of the viewport's. The rule that asks has to sit on a descendant: an element is never matched by a @container rule reading its own container, and nothing warns you when it is not. |
| `counter($params...)` | Numbers the children of the element it is included in, with optional text before and after each number. No classes in the markup. |
| `ellipsis($width: 100%, $display: inline-block)` | Truncates a single line of text with an ellipsis. |
| `escape-to-parent($selector: null)` | Re-roots the current selector under another one using @at-root. |
| `except($params...)` | Selects every sibling except the ones named. |
| `focus-ring($width: 2px, $offset: 2px, $color: currentColor)` | Draws a keyboard focus ring with outline on :focus-visible, which survives forced-colors mode where a box-shadow ring disappears. |
| `font-face($font-family, $file-path, $font-style: normal, $font-weight: 400, $file-formats: woff2, $font-display: null)` | Emits an @font-face rule for one family across several file formats. Must be called at the root. |
| `gradient($colors, $type: linear, $direction: null, $shape: null, $position: null, $from: null, $in: null, $repeating: false)` | A linear, radial or conic gradient as background-image, plain or repeating, with an optional colour interpolation space. Replaced linear-gradient and radial-gradient in 3.0.0. |
| `hide($toggle: "hide")` | Visually hides an element while keeping it available to screen readers, either always or until it or anything inside it has keyboard focus. |
| `line-clamp($lines: 3)` | Truncates text after a number of lines, where ellipsis truncates one. It emits five declarations rather than one because -webkit-line-clamp does nothing on its own: without display: -webkit-box or without -webkit-box-orient: vertical the text is not clamped at all and nothing warns you, and without overflow: hidden the clamped text spills out below the box. The unprefixed line-clamp is emitted too, for when it becomes Baseline. |
| `loadify($params...)` | Fades elements in on page load. Call once at the root to set up, then on each element. Under prefers-reduced-motion: reduce the end state is applied directly and no animation runs. Switching the animation off alone would not do, because the element starts invisible and the animation is what reveals it, so the content would stay hidden for good. |
| `motion-safe` | Wraps its content in @media (prefers-reduced-motion: no-preference), so motion is opt-in: a user who asked their system for less motion gets none of it. |
| `only($params...)` | Selects only the siblings named. |
| `placeholder-shown` | Styles an input while its placeholder is visible. |
| `placeholder` | Styles the placeholder text of an input across vendor prefixes. |
| `position($position: absolute, $offsets: 0, $logical: false)` | Sets position and offsets in one call, using shorthand order. |
| `remove($params...)` | Hides an element outright, or within a media query: from a breakpoint up with min, up to it with max, or between two breakpoints. One breakpoint on its own hides the element at exactly that width, a single pixel, and prints a warning: pass only for that. |
| `reset-css` | Meyer reset. Must be called at the root of the stylesheet. |
| `reset-figure` | Removes default figure margins and makes the image inside responsive. |
| `resizable($direction: both, $overflow: auto)` | Makes an element user-resizable. |
| `responsive-image` | Makes an image fill its container width. |
| `scissors($corners)` | Cuts the corners off an element with clip-path. |
| `screen-agent($resolution)` | Media query targeting a screen pixel density. |
| `sizer($width, $height: $width)` | Sets width and height together; one argument makes a square. |
| `smartphone($device, $orientation: null)` | Media query targeting a known smartphone by device dimensions. |
| `sprite($params...)` | Sets up an element as a sprite tile: an image, a background position, or both. |
| `stretched-link($value: "before")` | Expands a link to cover its positioned parent, so the whole card is clickable. |
| `tablet($device, $orientation: null)` | Media query targeting a known tablet by device dimensions. |
| `text-gradient($colors, $type: linear, $direction: null, $shape: null, $position: null, $from: null, $in: null, $repeating: false)` | Fills the text with a gradient through background-clip: text. It takes the gradient mixin's arguments, colours first: a linear, radial or conic gradient, plain or repeating, with an optional colour space. |
| `text-image($image: null)` | Fills the text with an image via background-clip. |
| `text-selection($value: null)` | Styles the ::selection pseudo-element. |
| `text-shadow($params...)` | Layered text shadows, each written as a direction or an angle, a colour and a distance. |
| `text-stroke($width: 1px, $color: currentColor, $style: hollow, $fill: null)` | An outline on text, in three looks: outside the letter, straddling it, or the letter left unfilled. |
| `tokens($map, $prefix: null)` | Writes a Sass map out as CSS custom properties, for any kind of token: colours, spacing, sizes, radii, type, shadows, durations. With the prefix space, (4: 1rem) becomes --space-4: 1rem. A null value is skipped, and a quoted string keeps its quotes. |
| `triangle($direction: "bottom", $color: black, $size: 10px 8px)` | Draws a CSS triangle out of borders, pointing in a given direction. |

## Functions

Called like normal Sass functions, with no `@include`. They are public API,
and camelCase is what tells them apart from the kebab-case mixins above.

| Signature | What it does |
|---|---|
| `clearUnit($value)` | Strips the unit off a number, returning it unitless. |
| `clearWhitespace($string)` | Removes every space from a string. |
| `convertToEm($value)` | Converts a pixel length to em, against a 16px base. |
| `convertToNumber($value)` | Parses a string of digits into a number. |
| `fillNulls($value, $seperation: comma, $skip: false)` | Replaces null entries in a list with 0, or drops them. |
| `fluid($min, $max, $min-viewport: 320px, $max-viewport: 1280px)` | A clamp() value that grows with the viewport between two widths, then stops. The preferred value keeps a rem term rather than being pure vw, because a vw-only value ignores browser text zoom and fails WCAG 1.4.4. It is a function rather than a mixin because the value is the hard part and belongs to any property, not only font-size. |
| `fontSizer($size, $time)` | Multiplies a size by a factor. Handy for a modular scale. |
| `fontSource($font-family, $file-path, $file-formats)` | Builds one src entry for an @font-face rule. |
| `gradientValue($colors, $type: linear, $direction: null, $shape: null, $position: null, $from: null, $in: null, $repeating: false)` | The gradient mixin's gradient as a value, for layering it with an image in one background-image, or using it as a mask-image or border-image. It takes the same arguments and refuses the same input, but cannot write the fallback the mixin writes before a gradient with $in. |
| `isColor($value)` | Returns the value if every item in it is a colour, and errors otherwise. |
| `isGutter($value)` | True for anything that can sit where a CSS length is expected: a number, a calculation, or a CSS function such as var(). |
| `isNumber($value)` | Returns the value if it is a number. |
| `isTime($value)` | Returns the value if it is a time in s or ms, and errors otherwise. |
| `mapDeepGet($map, $keys...)` | Reads a value out of a nested map by following a chain of keys. |
| `pixelify($value)` | Returns the value with a px unit, adding one if it is missing. |
| `pseudoSelector($elements, $pseudo: null)` | Appends a pseudo-class to every selector in a list. |
| `remify($value)` | Converts a pixel length to rem, against a 16px root. |
| `shade($color, $percentage)` | Mixes a colour towards black by a percentage. |
| `shorthandProperty($value)` | Expands one to four values into the four-value CSS shorthand order. |
| `tint($color, $percentage)` | Mixes a colour towards white by a percentage. |
| `validateBreakpoint($value)` | Resolves a breakpoint name to its width, passing a length, a percentage or a CSS function through, and refusing a word that is not a key. |
| `validateLength($value)` | Returns the value if it is a length or one of auto, inherit, initial, 0. Returns null quietly for null, so a caller can skip a value. |
| `validateRatio($ratio)` | Turns an aspect ratio into a value for the CSS aspect-ratio property. |
| `validateScissors($value)` | Normalises corner values for the scissors mixin, adding px where missing. |

## Checking your work

Sass evaluates mixin bodies lazily, so a stylesheet that merely loads the
library always compiles. Compile the file that actually calls the mixin:

```bash
sass --load-path=node_modules/gerillass/scss your.scss
```

An empty rule in the output means the mixin matched none of its branches —
treat that as a bug, not as success.
