# Plan for values a browser drops

The findings of `silent-values.md` turned into work: 49 arguments in 28 mixins
that compile a bad value into CSS a browser drops or can never match. For each
item: what goes wrong, the change, whether any working call changes its output,
what it touches, and what proves it.

Written 14 September 2026 against `main` at 2.3.0. Nothing below is
implemented. Figures and line numbers age; re-check them before acting, as
`CLAUDE.md` asks of everything in `todos/`.

## Decisions to make first

Each changes what the items below look like. A recommendation is given, but
none is settled.

| # | Question | Recommendation |
|---|---|---|
| 1 | Shared checks in `scss/internal/`, or a private copy in every file as today? | `scss/internal/`, see S0 |
| 2 | Should `validateBreakpoint`, a public utility, raise on a word that is not a key? | yes, in a patch, listed in the changelog |
| 3 | Should `position` raise instead of warn for an offset that is not a length? | raise in `position`, keep `validateLength` warning |
| 4 | An image path with a space: refuse it, or write `url("a b")`? | quote it, only when the path needs quotes |
| 5 | One release or several? | four patch releases, see Order |
| 6 | Keep the browser measurement as a tool in the repository? | yes, as a page with no new dependency, see S0 |

On 3: `CLAUDE.md` says the `position` warning is deliberate and points to the
note in `scss/utilities/_validate-length.scss`. That note explains why `null`
and `var()` are accepted, not why the rest warns rather than raising. The
report measured that the 7 calls it warns about all produce CSS a browser drops.

## Overview

| # | Item | Arguments | Release |
|---|---|---:|---|
| S0 | Groundwork: shared checks, audit probes, browser page | | with S1 |
| S1 | Conditions: `breakpoint`, `remove`, `container-query`, `screen-agent` | 4 | 2.3.1 |
| S2 | Selectors: `only`, `except` | 2 | 2.3.1 |
| S3 | Keywords outside the property's set | 8 | 2.3.2 |
| S4 | Images: a list or a path with a space | 5 | 2.3.2 |
| S5 | `background-stripes` appending `deg` to another unit | 1 | 2.3.2 |
| S6 | Colours | 10 | 2.3.3 |
| S7 | Lengths | 19 | 2.3.4 |

49 in total. The order is the report's, with two changes: images and the unit
bug move before colours, because both are small and need no new value set, and
lengths go last because they need the most measuring.

---

## S0. Groundwork

### S0a. Shared checks in `scss/internal/`

**Problem.** The library already keeps private helpers as copies:
`-is-css-function` in 9 files, `-image` in 5, `-is-size` in 3,
`-custom-property-in` in 3, `-name-problem` in 2. A member starting with `-` is
private to its file, and a public utility would add API and a minor release.
This plan adds checks to 28 mixins, so copying would multiply the problem.

**Fix.** A folder `scss/internal/` that no `_index.scss` forwards. A library
partial loads what it needs with `@use "../internal/kinds" as *`. Names there
must not start with `-`, or they become private to their own file again.

Measured today in a throwaway copy, with a function placed there and used by
`sizer`:

- the mixin works, both as `sizer` and `gls-sizer`;
- a consumer cannot reach the function: through `@use "gerillass" as *` and
  through `@import` it renders as literal CSS, like any unknown name, and
  through `@use "gerillass" as g` it is `Undefined function`;
- `tools/build-manifest.js` and `tools/check-docs.js` read only
  `scss/library` and `scss/utilities`, so the manifest does not change.

**Still to verify before relying on it.** `npm test`; `npm pack --dry-run`
lists `scss/internal/`; the four loading routes in `CLAUDE.md` against a packed
tarball; `tools/check-docs.js` counts a mixin as validating by the pattern
`@error|validate[A-Z]|is[A-Z][a-z]`, so helper names should start with `is`, or
the count drops.

**Moving the existing copies** is a commit of its own, before any new check,
and must leave every output byte-identical: the compile matrix below, before
and after.

