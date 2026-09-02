---
name: sass-test
description: Write or debug sass-true unit tests for Gerillass mixins and utility functions. Use when adding test coverage, when a spec fails, or when the user asks to test a mixin.
---

# Write a sass-true test

Coverage is the weakest part of this repository: `test/smoke.scss` proves all 51
mixins still evaluate, but only a handful assert what they actually produce.
Adding a real spec is almost always worth it.

## How the suite is wired

`test/scss.spec.js` globs `test/**/*.spec.scss` and hands each file to
[sass-true](https://github.com/oddbird/true), which runs the Sass and reports
each `describe`/`it` as a Jest test. There is no registration step — dropping a
new `.spec.scss` file in is enough.

Mirror the source layout: a mixin from `scss/library/` gets
`test/library/<name>.spec.scss`, a function from `scss/utilities/` gets
`test/utilities/<camelCaseName>.spec.scss`.

Note the spec files use `@use`, while the library itself is still `@import`-based.
That is not an inconsistency to fix — the specs load individual partials
directly, which is what lets them test one member in isolation.

## Testing a mixin — assert the CSS

Mixins emit declarations, so compare rendered output against expected output:

```scss
@use "true" as *;
@use "../../scss/library/your-mixin" as *;

@include describe("your-mixin()") {
  @include it("Describe what the mixin returns.") {
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

Functions return values, so no output block is needed:

```scss
@use "true" as *;
@use "../../scss/utilities" as *;
@use "../../scss/maps" as *;

@include describe("__yourFunction()") {
  @include it("Describe what the function returns.") {
    @include assert-equal(__yourFunction($input), $expected);
  }
}
```

`test/utilities/mapDeepGet.spec.scss` is the working example. Note it pulls in
`scss/maps` as well — a utility that reads a map needs that map loaded.

## Pulling in dependencies

`@use` only what the member under test actually needs. A mixin that reads
`$map-for-breakpoints` needs `@use "../../scss/maps" as *`; one that calls
`__validateLength` needs `@use "../../scss/utilities" as *`.

If a partial calls a `gls-` prefixed mixin — `_remove.scss`, `_reset-figure.scss`,
`_brand-logo.scss` and `_background-image.scss` do — the isolated partial will not
resolve it. Load the whole library with `@use "../../scss/gerillass" as *` for
those four instead of the single file.

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
