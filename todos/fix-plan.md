# Fix plan after three agent trials

The findings of `agent-trials.md` turned into work. Three projects were built
from scratch by coding agents with the published package, and every claim in
their feedback was checked by compiling it, and in a browser where compiling
could not settle it. This file says what to change, in what order, and why.

Written 13 September 2026 against gerillass 2.1.0, and validated the same day:
see Validation at the end, which moved two items and corrected four. Nothing
below has been implemented. Figures and line numbers age; re-check them before acting, as
`CLAUDE.md` asks of everything in `todos/`.

## How to read an item

Every item has the same parts:

- **Problem**: what goes wrong, in the terms of someone calling the mixin.
- **Example**: the call and what it does today, compiled with Dart Sass 1.103.1,
  the version this repository installs. The trials ran 1.104.1.
- **Fix**: the change, with code where the change is code.
- **Changes existing output?**: whether any call that works today would emit
  different CSS. This decides the release.
- **Touches**: the files, specs, `meta/` entries and pages that move with it.
- **Verify**: what proves it worked.

**T1**, **T2** and **T3** mark which trial found it: T1 a portfolio (Claude
Opus 5, Sass CLI), T2 a conference site (Claude Fable 5.1, Vite), T3 a
bidirectional operations dashboard (model not recorded, Parcel). A finding more
than one trial reached independently is the strongest signal here. **probe**
marks what no trial hit but a sweep of `var(--x)` through every argument found;
see G4.

## Overview

| # | Item | Release | Trials |
|---|---|---|---|
| G1 | Fail the manifest suite when an example warns | groundwork | T1 T2 |
| G2 | Test values that must be accepted, not only refused | groundwork | T1 T2 T3 |
| G3 | A `caveats` field for behaviour a signature cannot show | groundwork | T1 T2 T3 |
| G4 | The audit sees Sass arithmetic errors and broken `var()` output | groundwork | probe |
| F1 | `triangle` accepts `var()`, `currentColor`, `color-mix()` | 2.1.1 | T1 T2 |
| F2 | `position` skips `null` without a warning | 2.1.1 | T1 T2 |
| F3 | `breakpoint` refuses three arguments instead of emitting nothing | 2.1.1 | T1 |
| F4 | Size conditions refuse `var()`, which can never match | 2.1.1 | T3 |
| F7 | `reset-css` stops putting comments in compiled CSS | 2.1.1 | T1 T2 |
| F8 | Values that end up in a declaration let a CSS function through | 2.1.1 | probe |
| F9 | Computed sizes work with `var()`, `calc()` and `clamp()` | 2.1.1 | probe |
| F10 | `background-image` and `font-face` stop dropping values silently | 2.1.1 | probe |
| F11 | Utility functions refuse non-numbers with their own message | 2.1.1 | audit |
| D1 | Document the `loadify` module rule | 2.1.1 | T2 |
| D2 | Correct the `remove` summary and example | 2.1.1 | T2 T3 |
| D3 | A Parcel section in the README | 2.1.1 | T3 |
| A1 | Logical directions for `triangle` | 2.2.0 | T3 |
| A2 | Logical corners for `border-radius` | 2.2.0 | T3 |
| A3 | Logical offsets for `position` | 2.2.0 | T3 |
| A4 | `$font-display` for `font-face` | 2.2.0 | T3 |
| A5 | `focus-visible` and `user-invalid` for `all-text-inputs` | 2.2.0 | T3 |
| N1 | New member: `focus-ring` | 2.2.0 | T1 T2 T3 |
| N2 | New member: a reduced-motion guard | 2.2.0 | T2 T3 |
| N3 | New member: custom properties from a map | 2.2.0 | T2 T3 |
| B1 | One boundary rule for `breakpoint` and `container-query` | 3.0.0 | T1 T2 T3 |
| B2 | Retire the one-argument exact-width form | 3.0.0 | T2 T3 |
| B3 | `columnizer` on `gap`, without margins or universal `box-sizing` | 3.0.0 | T1 T2 T3 |
| B4 | `hide("unhide")` leaves `position` alone | 3.0.0 | T2 T3 |
| B5 | `before` and `after` emit `content: ""` by default | 3.0.0 | T1 |
| B6 | `font-face` defaults to `woff2` | 3.0.0 | T3 |
| B7 | `all-text-inputs` stops matching `[type='color']` | 3.0.0 | T3 |
| B8 | `aspect-ratio` holds on images with `width`/`height` attributes | 3.0.0 | T3 |
| B9 | `counter` numbers correctly inside container queries | 3.0.0 | T2 |

The order is deliberate. Groundwork first, so each fix lands with a test that
would have caught the defect. Then the 2.1.1 fixes, which change no output of a
call that works today. Then 2.2.0 additions, which give callers something new
without touching what they have. The 3.0.0 changes come last, together, with a
`MIGRATION.md` section each, because each one changes CSS somebody may rely on.

Work already recorded elsewhere is not repeated: the `if()` deprecations are
under Modernisation in `CLAUDE.md`, and the comments in the source are in
`source-comments.md`.

---

## Groundwork

**Status.** G1 to G4 are implemented. What each one found when it landed is
recorded under it; the sections stay because the fixes below refer to them.

### G1. Fail the manifest suite when an example warns

**Problem.** An example in `meta/` is compiled and snapshotted, and it passes
even when the compile prints a `@warn`. A documented call can therefore warn on
every build without the suite ever noticing.

**Example.** The `position` documentation page shows skipping an edge with
`null`:

```scss
.a { @include position(absolute, null 16px 16px 16px); }
```

It produces the right CSS and this, which nobody catches:

```
WARNING: `` does not look like a length. Pass a number with a unit such as `20px` ...
```

The message is empty between the backticks because `null` interpolates to
nothing, so even a reader who sees it learns nothing.

**Fix.** Compile examples with a logger that records warnings, and fail the
test if one was recorded. Leave deprecation warnings out of it: the `if()`
deprecations are tracked separately and would fail every test.

```js
const warnings = [];
const result = sass.compileString(source, {
  ...options,
  logger: {
    warn(message, { deprecation }) {
      if (!deprecation) warnings.push(message);
    },
  },
});
expect(warnings).toEqual([]);
```

**Changes existing output?** No. Tests only.

**Touches.** `test/manifest.spec.js`.

**Verify.** Add the `null` example above to `meta/position.json`. The suite
must fail before F2 and pass after it. Done when G1 landed: with the example
added temporarily the test failed on the empty-message warning, and passed
again once it was removed.

**Validated.** None of the 143 examples in `meta/` prints a warning today, so
turning this on does not fail the suite by itself.

### G2. Test values that must be accepted, not only refused

**Problem.** `rejects` proves that bad input is refused. Nothing proves that
valid modern CSS is accepted, and three defects of exactly that shape shipped:
`triangle` refusing `var()` and `currentColor`, `position` warning on `null`,
and in the other direction `container-query` accepting a `var()` size that can
never match.

`tools/audit.js` does not help here as written. It probes every argument with
`nonsense`, `16 9`, `true`, `#ff0000`, `42` and `"a b"`, none of which is a value
that should pass.

**Fix, in two parts.**

1. **Put the modern forms in `examples`.** No new schema is needed. An example
   is compiled, snapshotted, shown in `SKILL.md` and, after G1, must compile
   without a warning. Showing `var()` in an example also teaches it to the
   agents that read the manifest.

   ```json
   "examples": [
     ".a { @include triangle(top, red, 10px); }",
     ".a { @include triangle(right, var(--accent), 6px 8px); }",
     ".a { @include triangle(right, currentColor); }"
   ]
   ```

   Where a modern form must be refused, put it in `rejects`, so the refusal is
   tested too:

   ```json
   "rejects": [
     ".a { @include container-query(min, var(--wide)) { color: red; } }"
   ]
   ```

