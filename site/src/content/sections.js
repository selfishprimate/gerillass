/*
  A section is a folder of .mdx files under content/, and its folder name is
  the first segment of the URL: content/docs/counter.mdx is /docs/counter.

  content/docs is the only section today. content/blog would be the next one,
  and the point of this file is that it would arrive without the head, the
  routes or the sitemap being rewritten for it -- what a section is called in
  a title is derived here, and what renders its pages is one line in
  routes.jsx.

  The name in a title is the folder name in title case, so blog becomes
  "Gerillass Blog" on its own. NAMES is only for a folder whose title case
  would read wrong.
*/

export const BRAND = "Gerillass";

const NAMES = {
  /*
    Empty on purpose. "docs" already title-cases to "Docs", which is what the
    header menu and the URL both say. An entry here is what a section adds
    when its folder name is not the word it wants in a title.
  */
};

function titleCase(section) {
  return section
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/*
  What follows the brand in a page's title.

  A page that belongs to no section -- the landing page, the playground --
  carries the brand on its own, which is what a null section returns. That is
  deliberate: the brand goes first only on the home page, because that page is
  the brand. Everywhere else the distinguishing words come first, so a result
  and a browser tab can be told apart before either is truncated.
*/
export function suffixFor(section) {
  if (!section) return BRAND;
  return `${BRAND} ${NAMES[section] ?? titleCase(section)}`;
}
