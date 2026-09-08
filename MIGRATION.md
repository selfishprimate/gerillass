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