**Changes existing output?** No.

**Status.** Done. `scss/internal/` holds `isCssFunction` (was in 9 files),
`isSize` (3), `customPropertyIn` (3) and `imageValue` (5). The five `-image`
copies were two versions, three writing `url($value)` and two
`url(string.unquote($value))`, so `imageValue` takes `$unquote` to keep both.
`-name-problem` stays in `container` and `container-query`, whose two copies
check different things, and `-is-css-color` stays in `triangle` until S6.

Verified: the compile matrix, 7382 calls, identical before and after;
`npm test` 653 passed; `gerillass.json`, `SKILL.md` and `llms.txt` unchanged;
`npm pack --dry-run` 105 files, the four new ones under `scss/internal/`. The
packed tarball was installed and compiled through `pkg:gerillass`,
`pkg:gerillass/scss/gerillass` and `loadPaths`: all three work, a call to
`isCssFunction` renders as literal CSS, and `g.isSize` through a namespace is
`Undefined function`. Not tried: Vite, webpack and Parcel, which resolve the
entry file the same way and reach `scss/internal/` only through relative
`@use`.

One thing the plan got backwards: `tools/check-docs.js` counted `counter` as
validating once it called `isCssFunction`, so the count rose rather than fell.
The pattern now leaves `isCssFunction` out, since it picks a branch and refuses
nothing.

### S0b. Audit probes

`tools/audit.js` probes six bad values and missed most of the report. Add
`huge`, `10deg`, `-10px` and the unitless `10` to `PROBES`, so each fix shows up
as a refusal there. The SILENT, UNHELPFUL and BROKEN OUTPUT buckets must stay
empty; the new probes will fill PASSED THROUGH, which is expected and is what
falls as each item lands.

**Status.** Done. `-10px` is new; a unitless number was already probed as `42`,
so `10` was not added. On the unchanged library the new probes raised WARNED
ONLY from 30 to 41 and PASSED THROUGH from 305 to 482; SILENT, UNHELPFUL and
BROKEN OUTPUT stayed at 0.

### S0c. The browser page

The browser half of the report is not in the repository, and every item needs
it twice: to measure a property's value set before writing a check, and to
confirm the new output after. A script, `tools/browser-check.js`, that takes
compiled CSS, splits it into declarations, selectors and conditions, and writes
one HTML page testing each with `CSS.supports`, rule insertion and `matchMedia`,
as the report did. Opened in Chrome, it needs no devDependency, which keeps
`package.json` as it is.

**Status.** Done, as `tools/browser-check.js`. It takes `.css` files, `.scss`
files compiled against `scss/`, or single pieces such as
`"media:(min-width: huge)"`, and writes `.browser-check/index.html`, which
`.gitignore` leaves out. The in-app browser runs no script in a page opened
from disk, so `--serve` serves that page on port 7002, started by the
`browser-check` entry in `.claude/launch.json`. Results are in the page's table
and in `window.results`.

Its controls came out as expected in Chrome 152: `width: 10px` and
`:nth-of-type(2)` kept, `width: 10deg` and `:nth-of-type(10deg)` dropped,
`(min-width: 200px)` and `(max-width: 1px)` kept, and a container condition
kept whether or not the 500px container matched it.

### S0d. The compile matrix

One script, kept in the scratchpad rather than the repository, that compiles
every call of the report (86 arguments, nine values), every `meta/` example and
reject, and `test/smoke.scss`, and writes one file per call. Run it on `main`
before each item and on the branch after, then `diff`. Every difference must be
a call whose old CSS the browser dropped.

**Status.** Done, and kept out of the repository as planned. It compiles 7382
calls: 53 values at every argument of every member, 31 more argument shapes for
variadic members such as `min, huge` and `between, small huge`, every `meta/`
example, reject and warns entry under both `@import` and `@use`, and
`test/smoke.scss`. A second script sorts the differences into CSS to error,
error to CSS, changed CSS, changed message and changed warnings. The baseline
was taken from `main` at d538217.

