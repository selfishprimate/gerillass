#!/usr/bin/env node
//
// Writes a page that asks a browser whether CSS works.
//
// A compile only proves Sass accepted a value. Whether the browser keeps it is
// a separate question, and the one `todos/silent-values.md` had to answer by
// hand: `@media (min-width: huge)` compiles, parses, and never matches. This
// splits CSS into the pieces a browser has to accept and writes one HTML page
// that tests each of them in the browser that opens it:
//
// - a declaration, with CSS.supports(property, value);
// - a selector, with CSS.supports(selector(...));
// - a @media condition, with matchMedia: one that neither matches nor has its
//   `not` form match is parsed and can never apply;
// - a @container condition the same way, against a real 500px container.
//
// There is no dependency: open the page in Chrome and read the table, or read
// `window.results` from a script. Nothing here can say whether a value does
// what was meant, only whether the browser drops it.
//
// Usage:
//   node tools/browser-check.js [--out page.html] <input>...
//   node tools/browser-check.js --serve [port]
//
// An input is a .css file, a .scss file compiled against scss/, or a single
// piece written as type:text, where type is media, container, declaration or
// selector:
//   node tools/browser-check.js "media:(min-width: huge)" "declaration:width: 10deg"
//
// The page is written to .browser-check/index.html unless --out says
// otherwise. A browser runs no script in a page opened from disk in some
// setups, the in-app browser among them, so --serve serves that folder on
// localhost, 7002 by default; the `browser-check` entry in .claude/launch.json
// starts it.

const fs = require("fs");
const http = require("http");
const path = require("path");
const sass = require("sass");

const ROOT = path.resolve(__dirname, "..");
const PAGE_DIR = path.join(ROOT, ".browser-check");

const args = process.argv.slice(2);

if (args[0] === "--serve") {
  const port = Number(args[1]) || 7002;
  http
    .createServer((req, res) => {
      // Always the one page: there is nothing else in the folder to serve.
      const file = path.join(PAGE_DIR, "index.html");
      if (!fs.existsSync(file)) {
        res.writeHead(404, { "content-type": "text/plain" });
        res.end("No page yet. Run node tools/browser-check.js <input>... first.");
        return;
      }
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      res.end(fs.readFileSync(file));
    })
    .listen(port, "127.0.0.1", () => console.log(`browser-check page at http://localhost:${port}`));
  return;
}

let out = path.join(PAGE_DIR, "index.html");
const inputs = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--out") out = path.resolve(args[++i]);
  else inputs.push(args[i]);
}
if (!inputs.length) {
  console.error("Usage: node tools/browser-check.js [--out page.html] <file.css|file.scss|type:text>...\n       node tools/browser-check.js --serve [port]");
  process.exit(1);
}

// Splits CSS in the expanded style Sass writes: one prelude per line ending in
// `{`, one declaration per line ending in `;`. It is not a general CSS parser
// and does not need to be, because its input always comes from Sass.
function piecesOf(css, source) {
  const pieces = [];
  for (const raw of css.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("@charset") || line === "}") continue;
    if (line.endsWith("{")) {
      const prelude = line.slice(0, -1).trim();
      const media = prelude.match(/^@media\s+(.+)$/);
      const container = prelude.match(/^@container\s+(?:[^\s(]+\s+)?(.+)$/);
      if (media) pieces.push({ type: "media", text: media[1], source });
      else if (container) pieces.push({ type: "container", text: container[1], source });
      else if (!prelude.startsWith("@") && !/^(from|to|\d+%)$/.test(prelude)) {
        for (const selector of prelude.split(",")) pieces.push({ type: "selector", text: selector.trim(), source });
      }
    } else if (line.endsWith(";")) {
      const colon = line.indexOf(":");
      if (colon > 0) pieces.push({ type: "declaration", text: line.slice(0, -1), source });
    }
  }
  return pieces;
}

