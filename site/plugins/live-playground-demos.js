import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import * as sass from "sass";

/*
  The home page's playground section plays a loop of demos, typed out with the
  CSS they compile to. Nobody types into it, so nothing has to be compiled in
  the browser: this compiles the demos while the site is built, against the
  library beside it, and the page ships the pairs as data.

      import { demos, compiler } from "virtual:live-playground-demos";

  That keeps Dart Sass off the home page entirely (the full playground still
  loads it, on its own route), and it means the section cannot show CSS the
  library does not produce: a demo that fails to compile fails the build.

  The snippets come from the full playground's demos.json, which is generated
  from the documentation pages, so the section and the playground cannot
  disagree about what a mixin's example is. The `@use` line is compiled but not
  shown, the same as on the documentation pages.
*/

const ID = "virtual:live-playground-demos";
const RESOLVED = "\0" + ID;
const LIBRARY = fileURLToPath(new URL("../../scss", import.meta.url));
const DEMOS = fileURLToPath(
  new URL("../src/components/Playground/demos.json", import.meta.url)
);

/*
  The order they play in. Short ones, each a different kind of thing a mixin
  does: a shape, a clamp, a pseudo-element, a gradient, an accessibility rule,
  a position shorthand. Every one has to fit its pane without scrolling, which
  was measured by compiling them: none is over 16 lines of Sass or 12 of CSS.
*/
const PLAYLIST = [
  "circle",
  "line-clamp",
  "triangle",
  "text-gradient",
  "focus-ring",
  "position",
];

const USE = /^\s*@use\s+["']gerillass["'][^;]*;\s*/;

export default function livePlaygroundDemos() {
  return {
    name: "gerillass:live-playground-demos",

    resolveId(source) {
      return source === ID ? RESOLVED : null;
    },

    load(id) {
      if (id !== RESOLVED) return null;
      this.addWatchFile(DEMOS);

      const all = JSON.parse(readFileSync(DEMOS, "utf8"));
      const demos = PLAYLIST.map((name) => {
        const demo = all[name];
        if (!demo) {
          this.error(`live-playground-demos: "${name}" has no demo in demos.json`);
        }
        let css;
        try {
          css = sass.compileString(demo.scss, {
            loadPaths: [LIBRARY],
            style: "expanded",
            silenceDeprecations: ["if-function"],
          }).css;
        } catch (error) {
          this.error(`live-playground-demos: "${name}" failed to compile\n\n${error.message}`);
        }
        return {
          name,
          title: demo.title || name,
          source: demo.scss.replace(USE, "").trimEnd(),
          css: css.trimEnd(),
        };
      });

      // sass.info is "dart-sass\t1.104.0\t(Sass Compiler)..." on its first line.
      const version = String(sass.info).split("\n")[0].split("\t")[1];

      return [
        `export const demos = ${JSON.stringify(demos)};`,
        `export const compiler = ${JSON.stringify(`Dart Sass ${version}`)};`,
      ].join("\n");
    },

    // Editing a mixin changes what its demo compiles to.
    configureServer(server) {
      server.watcher.add(LIBRARY);
      server.watcher.on("change", (path) => {
        if (!path.startsWith(LIBRARY)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: "full-reload" });
        }
      });
    },
  };
}