---

## S1. Conditions

**Problem.** A name that is not in `$map-for-breakpoints` is written into the
query as it is. `breakpoint(min, huge)` compiles to `@media (min-width: huge)`,
which never matches, and prints nothing. With one argument it prints the
single-pixel warning, which names the wrong problem.

The cause is `validateBreakpoint`, which returns a key's width and anything
else unchanged. It also has a bug of its own: the `@for` loop returns on its
first pass, and `map.has-key` is asked about the whole value, not the item.

**Fix.** `validateBreakpoint` accepts, and returns:

- a key of `$map-for-breakpoints`, as its width;
- a number with a length unit, or `0`;
- a calculation, if the measurement shows a condition accepts it.

Everything else raises, naming the keys of the map. `var()` is already refused
before this is reached, with its own message. `breakpoint`'s one-argument
branch and its `only`, `min` and `max` branches use `map.has-key` directly
rather than the function; route them through it, so every branch checks. The
check runs before the single-pixel warning, so `breakpoint(huge)` raises and
does not also warn.

`screen-agent` gets its own set: `1x`, `2x`, `3x`, or a number with `dpi`,
`dpcm`, `dppx` or `x`.

**Measure first.** In Chrome: `calc()` and `clamp()` in a width condition and a
resolution condition; a negative length; `vw`, `ch` and `cqi` in a media
condition and a container condition.

**Changes existing output?** Only for calls whose condition can never match.
Decision 2 covers `validateBreakpoint` called directly.

**Touches.** `scss/utilities/_validate-breakpoint.scss`,
`scss/library/_breakpoint.scss`, `_container-query.scss`, `_screen-agent.scss`;
`remove` is covered through `breakpoint`. `rejects` in each `meta/` file for
`huge`, `min, huge`, `between, small huge`, `huge, large`, `10deg` and `10`. A
sass-true spec for `validateBreakpoint`. The documentation pages of the four
mixins, and of the function if it has one.

**Verify.** The rejects fail before the change. The matrix changes only the
calls above. The audit shows the new refusals.

**Status.** Done, not released.

*Measured first*, in Chrome 152, 208 conditions. A width condition kept every
CSS length unit (52 of them, `Q` and `rcap` to `dvmin` and `cqmax`) in any case,
`0`, a negative length, and `calc()`, `clamp()`, `min()` and `max()`. It never
matched a word, `%`, a unitless number, `x`, `dppx`, `fr`, `s`, a made-up unit,
`env()`, `attr()` or a quoted string. A resolution condition kept `dpi`,
`dpcm`, `dppx` and `x`, `0dppx` and a calculation, and never matched a
unitless number, a length or a negative resolution. So the plan's worry about a
negative length was unfounded, and it stays accepted.

*Two things changed the design.* `validateBreakpoint` is used in declarations,
`max-width: validateBreakpoint("large")` on its own documentation page, so the
condition-only rules went into `scss/internal/_is-condition-value.scss` and
`_condition-width.scss`, and the public function refuses only a word that is
not a key, and a list. It still returns a length, a percentage, a CSS function,
`null` and the sizing keywords (`auto`, `none`, `fit-content`, `inherit` and
so on) unchanged; the first draft refused `null` and `auto`, both of which
worked in a declaration, and was corrected. And `breakpoint(min, "600px")`
compiled to `(min-width: 600px)`, because Sass writes a quoted string into a
condition unquoted, so the check reads a string's content: a quoted length is
accepted and a quoted word is not.

The check runs before the single-pixel warning, so `breakpoint(huge)` raises
and does not also warn. `breakpoint` keeps writing its queries exactly as
before and calls the check only for its error; `container-query` swaps
`validateBreakpoint` for `conditionWidth`, which returns the same value. The
same pass removed the loop bug: `validateBreakpoint(small medium)` gave `small`.

