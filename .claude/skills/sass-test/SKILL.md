---
name: sass-test
description: Write or debug sass-true unit tests for Gerillass mixins and utility functions. Use when adding test coverage, when a spec fails, or when the user asks to test a mixin.
---

# Write a sass-true test

Coverage is the weakest part of this repository: `test/smoke.scss` proves all 51
mixins still evaluate, but only a few assert what they actually produce. Adding
a real spec is almost always worth it.

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

## Assert the failure cases too

Several mixins `@error` on bad input, and that behaviour is worth locking in —
but sass-true cannot catch an `@error`, since it aborts the whole compilation.
Verify those by hand instead:

```bash
printf '@import "gerillass";\n.a { @include your-mixin(nonsense); }\n' > /tmp/t.scss
sass --load-path=scss /tmp/t.scss
```

Check that the message names the accepted values. A mixin that silently emits
nothing for bad input is a bug — `ratio-box` did exactly that before v1.4.0.

## Running

```bash
npm test                        # everything
npx jest -t "your-mixin()"      # one describe block, by name
```

Deprecation warnings about `@import` and global built-ins are expected on `main`
and tracked for 2.0.0 — they are noise, not failures. Read the `Tests:` line.

## When a spec fails

Compare the two blocks in the reported diff before touching the mixin. A failure
usually means the expectation was written from intent rather than from what the
mixin emits — check the real output first:

```bash
printf '@import "gerillass";\n.element { @include your-mixin(10px); }\n' > /tmp/t.scss
sass --load-path=scss /tmp/t.scss
```

Only change the mixin once you are sure the expected CSS is the correct one.
