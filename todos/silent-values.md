# Values a Browser Drops

Which mixins turn a value that cannot work into CSS without a word, so the
rule is written, compiles, and does nothing. It started with a breakpoint name
that is not in the map, which `breakpoint` writes into the query as it is, so
`breakpoint(huge)` compiles to `@media (width: huge)`, and the question of how
many other members do the same.

Measured 14 September 2026, against `main` after 2.2.1 and the `$logical`
argument for `position`, in Chrome 152. Nothing in the library was changed to
produce it.

---

## The numbers

| | |
|---|---:|
| mixin arguments probed | 86, across 49 mixins |
| calls made, nine bad values each | 774 |
| refused with an error, which is the outcome wanted | 358 |
| compiled | 416 |
| compiled into CSS the browser dropped or can never match | **312** |
| compiled into CSS the browser accepted | 104 |
| of the 312, calls that printed a warning | 31 |
| arguments affected | **49, in 28 mixins** |

So for a bad value, a mixin is slightly more likely to hand the browser
something it drops than to say anything, and when it does say something it is
almost always the single-pixel warning of `breakpoint` and its neighbours, which names the wrong
problem.

---

## How it was measured

**The calls.** Every argument of every mixin that takes one, called with nine
values nobody passes on purpose: `huge`, `"huge"`, `10deg`, `10`, `-10px`,
`16 9`, `true`, `#ff0000` and `"a b"`. Each call uses the context of the
member's first documented example, at the root or in a selector, with a content
block where it takes one, and the other required arguments taken from that
example. This is how `tools/audit.js` builds its calls; the audit keeps only
the first 60 characters of the output and tries six values, which is why it
was not enough here.

**The browser.** The CSS each call produced was split into the pieces a browser
has to accept, 790 of them once repeats were merged, and each was tested in
Chrome 152:

- a declaration with `CSS.supports(property, value)`;
- a `@font-face` descriptor or a keyframe declaration by inserting the rule and
  reading the value back, since `CSS.supports` does not cover descriptors;
- a selector by inserting a rule with it, which throws when it is invalid;
- a `@media` condition with `matchMedia`: a condition that neither matches nor
  has its `not` form match is one the browser parsed and can never apply, which
  is how `(min-width: huge)` behaves;
- a `@container` condition the same way, against a real 500px container.

**The noise taken out.** The documented examples were split and tested the same
way. What fails there fails for a reason that is not the probe:
`-moz-osx-font-smoothing` in `antialias`, the `::-moz-placeholder` selectors in
`placeholder`, and the unprefixed `line-clamp`, which Chrome does not support at
all. Those were left out of the findings, except `line-clamp: 10`, which slipped
past the filter because its value differs; it is the same unsupported property
and not a finding either.

**What this does not cover.** Only Chrome. `CSS.supports` asks whether a
property takes a value, not whether it does what was meant. The nine values are
generic: a typo of a real keyword, such as `larg` for `large`, behaves like
`huge`, but a value that is valid CSS and wrong for the element is out of
reach. The utility functions were not tested in the browser; the audit already
lists `validateBreakpoint`, `shorthandProperty`, `pseudoSelector`,
`mapDeepGet`, `isGutter` and `fillNulls` as passing bad values through.

---

## Findings, by what goes wrong

### 1. A condition that can never match

The whole rule is written and never applies. This is the most expensive kind,
because nothing on the page looks broken until the breakpoint is reached.

| Member | Argument | Bad value becomes |
|---|---|---|
| `breakpoint` | `$params` | `huge` → `@media (width: huge)`; `min, huge` → `(min-width: huge)` |
| `remove` | `$params` | the same, through `breakpoint` |
| `container-query` | `$params` | `huge` → `@container (width: huge)` |
| `screen-agent` | `$resolution` | `huge` → `@media (min-resolution: huge)` |

The cause is one function: `validateBreakpoint` returns a map key's width, and
anything else unchanged. With one argument these print the single-pixel warning
from 2.2.0, which says `breakpoint(huge)` matches a viewport exactly huge
wide; with two, `min, huge`, `only, huge`, `between, small huge` or
`huge, large`, they print nothing.

