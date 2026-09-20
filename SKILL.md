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
| `auto-grid` | `.cards { @include auto-grid(auto); }` |
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
| `escape-to-parent` | `.a { @include escape-to-parent(42) { color: red; } }` |
| `except` | `.a { @include except(#ff0000) { margin: 0; } }` |
| `focus-ring` | `@include focus-ring;` |
| `font-face` | `.a { @include font-face("Inter", "/fonts/inter"); }` |
| `gradient` | `.a { @include gradient((red, blue), sideways); }` |
| `hide` | `.a { @include hide(nonsense); }` |
| `loadify` | `@include loadify(nonsense);` |
| `motion-safe` | `.card { @include motion-safe; }` |
| `only` | `.a { @include only(#ff0000) { margin: 0; } }` |
| `position` | `.badge { @include position(absolute, 0, $logical: yes); }` |
| `remove` | `.a { @include remove(a, b, c); }` |
| `reset-css` | `.a { @include reset-css; }` |
| `resizable` | `.a { @include resizable(huge); }` |
| `scissors` | `.a { @include scissors(5px 10px); }` |
| `screen-agent` | `.a { @include screen-agent(var(--density)) { color: red; } }` |
| `sidebar` | `.layout { @include sidebar(20); }` |
| `sizer` | `.a { @include sizer(huge); }` |
| `smartphone` | `.a { @include smartphone(Nokia3310) { display: none; } }` |
| `sprite` | `.icon { @include sprite("/img/a.png" "/img/b.png", 0 -40px); }` |
| `stretched-link` | `.card a { @include stretched-link(middle); }` |
| `tablet` | `.a { @include tablet(Surface) { display: none; } }` |
| `text-gradient` | `.a { @include text-gradient("top", (red, blue)); }` |
| `text-image` | `.a { @include text-image(16 9); }` |
| `text-selection` | `.a { @include text-selection(bogus) { background: yellow; } }` |
| `text-shadow` | `.a { @include text-shadow(42); }` |
| `text-stroke` | `.a { @include text-stroke(black, transparent, red, 2px); }` |
| `tokens` | `:root { @include tokens(#fff); }` |
| `triangle` | `.caret { @include triangle(sideways); }` |
| `truncate` | `.a { @include truncate(0); }` |

## Traps a signature does not show

**`adaptive`**

- The first breakpoint is the width every screen already has, so no query is written for it and the container is full width below the next one. That is the point of the mixin: the side space comes from the step, and it grows as the viewport passes each breakpoint.
- A breakpoint of zero is skipped by its value since 4.0.0. It used to be dropped by name, `map.remove($map, "xsmall")`, and `$map-for-breakpoints` is `!default`: a project naming its own breakpoints kept the zero entry, and the mixin wrote `@media (min-width: 0)` with `max-width: calc(0 - 30px * 2)` in it. Measured in Chrome 152, Firefox 156 and Safari 26.6.2, that calculation is invalid and the declaration is dropped; written as `0px` it computes to -60px, the browser clamps it to 0, and the container is 0 wide at every size. With the default map the CSS is exactly what it always was.

**`after`**

- With no argument the mixin also writes `content: ""` in a rule of its own, `:where(.a)::after`, so a block of styles alone draws the pseudo-element. A `content` written in the block, or by another rule for the element with a class or an element selector, still wins. Until 4.0.0 nothing was written and the pseudo-element was not drawn.
- If `content` comes only from another state, such as `.a:hover::after` or a media query, the pseudo-element is now drawn empty the rest of the time. Write `content: none` in the block.
- On a `q` element the default replaces the browser's quotation marks; pass `open-quote` or `close-quote` in the block to keep them. A bare `::after { content: ... }` rule written before the include loses to the default, since both have the same specificity.

**`all-buttons`**

- The list is `button` and the four button `input` types, and each type is written with `input` since 4.0.0. Until then it was `[type='button']`, which matches anything carrying that attribute: measured in Chrome 152, Firefox 156 and Safari 26.6.2, `<a type="button">` and a custom element with the same attribute both took the button styles in all three, and now neither does.
- `input[type='image']` is new to the list. It is a submit button drawn as an image, and it matched none of the old entries, so it fell outside every rule the mixin wrote.
- Reach for `focus-visible` rather than `focus` for a ring. Measured in Chrome 152 and Firefox 156: a mouse click matched `:focus` but not `:focus-visible`, while arriving with the Tab key matched both, so a ring written for `focus` is shown to everyone who clicks. It could not be measured in Safari, where macOS does not focus a button on click unless the system's full keyboard access is switched on.
- A `[role=button]` element is not in the list, and a `<div>` acting as a button is not styled: it is not a button to the browser either.

**`all-text-inputs`**

