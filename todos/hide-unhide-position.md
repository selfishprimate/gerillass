# `hide`: research, measurements and a proposal

First written 15 September 2026 as B4 of `todos/fix-plan.md`, about
`hide("unhide")` writing `position: static`. Rewritten 17 September 2026, when
the maintainer asked for the mixin to be modernised: how other libraries do it,
what the literature says, and everything measured in Chrome, Firefox and
Safari.

**Status.** Done on the `hide` branch for 4.0.0, 17 September 2026. The
maintainer took both halves of the proposal at once: `hide(focusable)` is in,
and `hide(unhide)` stops the build with a message naming both replacements,
with a `MIGRATION.md` section. The documentation page was rewritten around the
examples below, and the compiled output was measured again end to end in all
three browsers. A 3.1.0 with `unhide` warning instead was built first and
dropped for this.

## What the mixin does today

`hide` is the "visually hidden" pattern, also called `sr-only`: content that is
not seen but is still read by a screen reader, such as the label of an icon
button, a form label the design leaves out, or "(opens in a new tab)".
`display: none` and `visibility: hidden` cannot do this, because they remove
the element from the accessibility tree as well.

```css
/* @include hide; */
.a {
  position: absolute; width: 1px; height: 1px; padding: 0; border: 0;
  overflow: hidden; clip: rect(1px, 1px, 1px, 1px); clip-path: inset(100%);
  white-space: nowrap;
}

/* @include hide("unhide"); */
.a {
  position: static; width: auto; height: auto; overflow: visible;
  clip: auto; clip-path: none; white-space: inherit;
}
```

## Where it came from

Git history: `screen-reader` in December 2019 (commit `8da7457`), hide only and
without `clip-path`. On 16 May 2020 (`4232961`) it became `hide` with the
`$toggle` argument, and its `unhide` values match Bourbon's `hide-visually`,
which it was evidently modelled on. `unhide` exists to take the hiding back,
and the case that needs that is content revealed on keyboard focus, above all
the skip link.

## What other libraries do

Read from the published source, 17 September 2026: Bootstrap 5.3.8, Tailwind
4.3.3 and 3.4.19, Bourbon 7.3.0, Foundation 6.9.0, GOV.UK Frontend 6.5.1,
HTML5 Boilerplate 9.0.1, Angular CDK 22.1.7, React Aria 3.52.1, Radix 1.2.11,
Chakra 3.37.0, Primer 22.3.1, USWDS 3.14.0, Carbon styles 1.115.0, Web Awesome
3.13.0, Shoelace 2.20.1, Open Props 1.7.23, Pico 2.1.1, WordPress trunk and
Drupal 11.x.

- **The hidden state is nearly the same everywhere**: absolute, 1px, no
  padding or border, `overflow: hidden`, `nowrap`. They differ on clipping:
  `clip` only (Bootstrap, Tailwind 3, Foundation, CDK, Radix, Carbon, Drupal),
  `clip-path: inset(50%)` only (Tailwind 4, WordPress), or both (GOV.UK, React
  Aria, Web Awesome). Only Bourbon, and Gerillass after it, uses `inset(100%)`.