2. **Give the audit a second list, as a report.** Probe each argument with
   `var(--x)`, `currentColor`, `null` and `calc(1rem + 2px)`, and report the
   ones that raise in a new bucket, "refused valid CSS". It stays a report, not
   a gate, because not every argument should take every value: a size in a
   query condition must refuse `var()`.

**Changes existing output?** No.

**Touches.** `meta/*.json` for the members in F1, F2 and F4; `tools/audit.js`.

**Verify.** The new `triangle` examples fail until F1 lands, which is the point:
land each example in the same change as its fix.

### G3. A `caveats` field for behaviour a signature cannot show

**Problem.** Several of the traps the trials hit are behaviour, not argument
shape, and the manifest has nowhere to put them. `tools/build-manifest.js`
copies exactly four things from `meta/`: `summary`, `examples`, `rejects`, and
the `accepts` text on each argument. Anything else in a `meta/` file is dropped,
so `SKILL.md`, which is built from the manifest, cannot warn an agent.

The traps waiting for this field:

| Member | What goes wrong | Trial |
|---|---|---|
| `loadify` | `init` and a call in different modules fail with "The target selector was not found" | T2 |
| `breakpoint`, `remove`, `only`, `except` | Sass emits the nested `@media` before declarations written after the call, so those declarations win | T1 |
| `before`, `after` | with no argument, no `content` is emitted and nothing renders | T1 |
| `remove`, `breakpoint` | one argument means exactly that width, a single pixel | T2 T3 |
| `container` | a container cannot query itself; the query goes on a descendant | already in the source comment |

**Fix.** A `caveats` array of short sentences in `meta/`, copied by
`build-manifest.js` next to `summary`, and rendered by `build-skill.js` under
each member that has one.

```json
"caveats": [
  "`init` and every call must be in the same module, or the calling module must `@use` the one that calls `init`. Otherwise `@extend` fails with \"The target selector was not found\"."
]
```

```js
// tools/build-manifest.js, beside the lines copying summary, examples, rejects
if (m.caveats) member.caveats = m.caveats;
```

**Changes existing output?** No.

**Touches.** `tools/build-manifest.js`, `tools/build-skill.js`, the `meta/`
files in the table, `npm run manifest`. The freshness test in
`test/manifest.spec.js` passes once `gerillass.json` and `SKILL.md` are
regenerated. The comments proposed in `source-comments.md` explain the same
traps to someone reading the source; this field is the checked, generated copy.

**Verify.** `SKILL.md` shows the `loadify` caveat, and the suite is green.

### G4. The audit sees Sass arithmetic errors and broken `var()` output

**Problem.** After the trials, `var(--x)` was passed to every argument of the 47
mixins that take one, and the output was read, not only whether it compiled.

| Result | Mixins |
|---|---:|
| `var()` works in every argument | 10 |
| works in some arguments | 7 |
| accepted, but the CSS it emits cannot work | 4 |
| works in no argument | 26 |

Most refusals are correct: a keyword, a selector or a device name cannot come
from a custom property. What is left falls into four shapes, and `tools/audit.js`
reports none of them:

1. **Sass's own error instead of the library's.** `background-dots` and
   `background-stripes` do arithmetic on `$size`, `$gutter` and `$thickness`.
   Anything that is not a Sass number, `var()`, `calc()` and `clamp()` included,
   fails inside the mixin. The audit's `nonsense` probe hits this too, but its
   `INTERNAL` pattern does not contain "Undefined operation", so the result is
   counted as a proper refusal.

   ```
   Error: Undefined operation "nonsense * 5".
      ╷
   11 │   $gutter: $size * 5,
   ```

2. **Compiles, emits CSS that cannot work.** `url(var(--x))`,
   `content: "var(--x)"`, `border-width: var(--x) var(--x)/2 0`. The audit files
   these under pass-through, which it treats as fine.
3. **Compiles, drops the value.** `background-image` ignores `$filter-direction`
   with one colour; `font-face` drops unknown formats. There is still CSS, so it is
   not SILENT.
4. **Compiles, emits a condition that never matches.** F4.

**Fix.**

1. Add `Undefined operation` and `can't be used in a calculation` to `INTERNAL`.
   The plan expected new UNHELPFUL findings for `background-dots` and
   `background-stripes` only. Landing it found 39: those two (15), `triangle`
   with a colour as its size (1), and five utility functions doing arithmetic on
   whatever they are given (23). F9 covers the first 16; the functions are F11.
2. Extend the second probe list from G2 with a check on the output, not only the
   compile: flag CSS containing `url(var(`, `"var(`, or `var(` next to `/` outside
   a `calc()`, in a new "broken output" bucket.
3. A dropped value cannot be found from the CSS alone. Cover it with `rejects`
   from F10 instead.

**Changes existing output?** No.

**Touches.** `tools/audit.js`; the `/audit-library` skill, which describes the
buckets.

**Verify.** Before F8 to F10: the new buckets list the cases above. After: they are
empty, apart from what F4 turns into refusals.

When it landed, BROKEN OUTPUT listed 13: the F8 and F9 cases, plus two not
predicted. `font-face` with a `var()` `$file-path` emits `url("var(--x).eot")`,
and `convertToEm(var(--x))` emits `var(--x)/16pxem`. F10's format check does not
catch the first, since the formats themselves are valid, so give `$file-path` its
own check in F10. The second is F11.

---

## 2.1.1: fixes that change no working call

### F1. `triangle` accepts `var()`, `currentColor` and `color-mix()`

**Problem.** A themed project keeps every colour in a custom property, and
`triangle` refuses all of them. Both T1 and T2 worked around it the same way:
pass a fake colour, then overwrite `border-color` by hand, so the output carries
two `border-color` declarations.

**Example.**

```scss
.a { @include triangle(right, var(--accent), 6px 8px); }
```

```
Error: "'var(--accent)' is not a color value, please replace it with a valid one."
```

The same for `currentColor` and `color-mix(in srgb, red 50%, blue)`. A real
Sass colour, `transparent` and `oklch()` already pass.

**Why not simply widen `isColor`, as all three agents suggested.** `isColor` is
also the guard in `tint` and `shade`, and both pass the value straight to
`color.mix`. Today `tint(var(--x), 20%)` fails with the library's own message.
With a wider `isColor` it would reach `color.mix` and fail with Sass's instead:

```
Error: $color2: var(--x) is not a color.
```

Compile-time colour maths genuinely needs a Sass colour. A triangle's border
does not. The two checks answer different questions, so they should be two
checks.

**Fix.** A check for "a colour CSS will accept", private to `_triangle.scss` so
it adds no public member and the release stays a patch. `isColor`, `tint` and
`shade` do not change.

```scss
@use "sass:list";
@use "sass:meta";
@use "sass:string";

// A value CSS will take as a colour: a Sass colour, a colour keyword Sass does
// not know as a colour, or one of the functions that return a colour. A list
// passes when every item does, because isColor accepts lists and
// `triangle(top, red blue)` compiles today. Deliberately looser than isColor,
// which tint and shade need strict because they do the maths at compile time.
@function -is-css-color($value) {
  @if list.length($value) > 1 {
    @each $item in $value {
      @if not -is-css-color($item) {
        @return false;
      }
    }
    @return true;
  }
  @if meta.type-of($value) == "color" {
    @return true;
  }
  @if meta.type-of($value) == "string" {
    $text: string.to-lower-case(string.quote($value));
    @if list.index("currentcolor" "inherit" "initial" "unset" "revert", $text) {
      @return true;
    }
    $open: string.index($text, "(");
    @if $open and list.index("var" "color-mix" "light-dark" "env", string.slice($text, 1, $open - 1)) {
      @return true;
    }
  }
  @return false;
}
```

