#!/usr/bin/env node
/*
  Diffs what the old documentation said the library emits against what it
  actually emits.

  Every Hugo example carried a hand-written "CSS Output" block beside its Sass.
  Here that block is gone, because the CSS is compiled from the Sass at build
  time and a page cannot claim an output the library does not produce. That is
  the improvement -- but it also means 238 statements about the library's
  behaviour were about to be deleted without anyone reading them. This compiles
  each one and reports where the two disagree.

  A disagreement is one of three things, and the report cannot tell them apart:
  a page that went stale, an example that was wrong when it was written, or a
  mistake in the conversion. All three are worth a look.
*/

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import * as sass from "sass";

const LIBRARY = fileURLToPath(new URL("../../scss", import.meta.url));
const REF = fileURLToPath(new URL("./stated-css.json", import.meta.url));
const SETUP = { loadify: "@include loadify(init);" };

// Whitespace and the trailing semicolon before a brace are formatting, not
// behaviour, and the two sources were formatted by different hands.
const normalise = (css) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/;\s*}/g, "}")
    .replace(/\s+/g, " ")
    // The two were formatted by different hands, and a value broken across
    // lines by one of them is the same value. Space next to punctuation is
    // never meaningful in CSS, so it goes before anything is compared.
    .replace(/\s*([{}();:,])\s*/g, "$1")
    .replace(/'/g, '"')
    .trim();

if (!existsSync(REF)) {
  console.error("tools/stated-css.json yok. Once node tools/port-docs.js calistir.");
  process.exit(1);
}

const reference = JSON.parse(readFileSync(REF, "utf8"));
let checked = 0;
let failed = 0;
let differs = 0;
const report = [];

for (const [slug, examples] of Object.entries(reference)) {
  for (const [n, { source, css }] of examples.entries()) {
    checked += 1;
    const loads = /^\s*@(use|import)\s/m.test(source);
    const preamble = [loads ? null : '@use "gerillass" as *;', SETUP[slug]]
      .filter(Boolean)
      .join("\n");

    let actual;
    try {
      actual = sass.compileString(preamble ? `${preamble}\n${source}` : source, {
        loadPaths: [LIBRARY],
        style: "expanded",
        silenceDeprecations: ["if-function", "import", "global-builtin", "color-functions"],
        logger: sass.Logger.silent,
      }).css;
    } catch (error) {
      failed += 1;
      report.push(`${slug} #${n + 1}  DERLENMEDI: ${error.message.split("\n")[0]}`);
      continue;
    }

    if (normalise(actual) !== normalise(css)) {
      differs += 1;
      report.push(`${slug} #${n + 1}  FARKLI`);
    }
  }
}

console.log(report.join("\n"));
console.log(
  `\n${checked} ornek karsilastirildi. ${failed} derlenmedi, ${differs} farkli, ` +
    `${checked - failed - differs} birebir ayni.`
);
