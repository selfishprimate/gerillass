# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Gerillass is a **pure Sass library** — a toolkit of mixins and functions, in the spirit of Bourbon/Scut. There is no build step that produces CSS or JS: the `.scss` sources under `scss/` *are* the deliverable, and npm publishes them verbatim. Docs live at https://docs.gerillass.com; the site repo is separate.

Two consequences follow from this and drive most decisions in the repo:

1. **`package.json` must have no `dependencies`.** Everything (`jest`, `sass`, `sass-true`, `glob`, `gulp*`) belongs in `devDependencies`. Consumers get only `.scss` files, so a runtime dependency here forces the entire test toolchain onto every downstream project. This was the cause of 24 Dependabot alerts fixed in v1.3.3 — do not reintroduce it.
2. **Only `scss/` ships.** `.npmignore` excludes `test`, `assets`, `gulpfile.js`, dotfiles and `*.md`; npm always adds `README.md`, `LICENSE.md` and `package.json` back. Verify with `npm pack --dry-run` before any release (92 files / ~38 kB as of v1.6.2).

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
npm test                          # Jest: sass-true specs, the smoke test, and the manifest suite
npx jest -t "mapDeepGet()"      # single test, filtered by the describe/it name
npm run manifest                  # regenerate gerillass.json and SKILL.md (see below)
node tools/audit.js               # adversarial sweep: bad arguments at every mixin
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

## Verifying a claim

This is a published library with real users, so a wrong claim either ships a
defect or deletes something someone depends on. Every claim below was made
during earlier work on this repo from a secondary signal — a grep count, an npm
timestamp, a reading of the source — and every one was wrong:

| Signal | Conclusion drawn | What was actually true |
|---|---|---|
| no mixin calls these six utilities | dead code, delete them | documented public API; `remify` has its own docs page |
| eyeglass unpublished since June 2022 | dead package, drop the config | ~6800 downloads/month; the real fault was its importer breaking on any `@import` |
| `ratio-box` branches on `type-of == string` | a string is the correct argument | a list was accepted too, and silently produced a ratio box with no ratio |

Techniques that did work, in rough order of usefulness:

1. **A/B the output.** Capture it to a file, make the change, `diff`. This is
   what makes "nothing regressed" a fact instead of a hope.
2. **Isolate with controls.** When eyeglass failed, three runs — eyeglass with
   no `@import`, Gerillass without eyeglass, eyeglass with an unrelated local
   file — located the fault exactly. Guessing would not have.
3. **Test the packed artifact, not the working tree.** `npm pack`, install the
   tarball, build against it. `.npmignore` and `exports` mean the two are not
   the same thing.
4. **Enumerate variants instead of reasoning about which is right.** Four Grunt
   option spellings were tried; one worked. Faster and more certain than
   arguing from documentation.
5. **Ask what would disprove it.** For "dead code" the disproof was "is it
   documented, and does it work when called" — a thirty-second check.
6. **When a test fails, suspect the test first.** Three false failures happened
   here: a webpack config missing ESM support, a spec loading `ellipsis` while
   calling `ratio-box`, and a glob pointing at the wrong Vite output directory.
   All three looked like real breakage.
7. **Name what you did not test, in the same breath as the claim.** No input
   was found that reaches the `@error` in `_background-image.scss`; Parcel and
   esbuild were never installed. Saying so is better than letting silence imply
   coverage.

## Repo tooling

`.claude/` carries the automation for the two mistakes this project has actually
made, plus the workflows that are easy to half-finish:

- **`hooks/guard-dependencies.sh`** — blocks any edit that leaves `dependencies`
  non-empty in the root `package.json`.
- **`hooks/sync-prefix.sh`** — runs `npx gulp start` after any edit under
  `scss/library/`, so the `gls-` bundle cannot go stale.
- **`hooks/sync-manifest.sh`** — rebuilds `gerillass.json` and `SKILL.md` after
  any edit under `scss/library/`, `scss/utilities/` or `meta/`.
- **`hooks/check-docs.sh`** — runs `tools/check-docs.js`, which compares the
  counts the documentation claims against the counts the repository has, and
  blocks on a mismatch. It also prints a reminder naming the prose that usually
  needs updating when `tools/`, `test/` or `.claude/` changes, because that part
  is a judgement no script can make.
- **`/release`, `/new-mixin`, `/sass-test`, `/audit-library`** — the release
  checklist, the add-a-member checklist, the sass-true conventions, and the
  adversarial sweep over every mixin (`tools/audit.js`).

