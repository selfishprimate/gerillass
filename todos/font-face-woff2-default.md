# `font-face` formats default

Moved out of `todos/fix-plan.md`, where it was B6, on 15 September 2026. The
maintainer asked for each remaining 3.0.0 item to be examined and tested on its
own rather than done as a batch.

**Status.** Done for 4.0.0 on the `font-face-woff2` branch, 17 September 2026:
the default is `woff2`. **What was measured** at the end has the results.

## What the mixin does today

`$file-formats` defaults to `eot woff2 woff ttf svg`. Compiled today,
`@include font-face("Inter", "/fonts/inter");` writes:

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter.eot");
  src: url("/fonts/inter.eot?#iefix") format("embedded-opentype"),
       url("/fonts/inter.woff2") format("woff2"),
       url("/fonts/inter.woff") format("woff"),
       url("/fonts/inter.ttf") format("truetype"),
       url("/fonts/inter.svg#Inter") format("svg");
  font-style: normal;
  font-weight: 400;
}
```

Passing formats, such as `$file-formats: woff2`, writes only those.

## What goes wrong

A call that names no formats points at five files, two of them, EOT and SVG
fonts, formats no current browser loads. A bundler that resolves every `url()`
fails when only the `.woff2` exists. T3 hit this with Parcel, and it was
reproduced: with only `inter.woff2` on disk, Parcel 2.16.4 failed to resolve
`./fonts/inter.eot` from the default formats and built with
`$file-formats: woff2`. The README's Parcel section, D3 in the fix plan,
already tells Parcel users to pass the format.

## The proposal from the fix plan

Default `$file-formats` to `woff2`.

## What it would change for existing users

A call relying on the default loses four sources, including the separate `src`
line for EOT. A site that actually ships `.woff` or `.ttf` files for older
browsers, and relied on the default to list them, stops offering them.

## What was measured

The Parcel failure, as above. Nothing about which browsers still need the
other formats was checked.

## To test before planning

- Browser support for WOFF2 against the library's audience, and whether `woff`
  as a second default is worth keeping.
- The other bundlers: Vite, webpack and esbuild with only a `.woff2` on disk
  and the current default.
- How the documentation page and its examples present the formats today.
- Whether a `@warn` for the legacy formats in the default would be a useful
  step before the major version.

## Touches

`scss/library/_font-face.scss`; `meta/font-face.json`; the documentation page;
`MIGRATION.md`.

## What was measured, 17 September 2026

**Formats in the browsers.** A TTF converted to WOFF, WOFF2, EOT and SVG with
fonteditor-core, each served from a server that logged every request, one
`@font-face` per format and the mixin's old and new default:

| | Chrome 152 | Firefox 156 | Safari 26.6.2 |
|---|---|---|---|
| EOT alone | not requested | not requested | not requested |
| SVG font alone | not requested | not requested | requested and rendered |
| WOFF2, WOFF, TTF alone | rendered | rendered | rendered |
| old default, all files present | requests the .woff2 only | same | same |
| new default | requests the .woff2 | same | same |
| only .woff and .ttf on disk, old default | .woff2 404, then .woff, rendered | same | same |
| only .woff and .ttf on disk, new default | .woff2 404, no font | same | same |

Support data, `@mdn/browser-compat-data` 8.1.1: WOFF2 from Chrome 36, Firefox
39 and Safari 10 (macOS 10.12 and later); WOFF from Safari 5.1; SVG fonts
removed from Chrome in 38, never in Firefox, and still listed for Safari, which
the measurement confirms.

**Bundlers**, with only a `.woff2` on disk and the library on a load path:

| | Old default | New default |
|---|---|---|
| Vite 7.3.6 | builds, four broken `url()`s left in the CSS | builds clean |
| webpack 5.111 with sass-loader and css-loader | fails: can't resolve `.eot` | builds |
| esbuild 0.28.2, on the CSS Sass writes | fails: could not resolve `.eot` | builds |
| Parcel 2.16.4 with its Sass transformer | fails: failed to resolve `.eot` | builds |

The first webpack run failed for both, on `import` in a CommonJS test entry,
which was the harness and not the mixin; with `require` it gave the table
above.

**Calls compared**: 18 calls, each also under `gls-`. The 18 that pass no
formats changed, the 18 that do compiled the same.

**Whether `woff` should stay in the default.** Keeping it would save a project
that ships only `.woff`, but bring the bundler failure back for every project
that ships only `.woff2`, which is what current font tooling produces. The
default is `woff2`, and the WOFF-only case is in `MIGRATION.md`.

**The documentation page** was rewritten around the fonts the site serves:
Roboto from one file, a Roboto family of four files, the variable Inter with a
weight range and `unicode-range`, and Roboto Mono with `woff2 woff`, each with a
live demo, plus the argument order and named arguments. The Font Squirrel
recommendation, a generator that also produces EOT and SVG, became the fontTools
command `fonttools ttLib.woff2 compress font.ttf`, run here with fontTools
4.65.0. In all three browsers every face in the demos loaded, the text was
wider than in the fallback font, the family demo loaded all four files, and the
Inter demo widened with the weight, 98px at 100 to 119px at 900, from one file.
A `size-adjust` example was written and removed before release: it scales the
face it is written in, not a fallback, as its caption claimed.

The site's own `_fonts.scss` passes no formats for Roboto and Roboto Mono;
every file it names has a `.woff2`, so it is unaffected.

**Not covered**: Internet Explorer and browsers older than WOFF2 support, and
a real site's font set beyond one font.