*Verified.* The 44 new rejects failed before the change and pass after. New
specs for `breakpoint`, `screen-agent` and `validateBreakpoint`, and four
accepted forms added to `container-query`'s, passed before and after.
`npm test` 710 passed. The compile matrix: 7175 calls identical, 207 from CSS to
an error (50 each for `breakpoint`, `container-query` and `remove`, 43 for
`screen-agent`, 14 for `validateBreakpoint`), and none from an error to CSS,
none with changed CSS, none with changed warnings.

The old CSS of those 207 was split into 151 pieces and tested in Chrome 152:
every condition was dropped or could never match, with one exception.
`container-query(10px 20px)` used to write `(width: 10px)`, which can match,
with the single-pixel warning, by taking the first item of the list and
dropping the second. It is refused now as a list where one size is meant; list
it in the changelog. Of the `validateBreakpoint` values, none is a size in any
declaration.

The audit: WARNED ONLY fell from 41 to 17 and PASSED THROUGH from 482 to 469.
REFUSED VALID CSS rose from 240 to 249, all of it `currentColor` and `null` as a
size in a condition, which cannot match, plus `currentColor` in
`validateBreakpoint`. SILENT, UNHELPFUL and BROKEN OUTPUT stayed at 0.

The four documentation pages and `validate-breakpoint` gained the new refusals
and the accepted units, with each error message copied from a compile. The
site builds.

*Found on the way.* `tools/browser-check.js` reported
`(min-width: huge) and (max-width: 991px)` as kept, because it asked about the
`not` form of the whole condition. In a 500px frame the condition never matched
while `(min-width: 100px) and (max-width: 991px)` did. The tool now tests each
`and`-joined part, and two compound controls confirm it.

*Not tested.* A quoted length in exponent form, `"1e3px"`, is refused, though
the browser keeps `1e3px`; unquoted it is a Sass number and accepted. Firefox
and Safari, as for the whole plan. The error for `remove` names `breakpoint`,
because `remove` passes its sizes through it, as the `var()` error already did.

## S2. Selectors

**Problem.** `only(10deg)` compiles to `:nth-of-type(10deg)` and
`only(-10px)` to `:nth-last-of-type(10px)`, and the browser drops the whole
rule. `except` does the same inside `:not()`. With several arguments a word
fails with Sass's own error from `< 0`.

**Fix.** A number must be unitless and whole. Words keep their meaning:
`first`, `last`, `odd`, `even`, or a selector such as `.foo`. The
several-argument path checks each item the same way, so a word there raises the
library's message instead of Sass's.

**Measure first.** `:nth-of-type(0)` parses and never matches: decide whether
`0` is refused.

**Changes existing output?** No working call.

**Touches.** `scss/library/_only.scss`, `_except.scss`; `rejects` in both
`meta/` files; both documentation pages.

**Status.** Done, not released.

*Measured first*, in Chrome 152, 68 selectors and the matching of eleven on
six siblings. `:nth-of-type()` with any unit (`10deg`, `10px`, `10%`), a
fraction (`1.5`, `0.5`), `1e3` written as such, a word or `var()` is an invalid
selector and the rule is dropped; in a selector list one of them drops the
rest, so `only(1, 10deg)` styled nothing. A whole number was kept, negative,
`+3` and `99999` included. `:nth-of-type(0)` is valid and matched none of the
six, and `:not(:nth-of-type(0))` all six. So `0` is refused too: `only(0)`
selects nothing and `except(0)` excludes nothing, the same test S1 applied to a
condition that never matches.

*The design.* The check is shared from `scss/internal/_sibling-index.scss`,
which returns what is wrong or null. With one argument only a number is
checked, so `first`, `odd`, `.foo` and a suffix such as `"-active"` keep their
meaning. With several, every item must be a position, and a word now gets the
library's message instead of Sass's `Undefined operation "min < 0"`, which the
audit never saw because it probes a variadic mixin with one value. The
selectors are written by the same code as before.

