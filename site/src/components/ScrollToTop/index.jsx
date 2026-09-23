import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/*
  Before the browser paints, or the reader sees the new page at the position
  they left the old one and then watches it move. On the server there is no
  layout to run it in, and React says so, so the plain effect stands in: it
  never runs, since the prerender does not mount.
*/
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

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

  useBeforePaint(() => {
    const from = previous.current;
    previous.current = pathname;

    if (hash) return;
    if (navigationType === "POP") return;
    if (SAME_PAGE.includes(from) && SAME_PAGE.includes(pathname)) return;
    if (window.scrollY === 0) return;

    /*
      A jump, not a scroll. It used to glide up, which meant the new page was
      painted at the old position first and then travelled: from halfway down a
      long page that is a second of the wrong page moving past.

      `behavior: "instant"`, because `html` carries `scroll-behavior: smooth`
      for anchor links and an explicit behaviour is the only thing that beats
      it here. Setting the inline style instead was tried and does not work
      from inside this effect: the scroll is asked for before the style is
      recalculated, so the browser still reads `smooth` and glides. Measured
      on the dev server, with `scrollTo` wrapped to report the position it
      leaves behind: 2069 of 2400 the old way, 0 this way.
    */
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch {
      // An engine that does not know the keyword throws on the dictionary.
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, navigationType]);

  return null;
}

export default ScrollToTop;
