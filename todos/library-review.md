# A review of the whole library, 17 September 2026

Every mixin, function, list and map was read, with probe calls compiled in a
scratchpad, and comparable projects and modern CSS were surveyed at the same
time. This file is the list of what could be modernised, merged, added or
removed. Nothing here is decided, and nothing was measured in a browser.

**Evidence labels.** `[compiled]` means the CSS in this file came out of Dart
Sass here. `[source]` means it was read in the code. `[measure]` means it needs
Chrome, Firefox and Safari before anyone acts on it, as **Verifying a claim** in
`CLAUDE.md` requires. The 4.0.0 work already done on the branches is not
re-proposed.

---

## 1. Defects, reproduced here

Each of these was compiled on the `counter` branch.

| # | Call | What comes out | Why it is wrong |
|---|---|---|---|
| 1 | `text-shadow(top red 5px, sideways blue 3px)` | `text-shadow: 0 -5px red` | the second group's bad direction is dropped without a word |
| 2 | `text-shadow(top red -5px)` | `0 --5px red` | the browser drops the declaration |
| 3 | `text-shadow(top notacolor 5px)` | `0 -5px notacolor` | the colour is never checked |
| 4 | `text-shadow(top red 1.5rem, true)` | Sass's `1.5 is not an int` | an internal error, not the library's |
| 5 | `sprite("icons.webp")` | the library's error | `.webp`, `.avif`, `.gif`, `a.png?v=2` and `var()` are all refused, though the two-argument form takes any string |
| 6 | `.c, .d { .b { escape-to-parent(".theme") } }` | `.theme.c .b, .d .b` | only the first selector is prefixed, so `.d .b` gets the styles unconditionally |
| 7 | `ul li { escape-to-parent(".theme") }` | `.themeul li` | a selector that matches nothing |
| 7b | `escape-to-parent(".theme, .other")` | `.theme, .other.card` | found while fixing 6 and 7: the bare `.theme` paints every element carrying the class |
| 8 | `pixelify(2rem)` | `2px` | a silent, wrong conversion |
| 9 | `isNumber("a")` | `@warn`, then Sass's `Function finished without @return` | the same for `shorthandProperty(())` |
| 10 | `convertToEm(24px)` | the string `1.5em` | `convertToEm(24px) * 2` fails, while `remify` returns a number |

**Rows 6, 7 and 7b are done for 4.0.0 on the `escape-to-parent` branch.** The
mixin parses both sides with `sass:selector` instead of pasting the argument
onto the front of the parent as text, so every branch of the parent takes every
branch of the argument and `unify` writes an element before a class. A 253 call
matrix compiled against 3.x and against the branch: 110 calls unchanged, 111
changed, every one of them from a selector that leaked or matched nothing, and
32 now raise, all with the library's own message. It also gained a sass-true
spec and its documentation page's first demos.

**Rows 5, 8, 9 and 10 are done for 4.0.0 on the `library-defects` branch.**
`sprite` tells an image from a position by asking whether the value is a
position, rather than by reading the last four characters, so every format a
browser loads works and a quoted position is unquoted; `pixelify` converts the
unit rather than replacing it, exactly for the absolute units and against a
16px root for `rem`, and refuses `em`, `%` and the viewport units; `isNumber`
raises as `isColor` and `isTime` do; `shorthandProperty` raises on an empty
list and on a map, and still carries a `null` through, which `position`
depends on; and `convertToEm` returns a number. A 155 call matrix compiled
against 3.x and the branch: 102 unchanged, 53 changed, and `2rem` as 32px,
`1in` as 96px, `12pt` as 16px and a quoted `background-position` being dropped
were measured in Chrome 152, Firefox 156 and Safari 26.6.2.

`text-shadow` is the worst of these: it is in the SILENT and BROKEN OUTPUT
buckets that `tools/audit.js` is supposed to keep empty, and
`todos/silent-values.md` lists it as refusing every bad value, which only held
for the first group.