*Found and left alone.* A bare word on its own is appended to the selector:
`only(huge)` writes `.probehuge` and `except(huge)` writes `:not(huge)`. Both
are valid selectors, and the first is how a suffix is passed, so it is not a
value a browser drops. `var()` fails with Sass's own `expected selector`, and
an unquoted `.foo` with `Expected digit`, both before the mixin can see the
value.

*Verified.* The 24 new rejects (12, bare and prefixed) failed before and pass
after; new specs for both mixins passed before and after. `npm test` 741
passed. The compile matrix against S1: 7336 calls identical, 42 from CSS to an
error, 50 with a new message, and none from an error to CSS, with changed CSS or
with changed warnings. The 50 are all several-argument calls that failed with
Sass's `Undefined operation` and now fail with the library's message, 25 in
each mixin. The old CSS of the 42 was tested in Chrome 152: 40 selectors were
invalid and dropped, and the other two were `:nth-of-type(0)` and
`:not(:nth-of-type(0))`, which match nothing and exclude nothing. The audit's
PASSED THROUGH fell from 469 to 465, its other buckets unchanged. Both
documentation pages list the refusals, with messages copied from a compile,
and the site builds.

---

## S3. Keywords

**Problem.** Eight arguments take a short, closed set and pass anything:
`position: huge`, `display: huge`, `resize: huge`, `overflow: huge`,
`radial-gradient(huge at center, …)`, `font-style: huge`.

**Fix.** Each argument checked against its property's measured set, plus the
CSS-wide keywords where the property takes them, plus `var()` where the value
lands in a declaration. `font-face` already refuses `var()` in a descriptor.

| Member | Argument | Set to measure |
|---|---|---|
| `position` | `$position` | `static`, `relative`, `absolute`, `fixed`, `sticky` |
| `ellipsis` | `$display` | the single keywords, and two-word forms such as `inline flex` |
| `resizable` | `$direction` | `none`, `both`, `horizontal`, `vertical`, `block`, `inline` |
| `resizable` | `$overflow` | `visible`, `hidden`, `clip`, `scroll`, `auto`, and two values |
| `radial-gradient` | `$shape` | `circle`, `ellipse`, the extent keywords, and explicit sizes |
| `radial-gradient` | `$position` | a map key, or a CSS position: keywords, lengths, percentages |
| `font-face` | `$font-style` | `normal`, `italic`, `oblique` with up to two angles |
| `font-face` | `$font-weight` | `normal`, `bold`, a number from 1 to 1000, or a range of two |

`display` and `radial-gradient` are the ones where a guessed list would refuse
valid CSS; measure those widest.

**Changes existing output?** No working call.

**Touches.** Six partials, their `meta/` files and pages. `ellipsis` and
`resizable` leave the list of mixins in `CLAUDE.md` that validate nothing.

**Status.** Done, not released.

*Measured first*, in Chrome 152, 204 values: declarations with `CSS.supports`,
and the two `@font-face` descriptors by inserting the rule and reading it back,
which `tools/browser-check.js` learned to do for this (`font-face:` pieces, and
declarations inside `@font-face` in a compiled file). What each argument keeps
is written in the source comment above its check, and in short:

- `position`: the five keywords in any case, CSS-wide keywords, `var()`.
  Chrome drops `-webkit-sticky`, which Safari uses.
- `display`: one keyword, or two or three in any order naming at most one outer
  type, one inner type and `list-item`. `block inline`, `flex grid`,
  `list-item flex` and `inline-block flow` are dropped.
- `resize`: none, both, horizontal, vertical, block, inline and `auto`, which the
  plan did not list. `overflow`: one or two keywords, `overlay` included; three
  are dropped, and so is a CSS-wide keyword beside another.
- `radial-gradient`: $position that is not a map key is written after the shape
  without `at`, so it carries a size (`closest-side`, as the page documents), or
  `at` and a position, or both. Dropped: a percentage or negative length as a
  circle's size, the shape twice, four keywords after `at`, and the logical
  `at x-start`.
