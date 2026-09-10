import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

/*
  The files a crawler asks for that no page produces: sitemap.xml and llms.txt.

  Both are generated from what the build actually emitted rather than kept by
  hand. The sitemap that was here listed one URL, dated 2020, on a hostname the
  site no longer canonicalises to; there are 84 pages now.
*/

const SITE = "https://gerillass.com";
const LLMS = fileURLToPath(new URL("../../llms.txt", import.meta.url));

/*
  The library generates llms.txt for the package, and its links still point at
  docs.gerillass.com because that is what gerillass.json records as the
  documentation URL. The pages are here now, so the host is rewritten on the
  way in. This falls away when the manifest's `documentation` field moves with
  the domain.
*/
function llms() {
  if (!existsSync(LLMS)) return null;
  return readFileSync(LLMS, "utf8")
    .replace(/https:\/\/docs\.gerillass\.com\/docs\/([a-z0-9-]+)\/?/g, `${SITE}/docs/$1`)
    .replace(/https:\/\/docs\.gerillass\.com/g, `${SITE}/docs`);
}

// Every .html the build wrote, as the path a reader visits.
function routes(dir, prefix = "") {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (statSync(full).isDirectory()) {
      if (entry !== "assets") out.push(...routes(full, `${prefix}/${entry}`));
    } else if (entry.endsWith(".html")) {
      const name = entry.replace(/\.html$/, "");
      out.push(name === "index" ? `${prefix}/` : `${prefix}/${name}`);
    }
  }
  return out;
}

function sitemap(paths, stamp) {
  const urls = paths
    .sort()
    .map(
      (p) =>
        `  <url>\n    <loc>${SITE}${p === "/" ? "/" : p}</loc>\n    <lastmod>${stamp}</lastmod>\n  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/*
  Called after the prerender has written every page, which is the only moment
  the full list exists: as a Vite plugin this ran at the end of the client
  build and found three files, because the pages are written afterwards. It is
  called from scripts/prerender.mjs instead, once the last file is on disk.
*/
export default function writeSiteMetadata(outDir) {
  /*
    What a crawler is invited to, which is not the same as what the build
    wrote. Three kinds are held back:

    - /docs has no page of its own; it redirects.
    - the demo pages under /icons belong to the icon font, copied in with it.
    - /404 is a page the server hands back when there is nothing to hand back,
      so listing it would be inviting a crawler to index the absence of pages.
      They are not routes of this site and nothing links to them.
  */
  const paths = routes(outDir).filter(
    (p) => p !== "/docs" && p !== "/404" && !p.startsWith("/icons/")
  );
  const stamp = new Date().toISOString().slice(0, 10);

  writeFileSync(`${outDir}/sitemap.xml`, sitemap(paths, stamp));

  const text = llms();
  if (text) writeFileSync(`${outDir}/llms.txt`, text);

  return { adres: paths.length, llms: Boolean(text) };
}