- Matches `:where(input):not([type=button], [type=checkbox], [type=color], [type=file], [type=hidden], [type=image], [type=radio], [type=range], [type=reset], [type=submit])` and `textarea`, so an input with no type or a type the browser does not know, which it draws as a text field, is included. Until 4.0.0 it listed text types instead, which styled `[type=color]` and stretched its swatch, and missed unknown types.
- `select` is not matched. Style it in a rule of its own beside the mixin.

**`antialias`**

- The summary said this turned subpixel antialiasing **on** until 4.0.0, which is backwards: `-webkit-font-smoothing: antialiased` turns it off and draws greyscale, and `-moz-osx-font-smoothing: grayscale` is the same thing for Firefox.
- Both properties are non-standard and macOS only, and neither does anything on Windows or Linux. On macOS only two of the three engines respond: measured on 20 September 2026 by screenshotting the same page with and without the mixin and comparing the images, headless and in a real window, Chrome 152 and Safari 26.6.2 both draw differently, while Firefox 156 is identical to the byte, since it draws greyscale on macOS already and `-moz-osx-font-smoothing: grayscale` asks for what it does.
- Called inside a selector with no argument, the descendants are written inside `:where()` since 4.0.0, so a rule the page has for one of them wins. The old `.a *` was (0,1,0) and overrode it.

**`aspect-ratio`**

- An element with a `height` attribute, such as `<img width="1600" height="900">` or an embed code's `<iframe width="560" height="315">`, keeps the ratio: the mixin writes `height: auto` inside `:where()`, which overrides the attribute but loses to any `height` a stylesheet sets, before or after the include. Until 4.0.0 the attribute height won and the ratio was ignored.

**`auto-grid`**

- The line this replaces, `repeat(auto-fit, minmax(20rem, 1fr))`, overflows a container narrower than the minimum. Measured in Chrome 152, Firefox 156 and Safari 26.6.2 in a 250px container: the column is laid out at 320px and the grid runs 70px past the container in all three, which is a horizontal scrollbar on a phone. `min(100%, 20rem)` caps the minimum at the container and the same case lays out one 250px column.
- `$limit` is a ceiling, not a target: with `auto-grid(10rem, 1rem, 4)` in a 1000px container all three browsers lay out exactly four 238px columns, and in a 250px one a single 250px column.
- `$fill: true` writes `auto-fill`, which keeps an empty column, and the default `auto-fit` collapses it. Measured with two items in a 1000px container: `auto-fill` gave three 323px columns and `auto-fit` two 492px ones.
- It writes nothing on the children. `min-inline-size: 0`, which `columnizer` needs, was measured as unnecessary here: with a long unbroken token in a 250px container the track stayed 250px with and without it, since the track's minimum is given rather than left at `auto`.

**`background-pattern`**

- It replaces `background-dots` and `background-stripes`, which are removed in 4.0.0. `background-pattern(dots, ...)` and `background-pattern(stripes, ...)` take their place, with the arguments named rather than positional.
- A pattern is decorative. In forced colours mode a browser sets `background-image` to `none` for anything that is not a `url()`, so every pattern here disappears: never carry meaning in one.
- The colours default to `currentColor` mixed with transparency, so a pattern follows the text colour in either colour scheme. Pass `$color` for one to three colours, in the order the pattern layers them.
- Only `background-image`, `background-size`, `background-position`, `background-repeat` and, when asked for, `background-color` are written. The `background` shorthand would reset a `background-color` set before the include.
- A diagonal hard edge is drawn with stair steps in Firefox 156 and smoothly in Chrome 152 and Safari 26.6.2, which shows in `zigzag`, `chevron` and `triangles`. Feathering the stop by half a pixel was measured and did not change it.
- `gingham` draws its two bands at 55% of the colour, so the crossings darken on their own and an opaque colour still reads as cloth.
- `sunburst` and `concentric` are drawn from the middle of the box rather than from a tile, so they do not repeat: `sunburst` takes `$angle` as the width of one ray, and `concentric` takes `$size` as the gap between rings.
- `glow`, `vignette` and `mesh` are drawn once at the size of the box rather than tiled, so `$size` is how far the light reaches, one value or two, and `$origin` is where it comes from. `sunburst` and `concentric` read `$origin` too, since they are drawn from a point rather than tiled: from the top edge a sunburst becomes beams fanning down, and an off-centre `concentric` reads as a contour map rather than as a target. They are what premium marketing pages use behind a hero, measured from what attio.com, retool.com and raycast.com actually serve; none of them blurs anything, since a radial gradient is already soft.
- A mixin call writes `background-image`, so two calls on the same element replace one another rather than stacking. To fade a tiled pattern into the page, put the pattern on one element and a `vignette` in the page's colour on an element over it.
- `stripes` reads its line and its period apart, which no other pattern needs: `$thickness` is the line and `$size` is one line plus its gap, so the hairline hatch marketing pages use, a 1px line on a 10px tile, is `$size: 10px, $thickness: 1px`. With no `$size` the period stays twice the line, which is the even stripe `background-stripes` drew. A line as wide as the period is refused: Chrome 152, Firefox 156 and Safari 26.6.2 all clamp the last stop and paint a solid colour with no stripes at all.