- `font-style` in `@font-face`: normal, italic, auto, oblique with up to two
  angles within 90deg. `font-weight`: normal, bold, auto, 1 to 1000 with
  fractions and `calc()`, or two numbers. CSS-wide keywords, `bolder`, `lighter`,
  `0` and `1001` are dropped.
- A quoted keyword is dropped in all four declarations: `position: "sticky"`.

*The design.* Two more shared files: `scss/internal/_words.scss`, `wordsOf`,
which replaces the private `-words` in `container` with no change to its
output, and `_keyword-value.scss`, `keywordProblem`, which checks the kind and
count of each word, lets any value holding a parenthesis through, takes a
CSS-wide keyword only on its own, and optionally a vendor-prefixed word.
`isConditionValue` gained the kinds `length-percentage` and `angle`. The
grammars used by one mixin each (display, the gradient's size and position,
the font descriptors) are private to that mixin's file.

Three changes of output, each for a call that did not work: a valid quoted
keyword is written without its quotes in `position`, `ellipsis` and
`resizable`, as `font-face` already did; and a number from 1 to 1000 in
`font-face`'s $font-style is read as the weight, where only the hundreds were,
so `font-face(..., 450)` stopped writing `font-style: 450`. null still leaves a
declaration out.

*Found and left alone.* The page said `$shape` defaults to ellipse and can be
skipped with null; it is required and null is refused, as before, and the page
now says so. `radial-gradient` checks $shape and $position separately, so
`ellipse` with one length split across them is not caught. A quoted number in a
font descriptor is checked for its shape only, since Sass cannot read the text
as a number: `"1001"` is let through, and the reject uses unquoted
`oblique 100deg` for that reason.

*Verified.* The 23 new rejects (46 bare and prefixed) and the three quoted
specs failed before the change; the accepted forms in four new or extended
specs and two new `font-face` examples passed before and after, the examples
as snapshots. `npm test` 801 passed. The compile matrix against S2: 7137 calls
identical, 311 from CSS to an error, all in the eight arguments, 4 with changed
CSS, and none from an error to CSS. The 4 are `font-face` with $font-style `10`,
`42`, `1.5` and `2`, now written as the weight. The old CSS of the 311 was
tested in Chrome 152: every declaration built from a refused argument was
dropped, 308 pieces; the only ones kept were the declarations those mixins
always write, such as `overflow: hidden` in `ellipsis`.

The audit: PASSED THROUGH fell from 465 to 408, REFUSED VALID CSS rose from 249
to 262, all of it `currentColor` and `calc(1rem + 2px)` in keyword arguments,
where neither is valid; SILENT, UNHELPFUL and BROKEN OUTPUT stayed at 0.
`validating` in `tools/check-docs.js` is now 42 of 49. The five pages list the
refusals, with messages copied from a compile, and the site builds.

## S4. Images

**Problem.** `background-image`, `brand-logo` and `text-image` turn the list
`16 9` into `url(16 9)`, and `background-dots` and `background-stripes` turn
`"a b"` into `url(a b)`. Both are dropped.

**Fix.** The shared `-image` helper, moved to `scss/internal/` in S0a:

- a list where one image is meant raises;
- a path holding a space, a quote or a parenthesis is written quoted,
  `url("a b")`, which is a real file name; every other path keeps its output.

**Measure first.** That Chrome loads `url("a b")` for a file named `a b`.

**Changes existing output?** Only the calls above, which do not work today.
Decision 4.

**Touches.** Five partials, their `meta/` files. `sprite` builds its own
`url()` and has the same path problem; include it.

**Status.** Done, not released.

*Measured first*, in Chrome 152. Dropped: `url(16 9)`, `url(a b)`,
`url(a(1).png)`, `url(a'b.png)`. Kept: the same paths in quotes, which
resolved to the file (`url("a b")` to `a%20b`), and also `url(42)`, `url(true)`
and `url(#ff0000)`.

