#!/usr/bin/env node
"use strict";

// Generates llms.txt from gerillass.json, following the format at
// https://llmstxt.org/: an H1, a blockquote summary, free prose, then H2
// sections whose bodies are lists of markdown links.
//
// The file is meant to be served at https://docs.gerillass.com/llms.txt. It is
// generated here rather than in the docs repository because the manifest is
// the single source of truth for the API, and the test suite already proves
// the manifest matches the code.
//
// A member links to its documentation page when it has one, and to its source
// when it does not; gerillass.json documents it either way. Which is which is
// recorded in the two lists below, because it cannot be worked out from here.
//
// Nothing in this repository can check those links, since the pages belong to a
// site it does not build. `node tools/check-links.js` fetches them instead, and
// `/release` says to run it on every release.
//
//   node tools/build-llms-txt.js            # write llms.txt
//   node tools/build-llms-txt.js --check    # fail if it is out of date

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "llms.txt");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "gerillass.json"), "utf8"));

const REPO = "https://github.com/selfishprimate/gerillass";
const BLOB = `${REPO}/blob/main`;
const DOCS = manifest.documentation.replace(/\/$/, "");

const mixins = manifest.members.filter((m) => m.kind === "mixin");
const functions = manifest.members.filter((m) => m.kind === "function");

// One line per member. A summary can run long; llms.txt notes are meant to be
// short, so the first sentence is enough.
const firstSentence = (text) => {
  const cut = text.indexOf(". ");
  return cut === -1 ? text : text.slice(0, cut + 1);
};

// The documentation site addresses a page by the member's *file* name, not by
// the member name. For a mixin those are the same, since both are kebab-case,
// but a function is camelCase and its page is not: `clearUnit` lives at
// /docs/clear-unit/, and /docs/clearUnit/ is a 404.
//
// This cost an hour. Probing the site with member names reported 18 functions
// as having no page, and the five that "passed" were exactly the single-word
// names, where the two spellings coincide. A perfect correlation between
// "missing" and "more than one word" was the tell, and it was there to see.
const slugOf = (member) =>
  member.file.split("/").pop().replace(/^_/, "").replace(/\.scss$/, "");

// Members whose page does not exist yet, which today is none: all 76 are
// published. A member added in a release has no page until someone writes it,
// so put its name here and take it out once the page is live.
// `node tools/check-links.js` is what catches a name left in or left out.
const WITHOUT_DOCS_PAGE = new Set([]);

const link = (member) => {
  const url = WITHOUT_DOCS_PAGE.has(member.name)
    ? `${BLOB}/${member.file}`
    : `${DOCS}/docs/${slugOf(member)}/`;
  return `- [${member.signature}](${url}): ${firstSentence(member.summary)}`;
};

const build = () => `# Gerillass

> A Sass toolkit of ${mixins.length} mixins and ${functions.length} functions, built to be read by coding agents as well as by people. Every member is described in a machine-readable manifest whose examples and refusals are executed by the test suite, so the documentation cannot drift away from the code.

Gerillass is a pure Sass library. There is no build step and no runtime dependency: the \`.scss\` sources are the deliverable, and the package installs nothing else. It needs Dart Sass; LibSass and node-sass are not supported. This file describes Gerillass ${manifest.version}.

Load it with \`${manifest.load.bundler}\` under a bundler, or \`${manifest.load.packageImporter}\` with the Dart Sass package importer.

Every mixin answers to two names, bare and prefixed: \`@include circle(50px)\` and \`@include ${manifest.prefix}circle(50px)\` are the same mixin and produce identical CSS. The prefix exists to avoid collisions with other libraries. You can also namespace the whole library instead, with \`@use "gerillass" as gls;\` and \`@include gls.circle(50px)\`.

Mixins are kebab-case and always need \`@include\`. Functions are camelCase and never take it. That is the whole naming convention, and it is what tells the two apart at a call site.

Arguments are validated and refused with a message naming what is accepted, so a wrong call produces an error rather than a missing declaration. The exception is a value passed straight through to CSS, which is left alone so that \`var()\`, \`calc()\` and \`clamp()\` keep working.

## Mixins

${mixins.map(link).join("\n")}

## Functions

${functions.map(link).join("\n")}

## Optional

- [gerillass.json](${BLOB}/gerillass.json): the full machine-readable API. Every member with its signature, what each argument accepts, examples that compile, and the inputs it refuses. Ships inside the installed package at \`node_modules/gerillass/gerillass.json\`.
- [SKILL.md](${BLOB}/SKILL.md): the same material written as an agent skill, generated from the manifest. Ships in the package.
- [README](${BLOB}/README.md): installation for Vite, webpack, Next.js, Angular, Gulp and Grunt, and how to point an agent at the two files above.
- [MIGRATION.md](${BLOB}/MIGRATION.md): upgrading a project from 1.x to 2.0.0. The utility functions were renamed and two mixins were replaced.
- [CHANGELOG](${BLOB}/CHANGELOG.md): what changed in every release.
- [Source repository](${REPO}): the \`.scss\` sources, which are short and readable.
`;

const text = build();

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (current !== text) {
    console.error("llms.txt is out of date. Run: npm run manifest");
    process.exit(1);
  }
  console.log("llms.txt is up to date.");
} else {
  fs.writeFileSync(OUT, text);
  console.log(`llms.txt: ${mixins.length} mixins, ${functions.length} functions.`);
}
