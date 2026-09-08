---
name: new-mixin
description: Scaffold a new Gerillass mixin or utility function with the project's conventions, wire it into the import chain, regenerate the gls- bundle, and stub its test. Use when adding a new mixin, helper function, list or map to the library.
---

# Add a member to the Gerillass library

Six steps. Two of them fail loudly if you skip them — the manifest suite checks
that a new mixin has metadata and a smoke-test call. The other four fail
silently, which is worse. Do all of them.

## 1. Pick the layer

| Adding | Folder | Naming |
|---|---|---|
| public mixin | `scss/library/` | `kebab-case` |
| helper function | `scss/utilities/` | `camelCase` |
| value list | `scss/lists/` | `$list-of-…`, with `!default` |
| keyed config | `scss/maps/` | `$map-for-…`, with `!default` |

One member per file, and **the filename must match the member name** —
`_border-radius.scss` holds `@mixin border-radius`. This holds for all 51
existing mixins and 22 utilities; do not be the exception.

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

Validate arguments and fail loudly. 35 of the 45 mixins that take arguments do
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

Do **not** validate a value that is passed straight through to CSS. CSS accepts
an open-ended set there: `var()`, `calc()`, `clamp()`, `env()`, `unset` and
whatever ships next. A strict check rejects correct code — `validateLength`
used to warn about `var(--gap)` for exactly this reason. Validate the shape of
the call (arity, which keyword, which type) and leave the values alone.

Reuse the existing utilities rather than reimplementing them — `isColor`,
`isNumber`, `isTime` for type guards; `validateLength`,
`validateBreakpoint`, `validateRatio`, `validateScissors` for validation;
`remify`, `pixelify`, `convertToEm`, `shorthandProperty` for
conversion.

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

## 5. Describe it in `meta/`

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

## 6. Cover it with tests

Add a line to `test/smoke.scss` calling your mixin with valid arguments —
`test/smoke.spec.js` fails if a mixin in `scss/library/` has no call there.

The `meta/` examples give you a snapshot, which catches later changes to the
output. It does not say the output was right to begin with. If your mixin
computes anything — arithmetic, a percentage, a polygon, a shorthand order —
write a real assertion with `/sass-test` as well.

## 7. Confirm

```bash
npm test
printf '@import "gerillass";\n.a { @include your-mixin(...); }\n.b { @include gls-your-mixin(...); }\n' > /tmp/check.scss
sass --load-path=scss /tmp/check.scss
```

Check both halves of the API. Compiling the library without calling the mixin
proves nothing — Sass evaluates mixin bodies lazily.
