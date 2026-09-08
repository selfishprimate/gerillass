---
name: sass-test
description: Write or debug sass-true unit tests for Gerillass mixins and utility functions. Use when adding test coverage, when a spec fails, or when the user asks to test a mixin.
---

# Write a sass-true test

## Where a hand-written spec fits

The suite tests every member at four depths. Know which one you are adding to:

| Level | Proves | Coverage |
|---|---|---|
| smoke (`test/smoke.scss`) | the mixin evaluates | 51/51 mixins |
| snapshot (`meta/` examples) | its output cannot change unnoticed | 73/73 members |
| rejection (`meta/` rejects) | bad input is refused, with the library's own message | 45/73 |
| **sass-true spec** | **the CSS is correct** | **11/73** |

The first three come free from a `meta/` entry. A sass-true spec is the only one
that says the output was right in the first place — a snapshot of a wrong value
records it as correct.

So it is worth writing when the mixin **computes** something: arithmetic, a
percentage, a polygon, a shorthand order, gradient positions. It is usually not
worth it for a mixin that emits a few fixed declarations, where the snapshot
already covers everything and the assertion would just be maintenance.

Existing examples to copy from: `triangle`, `scissors`, `columnizer`,
`position`, `background-dots`, `ratio-box`, `responsive-video`, `remove`.

## Derive the expectation, do not paste it

Write what the CSS *should* be from the technique, then run it. Pasting the
compiled output turns the spec into a second snapshot and it can only ever
agree with the code.

This is not theoretical: deriving `columnizer`'s widths independently is what
revealed it interpolates its `calc()` instead of evaluating it, so
`calc(100% / 4)` reaches the stylesheet where `25%` would do. A pasted
expectation would have matched and said nothing.

When the mixin interpolates a value, Sass will evaluate the same expression in
your `expect` block and the two will not match. Force the literal:

```scss
flex: 0 0 unquote("calc(100% / 4)");
```

## How the suite is wired

`test/scss.spec.js` globs `test/**/*.spec.scss` and hands each file to
[sass-true](https://github.com/oddbird/true), which runs the Sass and reports
each `describe`/`it` as a Jest test. There is no registration step — dropping a
new `.spec.scss` file in is enough.

Two things about that glob: the filename must end in `.spec.scss`, and it must
not start with a dot. A leading dot makes the file invisible to `glob` and the
spec silently never runs.

Mirror the source layout: a mixin from `scss/library/` gets
`test/library/<name>.spec.scss`, a function from `scss/utilities/` gets
`test/utilities/<camelCaseName>.spec.scss`.

## Loading what you need

Specs use `@import`, matching the library. Do **not** use `@use` here — there
are no `_index.scss` files in `scss/`, so `@use "../../scss/utilities"` fails
with `Can't find stylesheet to import`.

Two working shapes:

```scss
@import 'true';
@import '../../scss/library/after';        // one partial, for an isolated member
```

```scss
@import 'true';
@import '../../scss/gerillass';            // the whole library
```

Prefer the single partial — it keeps the test honest about what the member
actually depends on. Reach for the whole library when the member needs more
than itself:

- it calls a `gls-` prefixed mixin (`_remove.scss`, `_reset-figure.scss`,
  `_brand-logo.scss`, `_background-image.scss`), which only exists in the
  generated bundle
- it calls `math.div`, which resolves through the `@use "sass:math"` at the top
  of `_gerillass.scss`
- it reads a map or list, or calls another utility

A partial that needs a map can also import just that map, as
`test/utilities/mapDeepGet.spec.scss` does.

## Testing a mixin — assert the CSS

```scss
@import 'true';
@import '../../scss/library/your-mixin';

@include describe('your-mixin()') {
  @include it('Describe what the mixin returns.') {
    @include assert {
      @include output {
        .element {
          @include your-mixin(10px);
        }
      }
      @include expect {
        .element {
          width: 10px;
        }
      }
    }
  }
}
```

`output` and `expect` are compared after normalisation, so indentation does not
matter but selectors and property order do.

## Testing a function — assert the value

```scss
@import 'true';
@import '../../scss/gerillass';

@include describe('__yourFunction()') {
  @include it('Describe what the function returns.') {
    @include assert-equal(__yourFunction($input), $expected);
  }
}
```

## Failure cases belong in `meta/`, not here

sass-true cannot catch an `@error` — it aborts the whole compilation. Do not try
to assert rejections in a spec. Add them to the mixin's `meta/` entry instead:

```json
"rejects": [".element { @include your-mixin(nonsense); }"]
```

The manifest suite compiles each one, requires it to fail, and requires the
failure to carry the library's own message rather than a Sass internal error.
That last check is what stops a regression back to `$n: Invalid index 2 for a
list with 1 elements`.

To read a message while writing it:

```bash
printf '@import "gerillass";\n.a { @include your-mixin(nonsense); }\n' | sass --stdin --load-path=scss
```

## Running

```bash
npm test                        # everything
npx jest -t "your-mixin()"      # one describe block, by name
```

Deprecation warnings about `@import` and global built-ins are expected on `main`
and tracked for 2.0.0 — they are noise, not failures. Read the `Tests:` line.

## When a spec fails

A red spec means the mixin and your expectation disagree. Decide which one is
wrong before touching either — that decision is the whole value of the spec, and
pasting the received output to make it green throws it away.

Work out on paper what the CSS ought to be. If the mixin does not match it, you
have found a bug. If your expectation was wrong, fix the expectation and say why
in a comment, as the `columnizer` spec does for its unevaluated calc.

To see what it currently emits:

```bash
printf '@import "gerillass";\n.element { @include your-mixin(10px); }\n' | sass --stdin --load-path=scss
```