All four hooks are `PostToolUse` on `Write|Edit` and exit 2 (blocking) on
failure. **They only fire for edits made through the editor** — a file changed
by a shell command does not trigger them, which is how the `gls-` bundle went
stale mid-session once. Run `npx gulp start` and `npm run manifest` by hand
after scripted edits.

## The manifest and the skill

`gerillass.json` and `SKILL.md` describe the API for coding agents, which have
no training data for a library this size. Both are **generated and committed**;
never hand-edit either.

| File | Built by | From |
|---|---|---|
| `gerillass.json` | `tools/build-manifest.js` | signatures parsed from `scss/`, semantics from `meta/*.json` |
| `SKILL.md` | `tools/build-skill.js` | `gerillass.json` |

Run both with `npm run manifest`. Only the two generated files ship; `meta/` and
`tools/` are excluded in `.npmignore`, and `SKILL.md` is re-included there
because the `*.md` rule would otherwise drop it.

**What keeps them honest is `test/manifest.spec.js`**, and this is the whole
point of the design:

- every `examples` entry in `meta/` is compiled **and snapshotted**
- every `rejects` entry must actually `@error`, and must fail with the library's
  own message rather than a Sass internal error
- every example runs again under its `gls-` name and must produce byte-identical
  CSS, which is the only thing checking the generated bundle
- both generated files must match a fresh build, so a stale commit fails CI

A mixin with no `meta/` entry fails the suite, so metadata is not optional.

So the manifest cannot claim behaviour the library does not have. When you add
or change a mixin, write its `meta/` entry in the same commit: the `rejects`
list is where the mixin's validation gets its test coverage.

## Architecture

Four layers, loaded in dependency order by `scss/_gerillass.scss`. The order is not cosmetic — the library is `@import`-based, so everything lands in one global namespace and later files depend on earlier ones being present:

| Layer | Folder | Contents | Naming |
|---|---|---|---|
| 1 | `scss/lists/` | flat value lists (`$list-of-buttons`) | `list-of-` prefix, `!default` |
| 2 | `scss/maps/` | keyed config (`$map-for-breakpoints`) | `map-for-` prefix, `!default` |
| 3 | `scss/utilities/` | 22 helper **functions** | `camelCase` |
| 4 | `scss/library/` | 51 **mixins** — the bulk of the API | `kebab-case` |

`_gerillass.scss` lists every partial explicitly. **A new file is invisible until you add its `@import` line there**, in the correct layer block.

Functions are `camelCase`, mixins are `kebab-case`, and that is what keeps them apart at a call site — together with `@include`, which a mixin always needs and a function never has. Utilities are public API and users call them directly; `remify` has its own page in the docs.

Until 2.0.0 they carried a `__` prefix. It had to go: under `@use`/`@forward` a member whose name starts with `_` is **private to its own file**, so every utility became unreachable, and through `@use ... as *` it failed silently, rendering as literal CSS. Three could not simply drop the prefix — `darken` and `lighten` would shadow the Sass built-ins with different results, and `null` is a keyword — so they are `shade`, `tint` and `fillNulls`. Utilities cluster around three jobs: type guards (`isColor`, `isNumber`, `isTime`), validators that `@warn`/`@error` and return (`validateLength`, `validateBreakpoint`, `validateRatio`, `validateScissors`), and converters (`remify`, `pixelify`, `convertToEm`, `fontSizer`, `tint`, `shade`, `shorthandProperty`).

**A utility that nothing in `scss/` calls is not dead code.** `remify`, `convertToEm`, `fontSizer`, `isNumber`, `tint` and `shade` are called by no mixin at all — they are there for users, and removing them would break stylesheets. Never treat "no internal callers" as a reason to delete a member; the library is the smaller half of its own audience.

Mixins validate their input and `@error` with a message that names the accepted values — 27 of the 51 do this as of v1.6.0, 25 inline and 2 (`ratio-box`, `responsive-video`) through `validateRatio`. Match that style rather than failing silently.

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

1. `@forward` does not make members visible to sibling partials. Roughly 40 files reference members from another layer (e.g. `_adaptive.scss` uses `$map-for-breakpoints`, `_font-face.scss` uses `fontSource`) and each needs its own `@use`. Because of lazy evaluation, the failures only surface when a mixin is actually included.
2. Adding those `@use` lines breaks the Gulp prefix bundle, per the constraint above. The generator has to hoist and dedupe `@use` rules, or the `gls-` strategy has to be replaced by the module system's own namespacing (`@use "gerillass" as gls`).

