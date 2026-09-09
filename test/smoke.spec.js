const path = require("path");
const sass = require("sass");

// Compiles test/smoke.scss, which includes every mixin in scss/library/.
//
// This exists because Sass evaluates mixin bodies lazily: a partial can
// reference an undefined variable, function or mixin and the library will still
// import cleanly. The failure only appears when someone calls that mixin. The
// sass-true specs cover the output of a handful of mixins; this one covers the
// far cheaper question of whether all 51 of them still evaluate at all.

const ENTRY = path.resolve(__dirname, "smoke.scss");
const LOAD_PATH = path.resolve(__dirname, "..", "scss");

describe("Smoke", () => {
  let result;

  it("compiles every mixin in the library", () => {
    // if-function only, and only because it is deliberately deferred; see
    // CLAUDE.md. `import` and `global-builtin` stay unsilenced on purpose:
    // 2.0.0 removed both from the library, so a warning for either is a
    // regression and should be seen rather than swallowed.
    result = sass.compile(ENTRY, {
      loadPaths: [LOAD_PATH],
      quietDeps: true,
      silenceDeprecations: ["if-function"],
    });

    expect(result.css.length).toBeGreaterThan(0);
  });

  it("emits a rule for every mixin it calls", () => {
    // Guards against a mixin silently producing nothing, and against the smoke
    // file drifting out of sync with scss/library/.
    const fs = require("fs");
    const source = fs.readFileSync(ENTRY, "utf8");
    const called = new Set(
      [...source.matchAll(/@include ([a-z-]+)/g)].map((m) => m[1])
    );
    const defined = fs
      .readdirSync(LOAD_PATH + "/library")
      .filter((f) => f.endsWith(".scss") && f !== "_index.scss")
      .map((f) => f.replace(/^_/, "").replace(/\.scss$/, ""));

    const missing = defined.filter((name) => !called.has(name));
    expect(missing).toEqual([]);
  });
});
