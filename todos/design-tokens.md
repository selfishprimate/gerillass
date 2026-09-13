# A Token Layer on `tokens`

Whether Gerillass should give its users a finished structure of design tokens,
primitive values and the semantic names built on them, instead of leaving every
value to be typed by hand. What four comparable systems ship, what was measured
while looking, and a shape for doing it here.

Researched 14 September 2026, against the `tokens` and `motion-safe` mixins on
the unreleased 2.2.0 branch. Versions and Baseline dates below are as of that
day; re-check them before acting on any of it.

---

## Where this starts

2.2.0 adds `tokens($map, $prefix: null)`. It writes a Sass map out as custom
properties, leaves a `null` out, keeps a quoted string quoted, refuses a name a
browser would drop, and refuses a nested map. The last one was chosen so that
flattening can be added later without changing a call that already works.

What it does not do is supply any values. There is no palette, no spacing
scale, no radius or type scale in `scss/maps/`, which holds breakpoints,
directions, font formats, positions and device sizes. A user who wants tokens
still writes every one of them.

The maintainer's direction, 14 September 2026: rather than hand-entered values,
give users a solid structure with primitive and semantic tokens, possibly as
something closer to a CSS framework.

---

## What comparable systems ship

| System | Primitives | Semantic layer | How a user changes it |
|---|---|---|---|
| **Tailwind CSS v4** | `@theme` variables in namespaces: `--color-*`, `--spacing-*`, `--radius-*`, `--text-*`, `--font-*`, `--shadow-*` and more. Colours in `oklch()`, steps 50 to 950 | none of its own; `@theme inline` exists so that a theme variable can point at another variable and still resolve | override one variable in `@theme`, or clear a namespace with `--color-*: initial` |
| **Open Props** v1.7.23 | `--gray-0` to `--gray-12`, `--size-1` to `--size-15`, `--radius-1` to `--radius-6`, `--font-size-00` to `--font-size-8`, `--shadow-1` to `--shadow-6`; 4.0 kB for the whole set | adaptive props such as `--surface-1`, `--text-1`, `--text-2`, from an optional normalize import that has light and dark variants | import only the packs you want |
| **Radix Colors** | 12 steps per scale, each with a job: 1 app background, 2 subtle background, 3 to 5 component backgrounds (normal, hover, active), 6 to 8 borders (subtle, normal, hover), 9 and 10 solid backgrounds, 11 low-contrast text, 12 high-contrast text | the steps themselves are the semantics; dark mode swaps to a dark scale behind the same step numbers | pick scales; MIT licensed |
| **Bootstrap 5.3** | Sass variables and maps such as `$theme-colors`, compiled into `--bs-*` custom properties in `_root.scss` | `$body-color`, `$link-color` and friends, with dark counterparts in `_variables-dark.scss` | a `color-mode()` mixin writing `[data-bs-theme="dark"]` or, with `$color-mode-type: media-query`, `prefers-color-scheme`; custom colours are merged into the maps by hand, because Sass cannot generate variables from a map |

And one format, for exchanging tokens between tools rather than shipping them:
the **W3C Design Tokens Community Group** published the first stable version of
its format, 2025.10, on 28 October 2025. A token is a JSON object with `$value`
and `$type`, groups nest, and an alias is written `"{colors.blue}"`. Files are
`.tokens` or `.tokens.json`. The editor's draft seen on 14 September 2026 is
already a newer preview.

Two licences matter if a palette is borrowed rather than designed: Tailwind CSS
and Radix Colors are both MIT.

---

## Measured

Chrome 152 unless stated, while researching this file.

**1. A semantic token does not follow a primitive overridden further down.**
With `--color-bg: var(--zinc-50)` on `:root`, an element lower down that set
`--zinc-50` to red still painted `var(--color-bg)` as `rgb(250, 250, 250)`. The
`var()` is resolved where `--color-bg` is declared, not where it is used.
Overriding `--color-bg` itself on that element worked. So a theme has to override
the semantic layer, or declare both layers on the same element; overriding
primitives alone changes nothing that reads through a semantic name. This is the
cascade problem Tailwind's `@theme inline` exists for.

**2. `light-dark()` picks light without `color-scheme`, even on a dark system.**
With the operating system set to dark, `color: light-dark(blue, orange)`
computed to blue. With `color-scheme: dark`, or `light dark`, it computed to
orange. Any theme output that uses `light-dark()` must write `color-scheme`.

**3. A misspelt token fails silently.** `background-color: var(--zinc-55)`,
where only `--zinc-50` exists, computed to transparent, and `color` fell back to
the inherited colour. Nothing in the browser reports it.

