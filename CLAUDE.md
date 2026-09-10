# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Gerillass is a **pure Sass library** — a toolkit of mixins and functions, in the spirit of Bourbon/Scut. There is no build step that produces CSS or JS: the `.scss` sources under `scss/` *are* the deliverable, and npm publishes them verbatim. Docs live at https://docs.gerillass.com; the site repo is separate.

Two consequences follow from this and drive most decisions in the repo:

1. **`package.json` must have no `dependencies`.** Everything (`jest`, `sass`, `sass-true`, `glob`) belongs in `devDependencies`. Consumers get only `.scss` files, so a runtime dependency here forces the entire test toolchain onto every downstream project. This was the cause of 24 Dependabot alerts fixed in v1.3.3 — do not reintroduce it.
2. **Only `scss/` ships.** `.npmignore` excludes `test`, `assets`, `meta`, `tools`, dotfiles and `*.md`; npm always adds `README.md`, `LICENSE.md` and `package.json` back. Verify with `npm pack --dry-run` before any release (98 files / ~38 kB as of v2.0.0).

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

## Node

The library needs no Node at all: it is `.scss` files and consumers compile
them with whatever they already have. Its `package.json` deliberately carries
**no `engines` field**, because declaring one would warn people off a runtime
the library does not use.

`site/` does need one, and `.nvmrc` pins 22 for anyone working in the
repository. That constraint lives in `site/package.json`, not the root.

## Commands

