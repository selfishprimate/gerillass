import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { fileURLToPath, URL } from "node:url";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const SRC = fileURLToPath(new URL("./src", import.meta.url));

// The site create-react-app used to build. Two of its conventions do not
// survive the move and are replaced here rather than in the source:
//
//   absolute imports   `import Header from "components/Header"` worked because
//                      jsconfig.json set baseUrl to ./src. Vite needs the alias
//                      spelled out.
//   %PUBLIC_URL%       replaced with a plain / in index.html, which is where
//                      Vite serves public/ from.
//   SVG components     `ReactComponent` imports, handled by vite-plugin-svgr.
//
// A third convention was fixed in the source rather than here: create-react-app
// allowed JSX inside .js files and Vite does not, so the files carrying JSX were
// renamed to .jsx. Content is untouched, and git records them as renames.
export default defineConfig({
  // create-react-app turned `import { ReactComponent as X } from "./a.svg"`
  // into a component through SVGR. vite-plugin-svgr is the same thing, and
  // exportAsDefault stays off so the existing named import keeps working.
  plugins: [react(), svgr()],
  // create-react-app let the source import from the top of src/ without a
  // relative path -- `components/Header`, `release` -- because jsconfig.json set
  // baseUrl there. Vite needs it spelled out, and spelling it out by hand goes
  // stale the first time somebody adds a folder, so every top-level entry in
  // src/ becomes an alias.
  resolve: {
    alias: readdirSync(SRC).map((entry) => ({
      find: new RegExp(`^${entry.replace(/\.jsx?$/, "")}(?=/|$)`),
      replacement: join(SRC, entry.replace(/\.jsx?$/, "")),
    })),
  },
  css: {
    preprocessorOptions: {
      scss: {
        // `@import "gerillass"` used to resolve out of node_modules, and the
        // source carries a commented-out relative path to a sibling checkout
        // for local work. Neither is needed now: the library is upstairs, so
        // the site always builds against the version it ships beside.
        loadPaths: [fileURLToPath(new URL("../scss", import.meta.url))],
      },
    },
  },
  build: { outDir: "dist" },
});