*What changed from the plan.* The plan saw one problem per group, and there
were two. `background-image`, `brand-logo` and `text-image` write
`url($value)`, which keeps a quoted path's quotes, so a path with a space was
already fine there; their problem was the kind of value, which they never
checked. `background-dots` and `background-stripes` checked the kind but
unquoted the path, so there the space was the problem. `sprite` with one
argument checks its path; with two it checked nothing.

`imageValue` in `scss/internal/` now takes the mixin and argument names and:

- refuses a list where one image is meant;
- refuses a number, a colour, a boolean or a calculation, which the first three
  mixins passed into `url()`;
- in the two pattern mixins, quotes a path holding a space, a parenthesis or a
  quote, in single quotes with any single quote escaped when the path holds a
  double quote, and writes every other path as before.

`sprite` refuses a non-string path in its two-argument form.

*Beyond the report's rule, and said so.* S1 to S3 refused only what compiled
into CSS the browser drops. Of the 93 calls S4 turns into an error, the old CSS
of 30 was dropped: the lists and `url(calc(...))`, `url(clamp(...))`,
`url(min(...))`. The other 63 were kept, as `url(42)`, `url(10deg)`,
`url(red)`, `url(40em)`, `url(true)`, `url(1)` from `sprite(1, 2)`: valid
syntax that asks for a file of that name, which is never an image. They are
refused because an image path is a string, which `background-dots` and
`background-stripes` already required. If that is judged too strict, the
non-string check is one `@if` in `_image-value.scss` and can come out without
touching the rest.

*Verified.* The 16 new rejects (8, bare and prefixed) failed before the change.
The quoting specs could not even run before it: `url(/img/it's.png)` opened a
string that broke sass-true's CSS parser, taking the whole Sass suite down,
which was the defect itself. `npm test` 821 passed after. The compile matrix
against S3: 7407 calls identical, 93 from CSS to an error, 2 with changed CSS
(the `"a b"` path in the two pattern mixins, now quoted), none from an error to
CSS. The five quoted outputs, including a path with both kinds of quote, were
kept in Chrome and resolved to the right file name. The audit: PASSED THROUGH
fell from 408 to 390, REFUSED VALID CSS rose from 262 to 265, the three
`calc(1rem + 2px)` images, whose `url()` the browser drops; SILENT, UNHELPFUL
and BROKEN OUTPUT stayed at 0. `tools/check-docs.js` now counts `imageValue` as
validation, so `brand-logo` and `text-image` join the validating mixins, 44 of
49. Six documentation pages updated, messages copied from a compile, and the
site builds.

## S5. The unit bug

**Problem.** `background-stripes` adds `deg` to any `$rotation` whose unit is
not `deg`: `-10px` becomes `-10pxdeg`, and the valid `0.25turn` becomes
`0.25turndeg`.

**Fix.** A unitless number gets `deg`, as its comment says. `deg`, `grad`,
`rad` and `turn` pass as they are. Any other unit raises.

**Changes existing output?** Only calls that were broken: a `turn`, `rad` or
`grad` rotation starts working.

**Found on the way, not in this plan.** `linear-gradient` and `text-gradient`
refuse a `$direction` in `turn` or `rad`, which CSS takes. That is refused
valid CSS, not a silent value.

---

## S6. Colours

**Problem.** Ten arguments pass a word as a colour: `outline: 2px solid huge`,
`-webkit-text-fill-color: huge`, `linear-gradient(to top, huge)`.

**Fix.** `triangle`'s private `-is-css-color` from 2.1.1, moved to
`scss/internal/` and widened from a measured set: a Sass colour,
`currentColor`, the system colours such as `Canvas`, the CSS-wide keywords, and
the functions that return a colour when Sass leaves them as text (`var`, `env`,
`color-mix`, `light-dark`, `color`, `rgb`, `hsl`, `hwb`, `lab`, `lch`, `oklab`,
`oklch`). `isColor` does not change: `tint` and `shade` need a real Sass colour,
as `fix-plan.md` records.

The gradients take colour stops, not colours: each comma-separated item is a
colour followed by up to two positions, or a single position as a hint. The
check follows that shape.

