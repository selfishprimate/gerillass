#!/usr/bin/env node
//
// Checks the counts the documentation claims against the counts the repository
// actually has.
//
// This exists because the claims drift, quietly and repeatedly. "31 of the 51
// mixins validate" was written into CLAUDE.md when the real number was 27, and
// /new-mixin carried "16 of the 51" long after it became 35. Both were written
// from memory and both were wrong, and nothing failed.
//
// It only checks numbers, because only numbers can be checked without judgement.
// Whether CONTRIBUTING.md needs new prose after a change is a question for a
// person; whether it says "51 mixins" when there are 52 is not.
//
// Usage: node tools/check-docs.js

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const list = (dir, re) =>
  fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(".scss") && f !== "_index.scss" && re.test(read(`${dir}/${f}`)));

// --- what is actually true -------------------------------------------------

const libFiles = list("scss/library", /^@mixin/m);
const utilFiles = list("scss/utilities", /^@function/m);

const withArgs = libFiles.filter((f) => /^@mixin\s+[\w-]+\s*\(/m.test(read(`scss/library/${f}`)));
const validating = withArgs.filter((f) => /@error|__validate|__is[A-Z]/.test(read(`scss/library/${f}`)));

const specs = [
  ...fs.readdirSync(path.join(ROOT, "test/library")),
  ...fs.readdirSync(path.join(ROOT, "test/utilities")),
].filter((f) => f.endsWith(".spec.scss"));

const manifest = JSON.parse(read("gerillass.json"));
const withRejects = manifest.members.filter((m) => (m.rejects || []).length).length;

let packFiles = null;
try {
  // npm pack writes its file listing to stderr, so merge the streams.
  const out = execFileSync("sh", ["-c", "npm pack --dry-run 2>&1"], { cwd: ROOT, encoding: "utf8" });
  const m = /total files:\s*(\d+)/.exec(out);
  if (m) packFiles = Number(m[1]);
} catch {
  // offline, or npm missing: skip this check rather than fail the hook
}

const truth = {
  mixins: libFiles.length,
  functions: utilFiles.length,
  members: libFiles.length + utilFiles.length,
  withArgs: withArgs.length,
  validating: validating.length,
  specs: specs.length,
  rejects: withRejects,
  packFiles,
};

// --- what the documentation claims -----------------------------------------

const DOCS = [
  "CLAUDE.md",
  "README.md",
  "CONTRIBUTING.md",
  ".claude/skills/new-mixin/SKILL.md",
  ".claude/skills/sass-test/SKILL.md",
  ".claude/skills/release/SKILL.md",
  ".claude/skills/audit-library/SKILL.md",
];

// A sentence about the past is not a claim about the present. Without this the
// checker flags its own changelog-style notes.
const HISTORICAL = /\bbefore v|\bwas\b|\bused to\b|\bwent from\b|\bhad been\b|\bat the start\b|\buntil v/i;

const CLAIMS = [
  { re: /(\d+)\s*\/\s*51 mixins/g, key: "mixins", what: "mixin total" },
  { re: /(\d+)\s*\/\s*(\d+) members/g, key: "members", what: "member total", group: 2 },
  { re: /all (\d+) mixins/gi, key: "mixins", what: "mixin total" },
  { re: /(\d+) mixins and (\d+) functions/g, key: "mixins", what: "mixin total" },
  { re: /(\d+) of the (\d+) mixins that take arguments/g, key: "validating", what: "validating mixins" },
  { re: /Expect (\d+) files/g, key: "packFiles", what: "published file count" },
  { re: /\((\d+) files \//g, key: "packFiles", what: "published file count" },
  // Coverage tables write a bare ratio with no noun, e.g. "| 44/73 |".
  { re: /\|\s*\d+\s*\/\s*(\d+)\s*\|/g, key: "members", what: "member total in a coverage table" },
];

const problems = [];

for (const doc of DOCS) {
  let text;
  try {
    text = read(doc);
  } catch {
    continue;
  }
  const lines = text.split("\n");

  lines.forEach((line, i) => {
    if (HISTORICAL.test(line)) return;
    for (const claim of CLAIMS) {
      claim.re.lastIndex = 0;
      let m;
      while ((m = claim.re.exec(line))) {
        const claimed = Number(m[claim.group || 1]);
        const actual = truth[claim.key];
        if (actual === null || actual === undefined) continue;
        if (claimed !== actual) {
          problems.push({ doc, line: i + 1, what: claim.what, claimed, actual, text: line.trim().slice(0, 78) });
        }
      }
    }
  });
}

// --- report ----------------------------------------------------------------

if (!problems.length) {
  console.log(
    `Documentation counts agree with the repository ` +
      `(${truth.mixins} mixins, ${truth.functions} functions, ${truth.validating}/${truth.withArgs} validating` +
      (truth.packFiles ? `, ${truth.packFiles} published files` : "") +
      `).`
  );
  process.exit(0);
}

console.error("Documentation claims a count the repository does not have:\n");
for (const p of problems) {
  console.error(`  ${p.doc}:${p.line}  ${p.what}: says ${p.claimed}, actually ${p.actual}`);
  console.error(`    ${p.text}\n`);
}
process.exit(1);