**`before`**

- With no argument the mixin also writes `content: ""` in a rule of its own, `:where(.a)::before`, so a block of styles alone draws the pseudo-element. A `content` written in the block, or by another rule for the element with a class or an element selector, still wins. Until 4.0.0 nothing was written and the pseudo-element was not drawn.
- If `content` comes only from another state, such as `.a:hover::before` or a media query, the pseudo-element is now drawn empty the rest of the time. Write `content: none` in the block.
- On a `q` element the default replaces the browser's quotation marks; pass `open-quote` or `close-quote` in the block to keep them. A bare `::before { content: ... }` rule written before the include loses to the default, since both have the same specificity.

**`border-box`**

- Called inside a selector with no argument, the descendants are written inside `:where()` since 4.0.0, so a rule the page has for one of them wins. Until then the rule was `.a *`, which is (0,1,0) and overrode a component's own `input` or `.inner` rule: measured in Chrome 152, Firefox 156 and Safari 26.6.2, a `.page-rule { box-sizing: content-box }` written before the include lost in all three and now wins in all three.
- At the root of a stylesheet the rule is `*, *::before, *::after`, which has no specificity of its own and is unchanged.

**`breakpoint`**

- With one argument the query matches exactly that width, `(width: 768px)`, which is a single pixel, and the mixin prints a warning. Write `only` for that width, or `min`, `max` or a range for anything wider.
- A range that ends at a key from $map-for-breakpoints, and `max` with a key, end just under the key: `breakpoint(max, medium)` is `(max-width: 767.98px)` and `breakpoint(small, medium)` ends at `767.98px`, or `47.99rem` with a rem map. So `max` and `min` at the same key, and neighbouring ranges, neither overlap nor leave a gap, including at fractional viewport widths. A length written by hand is used as written, and a zero key is left alone. Until 4.0.0 `max` included the key and a range ended 1 below it, which overlapped at the key and left gaps.
- Declarations written after the include, in the same rule, are emitted after the `@media` block and win over it. Write them before the include.

**`center`**

- The element has to be positioned, and its parent too: the mixin writes the offsets and the translation, not `position`.
- Until 4.0.0 the offset was `transform: translateX(-50%) translateY(-50%)`, and `transform` is one property, so a transform the element set for itself replaced the centring. Measured in Chrome 152, Firefox 156 and Safari 26.6.2: a 100x50 element centred in a 400x200 box and then given `transform: rotate(10deg)` or `transform: scale(1.5)` sat 50px right and 25px below the middle in all three. It is the `translate` property now, which composes with `transform`, so a hover that scales no longer moves the element off centre.

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

**`escape-to-parent`**

- The selector lands on the **outermost element** of the rule, as one compound: `.a .b` gives `.theme.a .b`, not `.theme .a .b`. For a class on an ancestor of that element, pass the ancestor with it, `"body.theme .inner"`, or nest the rule under it.
- Two element selectors cannot match the same element, so `ul li` with `"html"` or `"body.theme"` is refused rather than written as the `htmlul li` that matches nothing. Pass a class or an id.
- Before 4.0.0 the mixin pasted the argument onto the front of the parent as text. That prefixed only the first selector of a list, leaving the rest of the rule applying with no theme at all, glued the class to a leading element as `.themeul li`, and split a list argument so a bare `.theme` painted every element carrying that class. All three are fixed, and the CSS a call writes can change.

**`except`**

- An+B with an offset cannot be passed as a number: Sass does the arithmetic, so `except(2n+1)` becomes `3n` and excludes every third element, not the odd ones. Use `odd` or `even`, or a coefficient alone such as `3n`.
- Without `$of` the selector is `:nth-of-type`, which counts siblings **of the same tag** rather than the things being picked. Measured in Chrome 152, Firefox 156 and Safari 26.6.2 on a grid holding a `<div class="note">` and three `<div class="card">`: `.card:nth-of-type(1)` matched nothing, because the first div is the note, and every other number was one out. With `$of: ".card"` the same call matched the first card in all three.
- `:nth-child(… of S)` is in Chrome 111, Firefox 113 and Safari 9, and `CSS.supports("selector(:nth-child(2 of .card))")` answers true in all three.
- `$of` counts, it does not narrow: a call that passes a selector as the position, such as `only(".featured")`, is not counting anything, so passing both raises.

**`font-face`**

- `$file-formats` defaults to `woff2`. A project that ships only `.woff` or `.ttf` and passes no formats gets no font, silently, in Chrome, Firefox and Safari. Pass the formats you have files for. Until 4.0.0 the default was `eot woff2 woff ttf svg`, which made webpack, esbuild and Parcel fail on a missing `.eot`.
- Must be called at the root of a stylesheet, not inside a selector.

**`hide`**

