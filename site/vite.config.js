import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import sassExample from "./plugins/sass-example.js";
import docsIndex from "./plugins/docs-index.js";
import docsHead from "./plugins/docs-head.js";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkCompileExamples from "./plugins/remark-compile-examples.js";
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
  plugins: [
    // Before the React plugin: it hands .mdx over as JSX for React to compile.
    {
      enforce: "pre",
      ...mdx({
        // Without this, a page has to import every component it uses before its
        // first sentence. With it they come from MDXProvider, so a page stays
        // content and nothing else.
        providerImportSource: "@mdx-js/react",
        remarkPlugins: [
          remarkFrontmatter,
          // Front matter becomes an exported `frontmatter` object, which is
          // where a page's title, description and preview image come from.
          [remarkMdxFrontmatter, { name: "frontmatter" }],
          remarkCompileExamples,
        ],
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    svgr(),
    sassExample(),
    docsIndex(),
  ],
  // create-react-app let the source import from the top of src/ without a
  // relative path -- `components/Header`, `release` -- because jsconfig.json set
  // baseUrl there. Vite needs it spelled out, and spelling it out by hand goes
  // stale the first time somebody adds a folder, so every top-level entry in
  // src/ becomes an alias.
  resolve: {
    /*
      One copy of each of these, or a context provider and its consumer end up
      in different module instances and the consumer silently sees no provider.
      react-helmet-async is the one that showed it: <Head> rendered, threw
      nothing, and the document kept index.html's title.
    */
    dedupe: ["react", "react-dom", "react-helmet-async", "react-router-dom"],
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
  // Static generation runs the app in Node, which resolves modules more
  // strictly than a bundler does. react-syntax-highlighter's ESM build imports
  // its themes without file extensions, which Node refuses, so Vite bundles it
  // for the server pass rather than handing it to Node's resolver.
  // Each documentation route gets its own head written into the file the
  // build generates. See plugins/docs-head.js.
  ssgOptions: {
    onPageRendered: (route, renderedHTML) => docsHead(route, renderedHTML),
  },
  ssr: { noExternal: ["react-syntax-highlighter"] },
  build: { outDir: "dist" },
});
