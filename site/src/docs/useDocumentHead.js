import { useEffect } from "react";

import { headFor } from "./head";

/*
  Keeps the document head right while somebody moves between pages without a
  reload. The build has already written these tags into the file, so this is
  not what a crawler or a link preview reads -- it is what keeps the browser
  tab and the history entry honest after a client-side navigation.

  It replaces rather than appends. Every tag it writes carries
  `data-docs-head`, so the ones from the last page are removed first and a
  second set never piles up under the first.
*/
export default function useDocumentHead(frontmatter, path) {
  useEffect(() => {
    if (!frontmatter?.page_title) return undefined;

    const head = headFor(frontmatter, path);
    const previous = document.title;

    for (const stale of document.head.querySelectorAll("[data-docs-head]")) {
      stale.remove();
    }

    /*
      index.html carries the marketing site's own description, Open Graph tags
      and canonical link. The build strips the ones a documentation page
      replaces, but only from that page's file -- arriving here from the
      landing page instead means those tags are already in the document, and
      appending ours beside them leaves two of each. Two canonicals is the one
      that matters: a crawler running the page would be told the page is
      canonical to itself and to the home page at the same time.

      So they are taken out and put back on the way out, rather than removed,
      because the marketing routes still need them.
    */
    const keys = new Set([
      ...head.tags.map((t) => (t.name ? `meta[name="${t.name}"]` : `meta[property="${t.property}"]`)),
      ...head.links.map((l) => `link[rel="${l.rel}"]`),
    ]);

    const displaced = [];
    for (const selector of keys) {
      for (const el of document.head.querySelectorAll(selector)) {
        if (el.hasAttribute("data-docs-head")) continue;
        displaced.push([el, el.nextSibling, el.parentNode]);
        el.remove();
      }
    }

    document.title = head.title;

    const written = [];
    const write = (name, attributes) => {
      const el = document.createElement(name);
      el.setAttribute("data-docs-head", "");
      for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
      document.head.appendChild(el);
      written.push(el);
    };

    for (const tag of head.tags) {
      const key = tag.name ? "name" : "property";
      write("meta", { [key]: tag[key], content: tag.content });
    }
    for (const link of head.links) {
      write("link", { rel: link.rel, href: link.href });
    }

    return () => {
      // Leaving a page restores what index.html had, so the marketing routes
      // do not inherit a mixin's title, description or canonical on the way
      // back. The tags go back where they were, not merely back into the head.
      document.title = previous;
      for (const el of written) el.remove();
      for (const [el, before, parent] of displaced) parent.insertBefore(el, before);
    };
  }, [frontmatter, path]);
}