### 2. A selector the browser refuses

An invalid selector drops the whole rule, with every declaration in it.

| Member | Argument | Bad value becomes |
|---|---|---|
| `only` | `$params` | `10deg` → `:nth-of-type(10deg)`; `-10px` → `:nth-last-of-type(10px)` |
| `except` | `$params` | the same inside `:not()` |

Words are already refused here; a number with a unit is not.

### 3. A keyword outside the property's set

Each of these has a short, closed list of keywords, and the check is cheap.

| Member | Argument | Bad value becomes |
|---|---|---|
| `position` | `$position` | `position: huge` |
| `ellipsis` | `$display` | `display: huge` |
| `resizable` | `$direction` | `resize: huge` |
| `resizable` | `$overflow` | `overflow: huge` |
| `radial-gradient` | `$shape` | `radial-gradient(huge at center, …)` |
| `radial-gradient` | `$position` | `radial-gradient(circle huge, …)` |
| `font-face` | `$font-style` | `@font-face { font-style: huge }` |
| `font-face` | `$font-weight` | `@font-face { font-weight: huge }` |

### 4. A length that is not a length

| Member | Argument | Bad value becomes |
|---|---|---|
| `sizer` | `$width`, `$height` | `width: huge`, `width: 10deg` |
| `circle` | `$size` | `width: huge` |
| `brand-logo` | `$width`, `$height` | `width: huge` |
| `ellipsis` | `$width` | `max-width: huge` |
| `focus-ring` | `$width`, `$offset` | `outline: huge solid currentColor`, `outline-offset: huge` |
| `text-stroke` | `$stroke-width` | `-webkit-text-stroke-width: huge` |
| `position` | `$offsets` | `top: huge`; this one warns, on purpose, see below |
| `border-radius` | `$args` | `border-radius: huge` |
| `adaptive` | `$gutter` | `max-width: calc(576px - huge * 2)` |
| `background-dots` | `$size`, `$gutter` | `radial-gradient(… 10deg, …)`, `background-position: 5deg 5deg` |
| `background-stripes` | `$thickness` | `repeating-linear-gradient(… 10deg …)` |
| `triangle` | `$size` | `border-width: 10deg 5deg 0`; a negative size too |
| `scissors` | `$corners` | `polygon(0 10deg, …)` |
| `sprite` | `$params` | `background-position: 10deg` |
| `columnizer` | `$params` | `flex: 0 0 calc(100% / huge)` |

### 5. A colour that is not a colour

| Member | Argument | Bad value becomes |
|---|---|---|
| `focus-ring` | `$color` | `outline: 2px solid huge` |
| `text-stroke` | `$color`, `$stroke-color`, `$fallback-color` | `-webkit-text-fill-color: huge`, `color: huge` |
| `background-dots` | `$color` | `radial-gradient(huge 1em, transparent 0)` |
| `background-stripes` | `$color` | `repeating-linear-gradient(-45deg, huge 0, …)` |
| `background-image` | `$filter-color` | `background: huge` |
| `linear-gradient`, `radial-gradient`, `text-gradient` | `$colors` | `linear-gradient(to top, huge)` |

`isColor` cannot be reused for these as it is: it refuses `var()` and
`currentColor` on purpose, because `tint` and `shade` hand its result to
`color.mix`, as `todos/fix-plan.md` records.

### 6. A list where one image was meant

| Member | Argument | Bad value becomes |
|---|---|---|
| `background-image`, `brand-logo`, `text-image` | the image | `16 9` → `url(16 9)` |
| `background-dots`, `background-stripes` | `$image` | `"a b"` → `url(a b)` |

### 7. A unit appended to a unit

`background-stripes` adds `deg` to a `$rotation` whose unit is not `deg`, so
`-10px` becomes `repeating-linear-gradient(-10pxdeg, …)`. The comment on the
argument says a unitless number is read as degrees; any other unit should be
refused rather than suffixed.

---

## What is already right

