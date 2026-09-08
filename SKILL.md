---
name: gerillass
description: Use the Gerillass Sass mixin library — loading it, the mixin catalogue, and the argument forms that are easy to get wrong. Use when writing SCSS in a project that has gerillass installed.
---

# Gerillass

A Sass mixin library: 51 mixins and 21 functions that emit CSS from
semantic declarations. It is Sass source only — there is no runtime and no
utility classes, so styles live in your stylesheet and your markup stays clean.

Full documentation: https://docs.gerillass.com
Machine-readable API: `gerillass.json` in this package.

## Loading it

Through a bundler (Vite, webpack and most others resolve the package by name):

```scss
@use "gerillass" as *;
```

Calling Dart Sass yourself, with its package importer
(`new NodePackageImporter()` or `sass --pkg-importer=node`):

```scss
@use "pkg:gerillass" as *;
```

Anything else, by pointing a load path at `node_modules/gerillass/scss`:

```scss
@use "gerillass" as *;
```

Dart Sass only. LibSass and node-sass are not supported.

## Two names for every mixin

Every mixin exists twice: bare (`ratio-box`) and prefixed (`gls-ratio-box`).
They are the same mixin. The prefix exists to avoid collisions with other
libraries. Pick one and stay with it; do not mix them in a file.

With the module system you can namespace instead, which is usually cleaner:

```scss
@use "gerillass" as gls;
.hero { @include gls.ratio-box("16/9"); }
```

## Getting arguments right

The conventions are not uniform across the library, so check before guessing.
The single most common mistake is passing a ratio as a list:

```scss
.hero { @include ratio-box(16 9); }    // wrong — errors
.hero { @include ratio-box("16/9"); }  // right
```

Mixins that reject bad input do so with a message naming what they accept. If
you get one, read it: it lists the valid values. Mixins not in the table below
mostly pass their arguments through to CSS, so a wrong value there shows up as
a dropped declaration rather than an error.

| Mixin | Rejects, for example |
|---|---|
| `all-buttons` | `@include all-buttons(nonsense) { color: red; }` |
| `all-text-inputs` | `@include all-text-inputs(nonsense) { color: red; }` |
| `antialias` | `@include antialias(only);` |
| `background-dots` | `.a { @include background-dots(red, 1em, 5em, maybe); }` |
| `background-image` | `.a { @include background-image("/img/a.png", (red, blue), sideways); }` |
| `border-box` | `@include border-box(only);` |
| `border-radius` | `.a { @include border-radius(1px, 2px, 3px); }` |
| `center` | `.modal { @include center(diagonal); }` |
| `columnizer` | `.grid { @include columnizer(3, 20px, true, 9); }` |
| `except` | `.a { @include except(#ff0000) { margin: 0; } }` |
| `font-face` | `.a { @include font-face("Inter", "/fonts/inter"); }` |
| `hide` | `.a { @include hide(nonsense); }` |
| `loadify` | `@include loadify(nonsense);` |
| `only` | `.a { @include only(#ff0000) { margin: 0; } }` |
| `ratio-box` | `.hero { @include ratio-box(16 9); }` |
| `remove` | `.a { @include remove(a, b, c); }` |
| `reset-css` | `.a { @include reset-css; }` |
| `responsive-video` | `.video { @include responsive-video(16 9); }` |
| `scissors` | `.a { @include scissors(5px 10px); }` |
| `smartphone` | `.a { @include smartphone(Nokia3310) { display: none; } }` |
| `sprite` | `.icon { @include sprite("/img/sprite.txt"); }` |
| `stretched-link` | `.card a { @include stretched-link(middle); }` |
| `tablet` | `.a { @include tablet(Surface) { display: none; } }` |
| `text-selection` | `.a { @include text-selection(bogus) { background: yellow; } }` |
| `triangle` | `.caret { @include triangle(sideways); }` |

## Mixins

