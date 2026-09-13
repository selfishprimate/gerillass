const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const sass = require("sass");

// The manifest is only useful to an agent if it is true. Everything it claims is
// executed here: each example must compile, and each rejection must actually be
// rejected. A summary that drifts away from the code fails the build.

const ROOT = path.resolve(__dirname, "..");
const LOAD_PATH = path.join(ROOT, "scss");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "gerillass.json"), "utf8"));

const SASS_OPTS = {
  loadPaths: [LOAD_PATH],
  quietDeps: true,
  // if-function only, and only because it is deliberately deferred; see
  // CLAUDE.md. `import` and `global-builtin` stay unsilenced on purpose, so
  // that a regression to either one is visible rather than swallowed.
  silenceDeprecations: ["if-function"],
};

// Pass an array to collect @warn messages. Deprecations are left out: they are
// silenced above for a reason recorded in CLAUDE.md, and would fail every test.
const compile = (snippet, warnings) =>
  sass.compileString(`@use "gerillass" as *;\n${snippet}\n`, {
    ...SASS_OPTS,
    ...(warnings && {
      logger: {
        warn(message, { deprecation }) {
          if (!deprecation) warnings.push(message);
        },
      },
    }),
  });

const mixins = manifest.members.filter((m) => m.kind === "mixin");

describe("Manifest", () => {
  it("is up to date with the Sass sources", () => {
    // Throws if the checked-in gerillass.json differs from a fresh build.
    execFileSync("node", [path.join(ROOT, "tools", "build-manifest.js"), "--check"], {
      cwd: ROOT,
      stdio: "pipe",
    });
  });

  it("has a SKILL.md generated from the current manifest", () => {
    execFileSync("node", [path.join(ROOT, "tools", "build-skill.js"), "--check"], {
      cwd: ROOT,
      stdio: "pipe",
    });
  });

  it("has an llms.txt generated from the current manifest", () => {
    execFileSync("node", [path.join(ROOT, "tools", "build-llms-txt.js"), "--check"], {
      cwd: ROOT,
      stdio: "pipe",
    });
  });

  it("describes every mixin in scss/library", () => {
    const undocumented = mixins.filter((m) => !m.summary).map((m) => m.name);
    expect(undocumented).toEqual([]);
  });

  it("gives every mixin at least one example", () => {
    const missing = mixins.filter((m) => !m.examples || !m.examples.length).map((m) => m.name);
    expect(missing).toEqual([]);
  });

  it("only names arguments that exist in the parsed signature", () => {
    // An authored argument whose name no longer matches the source means the
    // signature changed and the metadata did not follow.
    const orphans = [];
    for (const m of manifest.members) {
      for (const arg of m.arguments) {
        if (arg.accepts && !arg.name.startsWith("$")) orphans.push(`${m.name} ${arg.name}`);
      }
    }
    expect(orphans).toEqual([]);
  });
});

// Compiling proves a mixin runs. It does not prove the CSS is right: changing
// circle's border-radius from 100% to 4px leaves every other assertion in this
// file green. Snapshotting the output turns any change to what a mixin emits
// into a reviewable diff. A snapshot records what the library does, not what it
// ought to do -- the sass-true specs under test/library are where correctness
// is asserted by hand.
//
// A documented call must also compile without a @warn. The CSS can be right
// while the build prints a warning on every compile: `position` did that for
// `null`, the way its own documentation page skips an edge, and passed.
//
// And without a /* */ comment. Inside a mixin one is emitted into the user's
// stylesheet, which is how the Meyer licence note from `reset-css` ended up in
// projects' compiled CSS. Library comments are `//`.
describe("Manifest examples", () => {
  for (const member of manifest.members) {
    for (const example of member.examples || []) {
      it(`${member.name}: ${example.replace(/\s+/g, " ").slice(0, 70)}`, () => {
        const warnings = [];
        const result = compile(example, warnings);
        expect(warnings).toEqual([]);
        expect(result.css).not.toMatch(/\/\*/);
        expect(result.css.length).toBeGreaterThan(0);
        expect(result.css).toMatchSnapshot();
      });
    }
  }
});

// Every mixin exists twice: bare, and prefixed through `@forward "library" as
// gls-*` in _gerillass.scss. Until 2.0.0 the prefixed half was a generated file
// and this check guarded the generator; it now guards the forward, which can
// still drop a member if the index misses one. Demanding identical CSS from
// both names is the check.
const prefixed = (snippet, name) =>
  snippet.replace(new RegExp(`@include\\s+${name}(?=[\\s(;{]|$)`, "g"), `@include ${manifest.prefix}${name}`);

describe("Prefixed mixins match their bare counterparts", () => {
  for (const member of mixins) {
    for (const example of member.examples || []) {
      it(`${manifest.prefix}${member.name}: ${example.replace(/\s+/g, " ").slice(0, 60)}`, () => {
        const bare = compile(example);
        const gls = compile(prefixed(example, member.name));
        expect(gls.css).toBe(bare.css);
      });
    }
  }
});

describe("Prefixed mixins reject the same input", () => {
  for (const member of mixins) {
    for (const reject of member.rejects || []) {
      it(`${manifest.prefix}${member.name} rejects: ${reject.replace(/\s+/g, " ").slice(0, 50)}`, () => {
        let message = null;
        try {
          compile(prefixed(reject, member.name));
        } catch (e) {
          message = e.message;
        }
        expect(message).not.toBeNull();
        expect(message).not.toMatch(/is not a string|Invalid index|\$number: .* is not a number/);
      });
    }
  }
});

describe("Manifest rejections", () => {
  for (const member of manifest.members) {
    for (const reject of member.rejects || []) {
      it(`${member.name} rejects: ${reject.replace(/\s+/g, " ").slice(0, 60)}`, () => {
        // Must fail, and must fail with the library's own message rather than a
        // Sass internal error leaking through.
        let message = null;
        try {
          compile(reject);
        } catch (e) {
          message = e.message;
        }
        expect(message).not.toBeNull();
        expect(message).not.toMatch(/is not a string|Invalid index|\$number: .* is not a number/);
      });
    }
  }
});
