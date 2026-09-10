/*
  Every page the site builds from markdown, found rather than listed.

  A page is an .mdx file inside a section folder under content/, and its URL is
  the folder plus the filename: content/docs/counter.mdx is /docs/counter. That
  is the whole registration step, so adding a page means adding a file and
  there is no second list to forget. With 76 members to port, a hand-kept array
  would have gone stale on about the third one.

  The glob has to be a literal for Vite to see it, so it cannot be built from a
  variable no matter how tempting that looks. The wildcard in the middle is
  what lets a second section -- content/blog -- be picked up without this file
  changing; see sections.js.
*/
const modules = import.meta.glob("../../content/*/*.mdx");

const LOCATION = /\/content\/([^/]+)\/([^/]+)\.mdx$/;

export const pages = Object.entries(modules)
  .map(([file, load]) => {
    const [, section, slug] = LOCATION.exec(file);
    /*
      index.mdx is a section's own landing page, so it is /docs rather than
      /docs/index. content/docs has none: /docs redirects to the introduction
      instead, which routes.jsx carries.
    */
    return { section, slug, path: slug === "index" ? section : `${section}/${slug}`, load };
  })
  .sort((a, b) =>
    a.section === b.section ? a.slug.localeCompare(b.slug) : a.section.localeCompare(b.section)
  );

export default pages;
