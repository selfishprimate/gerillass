#!/usr/bin/env node
/*
  Converts the Hugo documentation in ../../gerillass-docs into the MDX this
  site renders.

  The two formats say the same things in different words, and the vocabulary is
  small enough to translate rather than reinterpret: six shortcodes, listed in
  TRANSLATION below. What it does not translate is the CSS. Every Hugo example
  carries a hand-written "CSS Output" block and, where there is a demo, a
  hand-prefixed <style> copy of it. Here the CSS is compiled from the Sass at
  build time, so both are dropped -- and the hand-written one is kept aside so
  tools/check-ported-css.js can diff the two. A page whose stated output does
  not match what the library emits is either a bad conversion or a stale page,
  and both are worth knowing about.

  Run with --page <slug> to convert one, or with no arguments for all of them.
*/

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

const HUGO = fileURLToPath(new URL("../../../gerillass-docs/content/docs", import.meta.url));
const OUT = fileURLToPath(new URL("../content/docs", import.meta.url));
const CSS_REF = fileURLToPath(new URL("./stated-css.json", import.meta.url));

const TRANSLATION = {
  mixin: "Member",
  function: "Member",
  hint: "Hint",
  "arguments/table": "Arguments",
  "arguments/row": "Argument",
  highlightwrap: "Example",
};

const OPEN = /^\s*\{\{<\s*([a-z/]+)\s*(.*?)\s*>\}\}\s*$/;
const CLOSE = /^\s*\{\{<\s*\/\s*([a-z/]+)\s*>\}\}\s*$/;

function attrs(raw) {
  const out = {};
  const bare = [];
  /*
    Hugo escapes a quote inside an attribute as \", and a value that stops at
    the first one of those loses the rest of its sentence without failing --
    which is how `$name: \"card\"` truncated an argument description silently.
  */
  const re = /([a-zA-Z_]+)="((?:[^"\\]|\\.)*)"|(\S+)/g;
  let m;
  while ((m = re.exec(raw))) {
    if (m[1]) out[m[1]] = m[2].replace(/\\"/g, '"');
    else bare.push(m[3]);
  }
  return { out, bare };
}