**Rows 1 to 4 are done for 4.0.0 on the `text-shadow` branch.** Every direction
is now an angle, the keywords being its 45 degree steps, and the direction, the
colour, the distance and the blur are all checked. `0 --5px red`, `0 -5 red`,
`0 -5px -2px red` and `0 -5px notacolor` were measured in Chrome 152, Firefox
156 and Safari 26.6.2: all four compute to `none`, so nothing that worked is
refused. `$step` was added for how far apart a filled shadow's layers sit, a
`var()` distance now works through a `calc()` holding the sine and cosine, and
`MIGRATION.md` carries the diagonal change.

## 2. Outdated CSS, worth a major

- **`smartphone` and `tablet`.** They query `device-width` and `device-height`,
  deprecated in Media Queries 4, against a device table whose newest entry is
  from 2019. Several keys share dimensions, so a "model" query matches other
  models, and the landscape branch swaps the two, which on iOS probably never
  matches. [source] [measure] Proposal: deprecate with a `@warn` naming
  `breakpoint`, `container-query`, `(pointer: coarse)` and `(hover: none)`, and
  remove them with `map-for-smartphones` and `map-for-tablets`. **Measured and
  half done for 4.0.0 on the `device-maps` branch**, where the maintainer chose
  to keep the two and refresh them: `device-width` still resolves in all three
  engines, the maps are current again and flat, and both pages say that a size
  is not a model and that the query reads the screen rather than the window.
  Deprecating them is still open, and so is Android; `todos/device-maps.md`
  has the measurements.
- **`reset-css`** is Meyer's 2011 reset, unchanged: obsolete elements
  (`applet`, `acronym`, `center`), single-colon `:before`, no `box-sizing`, no
  font inheritance on form controls, `line-height: 1` on `body`, and no
  `:where()`, so it beats a component's own rules. [source] Proposal: a second
  member, `reset-modern`, everything inside `:where()`, which keeps list
  semantics for `[role=list]`, makes controls inherit the font and sets the
  media defaults. Leave `reset-css` alone for the people who call it.
- **`placeholder`** writes four rules for browsers before 2017 plus
  `::placeholder`. [source] Proposal: deprecate, or keep only `::placeholder`.
  `placeholder-shown` is a single pseudo-class and fails the bar; the trap
  worth encoding is the float-label pattern, which needs `placeholder=" "`.
- **`clearfix`** is a float-era technique; `display: flow-root` replaces it in
  one declaration, though the two differ in margin collapsing. [source]
  [measure] Proposal: deprecate with a `@warn`.
- **`antialias`** sets two non-standard properties that only ever worked on
  macOS. **The summary is fixed for 4.0.0 on the `border-box-specificity`
  branch**, and the mixin is not dead: in Chrome 152 the same line of text
  rendered to different pixels with and without it, compared as clipped PNGs.
  Deprecating it is still open.
- ~~**`stretched-link`** carries `background-color: rgba(0, 0, 0, 0)`~~ **done
  for 4.0.0 on the `stretched-link` branch**: the colour is gone and the four
  offsets are `inset: 0`. Measured in Chrome 152, Firefox 156 and Safari
  26.6.2, a click in the far corner of the card hits the link with the old CSS
  and with the new. `pointer-events: auto` stays: with an ancestor at
  `pointer-events: none` the corner answers the link with it and the body
  without it.
- ~~**`loadify`** starts its elements at `visibility: hidden`~~ **done for
  4.0.0 on the `loadify-visible` branch**: the keyframes start at `opacity: 0`
  with `backwards`, the element carries no hidden state, and the placeholder is
  gone, so `init` no longer has to be visible to the call and a stylesheet that
  forgets it builds with no fade. Measured in Chrome 152, Firefox 156 and
  Safari 26.6.2 with a later `animation: none`: the element computed to
  `opacity: 0` and `visibility: hidden` in all three and now computes to `1`
  and `visible`. The fade itself was timed in Chrome and Firefox; Safari
  throttles animations in an automation window, so the timing could not be read
  there.