```bash
npm test                          # Jest: sass-true specs, the smoke test, and the manifest suite
npx jest -t "mapDeepGet()"      # single test, filtered by the describe/it name
npm run manifest                  # regenerate gerillass.json and SKILL.md (see below)
node tools/audit.js               # adversarial sweep: bad arguments at every mixin
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
- **`hooks/sync-manifest.sh`** — rebuilds `gerillass.json` and `SKILL.md` after
  any edit under `scss/library/`, `scss/utilities/` or `meta/`.
- **`hooks/check-docs.sh`** — runs `tools/check-docs.js`, which compares the
  counts the documentation claims against the counts the repository has, and
  blocks on a mismatch. It also prints a reminder naming the prose that usually
  needs updating when `tools/`, `test/` or `.claude/` changes, because that part
  is a judgement no script can make.
- **`hooks/check-wiki.sh`** — runs `tools/check-wiki.js`, which refuses a
  release whose `wiki/` page is missing or does not mention something that
  changed. It reads the manifest at the previous tag rather than guessing, so
  "what changed" means members added, removed, or whose signature or summary
  moved. It only bites once `package.json` is ahead of the last tag; between
  releases the next version has no number yet, so it reports what is pending
  and exits clean.
- **`/release`, `/new-mixin`, `/sass-test`, `/audit-library`** — the release
  checklist, the add-a-member checklist, the sass-true conventions, and the
  adversarial sweep over every mixin (`tools/audit.js`).

All four hooks are `PostToolUse` on `Write|Edit` and exit 2 (blocking) on
failure. **They only fire for edits made through the editor** — a file changed
by a shell command does not trigger them. Run `npm run manifest` by hand after
scripted edits.

## The manifest and the skill

`gerillass.json` and `SKILL.md` describe the API for coding agents, which have
no training data for a library this size. Both are **generated and committed**;
never hand-edit either.

| File | Built by | From |
|---|---|---|
| `gerillass.json` | `tools/build-manifest.js` | signatures parsed from `scss/`, semantics from `meta/*.json` |
| `SKILL.md` | `tools/build-skill.js` | `gerillass.json` |
| `llms.txt` | `tools/build-llms-txt.js` | `gerillass.json` |

Run all three with `npm run manifest`. Only the first two ship; `meta/`,
`tools/` and `llms.txt` are excluded in `.npmignore`, and `SKILL.md` is
re-included there because the `*.md` rule would otherwise drop it.

`llms.txt` follows the format at https://llmstxt.org/ and is meant to be served
at `https://docs.gerillass.com/llms.txt`, so it is generated here and deployed
from the docs repository. A member links to its documentation page when it has
one and to its source when it does not, which two hand-maintained lists in
`tools/build-llms-txt.js` record: `MIXINS_WITHOUT_PAGE` and
`FUNCTIONS_WITH_PAGE`. They are split by kind because nearly every mixin has a
page and nearly no function does.

Neither list can be checked from here, so `node tools/check-links.js` fetches
every link instead. **Run it on every release.** It is a command rather than a
loop in `/release` because the loop got skipped, and v2.1.0 shipped with
`line-clamp` pointing at a page that did not exist.

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
| 3 | `scss/utilities/` | 23 helper **functions** | `camelCase` |
| 4 | `scss/library/` | 53 **mixins** — the bulk of the API | `kebab-case` |

`_gerillass.scss` lists every partial explicitly. **A new file is invisible until you add its `@import` line there**, in the correct layer block.

Functions are `camelCase`, mixins are `kebab-case`, and that is what keeps them apart at a call site — together with `@include`, which a mixin always needs and a function never has. Utilities are public API and users call them directly; `remify` has its own page in the docs.

Until 2.0.0 they carried a `__` prefix. It had to go: under `@use`/`@forward` a member whose name starts with `_` is **private to its own file**, so every utility became unreachable, and through `@use ... as *` it failed silently, rendering as literal CSS. Three could not simply drop the prefix — `darken` and `lighten` would shadow the Sass built-ins with different results, and `null` is a keyword — so they are `shade`, `tint` and `fillNulls`. Utilities cluster around three jobs: type guards (`isColor`, `isNumber`, `isTime`), validators that `@warn`/`@error` and return (`validateLength`, `validateBreakpoint`, `validateRatio`, `validateScissors`), and converters (`remify`, `pixelify`, `convertToEm`, `fontSizer`, `tint`, `shade`, `shorthandProperty`).

**A utility that nothing in `scss/` calls is not dead code.** `remify`, `convertToEm`, `fontSizer`, `isNumber`, `tint` and `shade` are called by no mixin at all — they are there for users, and removing them would break stylesheets. Never treat "no internal callers" as a reason to delete a member; the library is the smaller half of its own audience.

Mixins validate their input and `@error` with a message that names the accepted values — 37 of the 47 that take arguments do this, mostly inline. Match that style rather than failing silently.

Silent failure is the trap to watch for. A mixin that branches on `type-of` and
has no `@else` emits nothing at all for an unexpected type, which surfaces as a
missing declaration rather than an error. `ratio-box` had this until v1.4.0: a
list argument produced a ratio box with no ratio, and the smoke test still
passed because it only asserts that mixins evaluate.

### The dual API

Every mixin is exposed twice: unprefixed (`adaptive`) and prefixed
(`gls-adaptive`), so users can avoid collisions with Bootstrap and friends.
Since 2.0.0 both come from `_gerillass.scss`, one line each:

```scss
@forward "library";
@forward "library" as gls-*;
```

Before that the prefixed half was a **generated file**: `gulpfile.js`
concatenated `scss/library/**/*.scss` into `scss/_gerillass-prefix.scss` and
rewrote `@mixin ` to `@mixin gls-`. That generator is gone, and with it 1586
lines of committed build output, three Gulp devDependencies and a hook. It also
lifted the constraint that no `library/` partial could carry a `@use` rule,
which was the thing blocking the module migration.

`test/manifest.spec.js` runs every documented example under both names and
requires byte-identical CSS, so a member missing from `scss/library/_index.scss`
fails the suite rather than silently disappearing from one half of the API.

### The module system

Since 2.0.0 the library is `@use`/`@forward` throughout and calls no global
built-ins. **It compiles with zero deprecation warnings**, which is checkable
and worth keeping that way:

```bash
sass --load-path=scss test/smoke.scss 2>&1 >/dev/null | grep DEPRECATION
```

Each folder has an `_index.scss` that forwards its own partials, and
`_gerillass.scss` forwards the four folders. Every partial declares what it
uses:

```scss
@charset "UTF-8";

