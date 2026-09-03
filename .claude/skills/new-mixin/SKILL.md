---
name: new-mixin
description: Scaffold a new Gerillass mixin or utility function with the project's conventions, wire it into the import chain, regenerate the gls- bundle, and stub its test. Use when adding a new mixin, helper function, list or map to the library.
---

# Add a member to the Gerillass library

Four steps are easy to forget, and each one fails silently rather than loudly.
Do all of them.

## 1. Pick the layer

| Adding | Folder | Naming |
|---|---|---|
| public mixin | `scss/library/` | `kebab-case` |
| helper function | `scss/utilities/` | `__camelCase`, two leading underscores |
| value list | `scss/lists/` | `$list-of-…`, with `!default` |
| keyed config | `scss/maps/` | `$map-for-…`, with `!default` |

One member per file, and **the filename must match the member name** —
`_border-radius.scss` holds `@mixin border-radius`. This holds for all 51
existing mixins and 21 utilities; do not be the exception.

## 2. Write the file

Start every file with `@charset "UTF-8";`, then a blank line. Two-space indent,
double quotes.

```scss
@charset "UTF-8";

@mixin your-mixin($required, $optional: null) {
  // ...
}
```

**Do not add `@use` rules to anything in `scss/library/`.** The Gulp task
concatenates those files into one bundle, so a `@use` lands mid-file and Sass
rejects the whole thing (`@use rules must be written before any other rules`).
Library partials rely on the global namespace `_gerillass.scss` builds; that is
deliberate until the 2.0.0 module migration.

Validate arguments and fail loudly. 16 of the 51 mixins do this, and the message
should name what is acceptable:

```scss
@error "The argument must be one of the following: #{$list}.";
```

If you interpolate a list into an error message, do not wrap it in `quote()` —
`quote()` takes a string and throws on a list, which replaces your helpful
message with a confusing internal Sass error.

Reuse the existing utilities rather than reimplementing them — `__isColor`,
`__isNumber`, `__isTime` for type guards; `__validateLength`,
`__validateBreakpoint` for validation; `__remify`, `__pixelify`,
`__convertToEm`, `__shorthandProperty` for conversion.

## 3. Wire it into `_gerillass.scss`

**A new file is invisible until it is listed there.** Add an `@import` line in
the correct layer block, keeping the block alphabetical:

```scss
@import "library/your-mixin";
```

The layer order — lists, maps, utilities, library — is a real dependency order,
not decoration.

## 4. Regenerate the prefixed bundle

```bash
npx gulp start
```

This rebuilds `scss/_gerillass-prefix.scss`, which is committed build output —
never edit it by hand. Skipping this leaves the entire `gls-` half of the public
API without your mixin. Commit the regenerated file alongside the source.

(A PostToolUse hook runs this automatically after edits under `scss/library/`.
Run it manually anyway if you are unsure it fired.)

## 5. Cover it with tests

Add a line to `test/smoke.scss` calling your mixin with valid arguments —
`test/smoke.spec.js` fails if a mixin in `scss/library/` has no call there, so
this is not optional.

Then write a real assertion with the `/sass-test` skill, which covers the
sass-true conventions.

## 6. Confirm

```bash
npm test
printf '@import "gerillass";\n.a { @include your-mixin(...); }\n.b { @include gls-your-mixin(...); }\n' > /tmp/check.scss
sass --load-path=scss /tmp/check.scss
```

Check both halves of the API. Compiling the library without calling the mixin
proves nothing — Sass evaluates mixin bodies lazily.