In the mixin, `@if isColor($color)` becomes an explicit check with its own
message, so a bad value still gets a helpful error:

```scss
@if not -is-css-color($color) {
  @error "`#{$color}` is not a valid $color for `triangle`. Pass a colour, `currentColor`, or a CSS function such as `var(--accent)` or `color-mix(...)`.";
}
```

Compiled in a copy of the library with this change: `var(--x)`, `currentColor`,
`color-mix(in srgb, red 50%, blue)`, `light-dark(red, blue)`, `red`,
`transparent` and the list `red blue` pass; `nonsense`, `10px` and `url(a.png)`
raise the new message.

**Two things the first sketch got wrong**, found in validation. It refused a list
of colours, which `isColor` accepts, so `triangle(top, red blue)` would have gone
from compiling to raising. And it accepted any value containing `(`, so
`triangle(right, url(a.png))` would have gone from a refusal to CSS that cannot
work. The version above names the functions instead.

**Changes existing output?** No. A call with a real colour emits the same CSS;
every `triangle` call in the comparison under Validation was unchanged.

**Touches.** `scss/library/_triangle.scss`; `meta/triangle.json` (the examples in
G2, and the argument's `accepts` text); `test/library/triangle.spec.scss` (a new
test for `var()`); `meta/tint.json` and `meta/shade.json` gain
`tint(var(--x), 20%)` as a reject, which locks in the library's own message.

**Verify.** The suite, and `node tools/audit.js triangle` no longer listing
`var()` in the "refused valid CSS" bucket from G2.

### F2. `position` skips `null` without a warning

**Problem.** Skipping an edge with `null` is documented on the `position` page
and produces the right CSS, but it prints a warning per `null` with an empty
message. T1 wrote plain CSS instead in four places. T2 passed `auto`, which
emits `right: auto; bottom: auto` it did not want.

**Example.**

```scss
.a { @include position(absolute, 0 null null 0); }
```

```css
.a {
  position: absolute;
  top: 0;
  left: 0;
}
```

with, twice:

```
WARNING: `` does not look like a length. ...
```

**Fix.** One line at the top of `validateLength`. `position` already skips a
falsy result, so returning `null` quietly is enough.

```scss
@function validateLength($value) {
  // null means "leave this edge out", which `position` documents.
  @if $value == null {
    @return null;
  }
  // ... the existing checks, unchanged
}
```

Compiled: `null` returns nothing and warns nothing, and the declaration for that
edge is omitted.

**Changes existing output?** No. The CSS was already right; only the warning
goes.

**Touches.** `scss/utilities/_validate-length.scss`; `meta/position.json` (the
`null` example from G1, and `null` in the argument's `accepts` text);
`test/library/position.spec.scss` (a `null` case).

**Verify.** G1's `null` example passes. `validateLength` has one caller,
`position`, so nothing else moves.

### F3. `breakpoint` refuses three arguments instead of emitting nothing

**Problem.** A range written with three arguments compiles to nothing, with no
error. It is the silent failure `CLAUDE.md` warns about: the styles simply never
apply.

**Example.**

```scss
.x { @include breakpoint(between, medium, large) { color: green; } }
```

emits no CSS at all. The working forms are `breakpoint(between, medium large)`
and `breakpoint(medium, large)`.

**Fix.** `_breakpoint.scss` handles one argument and two arguments and has no
`@else`. Add one, as `container-query` already does:

```scss
} @else {
  @error "`breakpoint` takes one or two arguments; you passed #{list.length($params)}. For a range, pass `between` with a space-separated pair, `between, medium large`, or two sizes, `medium, large`.";
}
```

**Changes existing output?** No working call changes. A three-argument call
emitted nothing and now raises.

**Touches.** `scss/library/_breakpoint.scss`; `meta/breakpoint.json` (the
three-argument call as a reject).

**Verify.** The new reject fails with this message and not a Sass internal one.
Zero arguments are the same silent case today, and the `@else` catches them too;
both were checked in the prototype.

### F4. Size conditions refuse `var()`, which can never match

**Problem.** Custom properties are not allowed in a container or media size
condition. The mixins accept one anyway and emit a rule that never applies. It is
tempting to write, because `columnizer` rightly accepts `var()` for a gutter,
which is a declaration and not a condition.

**Example.**

```scss
.a { @include container-query(min, var(--wide)) { color: red; } }
```

```css
@container (min-width: var(--wide)) {
  .a { color: red; }
}
```

Measured in Chrome 152: a rule under `(min-width: var(--wide))` did not apply
inside a 400px container with `--wide: 200px`; the same rule under
`(min-width: 200px)` did.

**Fix.** Check every size before building the condition, in both mixins:

```scss
@function -is-custom-property($value) {
  @return meta.type-of($value) == "string" and string.index(string.quote($value), "var(") != null;
}

@if -is-custom-property($value) {
  @error "`#{$value}` cannot be used in a size condition: custom properties are not evaluated there, so the rule would never apply. Pass a length or a key from $map-for-breakpoints.";
}
```

Compiled: `var(--wide)` is caught; `400px` and `"medium"` are not.

**Changes existing output?** Only for calls whose output never worked. Those now
raise instead of emitting a dead rule.

**Touches.** `scss/library/_container-query.scss`, `scss/library/_breakpoint.scss`;
a reject in `meta/container-query.json` and `meta/breakpoint.json`. The `var()`
sweep in G4 found two more members with the same output: `remove`, which builds
on `breakpoint` and inherits the check, and `screen-agent`, whose `$resolution`
emits `@media (min-resolution: var(--x))` and needs the check of its own.

**Verify.** Measured in Chrome 152: `@media (min-width: var(--wide))` and
`@media (min-resolution: var(--r))` did not apply, while `(min-width: 10px)` did,
so the `@media` case holds as well as the container one.

The check has to look inside nested lists: in `breakpoint(between, var(--a) large)`
the custom property sits one level down. A prototype that recursed caught it,
and still accepted `calc(40em + 1px)` and `between, small large`.

### F5 and F6. Moved to 3.0.0

Validation found that both change what renders for calls that work today. They
are now B8 and B9, each with a caveat to publish in the meantime.

### F7. `reset-css` stops putting comments in compiled CSS

**Problem.** The Meyer licence note and the display-role note are `/* */`
comments inside the mixin, so they are emitted into the user's CSS. They were in
T1's compiled `main.css` at lines 67 and 92. Compressed output drops them; T2's
claim otherwise was wrong.

**Fix.** Turn both into `//` comments. Keep the attribution in the source.

**Changes existing output?** Two comments leave expanded output. No declaration
changes.

**Touches.** `scss/library/_reset-css.scss`; the manifest snapshot. This is rule 1
of `source-comments.md`: `//` only, everywhere in the library.

**Verify.** `grep -c meyerweb` on a compiled expanded file returns 0.

### F8. Values that end up in a declaration let a CSS function through

**Problem.** Eight arguments turn a `var()` into CSS that looks right and does
nothing, and two refuse a `var()` the property would take.

| Call | Today | Why it fails |
|---|---|---|
| `background-image(var(--hero))`, and the image argument of `brand-logo`, `text-image`, `background-dots`, `background-stripes` | `background-image: url(var(--hero))` | `url()` takes no `var()` inside it |
| `after(var(--label))`, `before(...)` | `content: "var(--label)"` | shows the text `var(--label)` |
| `counter(var(--prefix), decimal)` | `content: "var(--prefix)" counter(glsCounter, decimal)` | same |
| `aspect-ratio(var(--ratio))` | error: not a valid ratio | `aspect-ratio: var(--ratio)` is valid CSS |
| `line-clamp(var(--lines))` | error: not a whole number | `line-clamp: var(--lines)` is valid CSS |

A custom property that holds an image has to hold the whole `url(...)`, so the
right output for the first row is `background-image: var(--hero)`.

