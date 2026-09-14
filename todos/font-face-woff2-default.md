# `font-face` formats default

Moved out of `todos/fix-plan.md`, where it was B6, on 15 September 2026. The
maintainer asked for each remaining 3.0.0 item to be examined and tested on its
own rather than done as a batch. Not planned.

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
