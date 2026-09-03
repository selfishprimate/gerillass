# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Gerillass is a **pure Sass library** — a toolkit of mixins and functions, in the spirit of Bourbon/Scut. There is no build step that produces CSS or JS: the `.scss` sources under `scss/` *are* the deliverable, and npm publishes them verbatim. Docs live at https://docs.gerillass.com; the site repo is separate.

Two consequences follow from this and drive most decisions in the repo:

1. **`package.json` must have no `dependencies`.** Everything (`jest`, `sass`, `sass-true`, `glob`, `gulp*`) belongs in `devDependencies`. Consumers get only `.scss` files, so a runtime dependency here forces the entire test toolchain onto every downstream project. This was the cause of 24 Dependabot alerts fixed in v1.3.3 — do not reintroduce it.
2. **Only `scss/` ships.** `.npmignore` excludes `test`, `assets`, `gulpfile.js`, dotfiles and `*.md`; npm always adds `README.md`, `LICENSE.md` and `package.json` back. Verify with `npm pack --dry-run` before any release (89 files / ~23 kB as of v1.4.0).

Dart Sass only. LibSass/node-sass has been unsupported since v1.3.0.

### How consumers load it

`package.json` declares both `main` and an `exports` map with a `sass`
condition, which is what lets Dart Sass's `pkg:` importer resolve
`@use "pkg:gerillass"`. The `"./*"` wildcard in that map is not decorative —
`exports` is a whitelist, so without it every subpath (`pkg:gerillass/scss/…`)
becomes unreachable.

Four routes were verified against a packed tarball, and all four must keep
working after any change to `main`, `exports`, or the location of
`_gerillass.scss`:

| Route | Notes |
|---|---|
| `@use "pkg:gerillass"` | needs `NodePackageImporter` or `--pkg-importer=node`; requires `exports` |
| `@use "gerillass"` | Vite resolves this through `exports`; webpack through `main` |
| `@use "gerillass/scss/gerillass"` | subpath, needs the `"./*"` wildcard |
| `loadPaths` / `includePaths` | filesystem-based, unaffected by `exports` — this is what the Gulp and Grunt recipes in the README use |

**eyeglass metadata is inert.** The `eyeglass` block and the `eyeglass-module`
keyword are still there, but eyeglass 3.0.3 (June 2022, unmaintained) is broken
with current Dart Sass: any `@import` fails with `doneImporting is not a
function`, with or without Gerillass. It also rides the legacy JS API, which
Dart Sass removes in 2.0.0. Removing the block is a breaking change for a
hypothetical old-toolchain user, so it is queued for 2.0.0 rather than done now.

## Commands

```bash
npm test                          # Jest -> sass-true, runs every test/**/*.spec.scss
npx jest -t "__mapDeepGet()"      # single test, filtered by the describe/it name
npx gulp start                    # regenerate scss/_gerillass-prefix.scss (see below)
npm pack --dry-run                # inspect exactly what would be published
yarn audit                        # must stay at zero across all severities
```

There is no lint step and no CI — `.github/` holds only funding and issue templates. Yarn 1 (classic) is the lockfile format; `yarn.lock` is committed, `package-lock.json` is not used.

### Compiling by hand

Sass evaluates mixin bodies **lazily**. Compiling a file that merely loads the library succeeds even when a partial references an undefined variable, so this proves nothing:

```scss
@import "gerillass";   // compiles clean regardless of what is broken inside
```

To actually exercise the library you must `@include` the mixins:

```bash
printf '@import "gerillass";\n.a { @include adaptive(); }\n.b { @include gls-triangle(top, red, 10px); }\n' > /tmp/check.scss
sass --load-path=scss --quiet /tmp/check.scss
```

This distinction matters: a change can look fine and still be broken for every user of a mixin you did not include in your test file.

## Repo tooling

`.claude/` carries the automation for the two mistakes this project has actually
made, plus the workflows that are easy to half-finish:

- **`hooks/guard-dependencies.sh`** — blocks any edit that leaves `dependencies`
  non-empty in the root `package.json`.
- **`hooks/sync-prefix.sh`** — runs `npx gulp start` after any edit under
  `scss/library/`, so the `gls-` bundle cannot go stale.
- **`/release`, `/new-mixin`, `/sass-test`** — the release checklist, the
  add-a-member checklist, and the sass-true conventions.

Both hooks are `PostToolUse` on `Write|Edit` and exit 2 (blocking) on failure.

## Architecture

Four layers, loaded in dependency order by `scss/_gerillass.scss`. The order is not cosmetic — the library is `@import`-based, so everything lands in one global namespace and later files depend on earlier ones being present:

| Layer | Folder | Contents | Naming |
|---|---|---|---|
| 1 | `scss/lists/` | flat value lists (`$list-of-buttons`) | `list-of-` prefix, `!default` |
| 2 | `scss/maps/` | keyed config (`$map-for-breakpoints`) | `map-for-` prefix, `!default` |
| 3 | `scss/utilities/` | 21 helper **functions** | `__camelCase`, two leading underscores |
| 4 | `scss/library/` | 51 **mixins** — the bulk of the API | `kebab-case` |

`_gerillass.scss` lists every partial explicitly. **A new file is invisible until you add its `@import` line there**, in the correct layer block.