- ~~**`responsive-image`**~~ **done for 4.0.0 on the `responsive-image`
  branch**: `max-inline-size: 100%` and `height: auto` inside `:where()`.
  Measured in Chrome 152, Firefox 156 and Safari 26.6.2, all three agreeing: a
  100x50 image in a 600px container was drawn at 600x300 and is now left at
  100x50, a 1200x600 one still fits at 600x300, an image carrying `width` and
  `height` attributes was drawn 600x600 and is now 600x300, and a `height` a
  stylesheet sets still wins. `reset-figure` includes it and follows.
- ~~**`border-box`** and **`antialias`** write `.a *` at (0,1,0)~~ **done for
  4.0.0 on the `border-box-specificity` branch**: the descendants go through
  `:where()`, as `columnizer` does. Measured in Chrome 152, Firefox 156 and
  Safari 26.6.2 with a page rule written before the include: it lost in all
  three before and wins in all three now, while an element with no rule of its
  own still gets the reset.
- ~~**`center`** writes `transform: translateX(-50%) translateY(-50%)`~~ **done
  for 4.0.0 on the `center-translate` branch**: the offset is the individual
  `translate` property. Measured in Chrome 152, Firefox 156 and Safari 26.6.2,
  a 100x50 element centred in a 400x200 box and then given
  `transform: rotate(10deg)` or `scale(1.5)` sat 50px right and 25px below the
  middle in all three, and now stays in the middle; a transform written before
  the include used to be dropped instead. One-axis offsets are unchanged.
- **`adaptive`** does nothing below 576px and hard-codes the `xsmall` key.
  [source] `width: min(100% - 2 * gutter, key)` would give a gutter at every
  width. Two agent trials turned the mixin down; `todos/fix-plan.md` says to
  find out who uses it before any deprecation.
- **`text-stroke`** is **done for 4.0.0 on the `text-stroke` branch**: the
  arguments are `$width, $color, $style, $fill`, and `$style: outside` writes
  `paint-order: stroke fill` at twice the width, which keeps the letterform. The
  ink counts behind that are in `MIGRATION.md`. Its remaining idea, a
  `paint-order` shorthand for other members, was not pursued.
- **`text-gradient` and `text-image`** set `color: transparent` with no guard,
  so the text is invisible wherever the background does not paint, forced
  colours included, and `text-image` loses its text when the image 404s.
  [source] [measure]
- ~~**`all-buttons`** selects `[type='button']` without `input`~~ **done for
  4.0.0 on the `all-buttons` branch**: every type is written with `input`,
  `input[type='image']` joins the list, and `$pseudo` takes `focus-visible`
  and `focus-within`. Measured in Chrome 152, Firefox 156 and Safari 26.6.2:
  `<a type="button">` and a custom element took the styles in all three and no
  longer do, the image button was in no rule and now is. The click against Tab
  comparison for `focus-visible` was measured in Chrome and Firefox; macOS
  Safari does not focus a button on click unless full keyboard access is on.

## 3. Merges, in the shape of the 3.0.0 gradient work

| Merge | Sketch | Note |
|---|---|---|
| `text-gradient` + `text-image` | `text-fill($source, $size, $position, $fallback: currentColor)` | one member for gradients, images and `image-set()`, writing `background-image` rather than the shorthand, with the forced-colours fallback |
| ~~`background-dots` + `background-stripes`~~ | **done for 4.0.0 on the `background-pattern` branch**: one mixin, twenty patterns, an image as a background layer rather than a `::before`, longhands only, and colours that follow `currentColor` | |
| `only` + `except` | `nth($positions..., $not: false, $of: null)` | `$of` writes `:nth-child(n of .item)`, which counts by class rather than by tag, the thing `-of-type` gets wrong |
| `ellipsis` + `line-clamp` | `truncate($lines: 1, $width: 100%)` | one line is the nowrap method, more lines the clamp method |
| `placeholder` + `placeholder-shown` | `placeholder($state: text \| shown)` | or deprecate both |
| `smartphone` + `tablet` | remove, do not merge | merging keeps a broken technique alive |
| `circle` into `sizer` | `sizer($w, $h: $w, $round: false)` | low value, only if something else breaks these |
| `reset-figure` into `responsive-image` | drop `reset-figure` | it is `margin: 0` plus one include |

