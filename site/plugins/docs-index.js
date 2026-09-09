import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { parse as parseYaml } from "yaml";

/*
  The list of documentation pages, as a module the browser can import.

  The sidebar needs a title and a kind for all 76 pages at once, and the pages
  themselves are loaded lazily so that a reader downloads one of them rather
  than all of them. Importing them to read their front matter would undo that
  entirely, so the front matter is read here, at build time, and what reaches
  the browser is 76 short strings.

  The kind comes from gerillass.json rather than from the page, because that is
  where it is already recorded and a page repeating it could disagree with it.
*/

const VIRTUAL = "virtual:docs-index";
const RESOLVED = `\0${VIRTUAL}`;

const CONTENT = fileURLToPath(new URL("../content/docs", import.meta.url));
const MANIFEST = fileURLToPath(new URL("../../gerillass.json", import.meta.url));

// A function's page is kebab-case while the function is camelCase, which is
// the naming rule the library itself follows: clearUnit lives at /clear-unit/.
const camel = (slug) => slug.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function build() {
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const members = new Map(manifest.members.map((m) => [m.name, m]));

  const pages = readdirSync(CONTENT)
    .filter((f) => f.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const source = readFileSync(`${CONTENT}/${file}`, "utf8");
      const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      const frontmatter = match ? parseYaml(match[1]) : {};

      const name = members.has(slug) ? slug : camel(slug);
      const member = members.get(name);

      if (!member) {
        throw new Error(
          `content/docs/${file} documents "${slug}", which is not in gerillass.json. ` +
            `Either the member was renamed or removed, or the page is misnamed.`
        );
      }

      // The summary is the manifest's, not the page's, for the same reason the
      // kind is: it is already written down once and tested against the library.
      return {
        slug,
        title: frontmatter.title || slug,
        kind: member.kind,
        member: name,
        summary: member.summary,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  /*
    And the other direction. A page with no member fails above; a member with no
    page would simply not be listed, which is invisible -- the sidebar would
    look complete and the member would be undocumented. This is the same shape
    of gap as the playground's member menu, which has been three mixins short
    since 2.1.0 and nothing said so.
  */
  const documented = new Set(pages.map((p) => p.member));
  const undocumented = [...members.keys()].filter((name) => !documented.has(name));

  if (undocumented.length) {
    /*
      Printed as well as thrown. An error raised from a plugin's load hook is
      swallowed by vite-react-ssg, which reports "An internal error occurred"
      and nothing else -- so a guard that only throws stops the build while
      telling whoever is looking at it that the tool is broken.
    */
    const message =
      `${undocumented.length} member(s) in gerillass.json have no page under ` +
      `content/docs: ${undocumented.join(", ")}.\n` +
      `Add the page, or the sidebar will look complete while the member is ` +
      `undocumented.`;

    console.error(`\n[gerillass-docs-index] ${message}\n`);
    throw new Error(message);
  }

  return `export const pages = ${JSON.stringify(pages)};\nexport default pages;\n`;
}

export default function docsIndex() {
  let server;

  return {
    name: "gerillass-docs-index",
    configureServer(s) {
      server = s;
    },
    resolveId(id) {
      return id === VIRTUAL ? RESOLVED : null;
    },
    load(id) {
      return id === RESOLVED ? build() : null;
    },
    /*
      Adding or renaming a page changes this module without changing any file
      it imports, so nothing would reload it. Front matter edits count too: the
      title in the sidebar comes from there.
    */
    handleHotUpdate({ file }) {
      if (!file.endsWith(".mdx")) return;
      const mod = server?.moduleGraph.getModuleById(RESOLVED);
      if (mod) server.moduleGraph.invalidateModule(mod);
    },
  };
}