| Member | Arguments |
|---|---|
| `focus-ring` | `$color` |
| `text-stroke` | `$color`, `$stroke-color`, `$fallback-color` |
| `background-dots`, `background-stripes` | `$color` |
| `background-image` | `$filter-color` |
| `linear-gradient`, `radial-gradient`, `text-gradient` | `$colors` |

**Changes existing output?** No working call. Watch the `null` defaults of
`background-dots` and `background-stripes`, which pick a colour.

**Touches.** Seven partials, `_triangle.scss` for the move, their `meta/` files
and pages. `text-stroke` leaves the list in `CLAUDE.md`.

---

## S7. Lengths

**Problem.** The largest group: 19 arguments take a word or the wrong unit.
`width: huge`, `outline-offset: huge`, `border-width: 10deg 5deg 0`,
`polygon(0 10deg, …)`, `flex: 0 0 calc(100% / huge)`.

**Fix.** One shared check, given the property's keywords: a number with a
length unit or `%`, `0`, a calculation, or `var()` and `env()`, plus the
keywords passed in. The existing `-is-size` accepts any number, so `10deg` and
a unitless `10` pass it today; it is replaced by this.

| Member | Arguments | Keywords to measure |
|---|---|---|
| `sizer`, `circle`, `brand-logo` | sizes | `auto`, `min-content`, `max-content`, `fit-content`, `stretch` |
| `ellipsis` | `$width` | the same, and `none` |
| `focus-ring` | `$width` | `thin`, `medium`, `thick` |
| `focus-ring` | `$offset` | none |
| `text-stroke` | `$stroke-width` | `thin`, `medium`, `thick` |
| `border-radius` | `$args` | none; one to four radii |
| `adaptive` | `$gutter` | none; it goes into `calc()` |
| `background-dots` | `$size`, `$gutter` | none |
| `background-stripes` | `$thickness` | none |
| `triangle` | `$size` | none; a negative size raises |
| `scissors` | `$corners` | none; a unitless number stays pixels |
| `sprite` | position | a background position, the helper from S3 |
| `columnizer` | column count | a whole number above 0, or `var()` |
| `position` | `$offsets` | decision 3 |

**Do not touch** the interpolation in `columnizer` and `adaptive`: it is what
lets `var()` through, as `CLAUDE.md` records for `columnizer`. The check is on
the argument, before it is used.

**Changes existing output?** No working call, if the keyword sets are measured
wide enough. This is where that risk is largest.

**Touches.** 14 partials, `scss/utilities/_validate-scissors.scss`, their
`meta/` files and pages. `sizer`, `circle`, `brand-logo` and `adaptive` leave
the list in `CLAUDE.md`. If the release grows too large, split it: sizes first,
then the backgrounds, shapes and `position`.

---

## Every item, the same checklist

From `CLAUDE.md` and the way 2.1.1 to 2.3.0 were done:

1. Measure the value set in Chrome with the page from S0c.
2. Write the `meta/` rejects and any spec, and see them fail.
3. Make the change.
4. Diff the compile matrix: every change is a call the browser dropped.
5. `npm test`, `node tools/audit.js`, `node tools/check-docs.js`.
6. Check the new output with the browser page.
7. Update the documentation pages and build the site.
8. Record the status under the item here.
9. In the release: a changelog entry listing the calls that now raise, a
   `wiki/` page with the measurements, and `CLAUDE.md` brought up to date
   (the list of mixins that validate nothing, the `rejects` count under Test
   depths, Pending work).

## Not in this plan

- The utilities the audit lists as passing bad values through:
  `shorthandProperty`, `pseudoSelector`, `mapDeepGet`, `isGutter`,
  `fillNulls`. Only `validateBreakpoint` is here, because it is the cause of S1.
- Refused valid CSS, such as the gradient directions in S5.
- Firefox and Safari. The report measured Chrome only, and so will this.
- A value that is valid CSS and wrong for the element. No probe reaches it.
