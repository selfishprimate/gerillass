import { build } from "vite";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import docsHead from "../plugins/docs-head.js";
import writeSiteMetadata from "../plugins/site-metadata.js";
import writeCsp from "../plugins/csp.js";

/*
  Static generation, in one file.

  This replaces vite-react-ssg, which cannot be used with React Router 7: it
  imports `react-router-dom/server.js`, a subpath v7 removed. Its own README
  now points at React Router's built-in prerendering instead -- but that only
  emits `<path>/index.html`, which on Netlify answers at both `/docs/adaptive`
  and `/docs/adaptive/` with a 200. Two live URLs for every page is not a
  trade worth making while a documentation move is being crawled, so the
  filenames stay flat and this script writes them.

  What it does is small because the site asks for little: no loaders, no
  actions, no server, no data. Build the client, build the same routes for
  Node, render each path, put the markup where the empty div was.
*/

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "dist");
const ssrDir = join(root, ".prerender");

/* The one place the two builds have to agree. */
const ROOT_DIV = '<div id="root"></div>';
/* The opening tag alone: after the markup goes in, ROOT_DIV is no longer there
   to count, and the corruption this guards against injects a whole one. */
const ROOT_OPEN = '<div id="root">';

async function main() {
  console.log("prerender: istemci paketi");
  await build({ root, build: { outDir: "dist", emptyOutDir: true } });

  console.log("prerender: sunucu paketi");
  await build({
    root,
    build: {
      ssr: "src/entry-server.jsx",
      outDir: ".prerender",
      emptyOutDir: true,
      /*
        react-syntax-highlighter reaches for its themes without file
        extensions, which Node refuses, so it is bundled rather than handed to
        Node's resolver.
      */
      rollupOptions: { output: { format: "esm" } },
    },
    ssr: { noExternal: ["react-syntax-highlighter"] },
  });

  const { render, routes } = await import(join(ssrDir, "entry-server.js"));
  const template = readFileSync(join(outDir, "index.html"), "utf8");

  if (!template.includes(ROOT_DIV)) {
    throw new Error(
      `prerender: index.html'de ${ROOT_DIV} yok. Kabuk değiştiyse bu betik de değişmeli.`
    );
  }

  const paths = collect(routes);
  let yazilan = 0;

  for (const path of paths) {
    const markup = await render(path);
    // A redirect route, handled at the edge rather than written as a file.
    if (markup === null) continue;

    /*
      The replacement is a function on purpose. As a string, String.replace
      reads `$&` in it as "the matched substring", and the markup is a whole
      rendered page: a documentation example containing `data-currency="$"`
      puts a `$` against the `&` of `&quot;`, and the built file got
      `<div id="root"></div>` spliced into the middle of an attribute. Silent,
      and it shipped. A function replacement is never scanned for `$`.
    */
    const page = template.replace(ROOT_DIV, () => `<div id="root">${markup}</div>`);
    const html = docsHead(path.replace(/^\//, ""), page);

    /*
      And checked rather than trusted, because that defect looked like a
      corrupted page rather than a build error. One container per file, always.
    */
    const roots = html.split(ROOT_OPEN).length - 1;
    if (roots !== 1) {
      throw new Error(`prerender: ${path} icinde ${roots} adet ${ROOT_OPEN} var, 1 olmali.`);
    }

    const file = join(outDir, path === "/" ? "index.html" : `${path.replace(/^\//, "")}.html`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html, "utf8");
    yazilan++;
  }

  console.log(`prerender: ${yazilan} sayfa yazildi`);

  const { adres, llms, tarih } = writeSiteMetadata(outDir);
  console.log(`sitemap.xml: ${adres} adres, lastmod ${tarih}. llms.txt: ${llms ? "yazildi" : "kaynak yok"}.`);

  /*
    After the pages, because the policy names the hash of the inline scripts in
    them and checks that every page carries the same ones.
  */
  const { hashes } = writeCsp(outDir);
  console.log(`_headers: CSP yazildi, ${hashes} inline script hash'i.`);

  rmSync(ssrDir, { recursive: true, force: true });
}

/*
  Every path the route table can answer, flattened. The wildcard is skipped --
  it matches everything, so it has no one address to write -- and /404 carries
  the page it renders instead.
*/
function collect(routes, prefix = "") {
  const out = [];
  for (const route of routes) {
    if (route.path === "*") continue;
    const path = route.index
      ? prefix || "/"
      : `${prefix}/${route.path}`.replace(/\/{2,}/g, "/");
    if (route.element || route.lazy || route.Component) out.push(path);
    if (route.children) out.push(...collect(route.children, path === "/" ? "" : path));
  }
  return [...new Set(out)];
}

await main();