## 4. New members

**Ready now.** Each closes a trap, and each is Baseline in all three browsers.

1. **`auto-grid($min, $gap, $fill)`**: `repeat(auto-fit, minmax(min(100%, $min), 1fr))`. Already in `CLAUDE.md`; the `min()` is what stops a 250px container overflowing.
2. **`sidebar($side-width, $content-min, $gap, $side)`**: Every Layout's sidebar, which needs `flex-grow: 999`, `flex-basis: 0` and `min-inline-size: 50%` on the right child. Nobody writes that from memory.
3. **`switcher($threshold, $gap, $limit)`**: a row that flips to a column in one step, through a negative `flex-basis: calc(($threshold - 100%) * 999)`, with a quantity query for the item limit.
4. **`presence($open, $duration, $backdrop)`**: entry and exit animation for popover, dialog and `display: none`. `@starting-style` has to come after the rule it starts from, `display` and `overlay` both need `allow-discrete`, and `::backdrop` needs its own pair. Baseline since August 2024, so `CLAUDE.md`'s "too new" note is out of date. Firefox may not transition `display` [measure].
5. **`theme($mode, $strategy, $attribute)`**: `color-scheme` plus `light-dark()`, over the system setting and a manual toggle at once. Already promised in `todos/design-tokens.md`, where the light-without-`color-scheme` failure is measured.
6. **`safe-area($property, $min, $sides)`**: `max($min, env(safe-area-inset-*))`, since `env()` alone replaces the design padding with 0 where there is no inset.
7. **`glass`** and **`edge-fade`**, already in Pending work, both needing a prefixed twin for older Safari and a `@supports` fallback.
8. **`long-shadow($color, $length, $direction, $step)`**: what `text-shadow`'s fill mode tries to be, with the count computed from the length.
9. **`hit-area($min: 44px)`**: a pointer target of at least 24px for WCAG 2.5.8 without changing the visual size. [measure] against clipped parents.
10. **`lazy-render($size)`**: `content-visibility: auto` with `contain-intrinsic-size: auto $size`, without which the scrollbar jumps and anchors land wrong. Baseline September 2025.
11. **`when($feature)`**: one query mixin for `pointer: coarse`, `hover: none`, `forced-colors`, `prefers-contrast` and `scripting: none`, with `motion-safe` kept as an alias. It is also the replacement to point `smartphone` and `tablet` at.

**Parked until they age.** `text-trim` (Baseline August 2026), `field-sizing`
(June 2026), anchor positioning (January 2026, and partial before Safari 26),
style queries (May 2026), `corner-shape` for `scissors`, `appearance:
base-select`, `interpolate-size`, scroll-driven animations, `sibling-index()`.

**Fails the bar**, so not worth a member: `cluster`, `divider`, `stack` without
its split option, `text-wrap: balance` and `pretty`, `safe` alignment,
`:user-invalid` on its own (it is a `$pseudo` for `all-text-inputs`), font-stack
mixins, `subgrid`, `:has()`, `@layer`, `@scope`.

## 5. Utilities, lists and maps

- **Defects:** `isNumber` and `shorthandProperty` can end without a return,
  `pixelify(2rem)` returns `2px`, `convertToEm` returns a string where `remify`
  returns a number, `isTime("1s 2s")` errors instead of answering, `isColor`
  accepts a list and lets Sass raise. `fillNulls` spells its argument
  `$seperation`; an alias would fix that without a break.
- **`tint` and `shade`** mix in sRGB. An optional `$method: oklch`, and a
  `color-mix()` form for `var()` values, would modernise them without changing
  today's output.
- **`mapDeepGet`** duplicates `map.get($map, $keys...)`, built in since Dart
  Sass 1.27. Keep it, it is public API, but it could become a wrapper.
