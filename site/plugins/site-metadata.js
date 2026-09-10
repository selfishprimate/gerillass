import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { execFileSync } from "node:child_process";

/*
  The files a crawler asks for that no page produces: sitemap.xml and llms.txt.

  Both are generated from what the build actually emitted rather than kept by
  hand. The sitemap that was here listed one URL, dated 2020, on a hostname the
  site no longer canonicalises to; there are 84 pages now.
*/

const SITE = "https://gerillass.com";
const LLMS = fileURLToPath(new URL("../../llms.txt", import.meta.url));
const ROOT = fileURLToPath(new URL("../..", import.meta.url));

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

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

/*
  When each page last changed, from the history rather than from the clock.

  Every URL used to carry the date of the build, which says the whole site
  changed every time any of it did. A lastmod a crawler cannot trust is one it
  ignores, and 82 identical dates that move together is exactly that.

  A documentation page's date is the last commit that touched its .mdx. The two
  marketing pages have no single file behind them, so they take the last commit
  that touched the app or index.html, which is what would change them.

  A shallow clone has no history to read, and every file would come back with
  the date of the one commit it has. That is worse than the build date because
  it looks specific, so it falls back instead. Netlify clones deep enough today
  and this is checked rather than assumed.
*/
function history(stamp) {
  try {
    if (git(["rev-parse", "--is-shallow-repository"]).trim() === "true") return null;

    const dates = new Map();
    let date = null;
    /*
      One walk rather than a call per file: the date line comes first and every
      path under it belongs to that commit, so the first time a path appears is
      the last time it changed.
    */
    for (const line of git(["log", "--pretty=format:%cs", "--name-only", "--", "site/content/docs"]).split("\n")) {
      const text = line.trim();
      if (!text) continue;
      if (/^\d{4}-\d{2}-\d{2}$/.test(text)) { date = text; continue; }
      if (date && !dates.has(text)) dates.set(text, date);
    }
    if (!dates.size) return null;

    const app = git(["log", "-1", "--pretty=format:%cs", "--", "site/src", "site/index.html"]).trim();
    return { dates, app: /^\d{4}-\d{2}-\d{2}$/.test(app) ? app : stamp };
  } catch {
    // No git, or no repository: the build date is still better than nothing.
    return null;
  }
}

function sitemap(paths, stamp, changed) {
  const when = (path) => {
    if (!changed) return stamp;
    const slug = path.startsWith("/docs/") ? path.slice("/docs/".length) : null;
    if (slug) return changed.dates.get(`site/content/docs/${slug}.mdx`) ?? changed.app;
    return changed.app;
  };

  const urls = paths
    .sort()
    .map(
      (p) =>
        `  <url>\n    <loc>${SITE}${p === "/" ? "/" : p}</loc>\n    <lastmod>${when(p)}</lastmod>\n  </url>`
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
  const changed = history(stamp);

  writeFileSync(`${outDir}/sitemap.xml`, sitemap(paths, stamp, changed));

  const text = llms();
  if (text) writeFileSync(`${outDir}/llms.txt`, text);

  return { adres: paths.length, llms: Boolean(text), tarih: changed ? "gecmisten" : "build tarihi" };
}