- The hidden element is absolutely positioned. With no positioned ancestor it escapes a container that clips it, such as a horizontal carousel or a collapsed `height: 0; overflow: hidden` panel, and widens or lengthens the page in Chrome and Safari. Put `position: relative` on that container.
- `focusable` hides the element only while neither it nor anything inside it has focus, so the element's own styles, such as `position: fixed` and padding for a skip link, apply as they are once it is focused. Write them in the same rule.
- To hide an element only at some widths, put `@include hide` inside that media query. Hiding it everywhere and undoing it elsewhere cannot give back the position, padding and border `hide` overwrites, which is why `unhide` was removed in 4.0.0.
- An element with `display: contents` has no box to hide, so its children stay visible.

**`loadify`**

- The element is visible by default and the animation only fades it in: the keyframes start at `opacity: 0` and `backwards` applies that during the delay. Until 4.0.0 it was the other way round, `opacity: 0; visibility: hidden` with the animation revealing it, so anything that stopped the animation left the content invisible for good. Measured in Chrome 152, Firefox 156 and Safari 26.6.2 with a later `animation: none`: the element computed to `opacity: 0` and `visibility: hidden` in all three, and now computes to `1` and `visible`.
- `init` and the calls no longer have to see each other. The mixin used to define a `%loadify` placeholder that every call `@extend`ed, which fails with Sass's "The target selector was not found" whenever the call is in another module, an entry file's `init` being no help to a partial it loads. Each call writes its own declarations now, and a stylesheet that forgets `init` builds with no fade rather than not building.
- The mixin writes the `animation` shorthand, so an animation of your own on the same element replaces it.
- A time needs its unit and there is one per argument. `loadify(0)` wrote `animation: loadify 0.5s 0 backwards`, which Chrome 152, Firefox 156 and Safari 26.6.2 read as an iteration count of 0, so the fade never ran; `loadify(0.2s 0.4s)` wrote two delays, and all three dropped the declaration. Both are refused since 4.0.0.

**`motion-safe`**

- Keep the resting state outside the block. An element hidden in its base rule and revealed by an animation inside the block stays hidden for a user who asked for less motion; put the start state in the keyframes instead.

**`only`**

- An+B with an offset cannot be passed as a number: Sass does the arithmetic, so `only(2n+1)` becomes `3n` and selects every third element, not the odd ones. Use `odd` or `even`, or a coefficient alone such as `3n`.
- Without `$of` the selector is `:nth-of-type`, which counts siblings **of the same tag** rather than the things being picked. Measured in Chrome 152, Firefox 156 and Safari 26.6.2 on a grid holding a `<div class="note">` and three `<div class="card">`: `.card:nth-of-type(1)` matched nothing, because the first div is the note, and every other number was one out. With `$of: ".card"` the same call matched the first card in all three.
- `:nth-child(… of S)` is in Chrome 111, Firefox 113 and Safari 9, and `CSS.supports("selector(:nth-child(2 of .card))")` answers true in all three.
- `$of` counts, it does not narrow: a call that passes a selector as the position, such as `only(".featured")`, is not counting anything, so passing both raises.

**`placeholder-shown`**

- `:placeholder-shown` only matches a field that **has** a placeholder. For the floating label pattern the field usually shows no placeholder text of its own, and the way round that is `placeholder=" "`, a single space, which keeps the pseudo-class working while showing nothing.

**`placeholder`**

- Until 4.0.0 this wrote five rules, the standard one and four prefixed ancestors. Measured in Chrome 152, Firefox 156 and Safari 26.6.2 by giving each selector its own colour and asking what painted: `:-ms-input-placeholder` and the single-colon `:-moz-placeholder` parse in none of the three, and `::-webkit-input-placeholder` and `::-moz-placeholder` are their own engine's alias for `::placeholder`, which was written anyway. One rule is left, and it is understood by everything since Chrome 57, Firefox 51 and Safari 10.1, all 2017.
- Firefox used to give the placeholder its own opacity, so a colour can come out paler than you set it. `opacity: 1` beside the colour is the usual answer.

**`remove`**

- With one argument the element is hidden at exactly that width, `(width: 768px)`, which is a single pixel, and the mixin prints a warning. Write `only` for that width, or `min`, `max` or a range for anything wider.
- `max` with a key, and a range ending at a key, end just under the key, as in `breakpoint`: `remove(max, medium)` hides below 768px, `(max-width: 767.98px)`, so it does not overlap `remove(min, medium)`.
- A `display` written after the include, in the same rule, is emitted after the `@media` block and wins over it. Write it before the include.

**`reset-css`**