- **`list-of-length-units`** misses `dvh`, `svh`, `lvh`, `cqi`, `rlh`, `cap`,
  `vi` and `vb`, which `scss/internal/_is-condition-value.scss` already knows.
  **`list-of-counter-styles`** has `lower-alpha` twice.
  **`list-of-anchor-pseudo-classes`** has no `focus-visible` or `focus-within`.
- **`map-for-breakpoints`** has no `xxl` key, where Bootstrap 5 has 1400px.
  Adding one is not breaking.
- **`map-for-smartphones` and `map-for-tablets`** go with `smartphone` and
  `tablet`.

## 6. What the survey of other projects says

- **Bourbon was deprecated in September 2024**, telling users to write native
  CSS. Before that, 5.0.0 had already removed its prefixers, `em`, `rem`,
  `golden-ratio`, `box-sizing`, `inline-block` and `retina-image`, with one
  minor version of warnings first. The members closest to that line here are
  `border-box`, `antialias`, `responsive-image`, `clearfix`, `sizer`, `circle`,
  `placeholder`, `smartphone` and `tablet`.
- **What nobody ships** is the thing this library could: a compile-time
  contrast check on a colour pair, and `gerillass_compile` for agents. Both are
  already recorded, in `todos/design-tokens.md` and
  `todos/verifiable-css-layer.md`.
- **Sass MQ dropped `@import` support in 7.0.0.** This library still documents
  `@import` routes, which becomes a question when Dart Sass removes it.
- A shared internal `deprecate($name, $since, $use)` would keep the warnings of
  a deprecation cycle consistent, the way Bootstrap's `_deprecate.scss` does.

## 7. Leverage, the maintainer's north star

Named on 17 September 2026: one or two lines of Sass should write dozens of
lines of modern, good looking CSS, as `text-shadow` now does. Measured by that,
the candidates in this file sort differently from how they sort by defect
severity:

| Lines of CSS one call writes | Members |
|---|---|
| high, a computed or layered effect | `text-shadow` (done), a `long-shadow` sibling, `background-pattern` from the two background mixins, `text-fill`, `glass`, `edge-fade`, `presence`, `theme`, `switcher`, `sidebar`, `auto-grid` |
| middling, several declarations that have to agree | `truncate`, `columnizer`, `aspect-ratio`, `focus-ring`, `hit-area`, `safe-area`, `lazy-render`, `reset-modern` |
| low, a wrapper around one declaration | `border-box`, `antialias`, `responsive-image`, `clearfix`, `circle`, `sizer`, `placeholder-shown`, `remove` |

The last row is the deprecation list in section 2, and the first row is where
new work earns the most. A defect in a low-leverage member is still worth
fixing, but it is not worth a redesign.

## 8. A suggested order

1. **The defects in section 1**, which are bugs, not design questions.
   `text-shadow` and `escape-to-parent` first.
2. **4.0.0 candidates, since the major is open**: `smartphone` and `tablet`
   deprecated, `responsive-image`, `text-gradient` and `text-image` (or the
   `text-fill` merge), `loadify`, `border-box` and `antialias` scoping,
   `center` on `translate`, `all-buttons`.
3. **The merges**, one at a time, each with a `MIGRATION.md` section.
4. **New members**, in the order above, each through `/new-mixin`.
5. **`reset-modern`**, which also absorbs several one-declaration ideas.

## Not covered

- No browser was opened for any of this, and none of the `[measure]` claims has
  been checked. The three-browser rule applies to every one of them before it
  becomes work.
- The probe calls were literals and a few `var()` values, not the full
  value-kind matrix, and `tools/audit.js` was not re-run against these findings.
- Baseline dates come from the `web-features` package and MDN's compatibility
  data, not from the browsers themselves.
- Whether anyone actually uses `adaptive`, `smartphone`, `tablet` or `sprite`
  was not researched, and `todos/fix-plan.md` asks for that before a removal.
