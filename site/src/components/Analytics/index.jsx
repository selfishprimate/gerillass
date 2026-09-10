import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/*
  Sends one page view per navigation.

  The site used to be two Hugo builds, where every link was a document load and
  the browser counted the pages by itself. It is one app now: 82 routes, and
  only the first arrival is a real page load. Without this, Analytics would
  record the page somebody landed on and nothing they did afterwards.

  The tag in index.html is configured with `send_page_view: false`, so this
  sends the first one too. One code path, and it is this one.
*/

/*
  Which part of the site a page belongs to. The documentation used to live on
  its own subdomain and so had a property of its own; under one domain that
  distinction is a dimension rather than a second property, and this is it.
*/
function group(pathname) {
  if (pathname.startsWith("/docs")) return "Documentation";
  if (pathname.startsWith("/playground")) return "Playground";
  return "Marketing";
}

function Analytics() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;

    /*
      The title comes from the page's own front matter, written by an effect in
      docs/useDocumentHead. This component is rendered after the outlet, and
      React runs sibling effects in tree order, so that one has already run and
      document.title is the new page's rather than the last one's.
    */
    window.gtag("event", "page_view", {
      page_path: `${pathname}${search}`,
      page_location: window.location.href,
      page_title: document.title,
      content_group: group(pathname),
    });
  }, [pathname, search]);

  return null;
}

export default Analytics;
