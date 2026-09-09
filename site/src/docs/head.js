/*
  What a documentation page's head should contain, from its front matter.

  One function, used twice: the build calls it to write the tags into each
  generated HTML file, and the browser calls it to keep the head right when
  somebody navigates between pages without a reload. Both read the same front
  matter, so the two can never disagree.

  There is no head library here on purpose. react-helmet-async, which
  vite-react-ssg uses for this, does not apply in this app at all: neither its
  <Head> nor a <Helmet> inside its own <HelmetProvider> sets the title, on
  1.3.0 or 2.0.5, and it leaves no data-rh marks, so its side effects never
  run. Effects do run -- a plain `document.title = ...` in the same component
  works, so hydration and the DOM are fine. Rather than keep guessing at an
  archived dependency, the twenty lines it was there for are written out.
*/

export const SITE = "https://gerillass.com";

/*
  The head for /docs itself. That page is generated from the manifest rather
  than written as markdown, so it has no front matter of its own -- and without
  this it would fall through to the one index.html carries, and the landing
  page of the documentation would be titled after the marketing site.
*/
export const INDEX_FRONTMATTER = {
  title: "Documentation",
  // headFor appends "· Gerillass Documentation", so a page_title of
  // "Documentation" would have the word twice in one tab.
  page_title: "Every Mixin and Function",
  page_description:
    "Every mixin and function in Gerillass, with what each one does, the arguments it takes and the CSS it emits.",
  page_keywords:
    "Gerillass documentation, Sass mixins, Sass functions, SCSS library reference, CSS mixin library",
};

export function headFor(frontmatter, path) {
  const url = `${SITE}${path}`;
  const title = `${frontmatter.page_title} · Gerillass Documentation`;
  const description = frontmatter.page_description;

  const tags = [
    { name: "description", content: description },
    { property: "og:type", content: "product" },
    { property: "og:site_name", content: "Gerillass" },
    { property: "og:title", content: `Gerillass: ${frontmatter.page_title}` },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@gerillass" },
    { name: "twitter:creator", content: "@selfishprimate" },
  ];

  if (frontmatter.page_keywords) {
    tags.push({ name: "keywords", content: frontmatter.page_keywords });
  }

  // Every documentation page has its own preview image, and the pages this
  // replaces carry one each. A page without one would take the site's, which
  // is worse than none: 76 links sharing a single picture.
  if (frontmatter.page_image) {
    tags.push(
      { property: "og:image", content: `${SITE}/images/docs/${frontmatter.page_image}` },
      { property: "og:image:alt", content: `Gerillass: ${frontmatter.page_title}` }
    );
  }

  // The documentation pages have never emitted one; the marketing site does.
  const links = [{ rel: "canonical", href: url }];

  return { title, tags, links };
}

/*
  As HTML, for the build. `data-docs-head` is what marks these as ours, so the
  same attribute can find and replace them in the browser instead of a second
  set piling up underneath the first.
*/
export function headToHtml(head) {
  const escape = (value) =>
    String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  const lines = [`<title data-docs-head>${escape(head.title)}</title>`];

  for (const tag of head.tags) {
    const key = tag.name ? "name" : "property";
    lines.push(
      `<meta data-docs-head ${key}="${escape(tag[key])}" content="${escape(tag.content)}">`
    );
  }
  for (const link of head.links) {
    lines.push(`<link data-docs-head rel="${escape(link.rel)}" href="${escape(link.href)}">`);
  }

  return lines.join("\n    ");
}
