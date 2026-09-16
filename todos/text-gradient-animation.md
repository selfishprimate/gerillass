# An animation for `text-gradient`

Suggested by the maintainer on 17 September 2026, while writing the
documentation examples, for later. Nothing measured and nothing planned.

## The idea

A shimmer or a colour sweep across gradient text is a common effect: loading
states, hero headlines, holographic labels. Written by hand it is three things
beside the gradient, which is where people get it wrong:

- `background-size` wider than the element, such as `200% auto`, so there is
  gradient left to move;
- `@keyframes` moving `background-position`;
- an `animation` on the element.

`text-gradient` writes the `background` shorthand, which resets
`background-size` and `background-position`, so both have to come after the
`@include` or they are lost. That ordering trap is the case for the mixin doing
it.

An example of this was written into the documentation and taken out, because
the animation was added beside the mixin and read as if the mixin did it.

## Questions before any design

1. An argument on `text-gradient`, such as `$animate`, or a separate mixin?
2. What it animates: position for a shimmer, or the angle, which needs
   `@property` to animate a custom property and is newer.
3. Where the `@keyframes` go, since a mixin inside a rule cannot write one at
   the root without `@at-root`, and two calls must not collide on a name.
4. Reduced motion: `motion-safe` exists, and the animation should sit inside it
   by default.

## To measure first

- whether `background-position` animates smoothly on clipped text in Chrome,
  Firefox and Safari;
- whether `@property` and an animated angle work in all three.
