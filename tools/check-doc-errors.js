#!/usr/bin/env node
// Every `text` fence on a documentation page that begins with "Error:" states a
// message the library raises, and nothing compiles it: an <Example> compiles its
// `scss` fence, but a refusal is written as plain prose. So a message could drift
// from the one the mixin actually prints, which is what happened to `loadify`.
//
// This compiles the `scss` fence above each one and compares. A fence holding
// several `Error:` lines is matched against the several calls in the snippet, in
// order.
const fs = require("fs");
const path = require("path");
const sass = require("sass");

const ROOT = path.join(__dirname, "..");
const DOCS = path.join(ROOT, "site/content/docs");

// `loadify` on an element extends a placeholder the root call defines.
const SETUP = (src) =>
  /@include\s+(gls-)?loadify\(/.test(src) && !/loadify\(init\)/.test(src)
    ? "@include loadify(init);\n"
    : "";

const fences = (text) => {
  const out = [];
  const re = /```(\w*)\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text))) out.push({ lang: m[1], body: m[2], at: m.index });
  return out;
};

// The page states one message per refused call, so a snippet of several calls is
// split and each compiled on its own. Splitting on lines does not work -- a rule
// spans several of them -- so this walks the braces and cuts at depth zero.
const calls = (src) => {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        out.push(src.slice(start, i + 1));
        start = i + 1;
      }
    } else if (c === ";" && depth === 0) {
      out.push(src.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (src.slice(start).trim()) out.push(src.slice(start));
  const kept = out.map((s) => s.trim()).filter(Boolean);
  return kept.length ? kept : [src];
};

const raised = (src) => {
  try {
    sass.compileString(`@use "gerillass" as *;\n${SETUP(src)}${src}`, {
      loadPaths: [path.join(ROOT, "scss")],
      style: "expanded",
      silenceDeprecations: ["if-function"],
    });
    return null;
  } catch (e) {
    return String(e.message)
      .split("\n")[0]
      .replace(/^["']|["']$/g, "")
      .trim();
  }
};

const only = process.argv.slice(2);
const files = (only.length ? only.map((n) => `${n}.mdx`) : fs.readdirSync(DOCS)).filter((f) =>
  f.endsWith(".mdx")
);

let checked = 0;
let unchecked = 0;
const problems = [];

for (const file of files) {
  const text = fs.readFileSync(path.join(DOCS, file), "utf8");
  const list = fences(text);
  for (let i = 1; i < list.length; i++) {
    const stated = list[i];
    const source = list[i - 1];
    if (stated.lang !== "text" || !stated.body.startsWith("Error:")) continue;
    if (source.lang !== "scss") continue;

    const wanted = stated.body
      .split(/\n(?=Error:)/)
      .map((s) => s.replace(/^Error:\s*/, "").trim())
      .filter(Boolean);
    const snippets = calls(source.body);

    // One message per statement is the usual shape and each is checked. When
    // the counts differ the page is doing something else -- a snippet with a
    // variable declaration above the call, or a list of every message the
    // member can print -- so only the first is checked, against the whole
    // snippet, and the rest are counted as unchecked rather than failed.
    const pairs =
      wanted.length === snippets.length
        ? wanted.map((w, n) => [w, snippets[n]])
        : [[wanted[0], source.body]];
    unchecked += wanted.length - pairs.length;

    for (const [want, src] of pairs) {
      checked++;
      const got = raised(src);
      if (got === null) {
        problems.push(`${file}: a call that states an error does not raise\n    ${src.trim().replace(/\n/g, " ")}`);
      } else if (got.replace(/^Error:\s*/, "") !== want) {
        problems.push(`${file}\n    page: ${want}\n    real: ${got.replace(/^Error:\s*/, "")}`);
      }
    }
  }
}

for (const p of problems) console.log(p + "\n");
console.log(
  `${checked} stated message${checked === 1 ? "" : "s"} checked in ${files.length} page${
    files.length === 1 ? "" : "s"
  }, ${problems.length} problem${problems.length === 1 ? "" : "s"}` +
    (unchecked ? `, ${unchecked} listed beside another and not checked.` : ".")
);
process.exit(problems.length ? 1 : 0);
