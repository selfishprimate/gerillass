import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import { ARRIVE } from "animation";

/*
  A page's content, which travels a few pixels as it arrives and does not fade.

  It is the <main> element itself rather than a box around it, so the movement
  costs the layout nothing: the same tag, the same classes, in the same place.

  **It never changes opacity.** Two fades were tried, a spring from 0 and a
  gentler one from 0.6, and both were reported as the page blinking. The
  reason is in animation.js: the page is full of masked code blocks, and a mask
  is re-rasterised on every frame of an opacity. A transform is composited, and
  the page being replaced is at full brightness the whole time, so there is
  nothing to dip.
*/

/*
  "/" and "/playground" are the same page: the playground opens over the home
  page rather than replacing it, so it must not arrive a second time underneath
  its own window.
*/
const SAME_PAGE = ["/", "/playground"];

/*
  Whether this document has already shown a page. The first one does not move:
  it is written into the file by the build, and an `initial` means the build
  writes the transform into all 88 files, where anybody without JavaScript
  reads a page that is 8px out of place for ever.
*/
let firstPage = true;

function PageContent({ className = "content", children }) {
  const { pathname } = useLocation();
  const arriving = !firstPage;

  useEffect(() => {
    firstPage = false;
  }, []);

  /*
    The key is what re-runs the movement. Two documentation pages render the
    same component in the same position, so without it React updates the
    element in place and `initial` never applies again.
  */
  return (
    <motion.main
      key={SAME_PAGE.includes(pathname) ? "/" : pathname}
      className={className}
      initial={arriving ? { y: 14 } : false}
      animate={{ y: 0 }}
      transition={ARRIVE}
    >
      {children}
    </motion.main>
  );
}

export default PageContent;
