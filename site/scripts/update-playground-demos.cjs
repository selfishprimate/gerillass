#!/usr/bin/env node
/*
  Regenerates src/components/Playground/demos.json.

  Every mixin has a documentation page carrying `scss` blocks that show the
  mixin in use. This reads those from the pages under content/docs, so the
  playground demonstrates what the documentation demonstrates and stays in step
  with it.

  A page works through its mixin: the first example passes one argument, and
  each one after it adds something — the optional arguments, a content block,
  the mixin inside a breakpoint. The fullest of them is the one worth opening
  the playground on, so the blocks are tried longest first, later before
  earlier where they are the same size, and the first that compiles wins.
  Trying rather than taking: an example that has drifted out of date costs its
  page a richer demo, not the demo altogether.

  Longest rather than last, because a page does not always end on its fullest
  example — several close on the global form of a mixin they have just shown
  scoped, and one drops an argument it had already demonstrated.

  The documentation is not always ahead of the library. A release adds mixins
  before their pages are written, and the playground was missing three of them
  because of it. So the library's own `gerillass.json` is read as well: it
  lists every member, and anything the docs have no page for is taken from
  there instead — the summary for the description, and either an override
  below or the manifest's own fullest example for the snippet. That manifest
  is generated from the sources and every example in it is compiled by the
  library's test suite, so it is a sound second source; the docs still win
  wherever they have something to say.

  Usage: node scripts/update-playground-demos.cjs

  It used to fetch the pages from the gerillass-docs repository over `gh api`,
  parse Hugo's highlight shortcodes, and read the manifest out of an installed
  copy of the package. Since the site, the documentation and the library moved
  into one repository, all three are files beside it.
*/

const fs = require("fs");
const path = require("path");
const sass = require("sass");

const ROOT = path.join(__dirname, "..", "..");
const DOCS = path.join(__dirname, "..", "content", "docs");
const MANIFEST = path.join(ROOT, "gerillass.json");
/* Where _gerillass.scss lives, so `@use "gerillass"` resolves to the library in
   this repository rather than a published copy. */
const LOAD_PATH = path.join(ROOT, "scss");
const OUTPUT = path.join(
  __dirname,
  "..",
  "src",
  "components",
  "Playground",
  "demos.json"
);

/* The `scss` fences of a page, in order. */
function blocks(markdown) {
  return Array.from(markdown.matchAll(/```scss\n([\s\S]*?)```/g)).map((match) =>
    match[1].replace(/^\n+|\s+$/g, "")
  );
}

/*
  Loaded with `as *`, so a snippet reads exactly as the documentation writes it:
  `@include columnizer(3)`, not `@include gerillass.columnizer(3)`. `@use` on
  its own would namespace every member, and the older `@import` is on its way
  out of Dart Sass.
*/
const HEADER = '@use "gerillass" as *;\n\n';

