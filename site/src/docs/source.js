import manifest from "../../../gerillass.json";
import { pages } from "virtual:docs-index";

/*
  Where a documented member's source lives.

  The page's slug is not always the member's name -- validate-scissors
  documents validateScissors -- and virtual:docs-index has already done that
  matching to build the sidebar, so this reads its answer rather than guessing
  at the same rule a second time.

  A guide has no member and gets nothing back, which is what keeps the link off
  the Installation and License pages.
*/

const REPO = "https://github.com/selfishprimate/gerillass/blob/main";

const FILES = new Map(
  pages
    .filter((page) => page.member)
    .map((page) => [page.slug, manifest.members.find((m) => m.name === page.member)?.file])
);

export default function sourceHref(slug) {
  const file = FILES.get(slug);
  return file ? `${REPO}/${file}` : null;
}
