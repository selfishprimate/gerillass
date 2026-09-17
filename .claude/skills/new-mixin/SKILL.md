---
name: new-mixin
description: Scaffold a new Gerillass mixin or utility function with the project's conventions, wire it into the folder index, describe it in meta/, and test it. Use when adding a new mixin, helper function, list or map to the library.
---

# Add a member to the Gerillass library

Nine steps. Two of them fail loudly if you skip them: the manifest suite checks
that a new mixin has metadata and a smoke-test call. The others fail silently,
which is worse. Do all of them, and step 8 in particular: it is a rule in
`CLAUDE.md`, not a suggestion.

## 1. Pick the layer

| Adding | Folder | Naming |
|---|---|---|
| public mixin | `scss/library/` | `kebab-case` |
| helper function | `scss/utilities/` | `camelCase` |
| value list | `scss/lists/` | `$list-of-…`, with `!default` |
| keyed config | `scss/maps/` | `$map-for-…`, with `!default` |

One member per file, and **the filename must match the member name** —
`_border-radius.scss` holds `@mixin border-radius`. This holds for all 55
existing mixins and 24 utilities; do not be the exception.

## 2. Write the file

Start every file with `@charset "UTF-8";`, then a blank line. Two-space indent,
double quotes.

```scss
@charset "UTF-8";

@mixin your-mixin($required, $optional: null) {
  // ...
}
```

Declare what the file uses, right after the `@charset` line — see step 4. This
reversed in 2.0.0: library partials used to be forbidden from carrying a `@use`
rule, because a Gulp task concatenated them into one bundle and a `@use` landing
mid-file made Sass reject the whole thing. That generator is gone.

Validate arguments and fail loudly. Every mixin that takes arguments, 48 of them, does
this, and the message should name what is acceptable:

```scss
@error "The argument must be one of the following: #{$list}.";
```

If you interpolate a list into an error message, do not wrap it in `quote()` —
`quote()` takes a string and throws on a list, which replaces your helpful
message with a confusing internal Sass error.

Check the type before calling anything that throws on the wrong one —
`str-slice`, `nth`, `unit`, `unquote`. Otherwise the caller gets Sass's message
about its own parameter (`$n: Invalid index 2 for a list with 1 elements`)
instead of yours.

Do **not** validate a value by guessing what CSS takes. CSS accepts an
open-ended set: `var()`, `calc()`, `clamp()`, `env()`, `unset` and whatever
ships next. A strict check rejects correct code, and `validateLength` used to warn
about `var(--gap)` for exactly this reason. Validate the shape of the call
(arity, which keyword, which type), and check the kind of a value only against
a set measured in a browser, reusing the checks in `scss/internal/`
(`keywordProblem`, `colorProblem`, `colorStopsProblem`, `isConditionValue`,
`imageValue`), which were written that way. Measure where the value lands in
this mixin's output, too: the same value can be wrong in one property and a
working use in another.

Reuse the existing utilities rather than reimplementing them — `isColor`,
`isNumber`, `isTime` for type guards; `validateLength`,
`validateBreakpoint`, `validateRatio`, `validateScissors` for validation;
`remify`, `pixelify`, `convertToEm`, `shorthandProperty` for
conversion.

## 3. Wire it into the folder index

**A new file is invisible until it is listed there.** Add a `@forward` line to
its folder's `_index.scss`, keeping the list alphabetical:

```scss
@forward "your-mixin";
```

`_gerillass.scss` forwards the four folders, so nothing else needs touching —
and the `gls-` copy comes along automatically.

## 4. Declare what it uses

`@forward` does not reach sibling partials, so a mixin that reads a map or calls
a function needs its own `@use` at the top of the file:

```scss
@charset "UTF-8";

@use "sass:math";
@use "../maps/map-for-breakpoints" as *;
@use "../utilities/validate-length" as *;
```

`as *` keeps call sites unprefixed, which is the convention here. Miss one and
the mixin still compiles — Sass evaluates lazily — until something calls it,
which is what `test/smoke.scss` is for.

The `gls-` prefixed copy needs nothing: `_gerillass.scss` produces it with
`@forward "library" as gls-*`.