/*
  A page's fullest example is not always its most telling one, and where that
  is so the snippet is written here rather than chosen. It is compiled like any
  other, so an override that stops working falls back to the page.

  border-radius: the longest example on the page is the four-corner elliptical
  shorthand, which is CSS a stylesheet could write without the mixin at all.
  The keyword form is the thing the mixin adds.

  breakpoint: the page's fullest example calls `between` three times over one
  selector, so the CSS comes back as three blocks that read alike and belong to
  nothing in particular. One mode each, on selectors you would actually write,
  makes both halves of the playground legible: every media query in the output
  names the rule it came from.
*/
const OVERRIDES = {
  /*
    container and container-query: the container goes on an ancestor of the
    element the query styles. An element is never matched by a rule reading
    its own container, and nothing warns you when it is on the wrong one, so
    the snippet says so where somebody pasting it will still have it.
  */
  container: [
    ".card {",
    '  @include container("card");',
    "}",
    "",
    ".panel {",
    "  @include container(null, size);",
    "}",
  ].join("\n"),
  "container-query": [
    ".card {",
    '  @include container("card");',
    "}",
    "",
    "// The query goes on a descendant of the container, never on the",
    "// container itself. Nothing warns you when it is on the wrong element.",
    ".card .title {",
    '  @include container-query("min", 400px) {',
    "    font-size: 2rem;",
    "  }",
    "}",
  ].join("\n"),
  "line-clamp": [
    ".excerpt {",
    "  @include line-clamp(3);",
    "}",
  ].join("\n"),
  "border-radius": ".element{\n  @include border-radius(top, 24px);\n}",
  /*
    aspect-ratio: the longest block on its page is the one comparing the mixin
    with the `ratio-box` and `responsive-video` it replaced, which no longer
    exist and so will not compile. What is worth showing instead is the three
    ways a ratio can be written, the three things the second argument does, and
    the point the page makes hardest: on an embed the ratio goes on the iframe,
    not on a wrapper around it.
  */
  "aspect-ratio": [
    ".video iframe {",
    '  @include aspect-ratio("16/9");',
    "}",
    "",
    ".avatar {",
    '  @include aspect-ratio("1:1", contain);',
    "}",
    "",
    ".panel {",
    "  @include aspect-ratio(1.5, null);",
    "}",
  ].join("\n"),
  /*
    loadify: every example past the first one assumes the page has already
    called `@include loadify(init)`, which is what writes the keyframes and the
    placeholder the rest extends — on its own none of them compiles, and the
    playground was left with the init call by itself. Here the call and a use
    of it stand together, staggered over three items rather than the page's
    eight, which say the same thing seven times.
  */
  loadify: [
    "@include loadify(init);",
    "",
    ".parent-element {",
    "  .item {",
    "    @include only(1) {",
    "      @include loadify(0.2s, 0.6s);",
    "    }",
    "    @include only(2) {",
    "      @include loadify(0.4s, 0.6s);",
    "    }",
    "    @include only(3) {",
    "      @include loadify(0.6s, 0.6s);",
    "    }",
    "  }",
    "}",
  ].join("\n"),
  /*
    only: the page shows one call per example, so the demo landed on whichever
    was longest and said nothing about the rest. A number counts from the
    start, a negative one from the end, and the two can be mixed.

    One form each, on a list of its own: three calls stacked in a single
    selector would only be a list of arguments that belongs in one call, and
    saying the same thing over separate lists is both what you would write and
    what makes each selector in the output easy to place.
  */
  only: [
    ".cards {",
    "  .card {",
    "    @include only(2) {",
    "      background-color: #5bc0bb;",
    "    }",
    "  }",
    "}",
    "",
    ".articles {",
    "  article {",
    "    @include only(-1) {",
    "      border-bottom: 0;",
    "    }",
    "  }",
    "}",
    "",
    ".gallery {",
    "  figure {",
    "    @include only(1, -1) {",
    "      grid-column: span 2;",
    "    }",
    "  }",
    "}",
  ].join("\n"),
  breakpoint: [
    ".header{",
    "  @include breakpoint(min, large) {",
    "    padding: 2rem 4rem;",
    "  };",
    "}",
    "",
    ".card{",
    "  @include breakpoint(between, small large) {",
    "    flex: 0 0 50%;",
    "  };",
    "}",
    "",
    ".sidebar{",
    "  @include breakpoint(max, medium) {",
    "    display: none;",
    "  };",
    "}",
    "",
    ".footer{",
    "  @include breakpoint(only, 1200px) {",
    "    text-align: center;",
    "  };",
    "}",
  ].join("\n"),
};

/* The page's own name for the mixin and its one-line summary, from the front
   matter, so the list beside the editors reads like the documentation. */
function frontMatter(markdown, key) {
  const match = markdown.match(new RegExp(`^${key}:\\s*"([^"]*)"`, "m"));
  return match ? match[1] : null;
}

function title(markdown, name) {
  return frontMatter(markdown, "title") || name;
}

function description(markdown) {
  return frontMatter(markdown, "page_description") || "";
}


const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const mixins = new Set(
  manifest.members.filter((member) => member.kind === "mixin").map((member) => member.name)
);

/* A page names the member it documents in <Member name>, which is not always
   its file name: clear-unit.mdx documents clearUnit. Guides name none. */
