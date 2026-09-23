import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import { PAGE_MOTION } from "animation";

/*
  A page's content, faded in as it arrives.

  It is the <main> element itself rather than a box around it, so the fade
  costs the layout nothing: the same tag, the same classes, in the same place.

  **It never starts at nothing.** The first version of this began each page at
  `opacity: 0`, ten pixels down, and sprang it into place, and on 23 September
  2026 the maintainer reported it as a blink: the content of the page you asked
  for is missing for a moment and then arrives. It opens at 0.6 and settles, in
  under a fifth of a second, with no movement at all -- enough to read as a
  page arriving, never enough to read as a page missing.

  There is no exit. Playing one means holding the outgoing page on screen while
  it finishes, and the arriving page cannot be laid out until it does.
*/

/*
  "/" and "/playground" are the same page: the playground opens over the home
  page rather than replacing it, so it must not be faded a second time
  underneath its own window.
*/
const SAME_PAGE = ["/", "/playground"];

/*
  Whether this document has already shown a page. The first one is not faded:
  it is written into the file by the build, and giving it an `initial` means
  the build writes `style="opacity:0.6"` into every one of the 88 files, so
  anybody without JavaScript -- a crawler, a blocked bundle -- reads a dimmed
  page. Checked against the built output, which is where this was caught.

  It is a module variable rather than state because state belongs to a
  component instance, and every navigation mounts a new one.
*/
let firstPage = true;

function PageContent({ className = "content", children }) {
  const { pathname } = useLocation();
  const faded = !firstPage;

  useEffect(() => {
    firstPage = false;
  }, []);

  /*
    The key is what re-runs the fade. Two documentation pages render the same
    component in the same position, so without it React updates the element in
    place and `initial` never applies again.
  */
  return (
    <motion.main
      key={SAME_PAGE.includes(pathname) ? "/" : pathname}
      className={className}
      variants={PAGE_MOTION}
      initial={faded ? "arriving" : false}
      animate="here"
    >
      {children}
    </motion.main>
  );
}

export default PageContent;