// Attribute values are read as JSX strings, not markdown, so the little bit of
// markdown the Hugo attributes carry has to become the tags it stood for.
function inlineMarkdown(text) {
  return String(text)
    /*
      Angle brackets come first, before any tag is introduced. Several pages
      write an HTML element inside backticks -- `<body>`, `<a>` -- and left
      alone that is read as JSX opening a tag that never closes, which fails
      the build a long way from the line that caused it.
    */
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

const quote = (v) => String(v).replace(/"/g, "&quot;");

function convert(slug, source) {
  const fm = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const frontmatter = fm ? fm[1] : "";
  const body = fm ? source.slice(fm[0].length) : source;

  /*
    A page-level <style> block, the ones sitting between examples rather than
    inside one, is not a restatement of the mixin's output: it is what makes
    the demo boxes visible -- their padding, their colours, the alternating
    stripe on a columnizer item. Dropping those leaves every demo on the page
    unstyled, so they are collected here and put into each frame instead.
  */
  const pageStyles = [];
  const lines = [];
  {
    let depth = 0;
    let inStyle = false;
    for (const line of body.split(/\r?\n/)) {
      const o = line.match(OPEN);
      const c = line.match(CLOSE);
      if (o && o[1] === "highlightwrap") depth += 1;
      if (c && c[1] === "highlightwrap") depth -= 1;

      if (depth === 0 && (inStyle || /^\s*<style>/.test(line))) {
        inStyle = !/<\/style>/.test(line);
        pageStyles.push(line.replace(/<\/?style>/g, ""));
        continue;
      }
      lines.push(line);
    }
  }

  const out = [];
  const stated = [];
  const notes = [];
  let member = null;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const open = line.match(OPEN);

    if (!open) {
      out.push(line);
      i += 1;
      continue;
    }

    const [, name, raw] = open;
    const { out: a, bare } = attrs(raw);

    if (name === "mixin" || name === "function") {
      member = a.name;
      out.push(`<Member name="${quote(a.name)}">`, "");
      i += 1;
      continue;
    }

    if (name === "hint") {
      out.push(`<Hint kind="${quote(bare[0] || "info")}">`, "");
      i += 1;
      continue;
    }

    if (name === "arguments/table") {
      const footnote = a.footnote ? ` footnote="${quote(inlineMarkdown(a.footnote))}"` : "";
      out.push(`<Arguments of="${quote(member || slug)}"${footnote}>`);
      i += 1;
      continue;
    }

    if (name === "arguments/row") {
      const argName = ARGUMENT_NAMES[slug]?.[a.name] ?? a.name;
      out.push(
        `  <Argument name="${quote(argName)}" type="${quote(a.type || "")}">` +
          `${inlineMarkdown(a.description || "")}</Argument>`
      );
      i += 1;
      continue;
    }

    if (name === "highlightwrap") {
      const block = [];
      i += 1;
      let depth = 1;
      while (i < lines.length) {
        const c = lines[i].match(CLOSE);
        const o = lines[i].match(OPEN);
        if (c && c[1] === "highlightwrap") { depth -= 1; if (!depth) { i += 1; break; } }
        if (o && o[1] === "highlightwrap") depth += 1;
        block.push(lines[i]);
        i += 1;
      }
      out.push(...example(block, stated, notes, a.class, pageStyles, SETUP[slug]));
      continue;
    }

    /*
      A highlight on its own, outside any wrap. Four pages show a fragment of
      markup this way, with no Sass beside it and nothing to compile, so it
      becomes an ordinary fenced block.
    */
    if (name === "highlight") {
      const lang = bare[0] || "text";
      const code = [];
      i += 1;
      while (i < lines.length && !CLOSE.test(lines[i])) code.push(lines[i]), (i += 1);
      i += 1;
      out.push(`\`\`\`${lang}`, code.join("\n").trim(), "```", "");
      continue;
    }

    // Every other shortcode is an unknown, and passing it through unchanged is
    // what makes it visible: MDX refuses to parse {{< >}} and the build stops.
    out.push(line);
    i += 1;
  }

  const closed = out
    .join("\n")
    .replace(/^\s*\{\{<\s*\/\s*(mixin|function)\s*>\}\}\s*$/gm, "\n</Member>")
    .replace(/^\s*\{\{<\s*\/\s*hint\s*>\}\}\s*$/gm, "\n</Hint>")
    .replace(/^\s*\{\{<\s*\/\s*arguments\/table\s*>\}\}\s*$/gm, "</Arguments>");

  return { body: closed, frontmatter, stated, notes, member };
}

/*
  One highlightwrap becomes one <Example>. The caption is whatever prose sits
  above the first code block; the Sass is the example; the HTML is either an
  explicit html highlight or the demo markup left in the block.

  A wrap holding no Sass is not an example of a mixin -- the terminal
  transcript in the install page is the one case -- so it is left as plain
  fenced code.
*/
function example(block, stated, notes, className, pageStyles = [], setup = null) {
  const caption = [];
  const fences = [];
  const demo = [];

  let i = 0;
  while (i < block.length) {
    const o = block[i].match(OPEN);
    if (o && o[1] === "highlight") {
      const lang = attrs(o[2]).bare[0] || "text";
      const code = [];
      i += 1;
      while (i < block.length && !CLOSE.test(block[i])) code.push(block[i]), (i += 1);
      i += 1;
      fences.push({ lang, code: code.join("\n").trim() });
      continue;
    }
    (fences.length ? demo : caption).push(block[i]);
    i += 1;
  }

  /*
    Some captions carry a hint inside them. It is a note about the example, not
    part of the sentence introducing it, so it comes out and is written above
    the example rather than being escaped into the caption attribute.
  */
  const hints = [];
  {
    const kept = [];
    let open = null;
    let held = [];
    for (const line of caption) {
      const o = line.match(OPEN);
      const c = line.match(CLOSE);
      if (o && o[1] === "hint") { open = attrs(o[2]).bare[0] || "info"; continue; }
      if (c && c[1] === "hint") { hints.push({ kind: open, text: held.join("\n").trim() }); open = null; held = []; continue; }
      (open ? held : kept).push(line);
    }
    caption.length = 0;
    caption.push(...kept);
  }

  const scss = fences.find((f) => f.lang === "scss");
  const css = fences.find((f) => f.lang === "css");
  const html = fences.find((f) => f.lang === "html");

  /*
    Only a wrap marked class="example" is an example. The others are the "What
    it refuses" sections, which show a call that is meant to fail and the error
    the library answers with, and the one terminal transcript in the install
    page. Compiling those would stop the build on the very thing the page is
    demonstrating, so they stay as plain fenced code.
  */
  if (!scss || className !== "example") {
    return fences.map((f) => `\`\`\`${f.lang}\n${f.code}\n\`\`\``);
  }

  if (css) stated.push({ source: scss.code, css: css.code.replace(/^\/\/\s*CSS Output\s*\n?/i, "") });

  /*
    The <style> blocks in a demo are the same rules again, written out by hand
    with vendor prefixes and scoped to the demo's own class. They are dropped
    because the compiled CSS is what should be styling the result -- a demo
    carrying its own copy would keep looking right after the mixin broke. Any
    that hold more than a restatement are reported rather than guessed at.
  */
  const markup = demo.join("\n");
  const styles = [...markup.matchAll(/<style>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
  if (styles.length) notes.push({ caption: caption.join(" ").trim().slice(0, 60), styles });

  const body = html
    ? html.code
    : markup.replace(/<style>[\s\S]*?<\/style>/gi, "").trim();

  const parts = [];
  for (const h of hints) parts.push(`<Hint kind="${quote(h.kind)}">`, "", h.text, "", "</Hint>", "");

  const text = caption.join("\n").trim();
  const open = [
    "<Example",
    text ? ` caption="${quote(inlineMarkdown(text))}"` : "",
    setup ? ` setup="${quote(setup)}"` : "",
    ">",
  ].join("");
  parts.push(open);
  parts.push("```scss", scss.code, "```");

  /*
    The page's demo styling rides along in the HTML, which is the one pane the
    reader never sees. Putting it in the Sass would show the reader a stylesheet
    they did not write, and putting it in the CSS pane would claim the library
    emitted it.
  */
  const decorated = pageStyles.length && body
    ? `<style>\n${pageStyles.join("\n").trim()}\n</style>\n${body}`
    : body;
  if (decorated) parts.push("```html", decorated, "```");
  parts.push("</Example>", "");
  return parts;
}

/*
  Pages this repository owns. aspect-ratio was written here during the port,
  against measurements taken in a browser, and the upstream copy was written
  from the release notes rather than from the mixin. Converting over it would
  lose the better of the two.

  line-clamp is here for a different reason: its comparison table arrived as
  raw HTML carrying the Hugo site's own class names, which MDX reads as JSX and
  React then warns about, so it was rewritten as a Markdown table. Converting
  again would put the raw one back.

  content/docs/index.mdx has no counterpart upstream at all. It is the
  installation page, and it is written here.
*/
const HAND_WRITTEN = new Set(["aspect-ratio", "line-clamp"]);

/*
  Sass an example needs before it can compile, but which is not part of what it
  shows. loadify is the only member with this shape: `loadify(init)` defines the
  placeholder that every later call @extends, and the page says so in prose
  above the examples rather than repeating the line in each of them.
*/
const SETUP = { loadify: "@include loadify(init);" };

/*
  Argument names the Hugo pages left as a placeholder. The scissors page wrote
  its one argument as "--", so a reader was never told what to call it; the
  signature has always been scissors($corners). Checking the page against the
  manifest is what turned this up, and it was the only one of the 76.
*/
const ARGUMENT_NAMES = { scissors: { "--": "$corners" } };

const only = process.argv.includes("--page")
  ? process.argv[process.argv.indexOf("--page") + 1]
  : null;

const slugs = readdirSync(HUGO, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(`${HUGO}/${e.name}/index.md`))
  .map((e) => e.name)
  .filter((s) => (only ? s === only : !HAND_WRITTEN.has(s)))
  .sort();

mkdirSync(OUT, { recursive: true });
const reference = existsSync(CSS_REF) ? JSON.parse(readFileSync(CSS_REF, "utf8")) : {};
let withNotes = 0;

for (const slug of slugs) {
  const source = readFileSync(`${HUGO}/${slug}/index.md`, "utf8");
  const { body, frontmatter, stated, notes } = convert(slug, source);

  const image = existsSync(`${HUGO}/${slug}/images/gerillass-${slug}.jpg`)
    ? `gerillass-${slug}.jpg`
    : null;

  let fm = frontmatter.trimEnd();
  if (image && !/^page_image:/m.test(fm)) fm += `\npage_image: "${image}"`;

  /*
    A heading or a shortcode that follows a closing tag with no blank line
    between them is read as part of the block above it, so the tags get their
    own line and the run of blank lines is tidied afterwards.
  */
  const spaced = body
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^(<\/(?:Member|Hint|Arguments|Example)>)\n(?!\n|$)/gm, "$1\n\n");

  writeFileSync(`${OUT}/${slug}.mdx`, `---\n${fm}\n---\n${spaced}\n`);
  reference[slug] = stated;
  if (notes.length) withNotes += 1;
}

writeFileSync(CSS_REF, `${JSON.stringify(reference, null, 2)}\n`);
console.log(`${slugs.length} sayfa yazildi. ${withNotes} sayfada elle yazilmis <style> vardi.`);
