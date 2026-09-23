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
  A page arriving. Opacity only, from most of the way there, over less than a
  fifth of a second: a page rising from nothing on the site's own spring was
  measured as a blink rather than as an arrival, which is what components/
  PageContent has the long version of.
*/
export const PAGE_MOTION = {
  arriving: { opacity: 0.6 },
  here: { opacity: 1, transition: { duration: 0.18, ease: "easeOut" } },
};

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