**Fix.** A private check per file for a call to one of a few named functions,
with the names chosen for what the value becomes:

```scss
// True for an unquoted call to one of $names, such as var(--x).
@function -is-css-function($value, $names) {
  @if meta.type-of($value) != "string" or string.slice(meta.inspect($value), 1, 1) == "\"" {
    @return false;
  }
  $open: string.index($value, "(");
  @return $open != null and list.index($names, string.to-lower-case(string.slice($value, 1, $open - 1))) != null;
}
```

| The value becomes | Names |
|---|---|
| `content` | `var`, `attr`, `counter`, `counters` |
| an image | `var`, `url`, `image-set` and the gradient functions |
| a ratio or a line count | `var` |

Where it is true, emit the value as it is: `background-image: $image` without
`url()`, `content: $content` without quotes, and skip the number and ratio checks
in `line-clamp` and `validateRatio`. A quoted string stays text, so
`after("var(--x)")` still renders those characters, which is what quoting says.

**Why named functions, not any `(`.** The first sketch accepted anything with a
parenthesis. In the prototype that turned three refusals into silent, useless CSS:
`aspect-ratio(url(a.png))`, `line-clamp(url(a.png))` and `triangle(url(a.png))`.

**Not in a utility file.** `tools/build-manifest.js` takes one member per file.
With the helper placed in `_validate-ratio.scss`, the generated manifest lost
`validateRatio` and listed `-is-css-function` in its place. Write the check
inline in `validateRatio`, or teach the parser to skip names starting with `-`.

Measured in Chrome 152: `background-image: url(var(--hero))` computes to `none`,
while `background-image: var(--hero)` with `--hero: url(...)` loads the image.
`content: "var(--label)"` renders the characters and `content: var(--label)` the
value. `aspect-ratio: var(--ratio)` and `line-clamp: var(--lines)` both apply.

**Changes existing output?** Only for calls whose output did not work. The one
arguable case is `after(var(--x))` rendering the literal text today; nobody
writes that to get the text.

**Touches.** `scss/library/_background-image.scss`, `_brand-logo.scss`,
`_text-image.scss`, `_background-dots.scss`, `_background-stripes.scss`,
`_before.scss`, `_after.scss`,
`_counter.scss`, `_line-clamp.scss`, `scss/utilities/_validate-ratio.scss`; a
`var()` example in each `meta/` file; `test/library/after.spec.scss` and
`aspect-ratio.spec.scss`. The helper appears in several files; if that grates,
make it a public utility in 2.2.0 instead.

**Verify.** G4's "broken output" bucket is empty for these members.

### F9. Computed sizes work with `var()`, `calc()` and `clamp()`

**Problem.** Three mixins compute with a size, so only a Sass number can pass:

- `background-dots`: `$gutter` defaults to `$size * 5`, and the positions use
  `math.div($gutter, 2)` and `$gutter * 2`.
- `background-stripes`: `$thickness * 2` and `$thickness * $i`.
- `triangle`: `math.div(list.nth($size, 1), 2)`. Here a `var()` does not even
  fail: it emits `border-width: var(--x) var(--x)/2 0`, which is invalid.

**Example.**

```scss
.a { @include background-dots(red, 1rem, calc(1rem + 2px)); }
```

```
Error: Undefined operation "calc(1rem + 2px) * 2".
```

**Fix.** Do the arithmetic inside `calc()`. Dart Sass simplifies a calculation
over plain numbers to a number, so every call that works today emits the same
CSS, and anything else is left to the browser:

```scss
$gutter: calc($size * 5)          // was $size * 5
calc($gutter / 2)                 // was math.div($gutter, 2)
```

Compiled: `1em`, `10px` and `0.5rem` give `5em`, `50px`, `2.5rem` and `0.5em`,
`5px`, `0.25rem`, identical to the current expressions. `var(--x)` gives
`calc(var(--x) * 5)`, and `calc(1rem + 2px)` gives `calc((1rem + 2px) * 5)`.

**The trap.** `calc()` in Sass accepts an unquoted string without complaint:
`calc(nonsense * 5)` compiles. So check the value first, a number or
`-is-css-function` from F8, or a typo that raises today would start emitting CSS.
A colour inside `calc()` does raise, with Sass's message.

**The default `$gutter` has to move.** `$gutter: calc($size * 5)` in the
signature is evaluated before the body runs, so in the prototype a bad `$size`
failed there with Sass's own "can't be used in a calculation" and never reached
the check. Default `$gutter` to `null` and derive it after validating `$size`.
The CSS is the same, but the signature in `gerillass.json` changes from
`$gutter: $size * 5` to `$gutter: null`, so the documentation page's argument
table changes too.

**Changes existing output?** No, for number arguments. Validated in the
prototype: all eight `triangle` directions with nine sizes, and
`background-dots` and `background-stripes` across units, gutters, colour counts
and images, over 600 calls, compiled byte-identical. Sizes that were never
lengths do change: twelve `triangle` probes such as `nonsense`, `null` and `none`
emitted a broken `border-width` and now raise.

**Touches.** `scss/library/_background-dots.scss`, `_background-stripes.scss`,
`_triangle.scss`; `test/library/background-dots.spec.scss` and
`triangle.spec.scss` (a `var()` case each); a reject for `nonsense` in
`meta/background-dots.json` and `meta/background-stripes.json`.

**Verify.** Snapshots unchanged; G4 has no UNHELPFUL finding for these members.
Measured in Chrome 152: `border-width: 10px 10px/2 0` is invalid and the borders
fall back to 3px, while `calc(10px / 2)` gives 5px. Today's `var()` triangle also
prints a `math.div()` warning, which the fix removes.

### F10. `background-image` and `font-face` stop dropping values silently

**Problem.** Two arguments are thrown away without a word, the silent failure
`CLAUDE.md` warns about.

- **`background-image`** reads `$filter-direction` only when `$filter-color` has
  two or more colours. With one colour any direction is ignored, `45deg` and
  `nonsense` alike. With two, `nonsense` raises properly.
- **`font-face`** builds `src` through `fontSource`, which returns nothing for a
  format it does not know. One unknown format is dropped; if all are unknown,
  there is no `src` at all.

**Example.**

```scss
@include font-face("X", "/f/x", $file-formats: nonsense);
```

```css
@font-face {
  font-family: "X";
  font-style: normal;
  font-weight: 400;
}
```

A font that never loads, and no error. `woff2 nonsense` emits only the `woff2`
source, also without an error.

**Fix.**

- `background-image`: validate `$filter-direction` before branching on the colour
  count, with the message the two-colour branch already has. A valid direction
  with one colour stays harmless: a solid overlay has no direction to show.
- `font-face`: check every format against `$map-for-font-formats` and raise on
  the first unknown one, naming the accepted formats.

**Changes existing output?** A call with a misspelled format or direction now
raises instead of emitting CSS. `woff2 nonsense` did emit a working `src`, so
name this in the changelog; it is still a fix, since the call said something the
output ignored.

**Touches.** `scss/library/_background-image.scss`, `scss/library/_font-face.scss`;
rejects in `meta/background-image.json` and `meta/font-face.json`.

**Verify.** The rejects fail with the library's message. `$file-formats: var(--x)`
raises too, which is right: a format list is chosen at compile time.

**Validated.** In the prototype a valid direction with one colour still compiles
unchanged, and 57 probe calls moved from CSS that could not work to the new
errors. One message needs care: `$file-formats: null` prints empty backticks, so
name `null` explicitly.

### F11. Utility functions refuse non-numbers with their own message

**Problem.** Five public functions do arithmetic on their argument without
checking it, so anything that is not a number fails inside Sass, or worse,
compiles. Found by the audit once G4 taught it Sass's arithmetic errors.

