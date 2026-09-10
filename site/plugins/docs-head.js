import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { parse as parseYaml } from "yaml";

import { headFor, headToHtml } from "../src/docs/head.js";

/*
  Writes each documentation page's head into the file the build generates.

  The tags come from the same `headFor` the browser uses, so what a crawler
  reads and what the tab shows after a client-side navigation cannot disagree.
  See src/docs/head.js for why there is no head library involved.

  Only the documentation routes are touched. The marketing pages keep the head
  index.html gives them, which is the one somebody wrote by hand.
*/

const CONTENT = fileURLToPath(new URL("../content/docs", import.meta.url));

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
  // /docs redirects to the introduction, so it carries the same head.
  const path = normalise(route);
  if (MARKETING[path]) return MARKETING[path];
  if (path === "/docs") return read("introduction");

  const slug = path.replace(/^\/docs\//, "");
  if (slug === path) return null;
  return read(slug);
}

function read(slug) {
  const file = `${CONTENT}/${slug}.mdx`;
  if (!slug || !existsSync(file)) return null;

  const source = readFileSync(file, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? parseYaml(match[1]) : null;
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

  return out.replace("</head>", `  ${headToHtml(head)}\n  </head>`);
}
