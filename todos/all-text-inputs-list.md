# What `all-text-inputs` matches

Moved out of `todos/fix-plan.md`, where it was B7, on 15 September 2026. The
maintainer asked for each remaining 3.0.0 item to be examined and tested on its
own rather than done as a batch. Not planned.

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