| Function | Given | Today |
|---|---|---|
| `remify` | `nonsense` | `Undefined operation "nonsense/16px * 1rem"` |
| `fontSizer` | `nonsense` | `Undefined operation "nonsense * 10px"` |
| `clearUnit` | `nonsense` | `Undefined operation "nonsense * 0"` |
| `convertToNumber` | `nonsense` | `Undefined operation "0-1 * 10"` |
| `convertToEm` | `#ff0000` | `Undefined operation "#ff0000 / 16px"` |
| `convertToEm` | `var(--x)` | compiles to `var(--x)/16pxem` |

These are called by users directly; `remify` has its own documentation page.

**Fix.** A type check at the top of each, with a message naming what it takes,
in the style the mixins already use:

```scss
@if meta.type-of($value) != "number" {
  @error "`#{$value}` is not a valid $value for `remify`. Pass a number, such as `24px` or `24`.";
}
```

`convertToNumber` parses strings, so its check belongs where the parse fails,
not on the type.

**Changes existing output?** No working call changes: every row above is an error
or unusable CSS today. `convertToEm(var(--x))` goes from broken CSS to an error.

**Touches.** `scss/utilities/_remify.scss`, `_font-sizer.scss`, `_clear-unit.scss`,
`_convert-to-number.scss`, `_convert-to-em.scss`; a reject in each `meta/` file.

**Verify.** `node tools/audit.js` shows none of these five in UNHELPFUL or BROKEN
OUTPUT. Nothing here has been prototyped yet.

### D1. Document the `loadify` module rule

**Problem.** With `loadify(init)` in one partial and `@include loadify` in
another, compilation fails. The manifest example, the `meta/` summary and
`SKILL.md` all show both in a single file and say nothing about modules. T1
escaped only because its `init` sat in a module every partial happened to load.

**Example.**

```scss
// _a.scss
@use "gerillass" as gls;
@include gls.loadify(init);

// _b.scss
@use "gerillass" as gls;
.hero { @include gls.loadify; }

// main.scss
@use "a";
@use "b";
```

```
Error: The target selector was not found.
Use "@extend %loadify !optional" to avoid this error.
```

Adding `@use "a";` to `_b.scss` makes it compile.

**Fix.** The `caveats` entry from G3, a line in the `loadify` documentation page,
and the reason in the source comment.

**Changes existing output?** No.

### D2. Correct the `remove` summary and example

**Problem.** The manifest summary says `remove` "hides an element outright, or
only within a breakpoint range", and one of its examples is `remove("medium")`.
That call hides the element at exactly 768px and at no other width. It reads as
the obvious way to call the mixin, and it is also deliberate:
`test/library/remove.spec.scss` asserts it.

**Fix, now.** Say what the one-argument form does, in the summary and in a G3
caveat, and replace the example with `remove("min", "medium")` and
`remove("max", "medium")`. Whether the form should exist at all is B2.

**Changes existing output?** No.

### D3. A Parcel section in the README

**Problem.** The README has recipes for Vite, webpack, Next.js, Angular, Gulp and
Grunt, and none for Parcel. T3 spent the most time here.

**What T3 reported, not yet reproduced here.** A bare `@use "gerillass"` resolves
under Parcel through Parcel's own resolver. A `"main": "index.js"` field in the
project's own `package.json`, which `npm init -y` writes, broke it with "Can't
find stylesheet to import", and removing the field fixed it. The `pkg:` route
works, but Parcel's transformer treats `pkgImporter` as a legacy-API option, so
`NodePackageImporter` has to be constructed in a `.sassrc.js`.

**Fix.** Reproduce all of it against a packed tarball in a fresh Parcel project,
as `CLAUDE.md` asks for any route claim, then write the section and add Parcel to
the routes table in `CLAUDE.md`.

**Changes existing output?** No.

---

## 2.2.0: additions

None of these changes a call that works today. Each gives callers something they
cannot express now.

### A1. Logical directions for `triangle`

**Problem.** An interface that works in both left-to-right and right-to-left
needs an arrow that points "forward", not "right". `triangle` knows only physical
directions, so T3 wrote its own `chevron` mixin.

**Example.**

```scss
.caret { @include triangle("inline-end"); }
```

```
Error: "The argument for direction must be one of the followings: top, top-right, right, bottom-right, bottom, bottom-left, left, top-left"
```

**Fix.** Accept `inline-start`, `inline-end`, `block-start` and `block-end`, drawn
with logical border properties, so the browser resolves the side. For
`triangle("inline-end", red, 8px 12px)`, the logical twin of today's `right`:

```css
.caret {
  content: "";
  height: 0;
  width: 0;
  display: inline-block;
  border-style: solid;
  border-color: transparent;
  border-inline-start-color: red;
  border-block-width: 6px;
  border-inline-start-width: 8px;
  border-inline-end-width: 0;
}
```

In a left-to-right context this points right; in right-to-left it points left.

**The trap to avoid.** Do not add the new keywords to `$list-of-directions`.
`border-radius` validates its corner names against the same list, and its chain
of corner branches has no final `@else`. A keyword in the list but in no branch
would be accepted and emit nothing. Give `triangle` its own list.

**Changes existing output?** No.

**Touches.** `scss/library/_triangle.scss`; `meta/triangle.json`;
`test/library/triangle.spec.scss`; the documentation page.

**Verify.** Rendered in Chrome 152 for `inline-end`: under `dir="ltr"` the red
border is on the left, as with today's `right`; under `dir="rtl"` it moves to
the right and the arrow points left. Render the other three when implementing.

### A2. Logical corners for `border-radius`

**Problem.** The corner names (`top-left`, `cross-right` and the rest) are
physical, so a rounded start edge sits on the wrong side in right-to-left.

**Fix.** Accept logical corners and edges, each mapped to the logical radius
properties, whose names read block side first and inline side second:

| Argument | Emits |
|---|---|
| `start-start` | `border-start-start-radius` |
| `start-end` | `border-start-end-radius` |
| `end-start` | `border-end-start-radius` |
| `end-end` | `border-end-end-radius` |
| `inline-start` | `border-start-start-radius`, `border-end-start-radius` |
| `inline-end` | `border-start-end-radius`, `border-end-end-radius` |
| `block-start` | `border-start-start-radius`, `border-start-end-radius` |
| `block-end` | `border-end-start-radius`, `border-end-end-radius` |

```scss
.tab { @include border-radius(inline-start, 8px); }
```

```css
.tab {
  border-start-start-radius: 8px;
  border-end-start-radius: 8px;
}
```

Add the names to the list `_border-radius.scss` builds for itself, each with its
own branch. The trap from A1 applies in reverse: a name added to a list without a
branch is accepted and emits nothing.

**Changes existing output?** No.

**Touches.** `scss/library/_border-radius.scss`; `meta/border-radius.json`; the
documentation page.

**Verify.** Rendered in Chrome 152 for `inline-start`: the top-left and
bottom-left radii under `dir="ltr"`, the top-right and bottom-right under
`dir="rtl"`.

### A3. Logical offsets for `position`

**Problem.** `position` writes `top`, `right`, `bottom` and `left`. In
right-to-left, an offset meant for the start edge lands on the end edge.

**Be honest about the value.** T3 said the logical `inset-*` properties are
shorter than the mixin call, and for a single offset that is true. The case for
this item is consistency with A1 and A2, not saved typing. It is the first
candidate to drop if 2.2.0 needs trimming.

**Fix.** A `$logical` argument. The shorthand order stays the same, and each side
maps to its logical twin:

```scss
.badge { @include position(absolute, 0 auto auto 1rem, $logical: true); }
```

```css
.badge {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: auto;
  inset-block-end: auto;
  inset-inline-start: 1rem;
}
```

**Changes existing output?** No. The default stays physical.

**Touches.** `scss/library/_position.scss`; `meta/position.json`;
`test/library/position.spec.scss`.

### A4. `$font-display` for `font-face`

**Problem.** Every modern `@font-face` wants a `font-display`, and the mixin has
no argument for it. T2 and T3 wrote it in the content block, which works but is
not discoverable from the signature.

T3 also found that a variable font's weight range passes straight through, which
is useful and undocumented. Compiled:

```scss
@include font-face("Readex Pro", "/fonts/readex", $font-weight: 160 700, $file-formats: woff2);
```

```css
@font-face {
  font-family: "Readex Pro";
  src: url("/fonts/readex.woff2") format("woff2");
  font-style: normal;
  font-weight: 160 700;
}
```

**Fix.** `$font-display: null` as the last argument, emitted only when given.
Put it last: the mixin already reinterprets `$font-style` as a weight or a format
list depending on what it receives, and that logic should not be disturbed.

```scss
@include font-face("Readex Pro", "/fonts/readex",
  $font-weight: 160 700, $file-formats: woff2, $font-display: swap);
