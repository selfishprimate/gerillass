# What `all-text-inputs` matches

Moved out of `todos/fix-plan.md`, where it was B7, on 15 September 2026. The
maintainer asked for each remaining 3.0.0 item to be examined and tested on its
own rather than done as a batch.

**Status.** Done for 4.0.0 on the `all-text-inputs` branch, 17 September 2026,
by excluding the non-text types rather than listing the text ones. `select`
stays out, the maintainer's choice. **What was measured and built** at the end
has the results.

## What the mixin does today

`all-text-inputs($pseudo)` writes a selector list for every text-like field,
from `$list-of-text-inputs`, optionally with a pseudo-class such as `focus`,
`focus-visible` or `user-invalid`. Compiled today,
`@include all-text-inputs { border: 1px solid; }` writes:

```css
[type=color], [type=date], [type=datetime], [type=datetime-local],
[type=email], [type=month], [type=number], [type=password], [type=search],
[type=tel], [type=text], [type=time], [type=url], [type=week],
input:not([type]), textarea { border: 1px solid; }
```

`$list-of-text-inputs` is `!default`, so a project can replace it.

## What goes wrong

Found by T3:

- `[type='color']` is in the list. A colour picker is not a text input, and
  text-input styling, such as padding, a border or a fixed height, can distort
  the swatch.
- `select` is not in the list, and a form that styles its text fields almost
  always wants its selects to match.

`[type=datetime]` is also in the list, and that input type was removed from the
HTML standard. Noticed while writing this file, not checked further.

## The proposal from the fix plan

Remove `[type='color']`. Do not quietly add `select`, which is not a text
input: a separate list, or a documented pairing with another mixin, would be
clearer. That decision is open.

## What it would change for existing users

The selector list shrinks, so colour inputs stop receiving the styles. A
project that wants them back can restore the old list through the `!default`.

## What was measured

Nothing in a browser.

## To test before planning

- What typical text-input styles do to `[type=color]` in Chrome and Safari, to
  confirm the harm is real.
- The same for `[type=range]` and `[type=file]`, which are not in the list, to
  check the list is consistent.
- Whether `[type=datetime]` should go too.
- The shape of a `select` option: a separate `$list-of-form-controls`, a new
  mixin, or a flag.
- Whether the documentation page lists the matched types.

## Touches

`scss/lists/_list-of-text-inputs.scss`; `meta/all-text-inputs.json`; the
documentation page; `MIGRATION.md`.

## What was measured and built, 17 September 2026

27 controls in Chrome 152 and Firefox 156 headless and Safari 26.6.2: the eleven
text and date types, `datetime`, `type="foo"`, `type="TEXT"`, an untyped input,
`textarea`, `color`, `range`, `file`, `checkbox`, `radio`, `submit`, `button`,
`reset`, `select` and `select multiple`, each given `display: block; width:
220px; height: 36px; padding; border; border-radius` through the mixin, and
compared with the same page unstyled.

| | Old list | New selector |
|---|---|---|
| text, search, email, url, tel, password, number, date, datetime-local, month, week, time, untyped, textarea | styled | styled |
| `datetime`, removed from HTML | styled | styled |
| `type="foo"` | not styled, though drawn as text | styled |
| `type="TEXT"` | styled | styled |
| color | styled, swatch stretched into a bar | not styled |
| range, file, checkbox, radio, submit, button, reset, select | not styled | not styled |

All three browsers report `datetime` and `foo` as `type` `text`; Safari also
reports `month` and `week` as `text`, since it has no pickers for them. `:focus`
followed the same split in Chrome and Firefox; in Safari, where WebDriver's
`focus()` does not make `:focus` match, it was checked with Option+Tab, which
also skipped the colour picker.

`:where(input)` keeps the specificity of the old `[type='text']`, so a typed
input is matched at one attribute as before; an untyped input drops from one
attribute and one element to one attribute. Calls compared: 17 forms, each under
`gls-`; every call that compiled changed only in the selector, the invalid
`$pseudo` values still raise, now with the value named, and a replaced
`$list-of-text-inputs` compiles as before.

**`select`.** Measured unstyled with both selectors. Left out: its arrow and
padding differ between browsers, and the documentation shows it styled beside
the mixin.

**The documentation page** was rewritten: a table of what is matched and why, a
sign-up form where the colour picker and checkbox keep their look and `select`
has its own rule, a focus ring through `focus-ring` inside the mixin, a
`user-invalid` error state, a disabled state, and a scoped search bar. All five
demos were checked in all three browsers. Two captions had held a Markdown
link, which captions do not render, this one and the breadcrumb example on the
`after` page; both now name the mixin in bold.

**Not covered**: a mobile browser; the `user-invalid` state after real typing,
which the automation could not produce; `image` and `hidden` inputs, excluded
by the selector and not drawn.