## Test depths

Four levels, and knowing which one covers a member tells you what you can trust:

| Level | Proves | Coverage |
|---|---|---|
| `test/smoke.scss` | the mixin evaluates at all | 51/51 mixins |
| snapshot of `meta/` examples | the output cannot change unnoticed | 73/73 members |
| `meta/` rejects | bad input is refused with a real message | 44/73 |
| sass-true spec in `test/` | the CSS is **correct** | 11/73 |

Only the last one catches an output that was wrong from the start; a snapshot
records a wrong value as correct. Hand-written specs are therefore reserved for
members that compute something — `triangle`, `scissors`, `columnizer`,
`position`, `background-dots`, `ratio-box`, `responsive-video`. Use `/sass-test`.

`node tools/audit.js` is the fourth thing the suite cannot do: it throws
arguments nobody wrote a test for at every member and every argument position.
Its SILENT and UNHELPFUL buckets must stay empty.

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

## Pending work

Known and deliberately deferred, roughly in the order it makes sense to pick up.
Verified as of v1.6.1.

### Small, non-breaking

- ~~`columnizer` interpolates its `calc()`~~ — **do not "fix" this.** The
  interpolation is load-bearing: it is what lets `columnizer(var(--cols))` and
  a `var()` gutter work at all. Evaluating the expression would simplify
  `calc(100% / 4)` to `25%` and shorten the output, and would break every call
  whose column count or gutter is a custom property. Verified both ways.
- **Ten mixins take arguments and validate none of them** — `adaptive`,
  `brand-logo`, `circle`, `counter`, `ellipsis`, `resizable`, `screen-agent`,
  `sizer`, `text-image`, `text-stroke`. This is mostly deliberate: they pass
  their arguments straight to CSS, which accepts `var()`, `calc()`, `clamp()`
  and whatever ships next, so a strict check would reject correct code. Revisit
  only where the shape of the call can be checked without touching the value.
- **`position` warns rather than errors** on a value that is not a length, six
  cases in `node tools/audit.js`. Left as a warning on purpose — see the note
  in `scss/utilities/_validate-length.scss`.

### Modernisation

- **Agent-facing work beyond the manifest.** An MCP server exposing
  `gerillass.json` and an `llms.txt` on the docs site were scoped out of the
  v1.6.0 work. Neither is worth doing until the manifest has users.

### Reserved for 2.0.0

- **Move `ratio-box` and `responsive-video` to `aspect-ratio`.** The property is
  Baseline Widely Available, so the padding-top hack is no longer necessary.
  **Decided in September 2026 that this is a 2.0.0 change, not a minor one.**
  It is not a CSS simplification: `aspect-ratio` removes the `position: relative`
  on the container and the absolutely positioned child, so any markup that
  relied on that positioning context — anything else placed inside the box, or a
  child positioned against it — moves. Both mixins have hand-written specs, so
  the change will be visible in the diff rather than silent, and it needs a
  migration note.

- **The `@use`/`@forward` module migration.** See "Module-system status" above
  for the two verified blockers. A half-finished attempt is parked in
  `git stash` on this machine as `WIP: @use/@forward module migration (v2.0.0)
  - parked`. **It exists only locally and only in the stash** — it was never
  committed or pushed, so a fresh clone does not have it and any stash-dropping
  operation loses it. If it is still wanted, promote it to a real branch.
  `sass-migrator module --migrate-deps` reproduces most of it anyway, and
  handles the sibling `@use` blocker automatically; it does mangle
  `_gerillass-prefix.scss`, which must be excluded and regenerated.
- **Remove the eyeglass metadata.** The `eyeglass` block and the
  `eyeglass-module` keyword. Deferred rather than done because dropping them is
  breaking for a hypothetical user on an old toolchain, even though eyeglass
  itself is broken with current Dart Sass. See "How consumers load it" above.
- **Retire the `gls-` prefix bundle.** `@use "gerillass" as gls` already gives
  native namespacing, which is the whole point of the generated bundle. Dropping
  it removes ~1600 lines of build output, three Gulp devDependencies,
  `gulpfile.js`, and one of the two hooks. It also breaks every existing
  `gls-*` call site, so it belongs with the module migration and needs a
  migration note for users. `sass-migrator --remove-prefix` can generate
  backward-compatible forwarding.
