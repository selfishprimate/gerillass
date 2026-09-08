# Contribution
_To contribute, or not to contribute, that is the question!_

## Hey there!

**The future contributor of Gerillass,**

I'm sure you will find it quite easy to contribute to the project. I encourage you to examine the code in the "scss" folder first to understand the logic behind the structure.

If you don't somehow, you have to read the details below line-by-line, unfortunately.

## Gerillass Style Guide

Please examine the code and match the style with the code you write (**Prettier** plugin for your code editor can pretty much help you to format your code).

### Overview

* Use two spaces indentation (no tabs).
* Use `@charset "UTF-8";` line in every Sass related files to avoid any potential issues with character encoding.
* Use **camelCase** naming convention for function names only (e.g. `newFunction {}`). Mixins are kebab-case, so the casing is what tells them apart.
* Use **kebab-case** naming convention for the rest of the code.
* Use `map-for-`prefix for the map names (e.g. `$map-for-directions`).
* Use `list-of-` prefix for the list names (e.g. `$list-of-colors`).
* Don't use single quotes unless you have to.

### Functions

The functions should be placed in the **utilities** folder and follow the **camelCase** naming convention.

Do not start a member name with `_` or `-`. Sass treats those as private to the file, so the member becomes unreachable from anywhere else — and through `@use ... as *` it fails silently rather than erroring. Avoid the names of Sass built-ins too: a function called `darken` shadows the built-in one and quietly returns a different colour.

    @function newFunction($parameter) {
        // Your code!
    }

In the entire library, only the function names are following the camelCase naming convention to make a strict distinction between the functions and the mixins. Rest of the code follows **kebab-case** (also known as spinal-case) naming convention.


### Mixins

The mixin files should be placed in the **library** folder and they must follow the kebab-case naming convention.

    @mixin your-mixin($parameter) {
      // Your code!
    }

Validate what you accept, and say what you accept when you refuse it:

    @error "`#{$axis}` is not a valid $axis for `center`. Pass one of: both, horizontal, vertical.";

A mixin that silently emits nothing for a bad argument is the worst outcome — the build passes and a declaration is quietly missing. Check the type before calling anything that throws on the wrong one (`str-slice`, `nth`, `unit`, `unquote`), or the caller gets Sass's message about its own parameter instead of yours.

Do **not** validate a value you pass straight through to CSS. `var()`, `calc()`, `clamp()` and whatever ships next are all valid, and a strict check rejects correct code.

Add it to `scss/library/_index.scss` so it is forwarded, and declare whatever it uses at the top of the file:

    @charset "UTF-8";

    @use "sass:math";
    @use "../utilities/validate-length" as *;

`@forward` does not reach sibling partials, so a mixin that reads a map or calls a function needs its own `@use` line. The `gls-` prefixed copy is produced automatically by `_gerillass.scss`; there is nothing to regenerate.

### Lists

The list files should be placed in the **lists** folder, and the name of the list must start with the `list-of` prefix.

    $list-of-buttons: (
      "button",
      "[type='button']",
      "[type='reset']",
      "[type='submit']"
    ) !default;

### Maps

The maps should be placed in the **maps** folder, and the name of the map must be start with `map-for` prefix.

    $map-for-breakpoints: (
      "xsmall": 0,
      "small": 576px,
      "medium": 768px,
      "large": 992px,
      "xlarge": 1200px,
    ) !default;
 
## Describing what you added

Every mixin and function carries a small JSON file in `meta/` saying what it does, what each argument accepts, an example that works, and an input that must be refused. **The test suite fails if a mixin has no entry**, so this is part of writing the mixin, not paperwork afterwards.

    {
      "name": "your-mixin",
      "summary": "One line, saying what it emits.",
      "arguments": [{ "name": "$size", "accepts": ["a length", "auto"] }],
      "examples": [".element { @include your-mixin(10px); }"],
      "rejects": [".element { @include your-mixin(nonsense); }"]
    }

Signatures are read from your Sass, so do not repeat them. Then run:

    npm run manifest

That regenerates `gerillass.json` and `SKILL.md`, both of which ship in the package so that editors and AI coding agents can read the API instead of guessing at it. Commit them with your change.

Your `rejects` entries are how your validation gets tested: the suite compiles each one, requires it to fail, and requires the failure to be *your* message rather than an internal Sass error.

## Testing

    npm test

The suite checks four different things, and it helps to know which one your change needs:

| Level | What it proves | Where it lives |
|---|---|---|
| Smoke | the mixin evaluates at all | `test/smoke.scss` |
| Snapshot | its output cannot change unnoticed | your `meta/` examples |
| Rejection | bad input is refused, with a useful message | your `meta/` rejects |
| Assertion | the CSS is **correct** | `test/library/*.spec.scss` |

The first three come free once you have written the `meta/` entry. The fourth is written by hand with [sass-true](https://github.com/oddbird/true), and it is the only one that can tell you an output was wrong from the beginning — a snapshot of a wrong value records it as correct.

Write one when your mixin **computes** something: arithmetic, a percentage, a polygon, a shorthand order. `test/library/triangle.spec.scss` and `test/library/columnizer.spec.scss` are the examples to copy. Work out what the CSS should be from the technique and *then* compare; pasting the compiled output makes the test agree with the code no matter what the code does.

For a mixin that emits a few fixed declarations, the snapshot is enough.

There is also a sweep that throws arguments nobody wrote a test for at every member:

    node tools/audit.js

Its **SILENT** and **UNHELPFUL ERROR** buckets should be empty. If your change puts something in either, that is a defect to fix rather than a number to accept.

## Working with an AI agent

The repository is set up so that a coding agent can work here without guessing, and you are welcome to use one.

**What ships for agents.** `gerillass.json` describes every member — signature, accepted values, examples, refusals — and `SKILL.md` is a written guide generated from it. Both are in the published package, so an agent working in *your* project can read them out of `node_modules/gerillass/`.

**What is here for contributors.** `.claude/` holds instructions for [Claude Code](https://claude.com/claude-code), which is what this setup was built and tested against. Other agents can read `CLAUDE.md` directly; it is plain Markdown and describes the architecture, the traps and the conventions.

Four commands are available as slash commands:

| Command | Use it for |
|---|---|
| `/new-mixin` | adding a mixin, function, list or map, with every step that is easy to forget |
| `/sass-test` | writing a sass-true assertion |
| `/audit-library` | sweeping the whole library before a release |
| `/release` | version, changelog, tag, GitHub release, npm publish |

**What runs automatically.** Three hooks fire after a file is edited: they refuse a `package.json` that declares runtime dependencies, rebuild `gerillass.json` and `SKILL.md`, and check that the counts quoted in the documentation still match the repository. They only fire for edits made through the editor — if you change files with a shell command, run `npm run manifest` yourself.

**One rule if you use an agent.** Do not let it claim something it has not run. This library is published and has real users; a wrong claim either ships a defect or deletes something someone depends on. `CLAUDE.md` has a section on this with the mistakes that have actually been made here.

 
 Well, that's all for now.
 
 _This document will soon be updated!_
