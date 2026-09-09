#!/usr/bin/env node
"use strict";

// Checks that every link in llms.txt resolves.
//
// This is the one thing the test suite cannot assert, because the links point
// at gerillass.com and docs.gerillass.com, which this repository does not
// build. It exists as a command rather than as a loop pasted into /release
// because a loop that has to be copied is a loop that gets skipped: v2.1.0
// shipped with line-clamp linking to a page that did not exist, for exactly
// that reason.
//
// A 404 usually means one of two things, and both are fixed in
// tools/build-llms-txt.js:
//
//   a new mixin has no documentation page  -> add it to MIXINS_WITHOUT_PAGE
//   a function's page has been published    -> add it to FUNCTIONS_WITH_PAGE
//
// Needs network. Not run by any hook or test, on purpose.
//
//   node tools/check-links.js

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const FILE = path.join(ROOT, "llms.txt");

if (!fs.existsSync(FILE)) {
  console.error("llms.txt does not exist. Run: npm run manifest");
  process.exit(1);
}

const links = [...new Set(fs.readFileSync(FILE, "utf8").match(/https:\/\/[^)\s]+/g) || [])].sort();
if (!links.length) {
  console.error("llms.txt contains no links, which cannot be right.");
  process.exit(1);
}

const check = async (url) => {
  try {
    // HEAD is enough and some hosts answer it faster, but a few answer 405, so
    // fall back to GET rather than reporting a link as broken when it is not.
    let res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", redirect: "follow" });
    }
    return { url, status: res.status };
  } catch (error) {
    return { url, status: 0, error: error.message };
  }
};

(async () => {
  // A handful at a time: this hits two sites that belong to the project, and
  // there is no reason to flood either of them.
  const results = [];
  const queue = [...links];
  const workers = Array.from({ length: 6 }, async () => {
    while (queue.length) results.push(await check(queue.shift()));
  });
  await Promise.all(workers);

  const broken = results.filter((r) => r.status !== 200).sort((a, b) => a.url.localeCompare(b.url));

  if (!broken.length) {
    console.log(`All ${links.length} links in llms.txt resolve.`);
    return;
  }

  console.error(`${broken.length} of ${links.length} links in llms.txt do not resolve:\n`);
  for (const b of broken) {
    console.error(`  ${b.status || "failed"}  ${b.url}${b.error ? `  (${b.error})` : ""}`);
  }
  console.error(
    `\nFix the lists in tools/build-llms-txt.js and re-run npm run manifest.\n` +
      `A member with no page links to its source instead; a member whose page\n` +
      `has since been published should link to the page.`
  );
  process.exit(1);
})();