- Every rule is inside `:where()`, so the reset has no specificity of its own and any rule you write beats it whatever the order. The `box-sizing` rule is a `*` selector, which already has none.
- A list keeps its markers, and loses them with `role="list"`. The 2011 reset this replaces wrote `list-style: none` on every list, which is what makes VoiceOver stop announcing a list as a list.
- `svg` is not made a block, though the resets this one is modelled on do that. An inline SVG is usually an icon inside a line of text: measured on this project's own site, `display: block` on the header's search icon dropped its label onto a second line. `img`, `picture`, `video` and `canvas` are blocks.
- Rewritten in 4.0.0, so a page that includes it looks different: `box-sizing` is `border-box`, the body's line height is 1.5 rather than 1, lists keep their markers, images are blocks that never overflow, form controls inherit the page's font, and the obsolete elements in the old selector list are gone. Measured in Chrome 152, Firefox 156 and Safari 26.6.2 with both resets on the same page, all three agreeing.

**`reset-figure`**

- It includes `responsive-image` for the image, so the image no longer upscales and keeps its proportions against a `height` attribute. See that member for what was measured.

**`responsive-image`**

- Until 4.0.0 this wrote `width: 100%`, which upscales: measured in Chrome 152, Firefox 156 and Safari 26.6.2, a 100x50 image in a 600px container was drawn at 600x300 in all three. `max-inline-size: 100%` leaves it at 100x50 and still fits a larger image to the container.
- A `height` attribute is a definite height, so `<img width="1200" height="600">` was drawn 600x600 rather than 600x300, out of shape. `height: auto` inside `:where()` overrides the attribute and loses to any `height` a stylesheet sets, which was measured in all three browsers.
- `max-inline-size` rather than `max-width`, so the image fits the line in a vertical writing mode.

**`sidebar`**

- The threshold is a share of the row, not a width, which is why it follows the box rather than the window. Measured in Chrome 152, Firefox 156 and Safari 26.6.2 with the window at 1024px, so a 768px media query never fires: a grid with that query left the content at 356px in a 700px box, 216px in a 560px one and 60px in a 400px one, overflowing by 4px, while this mixin stacked in all three boxes. All three browsers agreed on every row.
- `flex-grow: 999` on the content is what keeps the sidebar at its `flex-basis`. With a plain `flex: 1` on both, the two share the spare space and the sidebar grows with the window.
- It styles the first and the last child. A third element between them is laid out by flexbox's own defaults, which is rarely what a sidebar layout wants.

**`smartphone`**

- `device-width` and `device-height` read the **screen**, not the viewport, so a desktop window resized to a phone's width matches nothing. Measured in Chrome 152, Firefox 156 and Safari 26.6.2: a query at the screen's own size matched and the same query one pixel off did not. For a rule that follows the window, use `breakpoint` or `container-query`.
- A size is not a model. Seven phones share 390x844 and four share 393x852, so `smartphone("iPhone15")` applies to the 15 Pro and the 16 as well. The names are for looking a size up, not for telling two devices apart.
- The landscape form swaps the width and the height, which is right where the platform swaps the screen with the device. Emulated in Chrome 152, the swapped query matched when the screen was reported as 874x402 and did not when it stayed 402x874. It is not measured on iOS; `todos/device-maps.md` records what is open.
- Since 4.0.0 an entry in the map is the screen as two lengths, `iPhone17: 402px 874px`, rather than a map of `width` and `height`. A map that still holds the old shape raises with a message saying so.

**`sprite`**

- With one argument the mixin has to tell an image from a position, and both can be strings. Until 4.0.0 it read the last four characters and took only `.png`, `.jpg` and `.svg`, so `.webp`, `.avif`, `.gif`, `.jpeg`, an upper case `.PNG`, a path with a query such as `a.png?v=2` and a data URI were all refused. It now asks whether the value is a position, and a string that is not one is the path.
- A `var()` with one argument is read as the position, since that is what a single `var()` usually is. For an image in a custom property, pass it with a position: `sprite(var(--sprite), 0 0)`.
- A quoted position is unquoted rather than refused: `background-position: "center"` is dropped in Chrome 152, Firefox 156 and Safari 26.6.2, all three falling back to `0% 0%`.

**`stretched-link`**

- The parent has to be positioned, and the mixin goes on one child of it. A second stretched link in the same parent covers the first.
- Until 4.0.0 the overlay also carried `background-color: rgba(0, 0, 0, 0)`, which is IE10's, where a transparent pseudo-element did not take the click. Measured in Chrome 152, Firefox 156 and Safari 26.6.2 by asking what a click in the far corner of the card would hit: the answer was the link with the line and without it, in all three.
- `pointer-events: auto` stays and is not decoration: with an ancestor at `pointer-events: none`, the corner answered the link with it and the body without it, in all three browsers.
- The overlay sits above the card's text, so the text inside the card cannot be selected with the mouse. That is the trade every version of this technique makes.

**`tablet`**

