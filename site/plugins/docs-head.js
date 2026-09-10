import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { parse as parseYaml } from "yaml";

import { headFor, headToHtml } from "../src/docs/head.js";
import { suffixFor } from "../src/content/sections.js";

/*
  Writes each content page's head into the file the build generates.

  The tags come from the same `headFor` the browser uses, so what a crawler
  reads and what the tab shows after a client-side navigation cannot disagree.
  See src/docs/head.js for why there is no head library involved.

  Any section under content/ is read, not just content/docs. Before this the
  lookup was hardcoded to that one folder and every other route fell through to
  null, which does not mean "no head": it means the generated file keeps the
  whole of index.html's, including the canonical that names the home page. A
  page in a section nobody had wired up would have declared itself a duplicate
  of the landing page, which is the same defect the 404 page had.

  The marketing pages keep index.html's head on purpose, because that one was
  written by hand.
*/

const CONTENT = fileURLToPath(new URL("../content", import.meta.url));

/*
  The route arrives without a leading slash -- "docs/aspect-ratio", not
  "/docs/aspect-ratio" -- so it is normalised before anything reads it. Getting
  that wrong is silent: the lookup finds no page, the head is left alone, and
  the file still builds.
*/
function normalise(route) {
  return `/${route}`.replace(/\/{2,}/g, "/").replace(/\/$/, "");
}

/*
  The two marketing routes that are not the landing page. Both were serving the
  landing page's title, description and canonical, so /playground declared
  itself a duplicate of / and had nothing of its own for a search result to
  show.
*/
const MARKETING = {
  "/playground": {
    page_title: "Playground",
    page_suffix: "Gerillass",
    page_description:
      "Write Sass against Gerillass in the browser and watch the CSS compile as you type. Pick a mixin, change its arguments, and share the result as a link.",
    page_keywords:
      "Sass playground, SCSS playground, compile Sass online, Gerillass playground, Sass mixin editor",
  },
};

function frontmatterFor(route) {
  const path = normalise(route);
  if (MARKETING[path]) return MARKETING[path];

  // /docs has no page of its own; it redirects to the introduction, so it
  // carries that page's head. The redirect itself is in routes.jsx.
  if (path === "/docs") return read("docs", "introduction");

  const location = /^\/([^/]+)(?:\/(.+))?$/.exec(path);
  if (!location) return null;

  const [, section, slug] = location;
  return read(section, slug ?? "index");
}

function read(section, slug) {
  const file = `${CONTENT}/${section}/${slug}.mdx`;
  if (!section || !slug || !existsSync(file)) return null;

  const source = readFileSync(file, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  /*
    The same defaulting routes.jsx does in the browser, so a page's title is
    the same string whether a crawler reads it out of the file or a reader
    arrives at it without a reload.
  */
  const frontmatter = parseYaml(match[1]);
  return { ...frontmatter, page_suffix: frontmatter.page_suffix ?? suffixFor(section) };
}

export default function docsHead(route, html) {
  /*
    The not-found page takes index.html's head like any other generated file,
    and that head says the page is canonical to the home page -- which would
    tell a crawler that every wrong address on the site is the home page. It
    gets neither a canonical nor a place in an index instead.
  */
  if (normalise(route) === "/404") {
    return html
      .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>\s*/i, "")
      .replace(
        "</head>",
        '  <meta name="robots" content="noindex">\n  </head>'
      );
  }

  const frontmatter = frontmatterFor(route);
  if (!frontmatter?.page_title) return html;

  const head = headFor(frontmatter, `${normalise(route)}/`);

  /*
    index.html carries the marketing site's own title, description and Open
    Graph tags. Left in place they would sit above these, and a crawler
    reading the first of two would take the wrong one -- so the ones being
    replaced come out first. Everything else in that head stays: the analytics,
    the fonts, the icons.
  */
  const replaced = new Set([
    ...head.tags.map((t) => (t.name ? `name=${t.name}` : `property=${t.property}`)),
    "rel=canonical",
  ]);

  let out = html.replace(/<title>[\s\S]*?<\/title>\s*/i, "");
  out = out.replace(/<(meta|link)\b[^>]*>/gi, (tag) => {
    const name = tag.match(/\bname=["']([^"']+)["']/i);
    const property = tag.match(/\bproperty=["']([^"']+)["']/i);
    const rel = tag.match(/\brel=["']([^"']+)["']/i);
    const key = name
      ? `name=${name[1]}`
      : property
        ? `property=${property[1]}`
        : rel
          ? `rel=${rel[1]}`
          : null;
    return key && replaced.has(key) ? "" : tag;
  });

  // A function, not a string: a title or description carrying `$&` would
  // otherwise be read as "the matched substring". See scripts/prerender.mjs.
  return out.replace("</head>", () => `  ${headToHtml(head)}\n  </head>`);
}
