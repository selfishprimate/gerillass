# Migrating to Gerillass 4.0.0

Written while 4.0.0 is being prepared, and added to as its changes land. So far
it covers `hide`. The 3.0.0 and 2.0.0 guides follow below, unchanged.

Every claim here was checked by compiling the old call against 3.0.0's source
and the new one against 4.0.0's, and the CSS each produces was measured in
Chrome 152, Firefox 156 and Safari 26.6.2.

---

## The short version

| | |
|---|---|
| `hide(unhide)` was removed | breaking, loud |
| `hide(focusable)` was added | not breaking |

The break stops the build with a message naming both replacements, so nothing
fails silently. To find every call first:

```bash
grep -rn "unhide" --include=*.scss .
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