- `device-width` and `device-height` read the screen, not the viewport, so a tablet running the page in a split view still matches: the window is narrower, the screen is not. A rule that has to follow the window belongs in `breakpoint` or `container-query`.
- A size is not a model: the current iPad, the iPad Air 11-inch and the iPad Air 4 and 5 all measure 820x1180, and the 12.9-inch Pro and the 13-inch Air both measure 1024x1366.
- `iPad` and `iPadPro` keep the sizes they have always had, the 7th to 9th generation iPad at 810x1080 and the 12.9-inch Pro, so no existing call changes. The current iPad is `iPad-A16` or `iPad10`, and the 11-inch Pro is `iPadPro-11` or `iPadPro-11-M4`.
- Since 4.0.0 an entry in the map is the screen as two lengths, `iPad10: 820px 1180px`, rather than a map of `width` and `height`. A map that still holds the old shape raises with a message saying so.

**`text-gradient`**

- The letters have no colour of their own: the gradient is the only thing painting them. In forced colours the browser forces `background-image: none` and forces `color`, but `-webkit-text-fill-color` is not a forced property, so the transparent fill survived and the text disappeared. Since 4.0.0 a `@media (forced-colors: active)` block gives both back: measured with forced colours on, the computed fill colour was `rgba(0, 0, 0, 0)` before and is black now, in Chrome 152 and Firefox 156. Safari has no way to turn forced colours on from automation, so it was not measured there.

**`text-image`**

- The letters have no colour of their own: `color` and `-webkit-text-fill-color` are transparent and the image is the only thing painting them. With a path that 404s the heading is **gone**, not broken: measured in Chrome 152, the box was pixel for pixel one whose text is transparent and which has no background at all. `$fallback` writes a `background-color` under the image, and with it the same box rendered its letters in that colour.
- Forced colours used to lose the text as well: the browser forces `background-image: none` and forces `color`, but `-webkit-text-fill-color` is not a forced property, so the transparent fill survived. Since 4.0.0 a `@media (forced-colors: active)` block gives both back. Measured with forced colours on: the computed fill colour was `rgba(0, 0, 0, 0)` before and is black now, in Chrome 152 and Firefox 156. It could not be measured in Safari, which has no way to turn forced colours on from automation.

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

**`truncate`**

- One line and several lines are different techniques, and that is why this replaced `ellipsis` and `line-clamp` in 4.0.0. One line is `white-space: nowrap` with `text-overflow`, which leaves the display alone; several is the `-webkit-box` trio, which takes the display over. Measured in Chrome 152, Firefox 156 and Safari 26.6.2 on a 320px box, they look the same at one line and the element differs: `inline-block` against Safari's `-webkit-box`.
- The standard `line-clamp` property is written beside the prefixed one for the future. `CSS.supports("line-clamp: 3")` still answers false in all three browsers, so the prefixed trio is what does the work.
- All five declarations of the clamp are needed: measured on a paragraph of five lines with a clamp of three, dropping `-webkit-box-orient`, `display: -webkit-box` or using the standard property alone left all five lines showing, and dropping `overflow: hidden` left the box three lines tall with the rest spilling out below it.

**`convertToEm`**

- Until 4.0.0 the unit was added as text, so the function returned the string `1.5em` rather than a number: it printed the same, and `convertToEm(24px) * 2` stopped the build with Sass's "Undefined operation". It now returns a number, as `remify` always has.

**`fillNulls`**

- The second argument was spelt `$seperation` until 4.0.0. The old spelling still works as a keyword argument and warns; `$separation` is the one to pass.

**`isNumber`**

- Until 4.0.0 a value that was not a number only warned, and the function then ended with nothing to return, so the build stopped with Sass's own "Function finished without @return" instead of a message naming the argument. It now raises, which is what `isColor` and `isTime` do.
- A `var()` or a `calc()` is not a Sass number and is refused. Pass those straight to the property rather than through a type guard.

**`isTime`**

- A unitless `0` is not a time and is refused since 4.0.0. Measured in Chrome 152, Firefox 156 and Safari 26.6.2: `animation-delay: 0` and `transition-duration: 0` are dropped, and in the `animation` shorthand a bare `0` is read as the iteration count, so `loadify 0.5s 0 backwards` never runs. Write `0s`.

**`mapDeepGet`**

- No map the library ships is nested any more: the phone and tablet maps held one entry per device until 4.0.0 and now hold the screen as two lengths. The function is for a map of your own.

**`pixelify`**

- Until 4.0.0 the unit was thrown away and `px` written in its place, so `2rem` gave `2px`, `1in` gave `1px`, `12pt` gave `12px` and `50%` gave `50px`. The conversions are now real: measured in Chrome 152, Firefox 156 and Safari 26.6.2, `2rem` is 32px, `1in` is 96px and `12pt` is 16px in all three.
- `em`, `%` and the viewport units are refused rather than guessed at: they are measured against the element's own font size, its parent and the window, none of which Sass can know. `rem` is converted against a 16px root, the same assumption `remify` and `convertToEm` make, so it is wrong for a page that sets another root size.

**`shorthandProperty`**

