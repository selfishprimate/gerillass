import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/*
  What the site reports to Analytics: one page view per navigation, one scroll
  depth per page, and one event per link that leaves the domain.

  All three are sent from here rather than left to the tag's own enhanced
  measurement, and that is deliberate. The site used to be two Hugo builds,
  where every link was a document load and the browser counted the pages by
  itself. It is one app now: 82 routes, and only the first arrival is a real
  page load. Enhanced measurement is built around page loads, so on a router
  that never reloads it measures the first page and then goes quiet.

  Measured before it was written this way, with scrolls and outbound clicks
  switched on in the panel: the tag downloaded for this property carried both
  modules (`percent_scrolled` and `link_url` are in the bundle, while
  `file_extension`, `video_provider` and `form_id`, which were left off, are
  not), and neither event ever arrived. On the page,
  `google_tag_manager.autoEventsSettings` reported the link listener armed
  (`lcl.init: true`) and the scroll one never started (`sdl.init: false`, no
  thresholds registered). Rather than keep guessing at a black box, the two
  events are sent here, where they can be read.

  So the panel's Scrolls and Outbound clicks stay off. Turning them on again
  would count everything twice.
*/

/*
  Which part of the site a page belongs to. The documentation had a property of
  its own while it lived on its own subdomain; under one domain that
  distinction is a dimension rather than a second property, and this is it.
*/
function group(pathname) {
  if (pathname.startsWith("/docs")) return "Documentation";
  if (pathname.startsWith("/playground")) return "Playground";
  return "Marketing";
}

/* The depth GA4's own scroll measurement reports, so the two are comparable. */
const DEPTH = 0.9;

function Analytics() {
  const { pathname, search } = useLocation();
  const sent = useRef(null);

  useEffect(() => {
    if (typeof window.gtag !== "function") return;

    const path = `${pathname}${search}`;
    /*
      StrictMode runs an effect twice on mount in development, so the first
      page of every local session was reported twice and localhost data goes
      into the same property as everything else. Remembering the last path
      reported drops the repeat.

      It cannot swallow a real one: the effect only runs again when the path
      changes, and arriving back at a page after visiting another sets this to
      the other page in between.
    */
    if (sent.current === path) return;
    sent.current = path;

    /*
      The title comes from the page's own front matter, written by an effect in
      docs/useDocumentHead. This component is rendered after the outlet, and
      React runs sibling effects in tree order, so that one has already run and
      document.title is the new page's rather than the last one's.
    */
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
      content_group: group(pathname),
    });
  }, [pathname, search]);

  /*
    Scroll depth, once per page. The effect is keyed on the route, so every
    navigation arms a fresh one and a reader who reaches the end of four pages
    is counted four times.
  */
  useEffect(() => {
    if (typeof window.gtag !== "function") return undefined;

    let sent = false;
    let queued = false;

    const measure = () => {
      queued = false;
      if (sent) return;

      const doc = document.documentElement;
      /*
        A page that fits on the screen has no end to reach, and would otherwise
        report one the moment anything scrolled -- including the jump to the
        top that every navigation performs.
      */
      if (doc.scrollHeight - window.innerHeight < 1) return;
      if ((window.scrollY + window.innerHeight) / doc.scrollHeight < DEPTH) return;

      sent = true;
      window.removeEventListener("scroll", onScroll);
      window.gtag("event", "scroll", { percent_scrolled: DEPTH * 100 });
    };

    // Scrolling fires far more often than it needs measuring, and a frame is
    // the finest granularity the answer can change at.
    const onScroll = () => {
      if (sent || queued) return;
      queued = true;
      window.requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname, search]);

  /*
    Links that leave the domain. One listener for the life of the app: it is on
    the document rather than on the links, so pages replacing their own markup
    changes nothing, and it does not need re-arming per route.
  */
  useEffect(() => {
    const onClick = (event) => {
      if (typeof window.gtag !== "function") return;
      if (!(event.target instanceof Element)) return;

      const link = event.target.closest("a[href]");
      if (!link) return;

      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }

      // mailto:, tel: and the like are not outbound clicks, they are handoffs.
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      if (url.hostname === window.location.hostname) return;

      window.gtag("event", "click", {
        link_url: url.href,
        link_domain: url.hostname,
        link_text: (link.textContent || "").trim().slice(0, 100),
        outbound: true,
      });
    };

    /*
      Capture, so a handler that stops the event on its way up cannot hide the
      click from this. The names and parameters are GA4's own, so the reports
      that expect them keep working.
    */
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}

export default Analytics;
