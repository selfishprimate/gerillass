import { createContext, useContext } from "react";

import manifest from "../../../gerillass.json";
import { pages } from "virtual:docs-index";

/*
  The two places a page can send you: the member's source, and the page's own
  markdown.

  The page's slug is not always the member's name -- validate-scissors
  documents validateScissors -- and virtual:docs-index has already done that
  matching to build the sidebar, so this reads its answer rather than
  reimplementing the same rule.

  Both live in this repository, the library at the root and the site under
  site/, which is why one link is a path into scss/ and the other into
  site/content/.
*/

const REPO = "https://github.com/selfishprimate/gerillass";

const FILES = new Map(
  pages
    .filter((page) => page.member)
    .map((page) => [page.slug, manifest.members.find((m) => m.name === page.member)?.file])
);

export function linksFor(slug) {
  const file = FILES.get(slug);

  return {
    source: file ? `${REPO}/blob/main/${file}` : null,
    // GitHub's own editor, which offers a fork to anybody without write access
    // rather than turning them away.
    edit: `${REPO}/edit/main/site/content/docs/${slug}.mdx`,
  };
}

/*
  It travels by context because the two halves know different things: what
  renders the member's header is a component inside the page, while which page
  is being rendered is the route's business.
*/
export const DocsLinksContext = createContext(null);

export function useDocsLinks() {
  return useContext(DocsLinksContext);
}