- Until 4.0.0 only a fifth value was checked. An empty list ended the build with Sass's own "Function finished without @return", and a map was read as its keys and values in turn, so `(a: 1, b: 2)` came out as `a 1 b 2 a 1 b 2`. Both raise now.
- A `null` is passed through on purpose, because a caller can read the four values back and skip the ones that are unset, which is what `position` does: `position(absolute, null)` writes the position and no offsets. In a declaration of your own a `null` simply disappears from the list, so `margin: shorthandProperty(1px null)` is `margin: 1px 1px`.

## Mixins

| Signature | What it does |
|---|---|
| `adaptive($gutter: 30px)` | Centred container whose max-width steps up at every breakpoint, full width below the first. |
| `after($content: null)` | Styles the ::after pseudo-element. A `data-` argument becomes an attr() content value. |
| `all-buttons($pseudo: null)` | Targets every button element at once, optionally in one pseudo-class state. |
| `all-text-inputs($pseudo: null)` | Targets every form control a browser draws as a text field, textarea included, optionally in one pseudo-class state. |
| `antialias($value: null)` | Draws text with greyscale antialiasing instead of subpixel, which makes it look thinner. |
| `aspect-ratio($ratio: null, $fit: cover)` | Holds an element to a ratio and adds what CSS aspect-ratio alone leaves out: object-fit so an image is cropped rather than stretched, and border: 0 so an iframe does not overflow its container by 4px. Apply it to the element itself, not to a wrapper. |
| `auto-grid($min: 16rem, $gap: 1rem, $limit: null, $fill: false)` | A grid that fits as many columns of $min as the container holds, without overflowing a narrow one. |
| `background-image($image-url: null, $filter-color: null, $filter-direction: null)` | Background image with an optional colour or gradient filter laid over it. |
| `background-pattern($kind: dots, $params...)` | Twenty background patterns drawn with gradients alone: seventeen that tile, from dots and stripes to houndstooth and harlequin, and glow, vignette and mesh, which light the whole box. |
| `before($content: null)` | Styles the ::before pseudo-element. A `data-` argument becomes an attr() content value. |
| `border-box($value: null)` | Applies box-sizing: border-box. |
| `border-radius($args...)` | Rounds corners, either all of them, one named corner, or all four individually. |
| `brand-logo($width, $height, $image-url: null)` | Logo box with an image and an accessible stretched link over it. |
| `breakpoint($params...)` | Media query built from the breakpoint map, or from raw lengths. |
| `breakpointer($selector: null)` | Debug helper that prints the active breakpoint name into a pseudo-element. |
| `center($axis: "both")` | Centres an absolutely positioned element in its positioned parent, leaving transform free. |
| `circle($size)` | Square element with a fully rounded border, i.e. a circle. |
| `columnizer($params...)` | Flexbox grid of equal columns, with an optional gutter written as gap and an optional fill for the last row. |
| `container-query($params...)` | A @container rule, taking the same argument shapes as breakpoint so the two read alike. Sizes may be a key from $map-for-breakpoints or a raw length, and a length is the common case because a container is usually narrower than the viewport. Nothing matches at all unless an ancestor was declared with the container mixin. |
| `container($name: null, $type: inline-size)` | Marks an element as a query container, so container-query can ask about its width instead of the viewport's. The rule that asks has to sit on a descendant: an element is never matched by a @container rule reading its own container, and nothing warns you when it is not. |
| `counter($params...)` | Numbers the children of the element it is included in, with optional text before and after each number. No classes in the markup. |
| `escape-to-parent($selector: null)` | Writes the rule again with another selector attached to its outermost element, so a theme or state class can switch what a nested rule does. |
| `except($params...)` | Selects every sibling but the ones named, counted by tag or by a selector you name. |
| `focus-ring($width: 2px, $offset: 2px, $color: currentColor)` | Draws a keyboard focus ring with outline on :focus-visible, which survives forced-colors mode where a box-shadow ring disappears. |
| `font-face($font-family, $file-path, $font-style: normal, $font-weight: 400, $file-formats: woff2, $font-display: null)` | Emits an @font-face rule for one family across several file formats. Must be called at the root. |
| `gradient($colors, $type: linear, $direction: null, $shape: null, $position: null, $from: null, $in: null, $repeating: false)` | A linear, radial or conic gradient as background-image, plain or repeating, with an optional colour interpolation space. Replaced linear-gradient and radial-gradient in 3.0.0. |
| `hide($toggle: "hide")` | Visually hides an element while keeping it available to screen readers, either always or until it or anything inside it has keyboard focus. |
| `loadify($params...)` | Fades elements in on page load. Call `loadify(init)` once at the root to write the keyframes, then the mixin on each element. |
| `motion-safe` | Wraps its content in @media (prefers-reduced-motion: no-preference), so motion is opt-in: a user who asked their system for less motion gets none of it. |
| `only($params...)` | Selects only the siblings named, counted by tag or by a selector you name. |
| `placeholder-shown` | Styles an input while its placeholder is visible, which is how a floating label knows the field is empty. |
| `placeholder` | Styles the placeholder text of an input or a textarea. |
| `position($position: absolute, $offsets: 0, $logical: false)` | Sets position and offsets in one call, using shorthand order. |
| `remove($params...)` | Hides an element outright, or within a media query: from a breakpoint up with min, up to it with max, or between two breakpoints. One breakpoint on its own hides the element at exactly that width, a single pixel, and prints a warning: pass only for that. |
| `reset-css` | Writes a modern baseline for the document: border-box, readable line heights, media that stays in its container, form controls that inherit the page's font. |
| `reset-figure` | Drops a figure's default margins and fits the image inside it. |
| `resizable($direction: both, $overflow: auto)` | Makes an element user-resizable. |
| `responsive-image` | Fits an image to its container without upscaling it or losing its proportions. |
| `scissors($corners)` | Cuts the corners off an element with clip-path. |
| `screen-agent($resolution)` | Media query targeting a screen pixel density. |
| `sidebar($side: 20rem, $gap: 1.5rem, $threshold: 50%, $side-on: left)` | A sidebar and a content column that stack when the space runs out, with no media query. |
| `sizer($width, $height: $width)` | Sets width and height together; one argument makes a square. |
| `smartphone($device, $orientation: null)` | Media query for one phone's screen, by name, from $map-for-smartphones. |
| `sprite($params...)` | Sets up an element as a sprite tile: an image, a background position, or both. |
| `stretched-link($value: "before")` | Spreads a link over its positioned parent, so the whole card is clickable. |
| `tablet($device, $orientation: null)` | Media query for one tablet's screen, by name, from $map-for-tablets. |
| `text-gradient($colors, $type: linear, $direction: null, $shape: null, $position: null, $from: null, $in: null, $repeating: false)` | Fills the text with a gradient through background-clip: text. It takes the gradient mixin's arguments, colours first: a linear, radial or conic gradient, plain or repeating, with an optional colour space. |
| `text-image($image: null, $fallback: null)` | Fills the letters with an image, with a colour to fall back to. |
| `text-selection($value: null)` | Styles the ::selection pseudo-element. |
| `text-shadow($params...)` | Layered text shadows, each written as a direction or an angle, a colour and a distance. |
| `text-stroke($width: 1px, $color: currentColor, $style: hollow, $fill: null)` | An outline on text, in three looks: outside the letter, straddling it, or the letter left unfilled. |
| `tokens($map, $prefix: null)` | Writes a Sass map out as CSS custom properties, for any kind of token: colours, spacing, sizes, radii, type, shadows, durations. With the prefix space, (4: 1rem) becomes --space-4: 1rem. A null value is skipped, and a quoted string keeps its quotes. |
| `triangle($direction: "bottom", $color: black, $size: 10px 8px)` | Draws a CSS triangle out of borders, pointing in a given direction. |
| `truncate($lines: 1, $width: null, $display: inline-block)` | Truncates text: one line with an ellipsis, or several with a clamp. |