| Signature | What it does |
|---|---|
| `adaptive($gutter: 30px)` | Centred container whose max-width steps up at every breakpoint. |
| `after($content: null)` | Styles the ::after pseudo-element. A `data-` argument becomes an attr() content value. |
| `all-buttons($pseudo: null)` | Targets every button-like element at once, optionally in one pseudo-class state. |
| `all-text-inputs($pseudo: null)` | Targets every text-like input at once, optionally in one pseudo-class state. |
| `antialias($value: null)` | Turns on subpixel-antialiased text smoothing. |
| `background-dots($color: null, $size: 1em, $gutter: $size * 5, $diagonal: true, $image: null)` | Repeating dot pattern as a background, optionally over an image. |
| `background-image($image-url: null, $filter-color: null, $filter-direction: null)` | Background image with an optional colour or gradient filter laid over it. |
| `background-stripes($color: null, $thickness: 1em, $rotation: -45deg, $image: null)` | Repeating stripe pattern as a background, optionally over an image. |
| `before($content: null)` | Styles the ::before pseudo-element. A `data-` argument becomes an attr() content value. |
| `border-box($value: null)` | Applies box-sizing: border-box. |
| `border-radius($args...)` | Rounds corners, either all of them, one named corner, or all four individually. |
| `brand-logo($width, $height, $image-url: null)` | Logo box with an image and an accessible stretched link over it. |
| `breakpoint($params...)` | Media query built from the breakpoint map, or from raw lengths. |
| `breakpointer($selector: null)` | Debug helper that prints the active breakpoint name into a pseudo-element. |
| `center($axis: "both")` | Absolutely centres an element inside its positioned parent. |
| `circle($size)` | Square element with a fully rounded border, i.e. a circle. |
| `clearfix` | Clears floated children using an ::after pseudo-element. |
| `columnizer($params...)` | Flexbox grid of equal columns, with an optional gutter and fill behaviour. |
| `counter($params...)` | CSS counter for a list, with optional text before and after the number. |
| `ellipsis($width: 100%, $display: inline-block)` | Truncates a single line of text with an ellipsis. |
| `escape-to-parent($selector: null)` | Re-roots the current selector under another one using @at-root. |
| `except($params...)` | Selects every sibling except the ones named. |
| `font-face($font-family, $file-path, $font-style: normal, $font-weight: 400, $file-formats: eot woff2 woff ttf svg)` | Emits an @font-face rule for one family across several file formats. Must be called at the root. |
| `hide($toggle: "hide")` | Visually hides an element while keeping it available to screen readers, or reverses that. |
| `linear-gradient($direction, $colors)` | Linear gradient background from a direction name or an angle. |
| `loadify($params...)` | Fades elements in on page load. Call once at the root to set up, then on each element. |
| `only($params...)` | Selects only the siblings named. |
| `placeholder-shown` | Styles an input while its placeholder is visible. |
| `placeholder` | Styles the placeholder text of an input across vendor prefixes. |
| `position($position: absolute, $offsets: 0)` | Sets position and offsets in one call, using shorthand order. |
| `radial-gradient($shape, $position, $colors)` | Radial gradient background from a shape and a position. |
| `ratio-box($ratio: null)` | Container that holds a fixed aspect ratio. Its single direct child is stretched to fill it. |
| `remove($params...)` | Hides an element outright, or only within a breakpoint range. |
| `reset-css` | Meyer reset. Must be called at the root of the stylesheet. |
| `reset-figure` | Removes default figure margins and makes the image inside responsive. |
| `resizable($direction: both, $overflow: auto)` | Makes an element user-resizable. |
| `responsive-image` | Makes an image fill its container width. |
| `responsive-video($ratio: null)` | Wrapper that keeps an embedded video at a fixed aspect ratio. |
| `scissors($corners)` | Cuts the corners off an element with clip-path. |
| `screen-agent($resolution)` | Media query targeting a screen pixel density. |
| `sizer($width, $height: $width)` | Sets width and height together; one argument makes a square. |
| `smartphone($device, $orientation: null)` | Media query targeting a known smartphone by device dimensions. |
| `sprite($params...)` | Sets up an element as a sprite tile: an image, a background position, or both. |
| `stretched-link($value: "before")` | Expands a link to cover its positioned parent, so the whole card is clickable. |
| `tablet($device, $orientation: null)` | Media query targeting a known tablet by device dimensions. |
| `text-gradient($direction, $colors)` | Applies a linear gradient to the text itself via background-clip. |
| `text-image($image: null)` | Fills the text with an image via background-clip. |
| `text-selection($value: null)` | Styles the ::selection pseudo-element. |
| `text-shadow($params...)` | Layered text shadows built from a direction, a colour and an offset. |
| `text-stroke($fallback-color: black, $color: transparent, $stroke-color: black, $stroke-width: 1px)` | Outlines text using the webkit text-stroke properties. |
| `triangle($direction: "bottom", $color: black, $size: 10px 8px)` | Draws a CSS triangle out of borders, pointing in a given direction. |

## Functions

Called like normal Sass functions. The two leading underscores mark them as
functions rather than mixins; they are public API.

| Signature | What it does |
|---|---|
| `__clearUnit($value)` | Strips the unit off a number, returning it unitless. |
| `__clearWhitespace($string)` | Removes every space from a string. |
| `__convertToEm($value)` | Converts a pixel length to em, against a 16px base. |
| `__convertToNumber($value)` | Parses a string of digits into a number. |
| `__darken($color, $percentage)` | Mixes a colour towards black by a percentage. |
| `__fontSizer($size, $time)` | Multiplies a size by a factor. Handy for a modular scale. |
| `__fontSource($font-family, $file-path, $file-formats)` | Builds one src entry for an @font-face rule. |
| `__isColor($value)` | Returns the value if every item in it is a colour, and errors otherwise. |
| `__isNumber($value)` | Returns the value if it is a number. |
| `__isTime($value)` | Returns the value if it is a time in s or ms, and errors otherwise. |
| `__lighten($color, $percentage)` | Mixes a colour towards white by a percentage. |
| `__mapDeepGet($map, $keys...)` | Reads a value out of a nested map by following a chain of keys. |
| `__null($value, $seperation: comma, $skip: false)` | Replaces null entries in a list with 0, or drops them. |
| `__pixelify($value)` | Returns the value with a px unit, adding one if it is missing. |
| `__pseudoSelector($elements, $pseudo: null)` | Appends a pseudo-class to every selector in a list. |
| `__remify($value)` | Converts a pixel length to rem, against a 16px root. |
| `__shorthandProperty($value)` | Expands one to four values into the four-value CSS shorthand order. |
| `__validateBreakpoint($value)` | Resolves a breakpoint name to its width, passing other values through. |
| `__validateLength($value)` | Returns the value if it is a length or one of auto, inherit, initial, 0. |
| `__validateRatio($ratio)` | Turns an aspect ratio into the padding-top percentage that holds it. |
| `__validateScissors($value)` | Normalises corner values for the scissors mixin, adding px where missing. |

## Checking your work

Sass evaluates mixin bodies lazily, so a stylesheet that merely loads the
library always compiles. Compile the file that actually calls the mixin:

```bash
sass --load-path=node_modules/gerillass/scss your.scss
```

An empty rule in the output means the mixin matched none of its branches —
treat that as a bug, not as success.
