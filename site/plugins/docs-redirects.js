import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { parse as parseYaml } from "yaml";

/*
  Turns the `aliases` in a page's front matter into redirects in the built
  _redirects file.

  A page that replaces another one keeps the old URL working: aspect-ratio was
  written to replace ratio-box and responsive-video, so the two addresses those
  had on the documentation site have to land somewhere rather than 404. Hugo
  did this from the same front matter key, which is why the key is spelt the
  way it is -- the pages were converted with it already in them.

  The rules are written above the SPA fallback that public/_redirects holds,
  because Netlify takes the first rule that matches and `/*` matches
  everything.
*/

const CONTENT = fileURLToPath(new URL("../content/docs", import.meta.url));

// 301, not 302. These pages are not coming back: the mixins behind them were
// removed in 2.0.0, and a permanent redirect is what moves the ranking and the
// links across rather than leaving them pointing at a URL that has no page.
const STATUS = 301;

function collect() {
  const pages = new Set();
  const rules = [];
  const seen = new Map();

  const files = readdirSync(CONTENT).filter((f) => f.endsWith(".mdx"));
  for (const file of files) pages.add(file.replace(/\.mdx$/, ""));

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, "");
    const source = readFileSync(`${CONTENT}/${file}`, "utf8");
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const aliases = match ? parseYaml(match[1])?.aliases : null;
    if (!Array.isArray(aliases)) continue;

    for (const alias of aliases) {
      const from = `/${String(alias).replace(/^\/|\/$/g, "")}`;

      /*
        An alias that is also a real page would shadow it, and the page would
        become unreachable without anything failing. Worth stopping for: the
        way this happens is a member being brought back under its old name.
      */
      const collides = from.replace(/^\/docs\//, "");
      if (pages.has(collides)) {
        throw new Error(
          `content/docs/${file} claims the alias ${from}, but content/docs/${collides}.mdx ` +
            `is a page of its own. The redirect would make it unreachable.`
        );
      }

      const already = seen.get(from);
      if (already && already !== slug) {
        throw new Error(`${from} is claimed as an alias by both ${already} and ${slug}.`);
      }
      seen.set(from, slug);

      /*
        Both spellings on the left, since Netlify matches these literally and a
        link to the old page could have been written either way. One spelling
        on the right, without the trailing slash: the slash form is itself
        301'd to the bare one, so pointing at it would send anyone following an
        old link through two redirects instead of one.
      */
      rules.push(`${from}  /docs/${slug}  ${STATUS}!`);
      rules.push(`${from}/  /docs/${slug}  ${STATUS}!`);
    }
  }

  /*
    /docs has no page of its own: the documentation opens on its introduction.
    The router does the same thing for a reader already inside the app.
  */
  rules.push(`/docs  /docs/introduction  ${STATUS}!`);
  rules.push(`/docs/  /docs/introduction  ${STATUS}!`);

  return rules;
}

export default function docsRedirects() {
  let outDir = null;
  let isSsr = false;

  return {
    name: "gerillass-docs-redirects",
    apply: "build",

    configResolved(config) {
      outDir = config.build.outDir;
      isSsr = Boolean(config.build.ssr);
    },

    closeBundle() {
      // Only the client build copies public/ into the output, so it is the
      // only one with a _redirects file to prepend to.
      if (isSsr) return;

      const rules = collect();
      if (!rules.length) return;

      const target = `${outDir}/_redirects`;
      const existing = existsSync(target) ? readFileSync(target, "utf8").trimEnd() : "";

      const header = "# Generated from the `aliases` in each page's front matter.";
      const body = [header, ...rules, "", existing].join("\n");

      writeFileSync(target, `${body.trimEnd()}\n`);
      this.info?.(`${rules.length} alias yonlendirmesi yazildi.`);
    },
  };
}
