#!/usr/bin/env node
//
// Builds gerillass.json, the machine-readable description of the public API.
//
// Signatures are parsed from the Sass sources, so they cannot drift. Everything
// a parser cannot know -- what an argument actually accepts, a worked example,
// an input that must be rejected -- is authored in meta/<name>.json and merged
// in here. test/manifest.spec.js then compiles every example and every
// rejection, which is what stops the authored half from going stale.
//
// Usage: node tools/build-manifest.js [--check]
//   --check  exit non-zero if gerillass.json is out of date instead of writing

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SOURCES = [
  { dir: "scss/library", kind: "mixin" },
  { dir: "scss/utilities", kind: "function" },
];
const META_DIR = path.join(ROOT, "meta");
const OUT = path.join(ROOT, "gerillass.json");

// Reads from the character after "(" and returns the argument text up to the
// matching ")". Counts nesting and skips over quoted sections so that defaults
// like `eot woff2 woff` or `rgba(0, 0, 0, 0.1)` survive intact.
function readArgList(source, start) {
  let depth = 1;
  let quote = null;
  for (let i = start; i < source.length; i++) {
    const c = source[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth === 0) return { text: source.slice(start, i), end: i };
    }
  }
  throw new Error("unbalanced parentheses in argument list");
}

// Splits "$a, $b: rgba(0, 0, 0, .1)" on top-level commas only.
function splitArgs(text) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let current = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      current += c;
      if (c === "\\") current += text[++i];
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === "(") depth++;
    else if (c === ")") depth--;
    if (c === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += c;
  }
  if (current.trim()) parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

function parseMember(source, kind) {
  const re = new RegExp(`^@${kind}\\s+([\\w-]+)`, "m");
  const m = re.exec(source);
  if (!m) return null;

  const name = m[1];
  const after = source.slice(m.index + m[0].length);
  const parenAt = after.search(/\S/);
  const member = { name, kind, arguments: [] };

  if (after[parenAt] !== "(") return member; // takes no arguments

  const abs = m.index + m[0].length + parenAt + 1;
  const { text } = readArgList(source, abs);

  for (const raw of splitArgs(text)) {
    if (raw.endsWith("...")) {
      member.arguments.push({ name: raw.slice(0, -3), variadic: true });
      continue;
    }
    const colon = raw.indexOf(":");
    if (colon === -1) {
      member.arguments.push({ name: raw, required: true });
    } else {
      member.arguments.push({
        name: raw.slice(0, colon).trim(),
        default: raw.slice(colon + 1).trim().replace(/\s+/g, " "),
      });
    }
  }
  return member;
}

function signatureOf(member) {
  if (!member.arguments.length) return member.name;
  const args = member.arguments.map((a) =>
    a.variadic ? `${a.name}...` : a.default !== undefined ? `${a.name}: ${a.default}` : a.name
  );
  return `${member.name}(${args.join(", ")})`;
}

function build() {
  const members = [];

  for (const { dir, kind } of SOURCES) {
    const full = path.join(ROOT, dir);
    for (const file of fs.readdirSync(full).sort()) {
      if (!file.endsWith(".scss") || file === "_index.scss") continue;
      const source = fs.readFileSync(path.join(full, file), "utf8");
      const parsed = parseMember(source, kind);
      if (!parsed) continue;
      parsed.file = `${dir}/${file}`;
      parsed.signature = signatureOf(parsed);
      members.push(parsed);
    }
  }

  const meta = {};
  if (fs.existsSync(META_DIR)) {
    for (const file of fs.readdirSync(META_DIR)) {
      if (!file.endsWith(".json")) continue;
      meta[file.replace(/\.json$/, "")] = JSON.parse(
        fs.readFileSync(path.join(META_DIR, file), "utf8")
      );
    }
  }

  for (const member of members) {
    const m = meta[member.name];
    if (!m) continue;
    if (m.summary) member.summary = m.summary;
    if (m.examples) member.examples = m.examples;
    if (m.rejects) member.rejects = m.rejects;
    if (m.arguments) {
      for (const arg of member.arguments) {
        const authored = m.arguments.find((a) => a.name === arg.name);
        if (authored && authored.accepts) arg.accepts = authored.accepts;
      }
    }
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    homepage: pkg.homepage,
    documentation: "https://docs.gerillass.com",
    // Every mixin is available twice: unprefixed and with a gls- prefix.
    prefix: "gls-",
    load: {
      packageImporter: '@use "pkg:gerillass" as *;',
      bundler: '@use "gerillass" as *;',
      loadPath: '@use "gerillass" as *;  // with loadPaths: ["node_modules/gerillass/scss"]',
    },
    members,
  };
}

const manifest = build();
const json = JSON.stringify(manifest, null, 2) + "\n";

if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (current !== json) {
    console.error("gerillass.json is out of date. Run: node tools/build-manifest.js");
    process.exit(1);
  }
  console.log("gerillass.json is up to date.");
} else {
  fs.writeFileSync(OUT, json);
  const documented = manifest.members.filter((m) => m.summary).length;
  console.log(
    `gerillass.json: ${manifest.members.length} members, ${documented} with authored metadata.`
  );
}
