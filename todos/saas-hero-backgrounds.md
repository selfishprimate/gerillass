# Hero backgrounds on premium SaaS sites

Researched 18 September 2026, when the maintainer asked what the expensive
looking SaaS sites put behind their heroes and which of it `background-pattern`
could draw. Twenty three sites were read, as served: the raw HTML and the
stylesheets it links, fetched rather than guessed at. **Nothing here was
compiled or opened in a browser**, and the CSS marked *sketch* is written from
the technique rather than copied from a site.

## The finding that matters

Most of the genre is not a pattern at all.

| Hero background | Sites |
|---|---|
| plain colour, no background layer | supabase.com, planetscale.com, notion.com, loops.so, cal.com, cursor.com, ui.shadcn.com |
| a photograph or a video, with gradient scrims over it | railway.com, retool.com, arc.net, resend.com, clerk.com, neon.com, superhuman.com |
| canvas, WebGL or a shader | stripe.com, vercel.com, raycast.com, mintlify.com |
| a noise texture, shipped as a file | framer.com (a base64 WebP tile), arc.net (`noise-light.png`) |
| **gradients only** | **attio.com, tailwindcss.com, liveblocks.io, and the component libraries** |

The pure CSS half is narrow and very consistent: a hairline grid, a dot grid, a
diagonal hatch, a radial glow, and a vignette in the page's own colour. Three of
those five the mixin already draws.

One assumption worth correcting: Magic UI's `grid-pattern` and `dot-pattern` are
SVG `<pattern>` and per-cell `<circle>` elements, and Aceternity's
`background-beams` is about fifty hand written SVG paths. The gradient recipes
people copy from those pages come from Tailwind arbitrary values, not from the
components.

## What the mixin cannot draw today

**A hatch whose line and gap are set apart.** `tailwindcss.com` fills its gutter
columns with a 1px line on a 10px period:

```css
background-image: repeating-linear-gradient(315deg,
  var(--pattern-fg) 0, var(--pattern-fg) 1px, transparent 0, transparent 50%);
background-size: 10px 10px;
background-attachment: fixed;
```

`stripes` writes `repeating-linear-gradient($angle, c 0 $t, transparent 0
calc($t * 2))`, so the line and the gap are locked at half the period each and a
1px line on a 10px period cannot be asked for. The shape the rest of the world
uses sizes the gradient by the tile instead (*sketch*):

```css
background-image: linear-gradient(315deg, var(--line) 0 1px, transparent 0);
background-size: 10px 10px;
```

This is the only pattern on a surveyed site that the mixin cannot produce.
`background-attachment` is a second gap: the mixin writes none, so the parallax
that page has is out of reach.

## What it could add, all gradients

**Glow.** Attio's hero, verbatim, one layer:

```css
background-image: radial-gradient(90% 80% at 50% 100%, #e6ecff 0%, #bccbff 45%, #86a0ee 100%);
opacity: 0.4;
```

Retool's, two corner blooms over a dark wash:

```css
background:
  radial-gradient(ellipse at 0% 100%, color-mix(in srgb, #2d4c71 75%, transparent) 0%, transparent 55%),
  radial-gradient(ellipse at 100% 100%, color-mix(in srgb, #793325 65%, transparent) 0%, transparent 50%),
  rgba(0, 0, 0, 0.45);
```

Neither blurs anything. Upstash reaches the same look with `filter: blur(60px)`
on a solid ellipse, which the mixin cannot write, but the two production sites
above ship the gradient form.

**Mesh, or aurora.** Three to five radial blobs and a ground:

```css
background:
  radial-gradient(at 20% 25%, oklch(72% 0.22 320 / .7) 0px, transparent 55%),
  radial-gradient(at 80% 20%, oklch(76% 0.20 200 / .6) 0px, transparent 55%),
  radial-gradient(at 65% 80%, oklch(70% 0.24 40 / .6) 0px, transparent 55%),
  oklch(96% 0.01 260);
```

The animated version of this look needs `blur()`, `mix-blend-difference` and a
mask; the static one needs none of them.

**A fade to the page colour.** Raycast's hero, verbatim, three layers, one per
edge:

```css
background:
  linear-gradient(to bottom, #07080a20 0%, #07080a20 90%, var(--grey-900) 100%) bottom right / 100% 100% no-repeat,
  linear-gradient(to left,  #07080a00 0%, var(--grey-900) 100%) top left  / 5% 100% no-repeat,
  linear-gradient(to right, #07080a00 0%, var(--grey-900) 100%) top right / 5% 100% no-repeat;
```

This is the gradient stand in for `mask-image`, and it is not a hack: Magic UI's
own `retro-grid` fades the same way, with the page colour over the pattern. It
fades to one named colour rather than to whatever is actually behind, which is
the trade a `$fade` argument would make.

**An origin for what the mixin draws from the middle.** `sunburst` is locked to
`at 50% 50%`; beams from the top edge, which the component libraries use, need
`from 180deg at 50% 0%`. `concentric` is one origin away from a topographic map,
and two layers at different origins is what makes it read as a map rather than
as a target.

## What was taken

**`glow`, `vignette` and `mesh` shipped**, on the `background-pattern` branch
for 4.0.0, with `$origin` for the first two and `$size` read as how far the
light reaches rather than as a tile. Items 2, 4 and 5 below are therefore done,
and item 3, `$fade`, is answered a different way: a `vignette` in the page's
colour on an element over the pattern, which the documentation shows, since one
mixin call writes one `background-image` and two calls on the same element
replace each other. All three were drawn in Chrome 152, Firefox 156 and Safari
26.6.2, which agree.

The rest of the list stands: the line and gap of a hatch, `$origin` for
`sunburst` and `concentric`, `background-attachment`, `contours` and `rings`.

## Ranked, for this mixin

1. **Let `stripes` set its line and its gap apart**, or add a `hatch` kind sized
   by `$size`. The only real gap the survey found.
2. **`glow`**, one radial ellipse with an origin, an extent and a colour.
   Highest return per layer, and two production sites ship exactly it.
3. **`$fade`**, a vignette in `$background` over any pattern.
4. **`mesh`**, three to five blobs from a colour list.
5. **`vignette`** as a kind of its own, edges rather than centre.
6. **`$origin` on `sunburst` and `concentric`**, which buys top edge beams and
   contour maps for two arguments.
7. **A docs line for `dots`**: the genre never staggers, and the mixin does by
   default.
8. **`background-attachment`**, for the fixed hatch.
9. **`contours`**, two offset `repeating-radial-gradient` layers.
10. **`rings`**, the gradient half of the Liveblocks halo.

## Out of reach without breaking the pure CSS rule

- **Noise and grain.** SVG `feTurbulence` or an image tile. Framer and Arc both
  ship a raster file. No gradient approximation exists.
- **A real `mask-image` fade**, to transparency rather than to a colour. This is
  the `edge-fade` member already on the backlog in `todos/library-review.md`;
  dub.co does it with `mask-composite: intersect` over three masks.
- **Blurred glow orbs.** `filter: blur()`, which would want a `glow` mixin of
  its own rather than a pattern.
- **Perspective or retro grids.** `perspective` plus `rotateX` on an element.
- **Beams, canvas and shaders.** Stripe, Vercel, Raycast, Mintlify.

## Not covered

Vercel, Raycast, Stripe and Mintlify render their heroes on the client, so what
was read there is configuration and class names, not drawing code. tailwindui.com
is behind a login wall. Nothing was verified in a browser, and no claim here
rests on a screenshot.

**Sources:** the served CSS of the twenty three sites above, plus
https://ibelick.com/blog/create-grid-and-dot-backgrounds-with-css-tailwind-css,
https://tailkits.com/components/tailwind-background-snippets/,
https://www.conic.style/css-mesh-gradient/, https://superdesign.dev/styles/aurora,
https://css-tip.com/css-graph-paper/,
https://www.setproduct.com/blog/complete-guide-to-blueprint-grid-design,
https://rauno.me/craft/vercel, https://magicui.design/docs/components/retro-grid,
https://ui.aceternity.com/components/grid-and-dot-backgrounds and
https://css-pattern.com/.
