# One `gradient` mixin

Researched 16 September 2026, when the maintainer asked whether
`linear-gradient` and `radial-gradient` could become one `gradient` mixin with
the type as an argument, what modern CSS gradients add, and what a merge could
improve. Not planned.

## Decided

On 16 September 2026 the maintainer decided:

- `gradient` ships in 3.0.0 and `linear-gradient` and `radial-gradient` are
  removed, with no wrappers and no deprecation period. `MIGRATION.md` needs a
  section.
- A gradient with a single colour stop warns, since browsers before Chrome
  135, Firefox 136 and Safari 18.4 drop it.
- A function form for layering and `mask-image`, `$in` and conic for
  `text-gradient`, and the fallback declaration for `$in` are all wanted.

## Where it stands

Written, with the old two left in place for comparison at the maintainer's
request:

- `scss/internal/_gradient.scss` builds and checks every gradient:
  `gradientOf()`, and `gradientDirection()` for a direction on its own. Its
  shape, size and position checks are copied from `_radial-gradient.scss` and
  become the only copy once that file goes.
- The `gradient` mixin and the `gradientValue` function are thin layers over
  it, each with a `meta/` entry, a documentation page and a lab case.
- `text-gradient`, `background-image`, `background-dots` and
  `background-stripes` now write their gradients through it. On 55 calls
  compiled before and after, every CSS that compiled before is byte for byte
  the same. What changed: `text-gradient` and `background-image` accept any
  angle unit, `"to top"` and `var()` as a direction, checked in Chrome as
  kept; `text-gradient` warns on a single colour; and their error messages
  name the accepted forms. `background-stripes` built its multi-colour stops as
  nested pairs, which the shared check read as one colour, so it now builds a
  flat list.

Checked in Chrome 152, Firefox 156 and Safari 26.6.2 on 17 September 2026,
with one page computing 78 declarations in each: every gradient the mixin
writes, the newly accepted directions of `text-gradient` and `background-image`,
`gradientValue` layered, as a mask and as a border image, all 20 accepted
spaces and `in var()`, and the 16 forms the builder refuses. The three agreed
on every one: each accepted form was kept and each refused form dropped. The
only difference from what the page expected was `in srgb`, which all three
serialise away because sRGB is the default.

`text-gradient` takes the gradient mixin's arguments, colours first, since
this branch. 15 calls in the old order, rewritten in the new, compile to the
same CSS; a call in the old order stops the build with the new form written
out. Its eight documentation examples were computed in Chrome 152, Firefox 156
and Safari 26.6.2, each clipped to the text, and looked at in Chrome and
Firefox.

Still to do: removing `linear-gradient` and `radial-gradient` in 3.0.0 with a
`MIGRATION.md` section, which also covers the new `text-gradient` order; and
the playground demos, at release time only, since the playground compiles the
published version and a demo in the new API fails there until 3.0.0 is out.

Browser measurements are Chrome 152 in the browser pane, with `CSS.supports`
and computed styles. Support in other browsers is from
`@mdn/browser-compat-data` 8.1.1 and was not measured.

## What the two mixins do today

```scss
@mixin linear-gradient($direction, $colors)
@mixin radial-gradient($shape, $position, $colors)
```

Compiled:

```css
/* linear-gradient(top, (red, blue)) */
background: linear-gradient(to top, red, blue);
/* radial-gradient(circle, "center", (red, blue)) */
background: radial-gradient(circle at center, red, blue);
```

Both check their colour stops through `scss/internal/_color-stops-problem.scss`.
`radial-gradient` also checks its shape, size and position word by word.
`background-image` calls `linear-gradient` for its filter layer, and the
playground's demos use both.

## What is wrong or missing

Each item was compiled or measured.

1. **They write the `background` shorthand.** It resets every other background
   property. Measured: an element with `background-color: rgb(255, 0, 0)` and
   `background-size: 20px 20px` before the shorthand computed to
   `rgba(0, 0, 0, 0)` and `auto`, so a gradient with transparent stops lost the
   colour behind it. With `background-image` the colour stayed red. It also
   means a gradient cannot be layered with an image.
2. **`$direction` takes only `deg`.** `0.25turn`, `var(--angle)` and the CSS
   spelling `"to top"` are all refused with the library's error, though Chrome
   keeps `linear-gradient(0.25turn, red, blue)`.
3. **No conic gradient**, although `conic-gradient` has worked in Chrome 69,
   Firefox 83 and Safari 12.1.
4. **No repeating gradients.** All three `repeating-*` forms are kept by Chrome.
5. **No colour interpolation space.** See the next section.
6. **Every argument is required.** CSS defaults a linear gradient to `to
   bottom` and a radial one to `ellipse farthest-corner at center`, but the
   mixins take no defaults, and `radial-gradient` puts the size and `at` in
   `$position` beside the named positions.
7. **A single colour stop is accepted**, measured as kept in Chrome 152, but
   the compat data dates it to Chrome 135, Firefox 136 and Safari 18.4, all
   from 2025. In an older browser that gradient is dropped. Not measured in one.

## What modern CSS adds