**20 arguments refused every one of the nine values**: `all-buttons` and
`all-text-inputs` `$pseudo`, `antialias`, `aspect-ratio $fit`, `border-box`,
`center $axis`, `container $type`, `font-face` `$file-formats` and
`$font-display`, `hide`, `loadify`, `smartphone` and `tablet` (both arguments),
`stretched-link`, `text-selection`, `text-shadow`, `tokens $map` and
`triangle $direction`.

**16 compiled into CSS the browser accepted**, which is right for them, since
the value is text, a name or a selector: `after` and `before` `$content`,
`counter`, `breakpointer` and `escape-to-parent` `$selector`, `container $name`,
`font-face` `$font-family` and `$file-path` for the values that are valid names,
`tokens $prefix`, `triangle $color`, the gradient directions, `aspect-ratio
$ratio`, `background-dots $diagonal`, `background-image $filter-direction` and
`position $logical`.

20 mixins have no argument in the findings at all.

---

## The tension this has to respect

`CLAUDE.md` records that nine mixins validate nothing on purpose: `adaptive`,
`brand-logo`, `circle`, `counter`, `ellipsis`, `resizable`, `sizer`,
`text-image` and `text-stroke`. They pass arguments to CSS because CSS takes
`var()`, `calc()`, `clamp()` and whatever ships next, and a strict check would
refuse correct code. It adds: revisit only where the shape of a call can be
checked without touching the value. Eight of those nine are in the findings.

That sentence is the way through. The checks this needs are about the kind of
value, not its content:

- **accept** what is plainly of the expected kind: a number with a length unit,
  or `0`, for a length; a Sass colour or colour keyword for a colour; a member of
  the set for a keyword;
- **accept** what only the browser can resolve: `var()`, `env()`, `attr()`, a
  calculation such as `calc()`, `clamp()`, `min()` or `max()`, and the CSS-wide
  keywords where the property takes them;
- **refuse** the rest: an unquoted word that is none of those, a quoted string,
  the wrong unit, a list where one value is meant.

`validateLength` already sorts lengths this way, but it warns rather than
raising. `CLAUDE.md` lists `position` warning as deliberate, and the note in
`scss/utilities/_validate-length.scss` explains the choice; this report does not
settle it, but it records that those warnings are the 7 `position $offsets`
calls above, and that their output is dropped.

---

## Before writing any check

A generic probe says what a browser drops; it does not list everything a
property accepts. Each check must be written from the property's real value
set, measured, so that valid CSS nobody probed stays accepted: `min-content`,
`fit-content` and `stretch` for a width, `thin`, `medium` and `thick` for an
outline width, `revert-layer`, colour functions such as `light-dark()` and
`color-mix()`, and so on. The same was done for `container` names and
`font-face` families in 2.2.1, and it caught cases a guessed list would have
refused.

**Changes existing output?** Only for calls whose CSS a browser already drops,
as in 2.1.1 and 2.2.1, so a patch release with a note listing the calls that now
raise. The exception to watch is anything whose value set turns out wider than
expected; that is what the measuring is for.

---

## Suggested order

1. **Conditions.** `breakpoint`, `remove`, `container-query` and
   `screen-agent`, through `validateBreakpoint`: a map key, a length or a CSS
   function, and nothing else. The smallest value set and the most expensive
   failure. The single-pixel warning should stop firing for a name that is not
   a breakpoint at all.
2. **Selectors.** `only` and `except`: an integer, and nothing with a unit.
3. **Keywords.** The eight arguments in group 3, each against its property's
   keyword list.
4. **Colours.** A colour check that accepts `var()` and colour functions, kept
   separate from `isColor`.
5. **Lengths.** The largest group and the one that most needs per-property
   keyword lists. Decide the `position` warning here.
6. **Images and the unit bug.** A list refused where one image is meant, and
   `background-stripes $rotation` refusing a non-angle unit.

Alongside, `tools/audit.js` could gain `huge`, a wrong unit and a unitless
number as probes, since its six values missed most of this. The browser half of
the measurement is not in the repository; whether to keep it as a tool is a
decision of its own.