```

adds `font-display: swap;` to the rule.

**Changes existing output?** No, with the default `null`.

**Touches.** `scss/library/_font-face.scss`; `meta/font-face.json` (an example
with a weight range and `$font-display`); the documentation page.

### A5. `focus-visible` and `user-invalid` for `all-text-inputs`

**Problem.** The accepted states are `hover`, `focus`, `active`, `invalid`,
`required` and `disabled`. Two a form actually needs are missing:

- `focus-visible`, the state a keyboard focus ring belongs on.
- `user-invalid`. Styling `invalid` marks every empty required field as an error
  the moment the page loads, before anyone has typed. T3 styled
  `[aria-invalid="true"]` by hand to avoid it.

**Example.**

```scss
@include all-text-inputs("focus-visible") { outline: 2px solid; }
```

```
Error: "The argument must be `null` or one of the followings: hover, focus, active, invalid, required, disabled"
```

**Fix.** Add both names to the list at the top of `_all-text-inputs.scss`.
Compiled with both added: `pseudoSelector` builds `[type=text]:focus-visible` and
`[type=text]:user-invalid` across the whole list, and the existing states are
unchanged.

**Changes existing output?** No.

**Touches.** `scss/library/_all-text-inputs.scss`; `meta/all-text-inputs.json`.
Check browser support for `:user-invalid` before the documentation recommends it
over `:invalid`.

---

## 2.2.0: new members

Each is seven places, not one: the partial, its line in `scss/library/_index.scss`,
a `meta/` entry, `npm run manifest`, a documentation page (the site build fails
without one), `npm run playground-demos`, and a spec if it computes anything.
`/new-mixin` is that checklist. The bar from `CLAUDE.md` still applies: a member
earns its place by encoding something people get wrong.

### N1. `focus-ring`

**Evidence.** All three trials wrote it by hand. T1 wrote a `focus-ring($offset)`
mixin, T2 a plain `:focus-visible` rule, T3 a mixin with a forced-colors branch.
It is already on the New members list in `CLAUDE.md`, and nothing else in this
plan has three independent requests behind it.

**What people get wrong.** Removing the outline and replacing it with nothing, or
with a `box-shadow`. T3's detail matters here: forced-colors mode discards
shadows, so a shadow focus ring vanishes for exactly the users who need it most.
An outline survives.

**Proposed.**

```scss
@mixin focus-ring($width: 2px, $offset: 2px, $color: currentColor) {
  &:focus-visible {
    outline: $width solid $color;
    outline-offset: $offset;
  }
}
```

**Open questions.**

- Whether a forced-colors branch is needed. T3 set `outline-color: Highlight`
  under `(forced-colors: active)`, but forced-colors mode may already recolour
  outlines itself. Check in that mode before adding it.
- Whether to offer a form without `:focus-visible`, for rings drawn on another
  element. T3 put its ring on a stretched link's `::before`, so that the ring
  surrounds the whole card the link covers.

### N2. A reduced-motion guard

**Evidence.** T2 wrote `motion-safe` and T3 `motion-ok`. Both independently made
motion opt-in, wrapping it in `(prefers-reduced-motion: no-preference)`, rather
than turning it off under `reduce`.

**Proposed.**

```scss
@mixin motion-safe {
  @media (prefers-reduced-motion: no-preference) {
    @content;
  }
}
```

**The tension with the bar.** This is one media query. Its case is not typing
saved but the direction: opt-in means a user who asked for less motion never gets
it, while an override under `reduce` has to catch every animation, and misses
some. `loadify` already encodes a subtler form of the same lesson, applying the
end state instead of switching the animation off. Decide whether that is enough
to earn a member before writing it. The name is also open.

### N3. Custom properties from a map

**Evidence.** T2 wrote `tokens($map)` and T3 `_colors($palette)`, both to write a
light and a dark palette once as Sass maps and emit them as custom properties.
T1 wrote the properties out by hand. Both mixin versions were then used under the
same three selectors: the system preference, a forced light theme, and a forced
dark theme.

**Proposed.** Written with `@if` rather than `if()`, which Sass deprecates (see
Modernisation in `CLAUDE.md`):

```scss
@mixin custom-properties($map, $prefix: null) {
  @each $name, $value in $map {
    $property: --#{$name};
    @if $prefix {
      $property: --#{$prefix}-#{$name};
    }
    #{$property}: #{meta.inspect($value)};
  }
}
```

```scss
:root { @include custom-properties((bg: #fff, text: #111), color); }
```

```css
:root {
  --color-bg: #fff;
  --color-text: #111;
}
```

Compiled, with `@use "sass:meta";`. The value goes through `meta.inspect`
because plain interpolation strips quotes: with `#{$value}`,
`("Readex Pro", sans-serif)` came out as `Readex Pro, sans-serif`, and a `"→"`
string would lose its quotes and stop being a string.

**Relation to `theme`.** `CLAUDE.md` lists a decorative `theme` idea
(`color-scheme` plus `light-dark()`). This member is lower level, and it is what
the trials actually wrote. The three-selector pattern around it could become
`theme` later. Keep the two separate.

### Held back: one trial each

T3 alone asked for these. Wait for a second trial before adding either.

- **A forced-colors wrapper**, used eighteen times in T3.
- **A direction helper** built on `:dir(rtl)`. It carries a real trap: written as
  `&:dir(rtl)` inside a pseudo-element it produces `.x::after:dir(rtl)`, which is
  invalid; T3 used `selector.unify` to put the pseudo-class first.

---

## 3.0.0: behaviour changes

Each of these changes CSS that a working call emits today. Ship them together in
one major release, each with a `MIGRATION.md` section showing the CSS before and
after.

### B1. One boundary rule for `breakpoint` and `container-query`

**Problem.** The same breakpoint ends in different places depending on how it is
written, in three ways:

1. **`max` includes the breakpoint.** `breakpoint(max, large)` is
   `max-width: 992px` and `breakpoint(min, large)` is `min-width: 992px`, so at
   exactly 992px both match. T1 hand-wrote `991.98px`; T2 wrote
   `breakpoint("xsmall", "large")` to reach `991px`. (T1 T2)
2. **The two mixins disagree.** A range ends at `max-width: 767px` in
   `breakpoint(small, medium)` and at `max-width: 768px` in
   `container-query(small, medium)`. `breakpoint` subtracts 1; `container-query`
   subtracts nothing. (T3)
3. **The subtraction ignores the unit.** With a rem map, `breakpoint(small, medium)`
   ends at `max-width: 47rem` for a `48rem` key, a 16px gap where neither range
   nor `min` matches. (T3)

**Fix.** For keys from the map, end `max` and every range just under the key, in
the key's own unit, in both mixins:

```scss
@function -range-end($value) {
  @if math.unit($value) == "px" {
    @return $value - 0.02;
  }
  @return $value - 0.01;
}
```

Compiled: `768px` gives `767.98px`, `48rem` gives `47.99rem`, `48em` gives
`47.99em`. A raw length passed by the caller is left exactly as written, so
`container-query(300px, 500px)` and its spec do not change.

| Call | Today | After |
|---|---|---|
| `breakpoint(max, large)` | `max-width: 992px` | `max-width: 991.98px` |
| `breakpoint(medium, large)` | `max-width: 991px` | `max-width: 991.98px` |
| `container-query(small, medium)` | `max-width: 768px` | `max-width: 767.98px` |
| `breakpoint(small, medium)`, rem map | `max-width: 47rem` | `max-width: 47.99rem` |

**Why it is major.** `breakpoint(max, large)` stops matching at exactly 992px.
Anyone whose layout depended on that pixel sees a change.

**The alternative.** Range syntax, `(width < 992px)`, removes the fractional gap
entirely instead of shrinking it. Container queries are a reasonable place to
adopt it. For `@media`, check browser support against the library's audience
before choosing it over the subtraction.

**Touches.** `scss/library/_breakpoint.scss`, `scss/library/_container-query.scss`,
and `remove`, which builds on `breakpoint`; the manifest snapshots; the
`breakpoint`, `remove` and `container-query` documentation pages; `MIGRATION.md`.

### B2. Retire the one-argument exact-width form

**Problem.** `breakpoint("medium")`, `remove("medium")` and `container-query(768px)`
match one pixel width, `(width: 768px)`. It is deliberate and tested, and it is
almost never what the caller meant. T2 and T3 both flagged it, and D2 records the
manifest example that teaches it. An explicit spelling already exists and says
what it does: `breakpoint(only, medium)`.

**Fix.** Do not reinterpret one argument as `min`: that would silently change every
existing call. Instead:

- **2.2.0:** a `@warn` on the one-argument form, pointing to `only`. Update the
  manifest examples first, or G1 fails them.
- **3.0.0:** the one-argument form raises, with the same pointer.

**Changes existing output?** Not in 2.2.0, which only warns. In 3.0.0 such a call
raises instead of emitting CSS.

**Touches.** `scss/library/_breakpoint.scss`, `scss/library/_remove.scss`,
`scss/library/_container-query.scss`; the first test in
`test/library/remove.spec.scss`; the manifest examples; the documentation pages.

### B3. `columnizer` on `gap`, without margins or universal `box-sizing`

**Problem.** Every trial hit this member in some way:

- It sets `box-sizing` on every descendant, `.g *`, not only on the columns, and
  repeats that block in each breakpoint where it is called. (T1 T2 T3)
- Its gutters are margins, so combined with `gap` the columns overflow. T1 and T2
  both added `gap: 0` before calling it. (T1 T2)
- The margin is `margin-right`, which sits on the outer edge in right-to-left.
  (T3)
- The last row carries a bottom margin, and `display: flex` is repeated in every
  call. (T2)

**Example.** `@include columnizer(2, 32px)` inside a breakpoint emits:

```css
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
```

**Fix.** `gap` does what the margins and the `:nth-child` reset were imitating,
has no side, and adds nothing below the last row:

```css
.f { display: flex; flex-wrap: wrap; gap: 32px; }
.f > * {
  box-sizing: border-box;
  flex: 0 0 calc((100% - (2 - 1) * 32px) / 2);
}
```

With the fill flag, `flex-grow` becomes 1. A mobile-first chain of calls then
overrides only `gap` and `flex-basis`.

**Why stay on flexbox.** Grid would be shorter, but the fill flag, which lets the
last row stretch, is a flexbox behaviour.

**Changes existing output?** Substantially. The descendants of the container lose
`box-sizing: border-box`, and the columns lose their margins.

**Touches.** `scss/library/_columnizer.scss`; all three tests in
`test/library/columnizer.spec.scss`; the manifest snapshot; the documentation
page; `MIGRATION.md`, which has to name both losses.

**Measured** in Chrome 152, three columns with a 30px gutter in a 300px box.
Today, under `dir="rtl"` the first row ends 30px short of the right edge,
because `margin-right` sits on the outer side, and two rows of 20px make a box
100px tall because the last row keeps its bottom margin. The `gap` version is
flush in both directions and 70px tall.

**Verify.** Render the fill flag and a 1, 2, 3 column chain when implementing.

### B4. `hide("unhide")` leaves `position` alone

**Problem.** Revealing a hidden element on focus, the skip-link pattern, is what
`unhide` is for. It writes `position: static`, which drops the revealed link into
the page flow and pushes the content down. T2 and T3 both wrote `position: fixed`
again after the call.

**Fix.** Remove `position: static` from `unhide`; the caller decides the position.
In the same change, drop the deprecated `clip` from the hidden state, since
`clip-path` beside it already does the work. T3 called it harmless dead weight.

**Changes existing output?** Yes, a declaration disappears from each state.

**Touches.** `scss/library/_hide.scss`; `meta/hide.json`; the documentation page.

### B5. `before` and `after` emit `content: ""` by default

**Problem.** Called with no argument, the mixins emit no `content`, so the
pseudo-element does not render. T1 did this four times in one session. It is
deliberate, and it is stated only in an error message, which a caller sees only
after passing something invalid. T2 and T3 avoided it by writing `content: ""`
themselves.

**Example.**

```scss
.a { @include after { color: red; } }   // renders nothing
.b { @include after("") { color: red; } } // renders
```

**Fix.** Make `""` the default. Keep `null` as the way to say "I write the
content myself".

**Changes existing output?** Yes. A call with no argument starts rendering a
pseudo-element. A project that relied on the empty default, for instance styling
a `::after` that another rule gives its content, may see that content overridden,
depending on source order.

**Touches.** `scss/library/_before.scss`, `scss/library/_after.scss`;
`test/library/after.spec.scss`, whose two tests pass arguments and are unaffected
(add one for the default); `meta/before.json` and `meta/after.json`.

### B6. `font-face` defaults to `woff2`

**Problem.** The default formats are `eot woff2 woff ttf svg`, so a call that names
no formats emits five sources, two of them for formats no current browser loads. A
bundler that resolves every `url()` fails when only the `.woff2` exists; T3 hit
that with Parcel.

**Fix.** Default to `woff2`.

**Changes existing output?** Yes. A call relying on the default loses the other
sources, including the separate `src` line for EOT.

**Touches.** `scss/library/_font-face.scss`; `meta/font-face.json`; the
documentation page.

**Verify.** T3's Parcel failure has not been reproduced here. The change stands on
its own, but reproduce the failure before citing it in the changelog.

### B7. `all-text-inputs` stops matching `[type='color']`

**Problem.** The list includes `[type='color']`, which should not get text-input
styling, and omits `select`, which T3 notes almost always wants it.

**Fix.** Remove `[type='color']`. Do not quietly add `select`, which is not a text
input: a separate list, or a documented pairing, is clearer. That decision is
open.

**Changes existing output?** Yes, the selector list shrinks. `$list-of-text-inputs`
is `!default`, so a project that wants the old list can restore it.

**Touches.** `scss/lists/_list-of-text-inputs.scss`; `meta/all-text-inputs.json`;
`MIGRATION.md`.

### B8. `aspect-ratio` holds on images with `width` and `height` attributes

**Problem.** Writing `width` and `height` on an `<img>` is the standard advice
for avoiding layout shift. The `height` attribute becomes a definite CSS height,
and with both dimensions definite the browser ignores `aspect-ratio`. The mixin
sets `width: 100%` and leaves the height alone, so the image renders at its
attribute height. This is the member's main promise, broken in the common case.

`CLAUDE.md` records three measurements behind the 2.0.0 design of this mixin. All
three used images without the attributes, so this case was never seen.

**Example.** `@include aspect-ratio("4:3")`, a 1600×900 source, a 300px
container, Chrome 152:

| Markup | Rendered |
|---|---|
| `<img class="photo" width="1600" height="900">` | **300 × 900** |
| `<img class="photo">` | 300 × 225 |
| with the attributes, plus `height: auto` | 300 × 225 |

**Fix.** Emit `height: auto` beside `width: 100%`:

```scss
display: block;
width: 100%;
height: auto;
aspect-ratio: validateRatio($ratio);
border: 0;
```

and add it to the source comment as the fourth measured gap.

**Changes existing output?** Yes, and validation is why this moved from 2.1.1.
Every call gains a declaration, and it does not only fix images. A height written
before the include in the same rule, or in an earlier rule, is now overridden: a
`<div>` with `height: 400px` and the mixin rendered 300 × 400 and renders
300 × 225 with the fix, measured in Chrome 152. A height written after the
include still wins.

The same measurement found the fix helps more than images. An
`<iframe width="560" height="315">`, which is what a YouTube embed code writes,
renders 300 × 315 today and 300 × 225 with `height: auto`.

**Until then.** A G3 caveat and a line on the documentation page: on an element
with a `height` attribute, write `height: auto` after the include.

**Touches.** `scss/library/_aspect-ratio.scss`; `test/library/aspect-ratio.spec.scss`
(all four tests' expected blocks); the manifest snapshots; `MIGRATION.md`;
`site/content/docs/aspect-ratio.mdx`; the 2.0.0 measurement table in `CLAUDE.md`.

**Verify.** Re-measured in Chrome 152 during validation, together with the two
cases above. Firefox and Safari not tried.

### B9. `counter` numbers correctly inside container queries

**Problem.** `container-type: inline-size` applies style containment, which scopes
counters to the container's subtree. The mixin increments on
`.counter-item::before`, which is inside that subtree, so when the items are
containers each one starts a counter of its own. T2 gave up its container
queries to keep the numbers.

**Example.** Measured in Chromium, three numbered items:

| Setup | Numbers |
|---|---|
| no container | 01 02 03 |
| container on each item, increment on `::before` (today) | 01 01 01 |
| container on the list | 01 01 01 |
| reset on the container element itself | 01 01 01 |
| container on each item, increment on the item itself | **01 02 03** |

**Fix.** Move `counter-increment` from the pseudo-element to the item. The
`content` stays on `::before`, where the reader's `@content` also goes.

Today:

```scss
&.counter-start .counter-item::before,
&.counter-continue .counter-item::before {
  content: counter(glsCounter);
  counter-increment: glsCounter;
  @content;
}
```

After:

```scss
&.counter-start .counter-item,
&.counter-continue .counter-item {
  counter-increment: glsCounter;
}
&.counter-start .counter-item::before,
&.counter-continue .counter-item::before {
  content: counter(glsCounter);
  @content;
}
```

**Changes existing output?** Yes, which is why this moved from 2.1.1. A plain list
numbers as before. But skipping an item by setting its `::before` to
`content: none` stops working. Measured in Chrome 152, three items with the
middle one suppressed read `01, 02` today and `01, 03` with the fix: a
pseudo-element with no content does not increment, and the item always does.
That is an old and ordinary way to leave a row unnumbered.

**Until then.** A G3 caveat naming the failure. Putting the container on an
element inside the item should avoid it, since the counter then sits outside
the contained subtree, but that has not been measured.

**Touches.** `scss/library/_counter.scss`; the manifest snapshot; a new
`test/library/counter.spec.scss`, since `counter` has no spec today; `MIGRATION.md`.

**Verify.** The table and the skipped item were re-measured in Chromium during
validation. Firefox and Safari have not been tried.

---

## Needs research before it becomes an item

- **`reset-css` and list semantics.** T3 declined the reset because
  `list-style: none` on every list removes list semantics in Safari with
  VoiceOver. Not reproduced here, and it needs a screen reader to check. If it
  holds, it is an accessibility defect in something many projects include whole.
- **`adaptive`.** T1 and T3 both declined it: nothing below 576px, and a
  `max-width` that steps at each breakpoint. Removing public API breaks
  stylesheets, so find out who uses it before any deprecation.
- **Members T3 found of little value:** `sizer`, `circle`, `all-buttons`,
  `resizable`, `reset-figure`. Recorded, not acted on. As `CLAUDE.md` puts it for
  utilities, one project not needing a member is no reason to delete it.

## What each release needs besides the code

- **Groundwork:** land G1 to G3 before the fixes, so each fix brings a failing test
  with it.
- **2.1.1:** a `CHANGELOG.md` entry that names the calls F3, F4, F9 and F10 turn
  from broken CSS into errors, and the `background-dots` signature change in F9; the full `/release` checklist, including `node tools/check-archive.js`
  and `node tools/check-links.js`; the wiki page.
- **2.2.0:** the `@warn` from B2; the new members through `/new-mixin`.
- **3.0.0:** a `MIGRATION.md` section per B item, B8 and B9 included, with CSS before and after. Before
  publishing, run one trial prompt against a prerelease to see what an agent trips
  on with the new behaviour.

## Validation

Every claim above was checked again the same day, because a plan acted on without
checking can leave the library worse than it found it. Three methods:

1. **Every example in this file compiled** against the repository's library, and
   the output compared with what the item says.
2. **The 2.1.1 fixes implemented in a throwaway copy** of the library, never in
   `scss/`, and compared with the original:
   - the full test suite. The only failures were the snapshots and
     `aspect-ratio` specs the fixes set out to change, and the manifest freshness
     check for the F9 signature;
   - 3393 calls compiled against both: every `meta/` example and reject, the
     smoke test, 30 probe values at every argument of every mixin, and numeric
     grids for the arithmetic in F9;
   - `node tools/audit.js` on both.
3. **Browser measurements** in Chrome 152 for F4, B8, B9, F8, F9, A1, A2 and B3.

The comparison, after the corrections below were made to the prototype:

| Result | Calls |
|---|---:|
| identical output | 3144 |
| CSS that could not work today, an error after | 73 |
| an error today, working CSS after: `var()`, `calc()` or `currentColor` where CSS takes them | 11 |
| Sass's own error today, the library's after | 63 |
| the library's error today, Sass's after | 0 |
| different CSS: the intended changes in F2, F7, F8, B8 and B9 | 75 |

The audit's SILENT and UNHELPFUL buckets were 0 before and after, and PASSED
THROUGH fell from 323 to 308.

What validation changed, each written into its item:

- **F5 and F6 moved to 3.0.0**, as B8 and B9: each changes what renders for a call
  that works today.
- **F1** would have refused a list of colours and accepted `url()`.
- **F8** needs named functions, and its helper must not sit in a utility file, or
  the manifest loses `validateRatio`.
- **F9** needs `$gutter` to default to `null`.
- **N3** needs `meta.inspect`, or quoted values lose their quotes.
- **`hide` and `index()`** is not a problem: `hide(nonsense)` raises the library's
  own message. Removed from research.

## Limits

- Three trials, on three project types. The third trial's model was not recorded.
- Browser measurements were Chrome and Chromium only; nothing was tried in
  Firefox or Safari.
- Prototyped: the 2.1.1 fixes, B8, B9 and A5. A1 and A2 were rendered as
  hand-written CSS, not built as Sass. Not prototyped: G1 to G4, A3, A4, N1 to N3
  as members, and B1 to B7.
- Not measured: the boundary overlap in B1, which follows from the definitions of
  `min-width` and `max-width`; forced-colours behaviour for N1.
- Not reproduced: the Parcel claims behind D3 and B6, and the VoiceOver claim.
- A prototype is not the implementation. It shows each approach holds; the real
  change still needs its own specs, `meta/` entries and a snapshot diff.
