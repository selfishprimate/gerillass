#!/usr/bin/env node
//
// Generates SKILL.md from gerillass.json.
//
// The skill is what a coding agent loads to use the library correctly. It is
// derived from the manifest rather than written by hand, so the catalogue and
// the accepted values cannot say something the test suite has not executed.
//
// Usage: node tools/build-skill.js [--check]

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "SKILL.md");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "gerillass.json"), "utf8"));

const mixins = manifest.members.filter((m) => m.kind === "mixin");
const functions = manifest.members.filter((m) => m.kind === "function");

// A mixin earns a row in "Arguments worth checking" when its metadata says an
// argument takes something a reader would not guess, or when it has a recorded
// rejection. Those are exactly the places an agent gets it wrong.
const tricky = mixins.filter((m) => m.rejects && m.rejects.length);

const row = (m) => `| \`${m.signature}\` | ${m.summary} |`;

const out = `---
name: gerillass
description: Use the Gerillass Sass mixin library — loading it, the mixin catalogue, and the argument forms that are easy to get wrong. Use when writing SCSS in a project that has gerillass installed.
---

# Gerillass

A Sass mixin library: ${mixins.length} mixins and ${functions.length} functions that emit CSS from
semantic declarations. It is Sass source only — there is no runtime and no
utility classes, so styles live in your stylesheet and your markup stays clean.

Full documentation: ${manifest.documentation}
Machine-readable API: \`gerillass.json\` in this package.

## Loading it

Through a bundler (Vite, webpack and most others resolve the package by name):

\`\`\`scss
${manifest.load.bundler}
\`\`\`

Calling Dart Sass yourself, with its package importer
(\`new NodePackageImporter()\` or \`sass --pkg-importer=node\`):

\`\`\`scss
${manifest.load.packageImporter}
\`\`\`

Anything else, by pointing a load path at \`node_modules/gerillass/scss\`:

\`\`\`scss
@use "gerillass" as *;
\`\`\`

Dart Sass only. LibSass and node-sass are not supported.

## Two names for every mixin

Every mixin exists twice: bare (\`ratio-box\`) and prefixed (\`${manifest.prefix}ratio-box\`).
They are the same mixin. The prefix exists to avoid collisions with other
libraries. Pick one and stay with it; do not mix them in a file.

With the module system you can namespace instead, which is usually cleaner:

\`\`\`scss
@use "gerillass" as gls;
.hero { @include gls.ratio-box("16/9"); }
\`\`\`

## Getting arguments right

The conventions are not uniform across the library, so check before guessing.
The single most common mistake is passing a ratio as a list:

\`\`\`scss
.hero { @include ratio-box(16 9); }    // wrong — errors
.hero { @include ratio-box("16/9"); }  // right
\`\`\`

Mixins that reject bad input do so with a message naming what they accept. If
you get one, read it: it lists the valid values. Mixins not in the table below
mostly pass their arguments through to CSS, so a wrong value there shows up as
a dropped declaration rather than an error.

| Mixin | Rejects, for example |
|---|---|
${tricky.map((m) => `| \`${m.name}\` | \`${m.rejects[0].replace(/\|/g, "\\|")}\` |`).join("\n")}

## Mixins

| Signature | What it does |
|---|---|
${mixins.map(row).join("\n")}

## Functions

Called like normal Sass functions. The two leading underscores mark them as
functions rather than mixins; they are public API.

| Signature | What it does |
|---|---|
${functions.map((f) => `| \`${f.signature}\` | ${f.summary || "—"} |`).join("\n")}

## Checking your work

Sass evaluates mixin bodies lazily, so a stylesheet that merely loads the
library always compiles. Compile the file that actually calls the mixin:

\`\`\`bash
sass --load-path=node_modules/gerillass/scss your.scss
\`\`\`

An empty rule in the output means the mixin matched none of its branches —
treat that as a bug, not as success.
`;

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (current !== out) {
    console.error("SKILL.md is out of date. Run: node tools/build-skill.js");
    process.exit(1);
  }
  console.log("SKILL.md is up to date.");
} else {
  fs.writeFileSync(OUT, out);
  console.log(`SKILL.md: ${mixins.length} mixins, ${functions.length} functions, ${tricky.length} with recorded rejections.`);
}
