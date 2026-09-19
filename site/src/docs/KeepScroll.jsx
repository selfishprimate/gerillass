import { useEffect } from "react";

/*
  Keeps the reader where they were when they refresh the page.

  One page needs this: `loadify`, whose whole subject is an animation that
  runs once, on load. This half saves the position; the inline script at the
  end of `index.html` is what puts it back, because by the time React runs the
  page has already been painted at the top and the jump is visible. Measured
  against the built site: the inline script restores at 85ms in Chrome 152 and
  112ms in Safari 26.6.2, where the first paint is at 120ms and 140ms. The instruction on it is "refresh the page to see the
  effect", and a refresh that puts the reader back at the top means the effect
  has finished by the time they have scrolled down to the demo again.

  The browser's own restoration does not do it here. Measured against the dev
  server: scrolled to 1800px on /docs/loadify and reloaded, the page came back
  at 0. The routes are lazy, so at the moment the browser tries to put the
  scroll back the document is barely taller than the viewport, and a position
  it cannot reach is dropped.

  So the position is saved while the reader scrolls and put back by hand, and
  only after a reload: a fresh arrival, a link from another page and the back
  button all keep the behaviour they had. `history.scrollRestoration` is set to
  manual for the life of the page so the browser does not scroll somewhere else
  first, and put back on the way out.

  Written as a component rather than a rule inside the template because it
  belongs to the page: `<KeepScroll />` on the page that needs it says so where
  a reader of that page will see it.
*/
function KeepScroll() {
  useEffect(() => {
    const key = `gerillass:scroll:${window.location.pathname}`;

    const read = () => {
      try {
        return Number(window.sessionStorage.getItem(key)) || 0;
      } catch {
        // Private windows and blocked site data throw rather than answering.
        return 0;
      }
    };

    const write = (value) => {
      try {
        window.sessionStorage.setItem(key, String(value));
      } catch {
        /* nothing to do: the page simply does not keep the position */
      }
    };

    const navigation = performance.getEntriesByType("navigation")[0];
    const reloaded = navigation ? navigation.type === "reload" : false;
    const saved = read();

    const previous = "scrollRestoration" in window.history ? window.history.scrollRestoration : null;
    if (previous) window.history.scrollRestoration = "manual";

    /*
      The demos are iframes and the page carries photographs, so it grows for
      a while after the first paint. One call is not enough: the position is
      put back on the next frame and again once things have settled.
    */
    /*
      The inline script has already taken the position. These are top-ups, for
      the height the page gains after it: the demos are iframes and the page
      carries photographs, so a position near the bottom is out of reach until
      they arrive. `scroll-behavior: auto` for the same reason it is set there,
      and the two-argument `scrollTo`, since `behavior: "instant"` throws where
      it is not recognised.
    */
    const timers = [];
    if (reloaded && saved > 0) {
      const root = document.documentElement;
      const behaviour = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";

      const restore = () => {
        if (Math.abs(window.scrollY - saved) > 2) window.scrollTo(0, saved);
      };
      restore();
      [100, 300, 700, 1200].forEach((delay) => timers.push(window.setTimeout(restore, delay)));
      timers.push(
        window.setTimeout(() => {
          root.style.scrollBehavior = behaviour;
        }, 1400)
      );
    }

    /*
      Saved on a timestamp rather than on an animation frame. A frame callback
      is the usual way to throttle a scroll handler, and it is the wrong one
      here: a browser that is not painting does not run it, and Safari in an
      automation window does exactly that, so nothing was ever written. The
      last position is caught by `pagehide`, which fires on the way out of the
      page whatever the reason.
    */
    const save = () => write(Math.round(window.scrollY));
    let last = 0;
    const onScroll = () => {
      const now = Date.now();
      if (now - last < 100) return;
      last = now;
      save();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", save);
    window.addEventListener("visibilitychange", save);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", save);
      window.removeEventListener("visibilitychange", save);
      timers.forEach((timer) => window.clearTimeout(timer));
      if (previous) window.history.scrollRestoration = previous;
    };
  }, []);

  return null;
}

export default KeepScroll;