let pieces = [];
for (const input of inputs) {
  const piece = input.match(/^(media|container|declaration|selector):(.+)$/s);
  if (piece) {
    pieces.push({ type: piece[1], text: piece[2].trim(), source: "argument" });
  } else if (input.endsWith(".scss")) {
    const css = sass.compile(input, { loadPaths: [path.join(ROOT, "scss")], style: "expanded", logger: sass.Logger.silent }).css;
    pieces.push(...piecesOf(css, input));
  } else {
    pieces.push(...piecesOf(fs.readFileSync(input, "utf8"), input));
  }
}

// Repeats say nothing new and make the table harder to read.
const seen = new Set();
pieces = pieces.filter((p) => {
  const key = `${p.type}:${p.text}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const page = `<!doctype html>
<meta charset="utf-8">
<title>browser-check</title>
<style>
  body { font: 13px/1.4 system-ui, sans-serif; margin: 16px; }
  table { border-collapse: collapse; }
  td, th { border: 1px solid #ccc; padding: 2px 6px; text-align: left; }
  .dropped { background: #fdd; }
  #container { container-type: inline-size; width: 500px; }
</style>
<p id="agent"></p>
<div id="container"><div id="child"></div></div>
<table><thead><tr><th>result</th><th>type</th><th>piece</th><th>source</th></tr></thead><tbody id="rows"></tbody></table>
<script>
const pieces = ${JSON.stringify(pieces).replace(/</g, "\\u003c")};
const style = document.createElement("style");
document.head.append(style);
const sheet = style.sheet;
const child = document.getElementById("child");

function containerHit(condition) {
  // A dropped rule throws on insertion; a kept one is read through a custom
  // property on an element inside a 500px container.
  try {
    sheet.insertRule("@container " + condition + " { #child { --hit: 1; } }", 0);
  } catch (e) {
    return null;
  }
  const hit = getComputedStyle(child).getPropertyValue("--hit").trim() === "1";
  sheet.deleteRule(0);
  return hit;
}

// A condition joined with \`and\` is tested one feature at a time. Asked as a
// whole, its \`not\` form was unreliable: \`(min-width: huge) and (max-width:
// 991px)\` never matched in a 500px frame, where its second half is true, yet
// the whole-condition test reported it kept. Any part that is dropped or can
// never match makes the whole condition never match.
function testParts(piece) {
  const parts = piece.text.split(/\\)\\s+and\\s+\\(/i);
  if (parts.length === 1) return test(piece);
  const results = parts.map((part, i) => {
    const text = (i > 0 ? "(" : "") + part + (i < parts.length - 1 ? ")" : "");
    return test({ ...piece, text });
  });
  if (results.includes("dropped")) return "dropped";
  if (results.includes("never matches")) return "never matches";
  return "kept";
}

function test(piece) {
  if (piece.type === "declaration") {
    const colon = piece.text.indexOf(":");
    const property = piece.text.slice(0, colon).trim();
    const value = piece.text.slice(colon + 1).trim();
    return CSS.supports(property, value) ? "kept" : "dropped";
  }
  if (piece.type === "selector") {
    return CSS.supports("selector(" + piece.text + ")") ? "kept" : "dropped";
  }
  if (piece.type === "media") {
    const yes = matchMedia(piece.text);
    if (yes.media === "not all" && piece.text.trim() !== "not all") return "dropped";
    const no = matchMedia("not all and " + piece.text);
    const negated = matchMedia("not " + piece.text);
    return yes.matches || no.matches || negated.matches ? "kept" : "never matches";
  }
  if (piece.type === "container") {
    const yes = containerHit(piece.text);
    if (yes === null) return "dropped";
    const no = containerHit("not " + piece.text);
    return yes || no ? "kept" : "never matches";
  }
  return "unknown type";
}

document.getElementById("agent").textContent = navigator.userAgent;
const rows = document.getElementById("rows");
window.results = pieces.map((piece) => {
  const result = piece.type === "media" || piece.type === "container" ? testParts(piece) : test(piece);
  const row = rows.insertRow();
  if (result !== "kept") row.className = "dropped";
  for (const cell of [result, piece.type, piece.text, piece.source]) row.insertCell().textContent = cell;
  return { ...piece, result };
});
document.title = "browser-check: " + window.results.filter((r) => r.result !== "kept").length + " of " + window.results.length + " not kept";
</script>
`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, page);
console.log(`${pieces.length} pieces -> ${out}`);
