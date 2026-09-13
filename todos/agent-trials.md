# Agent trials

Projects built from scratch by a coding agent with Gerillass installed from npm,
followed by the agent's own feedback, then every claim in that feedback checked
here by compiling it. The projects themselves do not matter and are not to be
fixed. What matters is what they reveal about the library.

The point of running more than one: a single model repeats its own blind spots
in every project, so a finding two different models reach independently is
worth more than anything either finds alone.

---

## The trials

| | Trial 1 | Trial 2 | Trial 3 |
|---|---|---|---|
| Date | 13 September 2026 | 13 September 2026 | 13 September 2026 |
| Model | Claude Opus 5 | Claude Fable 5.1 | not recorded |
| Project | UI/UX designer portfolio, two pages | "Kıyı 2026", conference site: home, programme, speaker pages, print stylesheet | "Harbourline", ferry operations dashboard in English and Arabic |
| Folder | `~/Desktop/gerillass-deneme` | `~/Desktop/kiyi-2026` | `~/Desktop/Harbourline` |
| Gerillass | 2.1.0 | 2.1.0 | 2.1.0 |
| Dart Sass | 1.104.1 (the agent reported 1.91.0) | 1.104.1 | 1.104.1 |
| Build | Sass CLI | Vite 8.3.0 | Parcel 2.16.4 |
| Load route | `@use "gerillass/scss/gerillass"` with `--load-path=node_modules` | `@use "gerillass" as gls`, resolved by Vite through `exports`, no `loadPaths` | `@forward "gerillass" with (...)` from a local `_gls.scss`, resolved by Parcel |
| Way into the library | read the source and quoted its comments | said the manifest and `SKILL.md` were enough | the manifest and `SKILL.md`, and the source comments |

The installed `scss/` was byte-identical to `main` in all three, so nothing below
has been fixed yet.

### What changed between the two prompts

Trial 1's only factual error was the Sass version, read from the `^1.91.0`
range in `package.json` rather than from what was installed. Trial 2's prompt
asked for two things and both worked:

1. Versions taken from `npm ls gerillass sass`, not from `package.json`.
2. Every problem reported with the smallest SCSS that reproduces it, compiled
   before it was written down.

With a snippet per claim, checking a trial took minutes. Keep both in every
future prompt. Trial 2's prompt deliberately named none of the known defects,
so that finding one again means something.

### Verification is still required

Trial 2 still made two wrong claims (below). An agent's report is a list of
leads, not a list of facts.

---

## Findings, by what to do about them

Every item was reproduced here with the trial's own versions unless marked
otherwise. **Both** means both trials hit it independently.

### Non-breaking fixes

**`isColor` rejects valid CSS colours.** Both. `triangle(right, var(--track), 8px 12px)`
and `triangle(right, currentColor, 8px 12px)` raise "is not a color value".
`color-mix(in srgb, red 50%, blue)` does too; `transparent` and `oklch()` pass.
The parenthesis rule in `isGutter` covers `var()` and `color-mix()` but not
`currentColor`, which is a keyword and needs recognising on its own. Both
agents worked around it the same way: a fake colour, then `border-color`
overridden with the custom property.

**`position` warns on `null` with an empty message.** Both.
`position(absolute, 0 null null 0)` produces the right CSS and two warnings
reading "`` does not look like a length". Skipping an edge with `null` is
documented on the `position` documentation page, and that page's own example,
`position(absolute, null 16px 16px 16px)`, prints the same warning. The
four-argument `border-radius` already skips nulls through
`fillNulls(..., true)`, so the pattern exists in the library.

**`breakpoint` with three arguments emits nothing and raises nothing.** Found
while checking trial 1. `breakpoint(between, medium, large)` produces no CSS
and no error; the working forms are `between, medium large` and
`medium, large`. Neither trial hit it in its own code. It is the silent
failure `CLAUDE.md` warns about.

**`reset-css` puts two block comments in the user's CSS.** Both noticed. The
Meyer licence and the display-role note are `/* */` inside the mixin, so they
appear in expanded output: trial 1's `main.css`, lines 67 and 92. Compressed
Sass output and Vite's build drop them, so trial 2's claim that they survive
compression was wrong. See `source-comments.md`: the library should use `//`.

**`counter` breaks inside a container query.** Trial 2, checked in a browser.
`container-type: inline-size` scopes counters to the container's subtree, and
the mixin increments on `.counter-item::before`, which is inside it, so every
card starts its own counter.

