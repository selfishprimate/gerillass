/*
  Every documentation page, found rather than listed.

  A page is an .mdx file under content/docs, and its filename is its URL. That
  is the whole registration step: adding a page means adding a file, and there
  is no second list to forget. With 76 members to port, a hand-kept array would
  have gone stale on about the third one.

  The glob has to be a literal for Vite to see it, so it cannot be built from a
  variable no matter how tempting that looks.
*/
const modules = import.meta.glob("../../content/docs/*.mdx");

export const pages = Object.entries(modules)
  .map(([file, load]) => ({
    slug: file.slice(file.lastIndexOf("/") + 1, -".mdx".length),
    load,
  }))
  .sort((a, b) => a.slug.localeCompare(b.slug));

export default pages;