| Feature | Example | Chrome | Firefox | Safari |
|---|---|---|---|---|
| conic and repeating conic | `conic-gradient(from 45deg at 30% 40%, red, blue)` | 69 | 83 | 12.1 |
| two positions on a stop | `red 0 50%, blue 50% 100%` | 71 | 64 | 12.1 |
| interpolation space | `linear-gradient(to right in oklab, ...)` | 111 | 127 | 16.2 |
| hue method | `in oklch longer hue` | 111 | 127 | 16.2 |
| single colour stop | `linear-gradient(red)` | 135 | 136 | 18.4 |

Firefox 127 shipped in June 2024, so the interpolation space is newly available
across the three and not yet widely.

Kept by Chrome 152, all in `background-image`: the space before or after the
direction (`to right in oklch` and `in oklch to right`), `in hsl longer hue`,
`in oklch longer hue`, `in srgb-linear`, the space on a radial or conic
gradient on either side of the shape or `from`, `light-dark()` and
`color-mix()` as a stop, and every repeating form.

Dropped by Chrome 152:

- `in srgb longer hue`: a hue method needs a polar space such as `hsl` or
  `oklch`.
- `conic-gradient(red 10px, blue)`: a conic stop takes an angle or a
  percentage, not a length.
- `linear-gradient(red 10deg, blue)`: the reverse for linear and radial.
- `radial-gradient(circle 10%, red, blue)`, as `radial-gradient` already
  refuses.

So `colorStopsProblem` cannot be reused as it is for conic: it would refuse
`red 90deg` and accept `red 10px`.

### What the space changes

Blue to yellow, rendered in Chrome:

- **sRGB, the default:** a grey middle.
- **`in oklab`:** an even blend through a light blue with no grey.
- **`in oklch`:** through cyan and green, with a visible hard step near the
  green where the colours leave the sRGB gamut and are clipped.
- **`in oklch longer hue`:** the other way round the wheel, through magenta
  and orange.

`oklab` is the safer suggestion for a plain blend. `oklch` is the one for a
colourful sweep, and its step is worth knowing before recommending it.

### Falling back

A declaration an old browser cannot parse is dropped, and an earlier one for
the same property stays. Simulated in Chrome with a space name it does not
know: `background-image: linear-gradient(to right, blue, yellow)` followed by
the same with `in notaspace` computed to the first. With `in oklab` the second
won. So the mixin can write the gradient without the space first and with it
second, and an old browser still gets a gradient. Not tested in a browser
older than 111.

## A proposed signature

```scss
@mixin gradient(
  $colors,
  $type: linear,
  $direction: null,  // linear: a direction name, an angle in any unit, "to top", var()
  $shape: null,      // radial: circle or ellipse, with an optional size
  $position: null,   // radial and conic: a position name or "at 30% 40%"
  $from: null,       // conic: the starting angle
  $in: null,         // an interpolation space, such as oklab or oklch longer hue
  $repeating: false
)
```

```scss
.a { @include gradient((red, blue)); }
.b { @include gradient((red, blue), $direction: "top-right"); }
.c { @include gradient((red, blue), radial, $shape: circle, $position: "top-left"); }
.d { @include gradient((red, yellow, lime, cyan, blue, magenta, red), conic); }
.e { @include gradient((blue, yellow), $direction: right, $in: oklab); }
.f { @include gradient((red 0 10px, blue 10px 20px), $direction: 45deg, $repeating: true); }
```

Colours come first so that everything else can have a default. What it would
do that the two mixins do not:

- write `background-image`, not the shorthand;
- take an angle in `deg`, `turn`, `rad` or `grad`, `var()`, `calc()` and the CSS
  `to` spelling;
- refuse an argument that does not belong to the type, such as `$from` on a
  linear gradient, instead of ignoring it, which is the silent failure this
  library checks for elsewhere;
- check conic stops as angles or percentages, and hue methods only with a polar
  space;
- with `$in`, write the gradient without the space first, as above.

## What a merge would change for users

- **Nothing, if the old names stay.** `linear-gradient` and `radial-gradient`
  can call `gradient` and keep writing `background`, so their output stays
  byte for byte, which the manifest's snapshots would check. Adding `gradient`
  is then a minor release.
- **Removing the old names is breaking** and belongs in 3.0.0, with a
  `MIGRATION.md` section. Between the two, a `warns` entry in `meta/` could
  point each old call at `gradient`.
- **`background-image`'s filter layer** would keep calling the old mixin or
  move to `gradient`. Moving it changes the `::after` layer from `background`
  to `background-image`, which needs its own before and after check.
- **The playground demos and both documentation pages** name the old mixins.

## Open questions

1. Should `gradient` also exist as a function, so a gradient can be layered
   with an image or used in `mask-image` and `border-image`? Utilities are
   camelCase, so it would need a name of its own.
2. Should `text-gradient`, which takes the same `$direction` and `$colors`,
   gain `$in` and conic at the same time?
3. Is the fallback declaration for `$in` wanted, or is two declarations more
   output than the library should write?

## Not covered

- Firefox and Safari were not measured; their versions are the compat data's.
- No browser older than Chrome 111 was used to confirm the fallback.
- The gamut step in `oklch` was seen for blue to yellow in Chrome only.
- Nothing was prototyped; the signature has not been compiled.
