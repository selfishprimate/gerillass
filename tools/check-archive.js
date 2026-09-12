#!/usr/bin/env node
//
// What the "Source code" zip on a GitHub release will contain.
//
// GitHub builds that zip, and the tarball beside it, with `git archive` from
// the tagged commit. It never reads .npmignore: only `export-ignore` in
// .gitattributes keeps a path out. That is how site/ was on its way into the
// release after 2.1.0 without anyone deciding it should be. It was committed,
// and nothing looked at the archive.
//
// The npm package has its own guard, the published file count in
// tools/check-docs.js. This is the same idea for the zip, which is meant to
// differ from the package: the zip is the library's source, buildable and
// testable, where the package is only what a compiler needs. So the check is
// an allowlist of top-level entries, and it fails naming anything outside it
// or anything on it that has gone missing.
//
// By default it archives the working tree as the next commit would record it,
// tracked and untracked files alike, so a change to .gitattributes can be
// checked before it is committed. `--ref` archives a commit or tag instead.
//
// Usage: node tools/check-archive.js [--ref v2.1.0]

const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const EXPECTED = [
  // The library and what builds, describes and tests it.
  "scss",
  "meta",
  "test",
  "tools",
  "assets",
  "package.json",
  "yarn.lock",
  "gerillass.json",
  "SKILL.md",
  "llms.txt",

  // Documents a user or a contributor reads.
  "README.md",
  "LICENSE.md",
  "CHANGELOG.md",
  "MIGRATION.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",

  // How the repository is worked on.
  "CLAUDE.md",
  ".claude",
  ".github",
  ".nvmrc",
  ".gitignore",
  ".npmignore",
  ".gitattributes",
];

const git = (args, env = {}) =>
  execFileSync("git", args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    maxBuffer: 256 * 1024 * 1024,
  });

function workingTree() {
  // A throwaway index, so the real one is never touched.
  const index = path.join(os.tmpdir(), `gerillass-check-archive-${process.pid}`);
  const env = { GIT_INDEX_FILE: index };
  try {
    git(["read-tree", "HEAD"], env);
    git(["add", "-A"], env);
    return git(["write-tree"], env).toString().trim();
  } finally {
    fs.rmSync(index, { force: true });
  }
}

const refAt = process.argv.indexOf("--ref");
const treeish = refAt === -1 ? workingTree() : process.argv[refAt + 1];
const label = refAt === -1 ? "the working tree" : treeish;

if (!treeish) {
  console.error("--ref needs a commit or a tag, e.g. --ref v2.1.0");
  process.exit(2);
}

const tar = git(["archive", "--format=tar", treeish]);
const entries = execFileSync("tar", ["-t"], { input: tar, maxBuffer: 64 * 1024 * 1024 })
  .toString()
  .split("\n")
  .filter(Boolean);

const files = entries.filter((e) => !e.endsWith("/"));
const found = new Set(entries.map((e) => e.split("/")[0]));

const unexpected = [...found].filter((e) => !EXPECTED.includes(e)).sort();
const missing = EXPECTED.filter((e) => !found.has(e));

if (!unexpected.length && !missing.length) {
  console.log(`Release archive of ${label}: ${files.length} files, only the expected entries.`);
  process.exit(0);
}

console.error(`Release archive of ${label} does not match what a release should carry:\n`);
for (const e of unexpected) {
  const count = files.filter((f) => f === e || f.startsWith(`${e}/`)).length;
  console.error(`  unexpected  ${e}  (${count} ${count === 1 ? "file" : "files"})`);
}
for (const e of missing) {
  console.error(`  missing     ${e}`);
}
console.error(
  "\nKeep an unexpected path out with `<path> export-ignore` in .gitattributes, " +
    "or add it to EXPECTED in this file if it belongs in the zip. " +
    "A missing entry was deleted, renamed, or excluded by mistake."
);
process.exit(1);
