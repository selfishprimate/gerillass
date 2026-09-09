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

function frontmatterFor(route) {
  const slug = normalise(route).replace(/^\/docs\//, "");
  if (slug === normalise(route)) return null;
  const file = `${CONTENT}/${slug}.mdx`;
  if (!slug || !existsSync(file)) return null;

  const source = readFileSync(file, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? parseYaml(match[1]) : null;
}

export default function docsHead(route, html) {
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