- **`margin: -1px`** is in Bootstrap (issue #25686, a scrollbar in Chrome 64),
  Tailwind, CDK, Radix and others. GOV.UK sets `margin: 0` on purpose, because
  a negative margin made VoiceOver on macOS read text out of order (PR #1109).
- **Revealing on focus has moved away from hide-then-undo.** Bootstrap uses
  `:not(:focus):not(:focus-within)`, GOV.UK `:not(:active):not(:focus)` (it
  removed its undo block in PR #5063), Primer `:not(:focus)`, Web Awesome
  `:not(:focus-within)`. The hiding is simply not applied while the element
  has focus, so the element's own styles are never overwritten. Drupal, HTML5
  Boilerplate, Foundation and WordPress still hide and undo.
- **Undo, where it exists, never restores everything.** Tailwind's
  `not-sr-only` forces `padding: 0; margin: 0`; none restores the border. No
  library uses `revert` or `unset`; Bourbon's PR #1098 proposing `revert` was
  closed unmerged.
- Extras: `!important` (Bootstrap, GOV.UK, Web Awesome), `user-select: none`
  and non-breaking spaces in `::before`/`::after` (GOV.UK), a `caption`
  exception and `* { overflow: hidden }` (Bootstrap).

The standards route is closed for now: csswg-drafts issue #560, a native
visually-hidden value, was closed by its author on 16 April 2025.

## What was measured

Chrome 152, Firefox 156 and Safari 26.6.2 on macOS, each driven by a script
(CDP, WebDriver BiDi and safaridriver) at 1024×768 with real Tab key presses
and real mouse events. Paint was checked by diffing screenshots with and
without the element; the accessibility tree was read in Chrome only. Each
variant is the exact CSS of the call, plus Bootstrap's, GOV.UK's and
Tailwind's hidden state for comparison.

### The hidden state

- **`clip` and `clip-path` each hide everything on their own**, in all three:
  the text, a 6px `outline`, a 12px `box-shadow`, a focus ring, and a
  `position: fixed` child, which `overflow: hidden` alone lets through. With
  neither, every one of those paints.
- **`inset(100%)` and `inset(50%)` render the same** in all three, as the CSS
  Shapes spec says they should.
- **`white-space: nowrap` matters**: without it the text breaks into 4 lines
  in all three browsers, one word each.
- **`display: contents` on the same element defeats the mixin** in all three:
  the element has no box, so the children paint. A caveat, not a fix.
- **A 0×0 size was focusable in Safari 26**, by Tab and by `focus()`, so the
  2023 report that Safari skips it is out of date. 1px stays, for NVDA before
  2026.1, which treated zero-size controls as invisible.
- **A hidden `<caption>` shifts a collapsed-border table by 1 to 2px in
  Safari.** Bootstrap's alternative, leaving the caption in flow, shifts it in
  all three. Too small to design around.
- **Chrome's accessibility tree keeps the spaces**: "Search all content" for
  `Search <span>all</span> content`. The spaces GOV.UK inserts only add a
  second space ("Search  all  content"). Firefox and Safari were not read.
- **Copying a paragraph in Chrome glues the words**: "…permanentlyafter",
  the space after the hidden element lost. Firefox and Safari keep it. GOV.UK's
  `user-select: none` leaves the hidden text out of the copy in all three.

### Page overflow: a defect in today's output

A hidden element whose ancestors clip it but none is positioned escapes the
clipping, because its containing block is the page. Its 1px box still sits
where the text would be, so it stretches the page:

| Case | Chrome | Firefox | Safari |
|---|---|---|---|
| hidden label on the 4th card of a horizontal carousel | page 1549px wide in a 1024px window | no overflow | 1550px |
| hidden note in a collapsed `height: 0; overflow: hidden` panel | page 3227px tall in a 768px window | no overflow | 3227px |
| hidden element at the edge of a scroll container | 1px scroll | none | 1px scroll |

Firefox is spared because it takes `clip` into account for scrollable overflow,
which the other two do not; removing `clip` brings the defect to Firefox too.
Tailwind 4, which has no `clip`, overflows in Firefox. `margin: -1px` fixes the
carousel in Chrome and Safari but not the collapsed panel. `top: 0; left: 0`
and a zero size fix all three, but move the element away from its text or make
it invisible to older NVDA. **`position: relative` on the clipping container
fixes it in all three**, verified for both cases.

### Revealing on focus

A skip link with its own `position: fixed; top: 8px; padding: 12px 16px;
border`, measured after Tab (Option+Tab in Safari, which skips links on Tab by
default), after pressing Enter, after clicking the revealed link, and after
`focus()` from a script following a click elsewhere:

| How it is written | Tab | Click on the revealed link | `focus()` | A container of links |
|---|---|---|---|---|
| `hide`, then `hide(unhide)` on `:focus` (today) | shown, but `static`, no padding or border, pushes the page down 22px | Safari: hidden on mouse-down, click lost | shown, unstyled | never shown |
| the same, with the author's styles written again | correct | Safari: click lost | correct | never shown |
| `unhide` without `position` | stays `absolute`, no padding | Safari: click lost | shown, unstyled | never shown |
| `:not(:focus):not(:focus-within)` (Bootstrap) | correct | Safari: click lost | correct | correct |
| `:not(:active):not(:focus)` (GOV.UK) | correct | correct | correct | never shown |
| `:not(:focus-visible)` | correct | Safari: click lost | **stays hidden while focused**, all three | never shown |
| **`:not(:focus-within):not(:active)`** | correct | correct | correct | correct |

Safari does not focus a link on click, so on mouse-down focus leaves the link,
the hiding comes back and the click lands on nothing. `:active` holds it open
for the press; this is the reason GOV.UK has it. `:focus-within` also matches
the element itself, so `:focus` beside it adds nothing, which the measurements
confirm. Chrome and Firefox behaved the same for every variant.

### Undoing at a breakpoint

A label with its own `position: relative; padding: 4px 8px; border: 1px`,
hidden on small screens:

- `hide` everywhere and `hide(unhide)` from 800px: shown with no padding, no
  border and `position: static`, in all three.
- `unhide` without `position`: stays `absolute` and jumps to the top.
- `hide` only inside `@media (max-width: 799.98px)`: correct, because nothing
  is overwritten in the first place.

`unhide` cannot give back what `hide` overwrote. Scoping the hiding does, and
scoping is also how every focus variant above that works is built.

## What this changes about the first proposal

The first version of this file proposed removing `position: static` from
`unhide` and dropping `clip`. Measured:

- **Dropping `clip` would add a defect**: it hides nothing `clip-path` does
  not, but it is what keeps Firefox free of the page overflow above.
- **Removing `position: static` from `unhide` does not fix the skip link**: it
  leaves the link `absolute` and unstyled. The fix is not to undo at all.

## Proposal

### Now, in a minor release: `hide(focusable)`

```scss
.skip-link {
  position: fixed;
  top: 1rem;
  padding: 0.75rem 1rem;
  @include hide(focusable);
}
```

```css
.skip-link { position: fixed; top: 1rem; padding: 0.75rem 1rem; }
.skip-link:not(:focus-within):not(:active) {
  position: absolute; width: 1px; height: 1px; padding: 0; border: 0;
  overflow: hidden; clip: rect(1px, 1px, 1px, 1px); clip-path: inset(100%);
  white-space: nowrap;
}
```

This is exactly the last row of the focus table. It works on a single link
and on a container of links, keeps the author's own styles, survives a click
in Safari, and changes no existing call. A prototype of the mixin was compiled
against 15 existing calls (quoted, unquoted, `gls-`, keyword argument,
interpolated, inside `@media`, in a selector list) with byte-identical output,
and the error message now names all three values.

Alongside it, in the same release:

- **The documentation page opens with real cases**: an icon button, a skip link
  with `focusable`, and a label hidden on small screens by scoping `hide`
  inside a breakpoint rather than `unhide`.
- **Caveats in `meta/hide.json`**, each from a measurement above: the page
  overflow and its `position: relative` fix; `unhide` not restoring padding,
  border or position; `display: contents`.

### Later, in a major release: `unhide`

Every case measured is served better by `focusable` or by scoping, and none by
`unhide`. Removing it breaks calls that work, so it belongs in a major with a
`MIGRATION.md` section. Until then it warns, the way one-argument `breakpoint`
does, and names both replacements. Changing it instead would only move the
defect around.

### Considered and not proposed

- `margin: -1px`: fixes half the overflow in two browsers, with a reported
  VoiceOver cost.
- `top: 0; left: 0` or a zero size: fix the overflow but move or shrink what
  assistive technology is pointed at, which could not be measured here.
- `user-select: none`: fixes Chrome's glued copy, but changes what every
  existing hidden text copies as. Worth an option if anyone asks.
- GOV.UK's non-breaking spaces: Chrome does not need them and gets a double
  space from them.
- `!important`: the mixin goes into the user's own selector, which should stay
  overridable.
- `inset(50%)`: renders the same, so changing it only changes output.

## Not covered

- No screen reader was run. macOS denied the script accessibility access, so
  VoiceOver, and the accessibility trees of Firefox and Safari, were not read.
  NVDA, JAWS and TalkBack were out of reach.
- No mobile browser, and no touch input.
- Buttons were not measured for the Safari click; they are not focused on click
  either, so the same should hold.
- `hide(null)` already raises " is not a valid value…" with an empty name. The
  prototype keeps that.
- The harness lived in the session's scratchpad and was not kept.

## Touches

`scss/library/_hide.scss`; `meta/hide.json` (an example, caveats); the
documentation page `site/content/docs/hide.mdx`; the playground demo;
`MIGRATION.md` only if `unhide` is removed.
