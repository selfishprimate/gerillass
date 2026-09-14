# Where a breakpoint ends

Measured 14 and 15 September 2026 in Chrome 152 and Safari 26.6.2. Not decided
and not planned: the maintainer took this out of `todos/fix-plan.md`, where it
was B1, to be looked at as a piece of work of its own. It changes what
`breakpoint(max, …)` and every range built from the map emit, so it belongs in
a major version.

## How the mixins decide today

`$map-for-breakpoints` names widths: `small` 576px, `medium` 768px, `large`
992px, `xsmall` a unitless 0.

| Call | Condition |
|---|---|
| `breakpoint(min, large)` | `(min-width: 992px)` |
| `breakpoint(max, large)` | `(max-width: 992px)`, 992 included |
| `breakpoint(only, medium)` | `(width: 768px)` |
| `breakpoint(small, medium)`, `breakpoint(between, small medium)` | `(min-width: 576px) and (max-width: 767px)` |
| `breakpoint(500px, 700px)` | `(min-width: 500px) and (max-width: 700px)`, a raw end left as written |
| `container-query(small, medium)` | `(min-width: 576px) and (max-width: 768px)`, nothing subtracted |

The 1 that `breakpoint` subtracts from a map key at the end of a range is
deliberate, and the maintainer explained why: two ranges side by side,
`small, medium` and `medium, large`, must not both apply at exactly 768px. A raw
length is left alone because the caller wrote exactly what they meant.

`remove` builds on `breakpoint`, so it follows whatever `breakpoint` does.

## What goes wrong

1. **`max` has no such protection.** `breakpoint(max, medium)` and
   `breakpoint(min, medium)` both apply at exactly 768px, the same overlap the
   range subtraction exists to prevent. The usual pair is a mobile rule under
   `max` and a desktop rule under `min` at the same key. Two agent trials hit
   it: one wrote `991.98px` by hand, the other switched to the range form.
2. **`container-query` has none either.** Its ranges end on the key, so
   `container-query(small, medium)` and `container-query(medium, large)` both
   apply at 768px.
3. **Subtracting 1 assumes whole pixels, and widths are not always whole.**
   - In Chrome on a screen with a device pixel ratio of 2, a viewport can be
     767.5px wide. `breakpoint(small, medium)` ends at 767px and
     `breakpoint(medium, large)` starts at 768px, so neither applies. The same
     happens at 991.5px.
   - Container widths come from percentages and flex and are often fractional.
     Half of a 1535px flex row is 767.5px, and there neither range applied;
     767.2px and 767.8px gave the same.
   - Safari rounds a viewport to whole pixels, so its media ranges showed no gap.
4. **Subtracting 1 ignores the unit.** With a rem map, `48rem` minus 1 is
   `47rem`, 16px short, so between 752px and 768px no range applies, in both
   browsers.

## The proposal from the fix plan

End `max`, and every range whose end is a map key, just under the key, in the
key's own unit, in both mixins. A raw length stays as written.

```scss
@function -range-end($value) {
  @if math.unit($value) == "px" {
    @return $value - 0.02;
  }
  @return $value - 0.01;
}
```

It is the same idea as today's 1, with a step small enough for fractional
widths and correct in any unit.

## The measurements

A page opened one frame per viewport width, 23 widths from 575px to 1200px with
fractions near each boundary, and one container per width, and read which
conditions matched with `matchMedia` and with custom properties set inside
`@container`. The root font size inside the frames was 20px, to check that rem
and em in a media condition ignore it; they did, in both browsers.

### Overlaps and gaps