const pages = fs
  .readdirSync(DOCS)
  .filter((file) => file.endsWith(".mdx"))
  .sort()
  .map((file) => {
    const markdown = fs.readFileSync(path.join(DOCS, file), "utf8");
    const member = markdown.match(/<Member name="([^"]+)"/);
    return { file, markdown, name: member ? member[1] : null };
  })
  .filter((page) => page.name && mixins.has(page.name));

/*
  Compiling is the only check worth having. An unknown mixin is an error, but
  an unknown function is not — Sass emits the call as literal CSS — so a demo
  can look fine and be wrong. That is why nothing below is written without
  being compiled first.
*/
function compiles(source) {
  sass.compileString(source, {
    loadPaths: [LOAD_PATH],
    logger: sass.Logger.silent,
  });
}

/* `ratio-box` reads better as "Ratio Box" in a list. */
function titleCase(name) {
  return name
    .split("-")
    .map((word) => (word === "css" ? "CSS" : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

const demos = {};
const skipped = [];
const fromManifest = [];

pages.forEach(({ name, markdown }) => {
  /* Blocks that actually call the mixin: some pages open with the markup or
     with the "before" state. */
  const found = blocks(markdown)
    .filter((block) => new RegExp(`@include\\s+${name}\\b`).test(block))
    .map((block, index) => ({ block, index }))
    .sort((a, b) => b.block.length - a.block.length || b.index - a.index)
    .map((entry) => entry.block);
  const examples = OVERRIDES[name] ? [OVERRIDES[name], ...found] : found;
  if (!examples.length) {
    skipped.push([name, "no scss example calling the mixin"]);
    return;
  }

  let scss = null;
  let failure = null;
  for (let index = 0; index < examples.length && !scss; index += 1) {
    const candidate = `${HEADER}${examples[index]}\n`;
    try {
      compiles(candidate);
      scss = candidate;
      if (index !== 0) {
        skipped.push([
          name,
          `fell back to a smaller example (${index} tried first): ${failure}`,
        ]);
      }
    } catch (error) {
      failure = error.message.split("\n")[0];
    }
  }
  if (!scss) {
    skipped.push([name, `no example compiles: ${failure}`]);
    return;
  }

  demos[name] = { title: title(markdown, name), description: description(markdown), scss };
});

/*
  Whatever the docs have not covered yet, from the manifest at the repository
  root. An override is preferred to the manifest's own examples
  where one is written for it, because a good demo shows the mixin doing
  something, and a manifest example is often the smallest call that is valid.
*/
manifest.members
  .filter((member) => member.kind === "mixin" && !demos[member.name])
  .forEach((member) => {
    const written = OVERRIDES[member.name];
    const candidates = written
      ? [written]
      : (member.examples || [])
          .slice()
          .sort((a, b) => b.length - a.length);

    let scss = null;
    let failure = null;
    for (let i = 0; i < candidates.length && !scss; i += 1) {
      const candidate = `${HEADER}${candidates[i]}\n`;
      try {
        compiles(candidate);
        scss = candidate;
      } catch (error) {
        failure = error.message.split("\n")[0];
      }
    }

    if (!scss) {
      skipped.push([member.name, `no manifest example compiles: ${failure}`]);
      return;
    }

    fromManifest.push(member.name);
    demos[member.name] = {
      title: titleCase(member.name),
      description: member.summary || "",
      scss,
    };
  });

const ordered = {};
Object.keys(demos)
  .sort()
  .forEach((name) => {
    ordered[name] = demos[name];
  });

fs.writeFileSync(OUTPUT, `${JSON.stringify(ordered, null, 2)}\n`);

console.log(
  `Wrote ${Object.keys(ordered).length} demos to ${path.relative(
    process.cwd(),
    OUTPUT
  )}`
);
if (fromManifest.length) {
  console.log(
    `  from the manifest, undocumented so far: ${fromManifest.join(", ")}`
  );
}
skipped.forEach(([name, reason]) => console.log(`  skipped ${name}: ${reason}`));