| Variant, in the preview pane's Chromium | Numbers |
|---|---|
| no container | 01 02 03 |
| container on the item, increment on `::before` (the mixin today) | 01 01 01 |
| container on the list | 01 01 01 |
| reset on the container element itself (trial 2's first suggestion) | 01 01 01 |
| **increment on the item itself, `content` still on `::before`** | **01 02 03** |

Moving `counter-increment` from `.counter-item::before` to `.counter-item`
fixes it and numbered a plain list the same way. It is not free, though:
validating `fix-plan.md` measured that an item skipped with `content: none` on
its `::before` is still counted after the move (`01, 03` instead of `01, 02`),
so the fix is a behaviour change, B9 there. Before shipping it: add a `meta/`
example, and check Firefox and Safari, which were not tested. The
test page, to rebuild the table:

```html
<style>
  .day { counter-reset: c; }
  .item::before { content: counter(c, decimal-leading-zero) " "; counter-increment: c; }
  .ctr { container-type: inline-size; }
  .selfinc { counter-increment: c; }
  .selfinc::before { content: counter(c, decimal-leading-zero) " "; }
</style>
<section class="day"><ol><li class="item ctr">a</li><li class="item ctr">b</li></ol></section>
<section class="day"><ol><li class="selfinc ctr">a</li><li class="selfinc ctr">b</li></ol></section>
```

Serve it over HTTP. A page placed in `site/public/` fails the site build on
purpose, because `plugins/csp.js` rejects any HTML whose inline scripts differ
from `index.html`, and it also lands in the sitemap; delete it and rebuild.

**`counter` hard-codes its names.** Both. `.counter-start`, `.counter-continue`,
`.counter-item` and the counter `glsCounter` are fixed, which put library
names into the markup and, in trial 1, collided with a `::before` the project
used for something else. Optional arguments for the item selector and the
counter name would be additions, not breaks. Trial 2's claim that two nested
independent counters are impossible was not tested.

### Behaviour changes, for a major version or an opt-in

**`max` includes its breakpoint.** Both. `breakpoint(max, large)` is
`max-width: 992px` while `min, large` is `min-width: 992px`, so both match at
992px, and the start/end form subtracts 1 to reach `max-width: 991px`, so the
library is inconsistent with itself. Trial 1 hand-wrote `991.98px`; trial 2
wrote `breakpoint("xsmall", "large")` to get 991px. Changing `max` alters every
existing call at exactly 992px. `-0.02px`, as Bootstrap does, works
everywhere; range syntax `(width < 992px)` removes the fractional gap
altogether but needs a newer browser. Related: single-argument
`breakpoint("medium")` is `(width: 768px)`, documented as exactly that width,
which almost never matches in practice.

**`columnizer` is flexbox with margins.** Both. Called 1, 2, 3 across
breakpoints it writes `display: flex` three times and a `box-sizing` block
three times, and that block targets `.g *`, every descendant, not just the
columns. Combined with `gap` it overflows; trial 1 added `gap: 0` and trial 2
did the same in the programme. The margin cascade across breakpoints does work:
trial 2 checked that a later `:not(:last-child)` overrides the earlier
`:nth-child(2n)`, and that holds. Scoping `box-sizing` to `> *` or rewriting on
`gap` changes output that users may rely on.

**`hide("unhide")` writes `position: static`.** Trial 2. A skip link unhidden on
focus needs `position: fixed` written again afterwards. Leaving `position`
alone would be more useful and is a change.

**`before` and `after` emit no `content` without an argument.** Trial 1.
`@include after { ... }` renders nothing. It is deliberate, and said only in
the error message you see after passing a bad value. A default of
`content: ""` would mostly be safe, since `@content` comes after it, but not
entirely.

**`adaptive` does nothing below 576px** and gives one `max-width` per
breakpoint. Trial 1 wrote its padding by hand. Against the bar in `CLAUDE.md`,
whether it still earns its place is a fair question; a `@warn` would come
before any removal.

### Documentation and the manifest

**`loadify(init)` and its calls must share a module.** Trial 2. With `init` in
one partial and `@include loadify` in another, both loaded from `main.scss`,
compilation fails with "The target selector was not found". `@use`-ing the
init module from the calling one fixes it. The manifest example, the `meta/`
summary and `SKILL.md` all show the two in one file and say nothing about
modules. Trial 1 escaped it only because its init sat in a module every partial
forwarded.

**Sass places a nested `@media` before the declarations after it.** Trial 1.
`.x { @include remove(min, large); display: inline-grid; }` emits the media
block first, so the later declaration wins at every width. Sass behaviour, not
the library's, but it bites every mixin that wraps `@content` in a query:
`breakpoint`, `remove`, `only`, `except`. Only Dart Sass 1.103 and 1.104 were
checked.

**There is nowhere to put any of these.** The manifest carries
`name, kind, arguments, file, signature, summary, examples, rejects`. The
`accepts` text on each argument is prose and never compiled, and there is no
field for a behavioural caveat, so `SKILL.md` cannot warn an agent about any of
the traps above. The proposed `caveats` field is in `source-comments.md`.

**The test discipline only runs one way.** `rejects` proves bad input is
refused. Nothing proves valid modern input is accepted, which is why the
`var()`, `currentColor` and `null` defects reached a release. `tools/audit.js`
probes `nonsense`, `16 9`, `true`, `#ff0000`, `42` and `"a b"`, none of which
is a value that should pass. Two changes would close this: compile the
`accepts` examples like `examples`, and give the audit a second list of values
that must be accepted. The audit also shows `triangle` validating the wrong
argument: strict about `$color`, where it refuses valid CSS, and silent about
`$size`, where `nonsense` passes straight into `border-width`.

### Candidates for new members

| Need | Trial 1 | Trial 2 |
|---|---|---|
| Light and dark tokens | written by hand on `:root` and `[data-theme]` | a `tokens($map)` mixin writing a map to custom properties, over the three states: system preference, forced light, forced dark |
| `prefers-reduced-motion` guard | | `motion-safe` mixin |
| Focus ring | `focus-ring($offset)` mixin | written by hand on `:focus-visible` |
| Section spacing | `section-space()` around `fluid()` | |

`focus-ring` and the reduced-motion guard are already under New members worth
adding in `CLAUDE.md`, and each now has one trial asking for it independently.
Token and theme support is the `theme` idea listed there as decorative; two
trials building it by hand suggests it is not.

---

## What both agents valued

- **`fluid()`**, used 69 times in trial 1 and 32 in trial 2. Trial 1 called it
  worth installing the library for on its own, and credited the comment that
  explains why the preferred value keeps a `rem` term.
- **`container` and `container-query`**, for taking the same argument shapes as
  `breakpoint`.
- **`aspect-ratio`, `line-clamp`, `hide`, `stretched-link`**, the members that
  close something written wrong by hand. Trial 2 applied `aspect-ratio` to the
  iframe itself, following the source comment.
- **The error messages**, which name the bad value and the valid ones. Trial 2
  checked that `hide(nonsense)` and `triangle(sideways)` fail with the library's
  own message.

Both reached the same description of the library unprompted: fixes for the
things people get subtly wrong in CSS, documented with what was measured. That
is the positioning argued for in `verifiable-css-layer.md`.

## Claims the agents got wrong

| Trial | Claim | What is true |
|---|---|---|
| 1 | Dart Sass was 1.91.0 | 1.104.1 was installed; 1.91.0 was the range floor in `package.json` |
| 2 | The `reset-css` comment survives compressed CSS | Absent from both compressed Sass output and the Vite build |
| 2 | The manifest has no `$name:` example for `container-query` | It has `container-query("min", 400px, $name: "card")` |
| 2 | Putting the counter reset on the container fixes counters | Still 01 01 01 in the browser |

Trial 3: none of its verified claims was wrong. Its note that `hide` calls the
global `index()` is true of the source, but compiling `hide(nonsense)` printed
no deprecation warning here and raised the library's own message.

## Trial 3 in brief

Harbourline's prompt added two requirements neither earlier project had, a
right-to-left interface and forced-colors mode, and one new feedback rule: list
the members you considered and did not use, with the reason. That list rejected
about twenty-five members with a reason each, which is the first evidence of why
members go unused rather than only that they do.

What it added, each verified here by compiling, and the first two in a browser:

- **`aspect-ratio` does not hold its ratio on an `<img>` with `width` and
  `height` attributes**, the standard way to prevent layout shift. Chrome 152,
  300px container, 1600x900 source: 300x900 with the attributes, 300x225
  without, 300x225 with the attributes plus `height: auto`.
- **A `var()` size in `container-query` compiles and never matches.** In the
  browser a rule under `(min-width: var(--wide))` did not apply; the same
  condition in px did.
- **`breakpoint` and `container-query` end the same range 1px apart**:
  `max-width: 767px` against `max-width: 768px`. `container-query` never
  subtracts; the source has no `- 1`.
- **A rem breakpoint map loses a whole rem** at the end of a range:
  `max-width: 47rem` for a `48rem` key, a 16px gap.
- **The direction-bound members cannot serve a bidirectional interface**:
  `triangle`, `position`, `border-radius` corners and `columnizer` margins are
  physical only. `triangle("inline-end")` raises.
- **Out-of-date defaults**: `font-face` still emits EOT and SVG sources,
  `all-text-inputs` knows no `focus-visible` or `user-invalid`, lists
  `[type='color']` and omits `select`.
- **`remove("medium")`**, a manifest example, hides at exactly 768px.
- **No Parcel recipe** in the README.

It hand-wrote `focus-ring` again, which makes three trials of three, and a
reduced-motion wrapper and a colour-map-to-custom-properties mixin again, which
makes two of three.

Not re-run here: the Parcel build failing on `font-face`'s default formats, the
root `package.json` `"main"` field breaking the bare import under Parcel, and
the Meyer reset removing list semantics in Safari with VoiceOver. RTL and
forced-colors rendering were read from the compiled CSS, not seen.

What to do about all of this is in `fix-plan.md`.

## Limits

- Three trials on three project types, and the third trial's model was not
  recorded. A change of model and project at once means a difference between
  trials cannot be attributed to either.
- Browser checks were Chromium only.
- Sass versions before 1.103 were not available locally.

## For the next trial

- Keep the two prompt rules above.
- Vary the project type again. A documentation site is the one none of the
  three has covered.
- Record the model in the trial table; trial 3's was not written down.
- Re-running trial 2's prompt on Claude Opus 5 would give one prompt under two
  models, which is the only way to compare the models rather than the projects.
- After a release carrying the source comments, repeat a prompt with the same
  model to see whether they change what the agent trips on. See
  `source-comments.md`.
