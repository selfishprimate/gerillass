# A default `content` for `before` and `after`

Moved out of `todos/fix-plan.md`, where it was B5, on 15 September 2026. The
maintainer asked for each remaining 3.0.0 item to be examined and tested on its
own rather than done as a batch. Not planned.

## What the mixins do today

`before($content)` and `after($content)` write a `::before` or `::after` rule
with the `@content` block inside. `$content` defaults to `null`. Compiled today:

```css
/* @include after("→") { color: red; } */
.a::after { content: "→"; color: red; }

/* @include after("data-label") { color: red; } */
.a::after { content: attr(data-label); color: red; }

/* @include after { content: "x"; } */
.a::after { content: "x"; }
```

With no argument the mixin writes no `content` of its own, and the caller is
expected to write it in the block.

## What goes wrong

A pseudo-element with no `content` is not rendered at all. Called with no
argument and a block that only styles, such as `after { color: red; }`, the
mixin produces a rule that draws nothing. T1 did this four times in one
session. The behaviour is deliberate, but it is stated only in an error message
that a caller sees after passing something invalid, not when calling it with
nothing. T2 and T3 avoided it by writing `content: ""` themselves.

## The proposal from the fix plan

Make `""` the default, so `after { color: red; }` renders an empty
pseudo-element, and keep `null` as the explicit way to say "I write the content
myself".

## What it would change for existing users

A call with no argument starts writing `content: ""`. A project that relied on
the empty default, for instance styling a `::after` whose content another rule
provides, may see that content overridden by the mixin's `content: ""`,
depending on which rule comes later and which is more specific.

## What was measured

Nothing in a browser. The problem comes from the trials, and the override risk
from reasoning about the cascade.

## To test before planning

- The override case: a `content` set by a separate rule, before and after the
  include in source order, and with higher and lower specificity.
- `after { content: "x"; }`, where the block writes its own `content`, to make
  sure the block still wins over the default.
- How many documented and real-world calls pass no argument, to size the
  change.
- Whether a `@warn` when the block has no `content` and no argument is given
  would solve the trap without changing output, as an alternative that needs no
  major version.

## Touches

`scss/library/_before.scss`, `scss/library/_after.scss`;
`test/library/after.spec.scss`, plus a test for the default;
`meta/before.json` and `meta/after.json`; the two documentation pages;
`MIGRATION.md`.