## 5. Look at it in the lab

A compile says what the mixin writes; the lab shows what that renders. Run the
site's dev server and open `/lab`:

```bash
npm run dev --prefix site   # then http://localhost:7001/lab
```

Add a case: two files in `site/lab/cases` with the same name, the Sass calling
the new member and the markup it styles.

```scss
// site/lab/cases/your-mixin.scss
.element {
  @include your-mixin(10px);
}
```

```html
<!-- site/lab/cases/your-mixin.html -->
<div class="element">Your mixin</div>
```

The case appears in the lab's list without a restart. There is nothing to link:
the lab finds `scss/library/_your-mixin.scss` from the `@include` (or a
function from a call to its name) and shows it in the Library panel, the
compiled CSS and any `@warn` or `@error` beside it, and the rendered page on
the right. Edit the mixin there or in the editor; every save reloads the lab.
A case is also the place to try the calls step 2 refuses, to see the message a
user will get.

Two things the lab does not do. **A file it saves does not trigger the
repository's hooks**, so run `npm run manifest` yourself after changing the
library from the page. And it does not replace steps 7 and 8: a render that
looks right is not a test, and it is not the before-and-after comparison.
`site/CLAUDE.md` has the details under **The lab**.

## 6. Describe it in `meta/`

**The build fails without this.** `test/manifest.spec.js` asserts that every
mixin in `scss/library/` has a `meta/` entry with a summary and at least one
example, so a new mixin with no metadata turns the suite red.

Create `meta/your-mixin.json`:

```json
{
  "name": "your-mixin",
  "summary": "One line, saying what it emits.",
  "arguments": [{ "name": "$size", "accepts": ["a length", "auto"] }],
  "examples": [".element { @include your-mixin(10px); }"],
  "rejects": [".element { @include your-mixin(nonsense); }"]
}
```

Signatures are parsed from the source, so do not repeat them here. What goes in
is what a parser cannot know.

`examples` are compiled by the suite and snapshotted; `rejects` must actually
`@error`, and must fail with your message rather than a Sass internal one. That
is how the validation you wrote in step 2 gets its test coverage — so write a
`rejects` entry for each branch you added.

Then regenerate:

```bash
npm run manifest
```

This rebuilds `gerillass.json` and `SKILL.md` and must be committed with the
rest. A hook does it automatically after an edit under `scss/` or `meta/`, but
only for edits made through the editor — a change made by a shell command does
not trigger it.

## 7. Cover it with tests

Add a line to `test/smoke.scss` calling your mixin with valid arguments —
`test/smoke.spec.js` fails if a mixin in `scss/library/` has no call there.

The `meta/` examples give you a snapshot, which catches later changes to the
output. It does not say the output was right to begin with. If your mixin
computes anything — arithmetic, a percentage, a polygon, a shorthand order —
write a real assertion with `/sass-test` as well.

## 8. Test it in a browser and compare

The documentation and the test suite only cover what someone wrote down. Before
calling the member done, follow **The rule for changing or adding a member** in
`CLAUDE.md`:

- measure in Chrome, Firefox and Safari, all three, with
  `tools/browser-check.js`, the values each property keeps before writing a
  check, and compare what the mixin renders with the same CSS written by hand.
  This is a rule, for a new member and for every change to one;
- compile a wide set of calls, well beyond the examples (`var()` with a
  fallback, maths functions, CSS-wide and vendor keywords, colour functions,
  gradients, `url()`, `paint()`, quoted values, lists), and test the output of
  each in the browser;
- for a change to an existing member, compile those calls before and after and
  diff them, and justify every call that starts raising by showing its old CSS
  did nothing, building the case where the browser kept it;
- write down what was not covered.

## 9. Confirm

```bash
npm test
printf '@import "gerillass";\n.a { @include your-mixin(...); }\n.b { @include gls-your-mixin(...); }\n' > /tmp/check.scss
sass --load-path=scss /tmp/check.scss
```

Check both halves of the API. Compiling the library without calling the mixin
proves nothing — Sass evaluates mixin bodies lazily.
