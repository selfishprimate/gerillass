/*
  One movement language for the whole site.

  The playground window wrote this first: springs rather than durations,
  because something that arrives with weight reads as a thing appearing and
  not as a page swap, and a quicker way out than in, because nobody waits to
  leave. The palette and the page transitions use the same two curves, so the
  site moves one way instead of three.
*/

export const SETTLE = {
  type: "spring",
  stiffness: 320,
  damping: 34,
  mass: 0.9,
};

/* Leaving is the same movement run backwards, and quicker. */
export const LEAVE = { duration: 0.18, ease: "easeIn" };

/*
  Arriving, and the shape of it is a constraint rather than a taste.

  Everything that arrives on this site carries a mask, a drop shadow or a
  backdrop filter: the code blocks and the playground's editors are cut to a
  nine piece mask, the palette's frame is a `drop-shadow`, its scrim a
  `backdrop-filter`. A filter and a mask are re-rasterised on every frame of an
  **opacity** change, which is why every fade tried here was reported as
  flicker rather than as movement. A **transform** on a promoted layer is not:
  the element is rasterised once and the layer is moved.

  So nothing fades. Things travel a few pixels on an ease that decelerates
  hard: most of the distance goes at once and the last of it settles, which is
  what reads as smooth rather than as a jump. The first attempt was 0.22s over
  half these distances and came out curt.
*/
export const ARRIVE = { duration: 0.42, ease: [0.16, 1, 0.3, 1] };

/*
  The dimmed page behind a dialog. Opacity only: it covers the whole viewport,
  so anything that moves it moves everything the eye can see.
*/
export const SCRIM_MOTION = {
  hidden: { opacity: 0, transition: { duration: 0.16, ease: "easeIn" } },
  shown: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
};

/* A dialog over that scrim, on the window's curve at a smaller amplitude. */
export const DIALOG_MOTION = {
  hidden: { opacity: 0, y: 14, scale: 0.98, transition: LEAVE },
  shown: { opacity: 1, y: 0, scale: 1, transition: SETTLE },
};