**4. A full palette is small once compressed.** 22 hues of 11 steps plus five
semantic tokens, written through `tokens`, came to 247 declarations: 11,149 bytes
with `--style=compressed`, 1,248 bytes gzipped. The values were placeholder
`oklch()` colours of the same shape as Tailwind's, not Tailwind's palette. A
map that is never passed to a mixin emits nothing, so shipping one costs a user
who does not call it nothing.

**5. `@use ... with` replaces a map, it does not merge into it.**
`@use "gerillass" with ($map-for-breakpoints: ("medium": 800px))` reached the
map through `@forward`, and `breakpoint(min, medium)` gave `800px`. But `large`
was gone, and `breakpoint(min, large)` compiled without a word to
`@media (min-width: large)`. A shipped palette configured the same way would
lose every hue the user did not restate.

**6. `oklch()` survives Sass, with one trap that has been fixed.** Dart Sass
1.103 parses `oklch(0.637 0.237 25.331)`, reads its channels, converts it to
`rgb` and checks it against the sRGB gamut. `color.mix()` refuses a non-legacy
colour without a `$method`. The trap was in `tokens` itself: it wrote values
through `meta.inspect`, which printed that colour's hue as `25.331000000000017deg`
and `math.div(1, 3)` as `0.3333333333333333`. It now writes a value the way an
ordinary declaration does, which is `25.331deg` and `0.3333333333`, and a spec
holds it there.

---

## A shape for it

Three layers, each usable without the next.

**1. Flatten nested maps in `tokens`.** `(blue: (500: #3b82f6))` with the prefix
`color` becomes `--color-blue-500`. This is the smallest step, it turns an error
into a feature, so nothing that compiles today changes, and it is what lets a
whole palette go through one call.

**2. Primitive scales in `scss/maps/`, as `!default` maps.** A colour palette,
spacing, radius, type sizes, perhaps shadows and easing. Measurement 5 decides
how they are configured: not by replacing the map with `with`, but by merging.
Either a second, empty `!default` map that the mixin merges over the first, or an
argument to the mixin that emits them.

**3. A `theme` mixin for the semantic layer.** It takes a map of semantic names
per mode, writes them for light on the root selector and for dark on a data
attribute, a media query, or both, the way Bootstrap's `$color-mode-type`
chooses. Measurement 1 decides that each mode redeclares the semantic names,
not the primitives. Measurement 2 decides that it always writes `color-scheme`.
This is the `theme` idea `CLAUDE.md` already lists under new members, grown a
layer beneath it.

### What would make it this library's and not another framework

The thesis in `verifiable-css-layer.md` is that Gerillass wins by checking what
CSS cannot. Tokens have two checks that no system above performs at build time:

- **A semantic token that points at a primitive that does not exist fails the
  build.** Written as `var(--zinc-55)` it fails silently (measurement 3). Written
  as a reference the mixin resolves against the primitive map, such as
  `(zinc, 55)` or `"zinc.55"`, it can raise with the names that do exist.
- **A text and background pair that fails contrast fails the build.** Sass can
  convert an `oklch()` colour to `rgb` and read its channels (measurement 6), so
  a WCAG contrast ratio can be computed for the pairs the semantic map declares,
  such as `text` on `bg`. Not prototyped; the luminance formula has to be written
  by hand, and a `var()` value cannot be checked at all.

Both are things an agent gets wrong and cannot see, which is the bar a member is
held to here.

---

## Decisions this needs

1. **Ship a palette, or only the structure?** Shipping values is a matter of
   taste in a library whose case rests on verifiable output. The structure,
   flattening and `theme` with references and contrast checks, is useful with the
   user's own palette.
2. **If a palette: whose, and which steps?** 50 to 950 is what agents have seen
   most, through Tailwind. Radix's 1 to 12 carry a meaning per step, which maps
   onto semantic names almost directly, but it swaps whole scales for dark mode,
   and measurement 1 says a swap of primitives alone does not reach the semantic
   names.
3. **How a reference is written** in the semantic map, if not as `var()`.
4. **Which dark mode trigger by default:** data attribute, media query, or both.
5. **`light-dark()` or selectors.** `light-dark()` is Baseline newly available
   since May 2024 and reaches widely available around November 2026. `CLAUDE.md`
   holds back features that recent, so selector overrides are the safe default
   until then.
6. **Colour format.** `oklch()` is Baseline since May 2023 and needs Dart Sass
   1.79 or later for colour maths; hex works everywhere.

## Suggested order

Flattening in `tokens` first, in a minor release, since it only turns an error
into output. Then `theme` with checked references, using the user's own maps.
Then decide on a shipped palette with that working in front of you, and contrast
checks last, once the semantic pairs have a shape to check.
