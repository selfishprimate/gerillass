import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/*
  Puts a new page at the top of itself.

  The router changes the page without touching the scroll position, so leaving
  a mixin's page halfway down and opening another one dropped the reader into
  the middle of it, usually into the CSS pane of some example they had not
  read.

  Three things are deliberately left alone:

  - a link to an anchor, which asked to land somewhere that is not the top
  - back and forward, where the browser restores the position the reader left
    and taking them to the top would lose their place
  - the playground, which opens over the home page rather than replacing it,
    so the page underneath has to stay where it was
*/

const SAME_PAGE = ["/", "/playground"];

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const previous = useRef(pathname);

  useEffect(() => {
    const from = previous.current;
    previous.current = pathname;

    if (hash) return;
    if (navigationType === "POP") return;
    if (SAME_PAGE.includes(from) && SAME_PAGE.includes(pathname)) return;
    if (window.scrollY === 0) return;

    /*
      Smooth, unless the reader has asked for less movement. `html` carries
      scroll-behavior: smooth, so this only has to name the exception.
    */
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
  }, [pathname, hash, navigationType]);

  return null;
}

export default ScrollToTop;