@use "sass:math";
@use "../lists/list-of-directions" as *;
@use "../utilities/is-color" as *;
```

`as *` rather than a namespace, deliberately: member names are unique across
the library, so this keeps call sites unchanged and made the migration a
verifiable no-op on the emitted CSS.

Two things that cost time, recorded so they do not have to be rediscovered:

1. **`@forward` does not reach sibling partials.** 32 files reference a member
   from another folder and each needs its own `@use`. Lazy evaluation hides the
   failure until the mixin is actually included, so `test/smoke.scss` is what
   catches it.
2. **A member whose name starts with `_` or `-` is private to its file.** This
   is why the utilities lost their `__` prefix in 2.0.0 — see the naming note
   under Architecture. Through `@use ... as *` a private member does not error,
   it renders as literal CSS.

`sass-migrator module` does most of the mechanical work but needs supervision:
it puts `@use` above `@charset`, it strips `__` prefixes and turns `__null` into
the invalid `null.null(...)`, and it rewrites generated files it should leave
alone.

## Test depths

Four levels, and knowing which one covers a member tells you what you can trust:

| Level | Proves | Coverage |
|---|---|---|
| `test/smoke.scss` | the mixin evaluates at all | 53/53 mixins |
| snapshot of `meta/` examples | the output cannot change unnoticed | 76/76 members |
| `meta/` rejects | bad input is refused with a real message | 47/76 |
| sass-true spec in `test/` | the CSS is **correct** | 12/76 |

Only the last one catches an output that was wrong from the start; a snapshot
records a wrong value as correct. Hand-written specs are therefore reserved for
members that compute something — `triangle`, `scissors`, `columnizer`,
`position`, `background-dots`, `aspect-ratio`, `container-query`. Use `/sass-test`.

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

## The wiki

`wiki/` holds handover notes for the **other two** repositories, `gerillass.com`
and `docs.gerillass.com`, one file per released version. Neither of those
sessions can see this repository, and neither can work out from a changelog
which control on a page needs touching.

The rule is that it never restates the API. `gerillass.json` carries every
signature and example and the test suite compiles all of it, so a wiki page
repeating that is an unchecked second copy. What goes in is what the manifest
cannot hold: which files and controls to change, and **the measurements**.
Almost every member added since 2.0.0 exists because something silently does
not work, and that failing case is what a documentation page has to open with.

Two things are easy to miss and are called out in every file:

- **The playground's member menu no longer needs touching**, and this note
  used to say it did. `site/src/components/Playground/mixins.js` parses the
  `@mixin` declarations out of the library source it already downloaded to
  compile with, so a new member appears once the version is published. What is
  still kept by hand is `demos.json`, the starting snippet per mixin, which
  `npm run playground-demos --prefix site` regenerates from the documentation
  front matter.
- **`llms.txt` is coupled to the documentation site.** A member with no page
  links to its source instead, through `NO_PAGE_YET` in
  `tools/build-llms-txt.js`. When a page is published, remove the name there
  and re-run `npm run manifest`.

`wiki/` is excluded from the package by the `*.md` rule in `.npmignore`.

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
Verified as of v2.1.0.

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

### New members worth adding

Researched after 2.0.1, against the bar this repo now holds itself to: a mixin
earns its place when it encodes something a user gets wrong, across more than
one declaration. `ratio-box` was deleted for failing that test and
`aspect-ratio` was written to pass it.

Sixteen areas of modern CSS were checked against the 50 mixins and **every one
had zero coverage**: `prefers-reduced-motion`, `focus-visible`, `line-clamp`,
`@container`, `@starting-style`, `light-dark()`, `color-scheme`, safe-area
insets, `auto-fit` grids, anchor positioning, `@scope`, view transitions and
scrollbar styling. The `clamp(` and `anchor` matches in `scss/` are a comment
and the `<a>` pseudo-class list, not the features.

**Four of the seven have shipped.** `container-query`, `fluid` and
`line-clamp` are in, and `loadify` respects `prefers-reduced-motion` now, which
was the accessibility defect the fourth entry existed for. What is left, in
order, with the trap each one closes:

1. **`auto-grid`.** Verified in a browser: in a 250px container,
   `repeat(auto-fit, minmax(20rem, 1fr))` lays out a 320px column and overflows
   by 70px, while `minmax(min(100%, 20rem), 1fr)` fits at 250px. Forgetting the
   `min()` is what produces horizontal scrolling on phones. Different enough
   from `columnizer`, which is flexbox and wants a column count.
2. **`focus-ring`.** `:focus-visible` with an offset and a forced-colors
   fallback. Commonly done wrong by removing the outline altogether.
3. **A standalone `prefers-reduced-motion` guard.** The defect it was paired
   with is fixed; the guard mixin itself was never written, and it is the
   smaller half.
4. **Decorative, in the spirit of `background-dots` and `scissors`:** `glass`
   (`backdrop-filter` with a `@supports` fallback, which is unreadable without
   it), `edge-fade` (`mask-image` on a scroll container), `theme`
   (`color-scheme` plus `light-dark()`, where forgetting the first makes the
   second silently pick light).

The first two are the ones that close a real defect. The rest are decorative
and can wait for a release that wants them.

**What one costs.** A member is seven places, not one: the partial in
`scss/library/`, its line in that folder's `_index.scss`, a `meta/` entry
(mandatory -- the suite fails without it, and `rejects` is where the mixin's
validation gets its coverage), `npm run manifest`, a page under
`site/content/docs/` (also mandatory -- `plugins/docs-index.js` fails the
**site** build if a manifest member has no page), `npm run playground-demos`,
and a sass-true spec if it computes anything. Then a minor release. `/new-mixin`
is that checklist.

Declined, for failing the bar: `text-wrap: balance`, `subgrid`, `:has()` and
scrollbar colouring are one or two properties with no trap. Anchor positioning
and `@starting-style` are strong candidates held back only because they reached
Baseline between October 2025 and April 2026, which is too new for a library
that still supports older toolchains.

### Modernisation

- **Sass is deprecating its own `if()`, and the library calls it 21 times.**
  Dart Sass 1.104 prints 25 `if-function` warnings compiling Gerillass (5 shown,
  20 omitted); 1.91 prints none. Two fixes look obvious and both are wrong,
  verified:

  1. The replacement syntax is `if(sass($cond): $a; else: $b)`. It compiles on
     1.104 and is a parse error on 1.91, so adopting it raises the minimum Dart
     Sass to a version released weeks ago.
  2. A helper `@function iff($c, $a, $b)` evaluates **both** branches, while
     `if()` evaluates only the one it takes. `_triangle.scss` depends on this:
     it calls `list.nth($size, 2)` in the untaken branch, and
     `triangle(top, red, 10px)` passes a single-value `$size`. Swapping in a
     helper turns a working call into `Invalid index 2 for a list with 1
     elements`.

  So all 21 sites need reading individually, and the ones inside interpolation
  need restructuring rather than substitution. Removal is not until Sass 3.0.0,
  so this is not urgent, but it is the last thing between the library and a
  clean compile.

- **An MCP server was considered and declined**, most recently in 2.0.1. A
  server whose only job is to serve `gerillass.json` adds nothing: that file
  already ships inside the package, an agent can read it directly, and putting
  a server in front of it only adds an install step. The one version that would
  earn its place exposes something a static file cannot, such as a
  `gerillass_compile(snippet)` tool that returns the CSS or the library's own
  error, so an agent can check a call instead of guessing at it. Revisit only
  for that, not to republish the manifest over a protocol.

  The other half of this item, an `llms.txt` for the docs site, was done in
  2.0.1 and is generated from the manifest like everything else.

### Done in 2.0.0

The module migration, the eyeglass removal and the retirement of the generated
`gls-` bundle all landed together, because each one blocked the others. The
`git stash` holding a half-finished attempt is obsolete and can be dropped.

`ratio-box` and `responsive-video` were replaced by one `aspect-ratio` mixin.
Porting them to the CSS property left the two byte-identical to each other and
wrapping barely more than one declaration, so neither earned its place; but a
bare `aspect-ratio` declaration does not replace them either. Three things were
measured in a browser before the replacement was designed, and each is why the
new mixin emits what it does:

| Written by hand | What happens | What the mixin adds |
|---|---|---|
| `aspect-ratio` on an `<img>` | the image is stretched, not cropped | `object-fit: cover` |
| `aspect-ratio` on an `<iframe>` | overflows its container by 4px, from the 2px default border | `border: 0` |
| `aspect-ratio` on a **wrapper** | does nothing for an `<iframe>` inside, which keeps its intrinsic 300×150 | applied to the element itself |

That last row is the migration hazard and is called out in `MIGRATION.md`: the
old mixins went on a wrapping `<div>`, the new one goes on the element.

`validateRatio` stays, for a ratio without the rest of the mixin: it parses
`"16:9"`, which CSS will not.