Per `CONTRIBUTING.md`, the `__` prefix and camelCase exist for one reason: to make functions impossible to confuse with mixins at a call site. **They do not mean "private".** Utilities are part of the public API and users call them directly — `__remify` has its own page in the docs. Utilities cluster around three jobs: type guards (`__isColor`, `__isNumber`, `__isTime`), validators that `@warn`/`@error` and return (`__validateLength`, `__validateBreakpoint`, `__validateRatio`, `__validateScissors`), and converters (`__remify`, `__pixelify`, `__convertToEm`, `__fontSizer`, `__lighten`, `__darken`, `__shorthandProperty`).

**A utility that nothing in `scss/` calls is not dead code.** `__remify`, `__convertToEm`, `__fontSizer`, `__isNumber`, `__lighten` and `__darken` are called by no mixin at all — they are there for users, and removing them would break stylesheets. Never treat "no internal callers" as a reason to delete a member; the library is the smaller half of its own audience.

Mixins validate their input and `@error` with a message that names the accepted values — 18 of the 51 do this, 16 inline and 2 (`ratio-box`, `responsive-video`) through `__validateRatio`. Match that style rather than failing silently.

Silent failure is the trap to watch for. A mixin that branches on `type-of` and
has no `@else` emits nothing at all for an unexpected type, which surfaces as a
missing declaration rather than an error. `ratio-box` had this until v1.4.0: a
list argument produced a ratio box with no ratio, and the smoke test still
passed because it only asserts that mixins evaluate.

### The dual API and the generated prefix bundle

Every mixin is exposed twice: unprefixed (`adaptive`) and prefixed (`gls-adaptive`), so users can avoid collisions with Bootstrap and friends. The prefixed half is **generated, not written**:

`gulpfile.js` concatenates `scss/library/**/*.scss` into `scss/_gerillass-prefix.scss`, strips the per-file `@charset`, re-adds one `@charset` + `@use "sass:math"` at the top, then does a blind string replace of `@mixin ` → `@mixin gls-`.

- **Never hand-edit `scss/_gerillass-prefix.scss`.** It is committed, but it is build output.
- After adding or changing any mixin, run `npx gulp start` and commit the regenerated file. Its committed state should be byte-identical to a fresh run.
- Only `library/` is prefixed. Utilities, lists and maps are shared by both halves and are not duplicated.
- Because the generator is a dumb concatenation, **any `@use` rule inside a `library/` partial ends up in the middle of the bundle**, which Sass rejects (`@use rules must be written before any other rules`). This is the single biggest constraint on the file layout.

**The bundle is not optional.** Five partials in `library/` call the *prefixed* mixins, so the unprefixed API depends on the generated bundle being loaded:

| Caller | Calls |
|---|---|
| `_remove.scss` | `gls-breakpoint` (×4) |
| `_reset-figure.scss` | `gls-responsive-image` |
| `_brand-logo.scss` | `gls-stretched-link` |
| `_background-image.scss` | `gls-linear-gradient` |

Dropping `@import "gerillass-prefix"` from `_gerillass.scss` therefore breaks `remove`, `reset-figure`, `brand-logo` and `background-image` with `Error: Undefined mixin` — verified, and only at include time. Any restructuring of the prefix strategy must rewrite these call sites first.

### Module-system status

The library still uses `@import` and global built-ins (`map-get`, `str-slice`, `nth`, …), which Dart Sass has deprecated. Running the tests prints deprecation warnings; that is expected on `main`, not a regression.

A migration to `@use`/`@forward` is planned for **2.0.0** and is not on `main`. Two things make it more than a mechanical rewrite, and both were verified:

1. `@forward` does not make members visible to sibling partials. Roughly 40 files reference members from another layer (e.g. `_adaptive.scss` uses `$map-for-breakpoints`, `_font-face.scss` uses `__fontSource`) and each needs its own `@use`. Because of lazy evaluation, the failures only surface when a mixin is actually included.
2. Adding those `@use` lines breaks the Gulp prefix bundle, per the constraint above. The generator has to hoist and dedupe `@use` rules, or the `gls-` strategy has to be replaced by the module system's own namespacing (`@use "gerillass" as gls`).

## Conventions

From `CONTRIBUTING.md`, which is the authority here:

- Two-space indent, no tabs.
- `@charset "UTF-8";` as the first line of **every** `.scss` file (Gulp strips and re-adds it for the bundle).
- Double quotes, not single, unless unavoidable.
- One mixin or one function per file; the filename matches the member name (`_border-radius.scss` → `@mixin border-radius`).
- Maps and lists carry `!default` so users can override them before importing.

## Releasing

The security fix only reaches users when the npm package is republished — updating the repo alone changes nothing for consumers.

1. Bump `version` in `package.json` (patch for dependency/security work; `2.0.0` is reserved for the module migration).
2. Add a `CHANGELOG.md` entry at the top, using the existing `- **Security:** / **Added:** / **Updated:** / **Removed:** / **Fixed:**` bullet style.
3. Commit, then `git tag -a vX.Y.Z -m "vX.Y.Z"` — tags are `vX.Y.Z`, no dot after `v`.
4. Push branch and tag, then `gh release create vX.Y.Z --latest --notes-file ...`.
5. `npm publish`. The account has 2FA enabled, so this needs `--otp=<code>` and must be run by the maintainer.

Default branch is `main` (renamed from `master` in v1.3.3). A repository ruleset blocks force-pushes and deletion of the default branch, with no bypass actors — direct pushes are allowed.
