import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import * as sass from "sass";

/*
  Compiles a Sass file against the library upstairs and hands back both halves
  of it: the source somebody wrote, and the CSS it produces.

      import example from "./aspect-ratio.scss?example";
      example.source  // the file as written
      example.css     // what the library compiles it to

  This exists so a documentation page cannot describe output the library does
  not produce. Today those blocks are typed into the markdown by hand -- 143 of
  them on docs.gerillass.com -- and nothing notices when a mixin changes
  underneath one. Here the page and the library are compiled together, so the
  block is the output or the build fails.

  `source` is the file as written rather than as compiled: the pair exists to
  show a reader the call they would make and the CSS it becomes, so the first
  half has to keep its comments and its formatting.

  The result is served under a virtual id rather than the original path. Vite
  decides what to do with a module by its extension and ignores the query, so
  a module whose id still contains `.scss` gets handed to the Sass compiler --
  which then meets the JavaScript this plugin returned and reports
  `expected "{"`.
*/

const QUERY = "?example";
const PREFIX = "\0gerillass-example:";
// The id has to stop looking like a stylesheet. Vite decides what to do with a
// module by the extension in its id and pays no attention to the query or to
// the null-byte prefix, so `...reset-css.scss` still reaches the Sass compiler
// even as a virtual module. The suffix is what keeps it out.
const SUFFIX = ".mjs";
const LIBRARY = fileURLToPath(new URL("../../scss", import.meta.url));

export default function sassExample() {
  return {
    name: "gerillass:sass-example",
    enforce: "pre",

    async resolveId(source, importer) {
      if (!source.endsWith(QUERY)) return null;
      const resolved = await this.resolve(source.slice(0, -QUERY.length), importer, {
        skipSelf: true,
      });
      return resolved ? PREFIX + resolved.id + SUFFIX : null;
    },

    load(id) {
      if (!id.startsWith(PREFIX)) return null;

      const file = id.slice(PREFIX.length, -SUFFIX.length);
      const source = readFileSync(file, "utf8");

      let css;
      try {
        css = sass.compile(file, {
          loadPaths: [LIBRARY],
          style: "expanded",
          // The library is not the subject of a page about it, so its own
          // deprecations are not this page's problem. if-function is the one it
          // still trips; see CLAUDE.md at the repository root.
          silenceDeprecations: ["if-function"],
        }).css;
      } catch (error) {
        // A failing example is a broken page, so it stops the build rather than
        // rendering an empty box. The message is Sass's own, which names the
        // file and the line.
        this.error(`Example failed to compile: ${file}\n\n${error.message}`);
      }

      return [
        `export const source = ${JSON.stringify(source.trimEnd())};`,
        `export const css = ${JSON.stringify(css.trimEnd())};`,
        `export default { source, css };`,
      ].join("\n");
    },

    // An example is compiled against the library, so editing a mixin has to
    // invalidate every example that used it. Watching the whole of scss/ is
    // coarse and correct; being precise would mean parsing the imports.
    configureServer(server) {
      server.watcher.add(LIBRARY);
      server.watcher.on("change", (path) => {
        if (!path.startsWith(LIBRARY)) return;
        for (const [id, mod] of server.moduleGraph.idToModuleMap) {
          if (id.startsWith(PREFIX)) server.moduleGraph.invalidateModule(mod);
        }
        server.ws.send({ type: "full-reload" });
      });
    },
  };
}
