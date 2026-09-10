import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import { PAGE_MOTION } from "animation";

/*
  A page's content, revealed when it arrives.

  It is the <main> element itself rather than a box around it, so the reveal
  costs the layout nothing: the same tag, the same classes, in the same place.

  It is also only the content. Animating the whole page moved the header, the
  announcement and the footer with it, and since those are in the same place on
  every page, watching them leave and come back read as the page jumping rather
  than as anything arriving. The chrome stays put and the part that actually
  changed is the part that moves.

  There is no exit. Playing one means holding the outgoing page on screen while
  it finishes, and the arriving page cannot be laid out until it does -- the
  document briefly has no content, the scroll position collapses with it, and
  that jump costs more than a fade back out is worth.
*/

/*
  "/" and "/playground" are the same page: the playground opens over the home
  page rather than replacing it, so it must not be revealed a second time
  underneath its own window.
*/
const SAME_PAGE = ["/", "/playground"];

/*
  Whether this document has already shown a page. The first one is not
  revealed: it is written into the file by the build, and starting it at
  opacity 0 would mean anybody without JavaScript -- a crawler, a slow
  connection, a blocked bundle -- gets a blank page where the content is.

  It is a module variable rather than state because state belongs to a
  component instance, and every navigation mounts a new one: a flag stored
  inside would be back to its initial value on each page and no page would ever
  be revealed. On the build machine no effect runs, so it stays true and all 80
  files are written with their content visible.
*/
let firstPage = true;

function PageContent({ className = "content", children }) {
  const { pathname } = useLocation();
  const revealed = !firstPage;

  useEffect(() => {
    firstPage = false;
  }, []);

  /*
    The key is what re-runs the reveal. Two documentation pages render the same
    component in the same position, so without it React updates the element in
    place and `initial` never applies again -- the first page fades in and
    every page after it appears at once.
  */
  return (
    <motion.main
      key={SAME_PAGE.includes(pathname) ? "/" : pathname}
      className={className}
      variants={PAGE_MOTION}
      initial={revealed ? "hidden" : false}
      animate="shown"
    >
      {children}
    </motion.main>
  );
}

export default PageContent;