| Scenario | Chrome | Safari |
|---|---|---|
| px `max` + `min`, today | overlap at 768 | overlap at 768 |
| px `max` + `min`, `.98` | none | none |
| px `max` + `min`, `(width < 768px)` | none | none |
| px ranges, today's `- 1` | gap at 767.5 and 991.5 | none, viewports are whole pixels |
| px ranges, `.98` | none | none |
| px ranges, range syntax | none | none |
| rem ranges, today | gap from 752 to 768 | gap from 752 to 768 |
| rem ranges, `.99` | none | none |
| rem `max` + `min`, today | overlap at 768 | overlap at 768 |
| rem `max` + `min`, `.99` | none | none |
| em ranges, `.99` | none | none |
| `min` chain only, which this does not touch | unchanged | unchanged |
| container ranges, today | overlap at 768 and 992 | overlap at 768 and 992 |
| container ranges, `.98` | overlap within 1/64px below 768 | gap within 1/64px below 768 |
| container ranges, range syntax | overlap within 1/64px below 768 | none |
| container `max` + `min`, today | overlap at 768 | overlap at 768 |
| container `max` + `min`, `.98` | overlap within 1/64px below 768 | gap within 1/64px below 768 |

### How each browser compares a boundary

- **Viewport widths.** Chrome with a device pixel ratio of 2 lets a frame's
  viewport be a half pixel, 767.5px; anything finer snapped to the nearest half.
  Safari rounded to a whole pixel, so 767.5px became 768px. Other pixel ratios
  and page zoom were not tried.
- **Chrome has a tolerance of about 1/64px.** A container 767.984375px wide,
  1/64px under 768, matched both `(width < 768px)` and `(width >= 768px)`. For
  the same reason `(max-width: 767.99px)` still matched a 768px container, so
  in px the step has to be `.98`; `.99` leaves the overlap in place.
- **Safari compares exactly.** The 767.984375px container matched
  `(width < 768px)` and not `(min-width: 768px)`, and it matched neither
  `(max-width: 767.98px)` nor `(min-width: 768px)`: the 0.02px step leaves a
  gap that narrow.
- Both are within 1/64px of the boundary, which a layout rarely lands on. At
  whole and half pixels, `.98` and range syntax were both clean in both
  browsers.

### The prototype

The proposal was applied to a copy of `breakpoint` and `container-query` and
about a hundred calls compiled against both, with px, rem, em and mixed-unit
maps.

- Changed as intended: `max` with a key, every range ending on a key, including
  `between, 500px large`, in both mixins, and `remove(max, …)` and
  `remove(small, medium)` through `breakpoint`. Each key ends in its own unit:
  `767.98px`, `47.99rem`, `47.99em`.
- Unchanged: `min`, `only`, the one-argument form, and every raw length, such as
  `breakpoint(max, 700px)` and `container-query(300px, 500px)`.
- **A defect in the proposal as written:** `max, xsmall` subtracts from the
  unitless `0` and writes `(max-width: -0.01)`, which is not valid CSS; with a
  `0px` key it writes `-0.02px`. Chrome and Safari both left the query
  unmatched, which is also what today's `(max-width: 0)` does, but the
  implementation should leave 0 alone.

## Choices still open

- **Whether `max` changes at all.** Keeping it inclusive and documenting the
  overlap is the other option. Changing it moves every `max` query off the key
  by 0.02px, which anyone relying on exactly that pixel will see.
- **Subtraction or range syntax.** For `@container`, range syntax was exact in
  Safari and no worse than `.98` in Chrome, so it looks like the better fit
  there. For `@media`, both were clean at every width the browsers produced.
  Browser support has to be checked before choosing range syntax: from memory,
  Safari 16.0 to 16.3 support container queries but not range syntax, which was
  not verified.
- **Whether `container-query` and `breakpoint` should use the same method**, or
  each the one that measures best for its at-rule.

## Not tested

- Firefox, which is not installed on the machine used.
- Device pixel ratios other than 2, and page zoom, which produce other
  fractional viewport widths.
- Container widths in Safari with today's `- 1`; the gap follows from Safari's
  exact comparison but was measured only in Chrome.
- What the change does to real layouts beyond which conditions match.

## What it touches when planned

`scss/library/_breakpoint.scss`, `scss/library/_container-query.scss`, and
`remove` through `breakpoint`; the manifest snapshots; the `breakpoint`,
`remove` and `container-query` documentation pages; a `MIGRATION.md` section,
since it is a major change.
