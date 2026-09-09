#!/usr/bin/env node
"use strict";

// Checks that a release being prepared has its wiki page, and that the page
// actually mentions what changed.
//
// The wiki is per released version, not per commit, so this deliberately only
// bites while a release is in progress. Two states:
//
//   the version in package.json is already tagged
//     Between releases. The page for the next version cannot exist yet, because
//     its number is not decided. Reports what is pending and exits 0.
//
//   the version in package.json is not tagged
//     A release is being prepared. wiki/vX.Y.Z.md is required, and it has to
//     name every member that changed since the last tag.
//
// What changed is read from the manifest at the previous tag rather than
// guessed: members added, members removed, and members whose signature or
// summary moved. The playground menu and the documentation pages cannot be
// checked from here, since they live in other repositories; wiki/README.md
// carries those.
//
//   node tools/check-wiki.js

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const version = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;

const git = (args) =>
  execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();

let tags = [];
try {
  tags = git(["tag", "--sort=-v:refname"]).split("\n").filter(Boolean);
} catch {
  process.exit(0); // not a git checkout, or no tags yet
}
if (!tags.length) process.exit(0);

// A member is "the same" when its signature and its summary are unchanged.
// Those are the two things a reader of the other repositories acts on; an edit
// to an example is not worth a wiki entry.
const facts = (manifest) => {
  const map = new Map();
  for (const m of manifest.members) map.set(m.name, m.signature + " " + m.summary);
  return map;
};

const current = facts(JSON.parse(fs.readFileSync(path.join(ROOT, "gerillass.json"), "utf8")));

// When the version in package.json is already tagged, the question is what has
// changed since that release, so it is the baseline itself. When it is not, a
// release is being prepared and the baseline is the last one that shipped.
const released = tags.includes("v" + version);
const previous = released ? "v" + version : tags[0];

let before;
try {
  before = facts(JSON.parse(git(["show", previous + ":gerillass.json"])));
} catch {
  process.exit(0); // the manifest did not exist at that tag
}

const added = [...current.keys()].filter((n) => !before.has(n));
const removed = [...before.keys()].filter((n) => !current.has(n));
const changed = [...current.keys()].filter((n) => before.has(n) && before.get(n) !== current.get(n));
const touched = [...added, ...removed, ...changed];

if (released) {
  if (touched.length) {
    console.log(
      touched.length +
        " member(s) have changed since " +
        previous +
        ", which is the released version."
    );
    console.log("They need a wiki page when the next version is cut: " + touched.join(", ") + ".");
  } else {
    console.log("Nothing has changed since " + previous + ". No wiki page is due.");
  }
  process.exit(0);
}

// From here on, a release is being prepared.
if (!touched.length) {
  console.log(
    "No member changed between " + previous + " and " + version + ". A wiki page is optional."
  );
  process.exit(0);
}

const page = path.join(ROOT, "wiki", "v" + version + ".md");
const problems = [];

if (!fs.existsSync(page)) {
  problems.push(
    "wiki/v" +
      version +
      ".md does not exist, and " +
      touched.length +
      " member(s) changed since " +
      previous +
      ".\n  Follow wiki/README.md. Members to cover: " +
      touched.join(", ")
  );
} else {
  const text = fs.readFileSync(page, "utf8");
  const missing = touched.filter((name) => !text.includes(name));
  if (missing.length) {
    problems.push(
      "wiki/v" +
        version +
        ".md never mentions: " +
        missing.join(", ") +
        ".\n  Every member that changed since " +
        previous +
        " needs covering, including what to\n  do about it on gerillass.com and docs.gerillass.com."
    );
  }
}

if (problems.length) {
  console.error("The wiki does not describe this release:\n");
  for (const p of problems) console.error("  " + p + "\n");
  console.error(
    "A release is not finished when npm has it. gerillass.com and\n" +
      "docs.gerillass.com cannot see this repository, and the playground's\n" +
      "member menu does not update itself."
  );
  process.exit(1);
}

console.log(
  "wiki/v" +
    version +
    ".md covers all " +
    touched.length +
    " changed member(s): " +
    touched.join(", ") +
    "."
);