## Functions

Called like normal Sass functions, with no `@include`. They are public API,
and camelCase is what tells them apart from the kebab-case mixins above.

| Signature | What it does |
|---|---|
| `clearUnit($value)` | Strips the unit off a number, returning it unitless. |
| `clearWhitespace($string)` | Removes every space from a string. |
| `convertToEm($value)` | Converts a pixel length to em, against a 16px base. |
| `convertToNumber($value)` | Parses a string of digits into a number. |
| `fillNulls($value, $separation: comma, $skip: false, $seperation: null)` | Replaces null entries in a list with 0, or drops them. |
| `fluid($min, $max, $min-viewport: 320px, $max-viewport: 1280px)` | A clamp() value that grows with the viewport between two widths, then stops. The preferred value keeps a rem term rather than being pure vw, because a vw-only value ignores browser text zoom and fails WCAG 1.4.4. It is a function rather than a mixin because the value is the hard part and belongs to any property, not only font-size. |
| `fontSizer($size, $time)` | Multiplies a size by a factor. Handy for a modular scale. |
| `fontSource($font-family, $file-path, $file-formats)` | Builds one src entry for an @font-face rule. |
| `gradientValue($colors, $type: linear, $direction: null, $shape: null, $position: null, $from: null, $in: null, $repeating: false)` | The gradient mixin's gradient as a value, for layering it with an image in one background-image, or using it as a mask-image or border-image. It takes the same arguments and refuses the same input, but cannot write the fallback the mixin writes before a gradient with $in. |
| `isColor($value)` | Returns the value if every item in it is a colour, and errors otherwise. |
| `isGutter($value)` | True for anything that can sit where a CSS length is expected: a number, a calculation, or a CSS function such as var(). |
| `isNumber($value)` | Returns the value when it is a number, and raises when it is not. |
| `isTime($value)` | Returns the value if every part of it is a time in s or ms, and errors otherwise. |
| `mapDeepGet($map, $keys...)` | Reads a value out of a nested map by following a chain of keys. |
| `pixelify($value)` | Returns the value in pixels: a unitless number takes a px, and a length in another unit is converted. |
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
