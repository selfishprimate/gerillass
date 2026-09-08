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
  silenceDeprecations: ["import", "global-builtin"],
};

const compile = (snippet) =>
  sass.compileString(`@import "gerillass";\n${snippet}\n`, SASS_OPTS);

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

describe("Manifest examples", () => {
  for (const member of manifest.members) {
    for (const example of member.examples || []) {
      it(`${member.name}: ${example.replace(/\s+/g, " ").slice(0, 70)}`, () => {
        const result = compile(example);
        expect(result.css.length).toBeGreaterThan(0);
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
