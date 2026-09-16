# Illustration prompt

The home page Benefits illustrations (`responsive.png`, `typography.png`,
`brain.png`, `installation.png` in `site/public/images/illustrations`) were
generated with ChatGPT from this template, one image per item. Fill in the placeholders and send it as it is.
No reference image is needed: the style is described in words.

## Template

```
Bold hand-drawn icon, 1:1 square, 600x600 pixels, fully transparent background.

Style: a chunky, friendly cartoon icon drawn with a confident thick marker. Mostly two colors: deep charcoal #2F3937 and off-white #FAFAF8, plus one small accent in khaki #BDC488 used sparingly, on no more than one or two small areas, never on outlines. Very thick, bold charcoal outlines, about 3% of the canvas width, with rounded ends and a slightly hand-drawn line, never thin or sketchy. Large areas filled with solid charcoal, inner areas filled with off-white, so every shape reads as a strong charcoal and off-white contrast. Two or three short motion lines beside the object, in charcoal and khaki, to add energy. No other colors, no gradients, no shadows, no texture, no background shape, blob, circle or frame. No characters, no speech bubbles, no text {TEXT_EXCEPTION}. The icon is centered and fills about 70% of the canvas. Simple and readable at 100 pixels.

Concept: "{TITLE}". {MEANING}

Subject: {SUBJECT} The khaki accent goes on {ACCENT}. Two or three short motion lines near {MOTION_SPOT}, one of them khaki.
```

## Placeholders

| Placeholder | What goes in | Example (Install Anywhere) |
|---|---|---|
| `{TITLE}` | the item's heading, as written | Install from npm or RubyGems |
| `{MEANING}` | what the heading means, one sentence | A package that drops into any project. |
| `{SUBJECT}` | one object, saying which parts are solid charcoal and which off-white | an open cardboard package box seen from the front, with a solid charcoal front and off-white open flaps. |
| `{ACCENT}` | the one small area that is khaki | a thick downward arrow dropping into the box |
| `{MOTION_SPOT}` | where the motion lines go | the arrow |
| `{TEXT_EXCEPTION}` | empty when there is no text, otherwise e.g. `except the letters "A"` | (empty) |

The colours are the site's own: `$crayola`, `$snow` and `$sage` in
`site/src/assets/scss/abstract/_variables.scss`.

## What worked and what did not

- **One object.** A robot holding a document did not work; the brain alone did.
- **Khaki on a small, strong spot**, such as an antenna tip, an arrow or a
  lightning bolt. Khaki eyes on an off-white face were too faint to read.
- **Avoid text.** When it is needed, keep it to large single letters.
- **Avoid clichés.** A robot head and AI sparkle stars both read as generic;
  a brain carried the AI item better.

## Letting ChatGPT pick the subject

Send this first, choose one of the answers, and put it into `{SUBJECT}` and
`{ACCENT}`:

```
I need an icon for this feature. Title: "{TITLE}". Description: "{DESCRIPTION}".
Suggest three different single-object subjects that express it without text, avoiding clichés like robots and sparkle stars. For each, say which parts are solid charcoal, which are off-white, and the one small area that gets a khaki accent. Keep each to two sentences.
```

## The files in `public/images/illustrations`

The four PNGs above are the ones the page uses; each already carries its soft
background blob. `robot.png`, `robot-alt.png` and `shape_01.svg` to
`shape_04.svg` are kept from trying alternatives and are not referenced.
