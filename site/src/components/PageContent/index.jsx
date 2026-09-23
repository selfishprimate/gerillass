import React from "react";

/*
  A page's content.

  It used to reveal itself: each new page started at `opacity: 0` and ten
  pixels down and sprang into place, so that the part of the window which had
  actually changed was the part that moved. Read on the site rather than in the
  abstract, that is a blink -- the content of the page you asked for is not
  there for a moment and then arrives -- and the maintainer asked for it gone
  on 23 September 2026. A documentation page is a reference, and a reference
  should be readable the instant it is open.

  What is left is the `<main>` element itself, which is what it always was: the
  same tag, the same classes, in the same place, so the reveal never cost the
  layout anything and its removal costs nothing either.
*/
function PageContent({ className = "content", children }) {
  return <main className={className}>{children}</main>;
}

export default PageContent;
