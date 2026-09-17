# A default `content` for `before` and `after`

Moved out of `todos/fix-plan.md`, where it was B5, on 15 September 2026. The
maintainer asked for each remaining 3.0.0 item to be examined and tested on its
own rather than done as a batch.

**Status.** Done for 4.0.0 on the `before-after-content` branch, 17 September
2026, as the proposal below but with the default in a rule of its own inside
`:where()`. **What was measured and built** at the end has the results.

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

## What was measured and built, 17 September 2026

The `@warn` alternative cannot be built: a mixin cannot see whether its
`@content` block writes `content`.

What was built writes, for a call with no argument or `null`,
`:where(&)::before { content: ""; }` before the mixin's own rule, so the default
has the specificity of the pseudo-element alone. A call with an argument is
unchanged: 216 calls compared, both mixins, with and without a block and under
`gls-`, and only the 32 with no argument changed.

Measured in Chrome 152 and Firefox 156 headless and Safari 26.6.2, identically,
for both mixins, each case in a frame of its own:

| Case | Old | New |
|---|---|---|
| styles only in the block | not drawn | drawn |
| no block | not drawn | drawn, empty |
| `content` in the block, or an argument | drawn | drawn, same |
| `.a::after { content }` before or after the include | wins | wins |
| `div::after { content }` before the include | wins | wins |
| `::after { content }` before the include | wins | loses to the default |
| `::after { content }` after the include | wins | wins |
| `.a::after { content: none }` after the include | hidden | hidden |
| content only under `.is-open`, class absent | not drawn | drawn empty, 20px box |
| content only under `.is-open`, class present | drawn | drawn |
| content only inside a media query that does not match | not drawn | drawn empty |
| `q` element, styles only | browser quotes | quotes gone |
| `q` element with `q::before, q::after { content: none }` | none | none |

The maintainer chose the default over leaving the trap, with the three losses
in `MIGRATION.md` and on both documentation pages.

**The documentation pages** gained a bell with a notification dot and a
tooltip with `content: none` in the block and its text on hover (`after`), and
a status dot and coloured quotation marks on `q` (`before`). Each page's four
old examples got a working demo, and each page four interface examples: a
new-tab arrow, a required-field marker, breadcrumb separators and a unit from a
data attribute (`after`); list markers, numbered steps with `counter()`, badges
with an icon from `var()` and a category from a data attribute (`before`). Every
pseudo-element on both pages, 31 of them, was checked in all three browsers for
its computed `content` and, by turning it off, for the space it takes; only
glyph widths differed, by up to 2px in Safari. Measured in all
three browsers: the dots are drawn at 8px, the idle tooltip has `content: none`,
and `q` keeps `open-quote` and `close-quote`. The hover state was measured in
Chrome and Firefox only: Safari's WebDriver does not trigger `:hover` at all,
checked on a plain page with one button.

**Not covered**: a mobile browser; `::marker` and other pseudo-elements, which
the mixins do not write; how many existing stylesheets style a pseudo-element
whose content comes from another state.
