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
      // do not inherit a mixin's title on the way back.
      document.title = previous;
      for (const el of written) el.remove();
    };
  }, [frontmatter, path]);
}
