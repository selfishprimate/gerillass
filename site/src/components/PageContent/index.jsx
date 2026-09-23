import React from "react";

/*
  A page's content.

  It used to arrive: `opacity: 0`, ten pixels down, on the site's own spring,
  and later a gentler fade from 0.6. Both read as a blink rather than as an
  arrival, and for the same reason -- the page being replaced is at full
  brightness, so anything that starts below it dips the content the reader is
  looking at and brings it back. The maintainer asked for it gone on
  23 September 2026, after the second attempt.

  What is left is the `<main>` element itself, with no key, so React updates it
  in place: measured with a MutationObserver over a navigation, the element is
  never removed and added, and the content swaps in one commit at full
  brightness.
*/
function PageContent({ className = "content", children }) {
  return <main className={className}>{children}</main>;
}

export default PageContent;
