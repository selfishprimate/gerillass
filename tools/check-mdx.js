#!/usr/bin/env node
"use strict";

// Every documentation page has to parse as MDX.
//
// Nothing else here reads a page as MDX. `check-doc-errors.js` and the
// contact-sheet tooling both pull fences out with regular expressions, the
// library's suite never touches the site, and the site's own build is the only
// thing that would notice -- which is how `placeholder-shown.mdx` shipped a
// caption holding `\"` inside a JSX attribute on 28 September 2026. MDX refused
// the file, the dev server answered with an internal error, and every check in
// the repository still passed. The page was blank in a browser and nothing said
// why.
//
// This parses all 84 in about half a second, which is cheap enough to run in
// the suite. It only asks whether a page parses; what the page says is the job
// of the other checks.
//
// `@mdx-js/mdx` lives in `site/node_modules`, because the library itself needs
// no Node at all (see CLAUDE.md). A missing install is reported and skipped
// rather than failed, so the library's suite still runs in a checkout where
// `site` has no dependencies.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CONTENT = path.join(ROOT, "site", "content");
const MDX = path.join(ROOT, "site", "node_modules", "@mdx-js", "mdx", "index.js");

const pages = () => {
  const out = [];
  if (!fs.existsSync(CONTENT)) return out;
  for (const section of fs.readdirSync(CONTENT)) {
    const dir = path.join(CONTENT, section);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith(".mdx")) out.push(path.join(dir, file));
    }
  }
  return out;
};

const main = async () => {
  if (!fs.existsSync(MDX)) {
    console.log("check-mdx: site/node_modules has no @mdx-js/mdx; skipped.");
    return;
  }
  const mdx = await import(MDX);
  const files = pages();
  const problems = [];

  for (const file of files) {
    try {
      // `jsx: true` leaves the JSX in place rather than compiling it to calls,
      // which is what the site's own plugin does and is a little faster. A
      // parse error surfaces either way.
      await mdx.compile(fs.readFileSync(file, "utf8"), { jsx: true });
    } catch (error) {
      const where = error.line ? `:${error.line}:${error.column}` : "";
      problems.push(`${path.relative(ROOT, file)}${where}\n  ${String(error.message).split("\n")[0]}`);
    }
  }

  if (problems.length) {
    console.error(`${problems.length} of ${files.length} pages do not parse as MDX:\n`);
    for (const problem of problems) console.error(problem + "\n");
    process.exit(1);
  }
  console.log(`${files.length} pages parse as MDX.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
