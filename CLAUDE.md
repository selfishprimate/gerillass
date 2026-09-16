# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Gerillass is a **pure Sass library** — a toolkit of mixins and functions, in the spirit of Bourbon/Scut. There is no build step that produces CSS or JS: the `.scss` sources under `scss/` *are* the deliverable, and npm and RubyGems both publish them verbatim. Docs live at https://docs.gerillass.com; the site repo is separate.

Two consequences follow from this and drive most decisions in the repo:

1. **`package.json` must have no `dependencies`.** Everything (`jest`, `sass`, `sass-true`, `glob`) belongs in `devDependencies`. Consumers get only `.scss` files, so a runtime dependency here forces the entire test toolchain onto every downstream project. This was the cause of 24 Dependabot alerts fixed in v1.3.3 — do not reintroduce it.
2. **Only `scss/` ships.** `.npmignore` excludes `test`, `assets`, `meta`, `tools`, dotfiles and `*.md`; npm always adds `README.md`, `LICENSE.md` and `package.json` back. Verify with `npm pack --dry-run` before any release (114 files / ~58 kB since `gradient` replaced the two old gradient mixins).
3. **The gem is the same library, not a port.** `gerillass.gemspec` ships `scss/`, `gerillass.json` and `SKILL.md`, plus `lib/`, `LICENSE.md` and `README.md`, reads its version from `package.json`, and has no runtime dependencies. `lib/` only tells Rails, Jekyll or a plain `sass-embedded` compile where `scss/` is. `.npmignore` keeps `lib`, the gemspec and `*.gem` out of the npm package. Keep the gemspec ASCII: RubyGems reads it in the locale's encoding, and a literal non-ASCII character fails to load.

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
| `@use "gerillass"` | Vite resolves this through `exports`; webpack and Parcel through `main`. Parcel fails with "Can't find stylesheet to import" if the **project's own** `package.json` has a `main`, which it takes for a library target |
| `@use "gerillass/scss/gerillass"` | subpath, needs the `"./*"` wildcard |
| `loadPaths` / `includePaths` | filesystem-based, unaffected by `exports` — this is what the Gulp and Grunt recipes in the README use |

The gem has routes of its own. Each was verified on Ruby 4.0.1 with gem 2.3.1
installed from RubyGems in a fresh project: every manifest example, its `gls-`
form and every `warns` entry, 366 stylesheets, compiled through the route and
diffed against Dart Sass's output from the npm package, with all matching, and
a refused call stopping the build with the library's message. Sprockets writes
`url("x")` as `url(x)`, with or without Gerillass. Each Sass setup reads load
paths from a different place, which is why `lib/gerillass/engine.rb` has three
branches:

| Route | Notes |
|---|---|
| Rails, `dartsass-rails` (Propshaft) | `--load-path` appended to `config.dartsass.build_options` after initialization, so an app assigning its own options keeps it. Not `config.assets.paths`: Propshaft copies everything on it into `public/assets`, which published all 109 sources, and its `excluded_paths` also removes the folder from the list dartsass-rails reads |
| Rails, `dartsass-sprockets` | appended to `config.sass.load_paths`, which is read on every compile. Appending to `config.assets.paths` after initialization missed the environment sprockets-rails had already built |
| Jekyll | `lib/gerillass/jekyll.rb` adds the folder to `sass.load_paths` in a `:site, :after_init` hook. Works with the gem in the `:jekyll_plugins` group, and with `plugins: [gerillass]` in `_config.yml` |
| plain Ruby | `Sass.compile(..., load_paths: [Gerillass.load_path])` with `sass-embedded` |

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
node tools/browser-check.js ...   # a page asking the browser whether CSS is kept (see below)
node tools/check-archive.js       # what a GitHub release's source zip would contain
npm pack --dry-run                # inspect exactly what would be published
yarn audit                        # must stay at zero across all severities
```

There is no lint step and no CI — `.github/` holds only funding, issue and pull request templates. Yarn 1 (classic) is the lockfile format; `yarn.lock` is committed, `package-lock.json` is not used.

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

To see what a call renders, rather than only what it compiles to, run the site's dev server (`npm run dev --prefix site`) and open `/lab`. It compiles the working tree's `scss/` against cases kept in `site/lab/cases`; `site/CLAUDE.md` has the details.

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
| `$filter-color` is documented as a colour | refuse anything that is not a colour | with no `$image-url` it is an `::after` layer's `background`, where a gradient, `url()` or `paint()` is a working overlay that main compiled |
| the compile matrix showed no working call refused | the new check refuses nothing valid | the matrix never tried `3n` or `paint()`; `only(3n)` and a `paint()` overlay both worked on main and were refused |
| the sweep of ~130 value kinds showed no working call refused | the length and colour checks refuse nothing valid | every value in it was a literal; `sizer(#{40}px)` and `focus-ring(2px, 2px, #{red})` worked on main and were refused, because interpolation gives a string, not a number or a colour |

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
   was found that reaches the `@error` in `_background-image.scss`; esbuild was
   never installed. Parcel was, for the README recipe, against a packed
   tarball. Saying so is better than letting silence imply coverage.

### The rule for changing or adding a member

**Documentation is not the test.** The maintainer made this a rule on
14 September 2026, after the two rows above: a page cannot show every use, and
a use it does not show still works in someone's stylesheet. Whenever a change
touches a mixin or function, a new check included, and whenever a member is
added, do all of this and report it:

1. **Compare before and after on calls, not on the docs.** Compile the same
   calls against the code before the change and after it, and diff. The calls
   go well beyond the documented examples: `var()` with and without a
   fallback, `env()`, `attr()`, maths functions with `var()` inside, every
   CSS-wide keyword, upper-case and vendor keywords, colour functions,
   gradients, `url()`, `image-set()`, `paint()`, quoted forms of valid values,
   values built by interpolation such as `#{$n}px` and `#{$name}`, which reach
   a check as unquoted strings, lists, and An+B forms such as `3n`. A value kind missing from the list is
   never tested, which is how both rows above slipped through.
2. **Test the output in all three browsers.** For every call whose CSS
   changes, and every call that starts or stops raising, test the old and the
   new CSS in Chrome, Firefox and Safari, all three installed on the
   maintainer's machine. The maintainer made this a rule on 17 September 2026:
   a check measured in Chrome alone can refuse a value another engine keeps, or
   accept one it drops. `tools/browser-check.js --serve` gives a page to open
   in each. An error is justified only when the old CSS was dropped, never
   matched, or demonstrably did nothing, and a browser that disagrees with the
   others is reported rather than averaged away.
3. **When the browser kept it, build the case.** Look at where the value lands
   in the emitted CSS, write the markup a user would have, and look at the
   result. Decide by what the mixin does with the value, not by whether the
   documentation mentions it.
4. **For a new member, measure first and compare after.** Measure the value set
   of each property in the browser before writing any check, and compare what
   the mixin renders with the same CSS written by hand.
5. **Say what was not covered**: browsers not tried, value kinds not probed,
   cases that could not be built.

The compile comparison and the sweep of value kinds used for this in
`todos/silent-values-plan.md` still live outside the repository; see the plan's
sections on the compile matrix and the false-refusal sweep for what they did.

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
- **`hooks/check-docs-current.sh`** — a `Stop` hook, so it runs when a turn
  ends rather than after an edit, over everything the branch has changed against
  `origin/main`, however it was changed. It rebuilds `gerillass.json`,
  `SKILL.md` and `llms.txt` when `scss/` or `meta/` changed and blocks if they
  were stale, runs `tools/check-docs.js`, and when the API, `meta/`, `todos/`,
  the tooling, the skills, the docs pages, the wiki or `package.json` changed
  without CLAUDE.md changing, keeps the turn going once with the sections that
  usually need it. Saying nothing needs to change is a valid answer; it does not
  repeat for the same set of files.
- **`hooks/check-commit-message.js`** — a `PreToolUse` hook on `Bash`, so it
  runs before a command rather than after an edit. When the command is a
  `git commit`, it refuses a message whose subject is over 72 characters or
  ends in a full stop, or that has no body beyond its trailers. A message it
  cannot read from the command, `-m "$MSG"` or an unquoted heredoc, is refused
  too: commits went in without a body exactly that way. The standard it checks
  is written out in `/commit-and-pr`.
- **`/release`, `/new-mixin`, `/sass-test`, `/audit-library`, `/commit-and-pr`**
  — the release checklist, the add-a-member checklist, the sass-true
  conventions, the adversarial sweep over every mixin (`tools/audit.js`), and
  the commit message and pull request description standard.

The first four hooks are `PostToolUse` on `Write|Edit` and exit 2 (blocking)
on failure. **They only fire for edits made through the editor**, and a file
changed by a shell command does not trigger them, which is how CLAUDE.md once
fell two releases behind. `check-docs-current.sh` exists for that gap. Run
`npm run manifest` by hand after scripted edits all the same.

**Keep this file and the skills current in the same branch as the change.**
When work adds or changes a member, finishes a `todos/` item, ships a release
or changes the tooling, update the sentences here that describe it (counts,
Pending work, the `todos/` sections, Repo tooling) and any `.claude/skills/`
file that quotes it, in that branch, not afterwards. A stale CLAUDE.md is what
the next session starts from.

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

- every `examples` entry in `meta/` is compiled **and snapshotted**, and must
  not print a `@warn`
- every `rejects` entry must actually `@error`, and must fail with the library's
  own message rather than a Sass internal error
- every `warns` entry must compile, print a `@warn` and match its snapshot,
  with the same CSS and warnings under its `gls-` name. It holds a form on its
  way out, such as one-argument `breakpoint`, until a major version refuses it
- every example runs again under its `gls-` name and must produce byte-identical
  CSS, which is the only thing checking the generated bundle
- both generated files must match a fresh build, so a stale commit fails CI

A mixin with no `meta/` entry fails the suite, so metadata is not optional.

So the manifest cannot claim behaviour the library does not have. When you add
or change a mixin, write its `meta/` entry in the same commit: the `rejects`
list is where the mixin's validation gets its test coverage.

One field is not executed: `caveats`, for behaviour a signature cannot show,
such as `loadify` failing across modules or `breakpoint` with one argument
matching a single pixel. `build-manifest.js` copies it and `SKILL.md` lists it
under "Traps a signature does not show". Because nothing checks it, write a
caveat only from a case you compiled or measured.

## Architecture

Four layers, loaded in dependency order by `scss/_gerillass.scss`. The order is not cosmetic — the library is `@import`-based, so everything lands in one global namespace and later files depend on earlier ones being present:

| Layer | Folder | Contents | Naming |
|---|---|---|---|
| 1 | `scss/lists/` | flat value lists (`$list-of-buttons`) | `list-of-` prefix, `!default` |
| 2 | `scss/maps/` | keyed config (`$map-for-breakpoints`) | `map-for-` prefix, `!default` |
| 3 | `scss/utilities/` | 24 helper **functions** | `camelCase` |
| 4 | `scss/library/` | 55 **mixins** — the bulk of the API | `kebab-case` |

`_gerillass.scss` lists every partial explicitly. **A new file is invisible until you add its `@import` line there**, in the correct layer block.

A fifth folder sits outside the layers on purpose. `scss/internal/` holds checks
the mixins share, such as `isCssFunction` and `customPropertyIn`, and has no
`_index.scss`, so nothing forwards it and a user cannot reach it: through
`@use "gerillass" as *` or `@import` a call to one renders as literal CSS, and
through a namespace it is an undefined function. It exists because a private
`-helper` is private to its own file, which left the same function copied into
up to nine partials. A partial loads what it needs with
`@use "../internal/is-css-function" as *`. The manifest and
`tools/check-docs.js` read only `library/` and `utilities/`, so an internal
function is neither API nor counted, and its name must not start with `-` or
`_`. Added for the plan in `todos/silent-values-plan.md`, where the move is
recorded as a verified no-op on 7382 compiled calls.

Functions are `camelCase`, mixins are `kebab-case`, and that is what keeps them apart at a call site — together with `@include`, which a mixin always needs and a function never has. Utilities are public API and users call them directly; `remify` has its own page in the docs.

Until 2.0.0 they carried a `__` prefix. It had to go: under `@use`/`@forward` a member whose name starts with `_` is **private to its own file**, so every utility became unreachable, and through `@use ... as *` it failed silently, rendering as literal CSS. Three could not simply drop the prefix — `darken` and `lighten` would shadow the Sass built-ins with different results, and `null` is a keyword — so they are `shade`, `tint` and `fillNulls`. Utilities cluster around three jobs: type guards (`isColor`, `isNumber`, `isTime`), validators that `@warn`/`@error` and return (`validateLength`, `validateBreakpoint`, `validateRatio`, `validateScissors`), and converters (`remify`, `pixelify`, `convertToEm`, `fontSizer`, `tint`, `shade`, `shorthandProperty`).

**A utility that nothing in `scss/` calls is not dead code.** `remify`, `convertToEm`, `fontSizer`, `isNumber`, `tint` and `shade` are called by no mixin at all — they are there for users, and removing them would break stylesheets. Never treat "no internal callers" as a reason to delete a member; the library is the smaller half of its own audience.

Mixins validate their input and `@error` with a message that names the accepted values — 47 of the 48 that take arguments do this, mostly inline. Match that style rather than failing silently.

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
| `test/smoke.scss` | the mixin evaluates at all | 55/55 mixins |
| snapshot of `meta/` examples | the output cannot change unnoticed | 79/79 members |
| `meta/` rejects | bad input is refused with a real message | 58/79 |
| sass-true spec in `test/` | the CSS is **correct** | 22/79 |

Only the last one catches an output that was wrong from the start; a snapshot
records a wrong value as correct. Hand-written specs are therefore reserved for
members that compute something — `triangle`, `scissors`, `columnizer`,
`position`, `background-dots`, `aspect-ratio`, `container-query`. Use `/sass-test`.

A spec has a second use once a member starts refusing values: it pins the
values that must stay accepted. `breakpoint`, `screen-agent` and
`validateBreakpoint` gained specs that way in S1 of
`todos/silent-values-plan.md`, and `only` and `except` in S2, each listing forms measured as working in a
browser, such as a quoted `"600px"` and `calc()`, so a check written too
strictly fails the suite instead of breaking a stylesheet.

`node tools/audit.js` is the fourth thing the suite cannot do: it throws
arguments nobody wrote a test for at every member and every argument position.
Its SILENT, UNHELPFUL and BROKEN OUTPUT buckets must stay empty. UNHELPFUL
reached 39 once the audit learned to recognise Sass's arithmetic errors, and
BROKEN OUTPUT started at 13; F8 to F11 in `todos/fix-plan.md` brought both back
to zero. REFUSED VALID CSS, from a second sweep with values CSS does take such
as `var(--x)`, is a report to read rather than a gate: a keyword argument is
right to refuse one.

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

`wiki/` is excluded from the package by the `*.md` rule in `.npmignore`, and
from the source zip of a GitHub release by `export-ignore` in `.gitattributes`.

## Releasing

The security fix only reaches users when the npm package is republished — updating the repo alone changes nothing for consumers.

1. Bump `version` in `package.json` (patch for dependency/security work; `2.0.0` is reserved for the module migration).
2. Add a `CHANGELOG.md` entry at the top, using the existing `- **Security:** / **Added:** / **Updated:** / **Removed:** / **Fixed:**` bullet style.
3. Commit, then `git tag -a vX.Y.Z -m "vX.Y.Z"` — tags are `vX.Y.Z`, no dot after `v`.
4. Push branch and tag, then `gh release create vX.Y.Z --latest --notes-file ...`.
5. `npm publish`. The account has 2FA enabled, so this needs `--otp=<code>` and must be run by the maintainer. Then the gem, built from the tag in a worktree outside the repository and pushed by the maintainer with their own one-time code: `gem build gerillass.gemspec --output <dir>/gerillass-X.Y.Z.gem` and `gem push <that file> --otp=<code>`. `/release` step 6b has the checks to run on the built gem first.
6. Update the site, which names the version in several places. The header badge
   and both download buttons follow `package.json` through `site/src/release.js`,
   but the download link is a 404 until the tag exists, so the site deploys after
   the tag. The playground's `FALLBACK` in
   `site/src/components/Playground/versions.js` is typed by hand and gets the new
   version once npm has it. Refresh the stargazers with
   `npm run supporters --prefix site`, and check the documentation pages against
   what changed, and regenerate the playground demos with
   `npm run playground-demos --prefix site`. `/release` has the full table.

Default branch is `main` (renamed from `master` in v1.3.3). A repository ruleset blocks force-pushes and deletion of the default branch, with no bypass actors — direct pushes are allowed.

## The todos folder

`todos/` holds research and proposals that have not been acted on. It sits
between the two neighbours it could be confused with: **Pending work** below is
the short list of things already decided and waiting, and `wiki/` is handover
for the other repositories. A file in `todos/` is neither decided nor addressed
to anyone else; it is the reasoning a decision would be made from.

It does not ship, and two separate rules see to that, because npm and GitHub
build their packages differently:

- **npm:** `todos` is listed in `.npmignore`. The `*.md` rule already covered
  the Markdown in it, but only by accident; a file of any other type would have
  been published.
- **GitHub releases:** the "Source code" zip and tarball attached to a release
  come from `git archive`, which never reads `.npmignore`. `.gitattributes`
  marks `todos` as `export-ignore`, along with `site`, `netlify.toml` and
  `wiki`, none of which is the library either.

Check the first with `npm pack --dry-run` and the second with
`node tools/check-archive.js`.

Every file there is dated to when it was researched, and **its figures age**.
Download counts, survey percentages and the state of a standard are exactly the
secondary signals **Verifying a claim** warns about. Re-check a number before
acting on it, and when an item is adopted, move it into Pending work and cut it
from the `todos/` file rather than keeping two copies.

### What `verifiable-css-layer.md` proposes

Researched 12 September 2026. The argument is that Gerillass cannot compete on
volume, and that its real asset is the test discipline behind the manifest:
examples that compile, rejections that must raise the library's own error.
What it suggests doing, in its own order:

1. **Reposition the description.** From "a Sass mixin library" to computed CSS
   that utility classes cannot express and agents cannot reliably work out.
   README, site and the manifest's own description.
2. **Make the agent-facing files reachable.** `gerillass.json` ships only
   inside the package, and `gerillass.com/gerillass.json` answered 404 when
   this was written. `SKILL.md` is in the same position: generated, committed,
   and registered in no agent directory.
3. **Build `gerillass_compile`.** This is the MCP item under Modernisation, the
   one version of that idea that earns its place, and the research found the
   space empty. The report suggests a CLI first, since it needs no install.
4. **`focus-ring` and the reduced-motion guard.** Both shipped in 2.2.0, as
   `focus-ring` and `motion-safe`. The report added outside evidence for both,
   from the literature on AI-generated UI being inaccessible by default.

And what it argues against: investing further in `llms.txt`, whose measured
effect is contested; and putting the manifest behind a protocol that only
serves the file, which Modernisation already declines.

### What `source-comments.md` proposes

Measured 13 September 2026, after the first trial project an agent built with
the library. The agent read the source rather than the documentation site and
quoted its comments, and every member it praised was commented while every
member it tripped on had none. The file proposes comments that say what the
code cannot (why, the trap, what was measured), never a restatement of the
signature, and in a set order: the members from that trial first, starting
with the ones it tripped on.

One part is a defect rather than a proposal and is recorded there with its
evidence: the two `/* */` comments in `_reset-css.scss` are emitted into the
user's compiled CSS. The library should use `//` throughout.

### What `agent-trials.md` records

Projects a coding agent built from scratch with the published package, each
followed by the agent's feedback and by a check here of every claim in it. The
projects are throwaway; only what they show about the library is kept. Three
trials so far, and the findings more than one of them reached independently
are the ones to trust most.

The file sorts the findings by what they would take: fixes that break nothing
(`isColor` refusing `var()` and `currentColor`, `position` warning on `null`,
`breakpoint` silent with three arguments), behaviour changes that need a major
version or an opt-in (`counter` failing inside a container query turned out to
be one, once its fix was measured), and gaps in documentation and the manifest.
It also records which of the agents' claims turned out wrong, and the two prompt
rules that made trial feedback quick to check: versions from `npm ls`, and a
compiled snippet for every problem.

### What `design-tokens.md` proposes

Researched 14 September 2026, after `tokens` was written for 2.2.0 and the
maintainer asked for a primitive and semantic token structure instead of values
typed by hand. It compares what Tailwind v4, Open Props, Radix Colors and
Bootstrap 5.3 ship, and records six measurements that constrain any design: a
semantic token does not follow a primitive overridden lower down, `light-dark()`
picks light without `color-scheme`, a misspelt `var()` fails silently, a full
palette is about 1.2 kB gzipped, `@use ... with` replaces a map rather than
merging, and `oklch()` survives Sass.

The shape it suggests, in order: flatten nested maps in `tokens`, primitive
scales as mergeable `!default` maps, and a `theme` mixin for the semantic layer.
What would make it this library's own is two build-time checks nothing else
performs: a reference to a primitive that does not exist, and a text and
background pair that fails contrast. It lists the decisions that come first,
starting with whether to ship a palette at all.

### What `silent-values.md` records

Measured 14 September 2026, after a breakpoint name missing from the map turned
out to compile straight into the query, `@media (width: huge)`. Every argument of every mixin was called with nine
values nobody passes on purpose, and the CSS that compiled was tested in Chrome
152: 312 of 774 calls produced CSS the browser drops or can never match, across
49 arguments in 28 mixins, and only 31 of them warned. It sorts them by what goes
wrong (conditions that never match, selectors the browser refuses, keywords,
lengths, colours, images, one unit bug) and lists the 20 arguments that already
refuse every bad value.

It proposes checking the kind of a value rather than its content, so `var()`,
`calc()` and the rest stay accepted, which is how the nine deliberately
unvalidated mixins can be revisited. Each check has to be written from the
property's measured value set, and it suggests starting with the conditions,
where `validateBreakpoint` is the single cause.

### What `silent-values-plan.md` sets out

Written 14 September 2026, the report above turned into work in the shape of
`fix-plan.md`. It opens with six decisions for the maintainer, then S0 to S7:
groundwork, conditions and selectors for 2.3.1, keywords, images and the unit
bug for 2.3.2, colours for 2.3.3 and lengths for 2.3.4.

The maintainer took all six recommendations. **Every step, S0 to S7, shipped
together in 2.3.1**; the status under each item has the measurements. S0 moved the private helper copies into `scss/internal/`
(see Architecture), added `huge`, `10deg` and `-10px` to the audit, and added
`tools/browser-check.js`. S1 made `breakpoint`, `remove`, `container-query`
and `screen-agent` refuse a size no condition can match, through
`scss/internal/_condition-width.scss` and `_is-condition-value.scss`, and made
`validateBreakpoint` refuse a word that is not a key.

Two things S1 found that the plan did not expect. `validateBreakpoint` is
called in declarations too, as its documentation page shows, so the
condition-only rules (no percentage, no bare number) went into the internal
check rather than the public function, and the function still returns
percentages, CSS functions, the sizing keywords and `null` unchanged. And a
quoted length such as `breakpoint(min, "600px")` has always worked, because
Sass writes it into the condition unquoted, so the check reads the string's
content rather than refusing every string.

S2 followed on the same branch: `only` and `except` refuse a position with a
unit or a fraction, which makes a selector the browser drops, and `0`, which
matches or excludes nothing, through `scss/internal/_sibling-index.scss`. S3
refused keywords a browser drops in `position`, `ellipsis`, `resizable`,
`radial-gradient` and `font-face`, through `scss/internal/_keyword-value.scss`
and grammars private to each mixin, and stopped writing a valid quoted keyword
with its quotes. S4 made `imageValue` refuse a list or a non-string image in
`background-image`, `brand-logo` and `text-image`, and quote a path holding a
space, a parenthesis or a quote in `background-dots` and `background-stripes`,
and made `sprite` check its path with two arguments. S5 stopped
`background-stripes` appending `deg` to a rotation in another unit, so `turn`,
`rad` and `grad` work and a length raises. S6 checked the ten colour arguments
through `scss/internal/_color-problem.scss` and `_color-stops-problem.scss`,
which replace `triangle`'s private helper and widen what it accepts to system
colours and `contrast-color()`. One exception was found by building the case
rather than reading the docs: `background-image` with no `$image-url` writes
the filter as an `::after` layer's `background`, so a gradient or `url()` there
is a real overlay and stays accepted. A false-refusal sweep followed, recorded
in the plan: every changed argument called with valid CSS kinds the compile
matrix never tried, compiled on `main` and on the branch, with the old CSS of
each new refusal tested in Chrome. It found `only(3n)` refused since S2,
`paint()` refused or wrapped in `url()`, and S6 accepting
`-webkit-fill-available` as a colour; all three are fixed. The lesson it
records: the matrix only proves what its value list contains, so a new check
needs probes of every value kind the argument can land beside. S7, lengths, is
in four chunks through `scss/internal/_length-problem.scss`. Chunk 1 checks the
sizes of `sizer`, `circle`, `brand-logo` and `ellipsis`; chunk 2 the widths
and offset of `focus-ring`, `text-stroke`'s stroke width, `triangle`'s size and
`border-radius`. A sweep with interpolated values then found that
`lengthProblem` and S6's `colorProblem` refused `#{40}px` and `#{red}`, which
reach a check as unquoted strings; both now read the string. Chunk 3 checks
the backgrounds' sizes, `scissors` through `validateScissors`, `sprite`'s
position, `columnizer`'s count and gutter and `adaptive`'s gutter, with value
sets measured by testing every compiled sweep call's own CSS in Chrome. It
turned two broken calls into working ones instead of refusing them:
`adaptive(0)` and `columnizer(3, 0)` now write `0px`, since a unitless 0 inside
their `calc()` was dropped. Chunk 4 made `position` raise on an offset a
browser drops instead of warning through `validateLength`, which had warned
about working values such as `AUTO` and stayed silent for `10deg`. S7, and with
it the plan, is done and released in 2.3.1.

### What `counter-modernisation.md` records

Measured 14 September 2026, when the maintainer asked whether B9 in
`fix-plan.md` had been tested against `counter-continue`. It had not. Seventeen
cases in Chrome 152 show B9's fix works for containers on the items and keeps
continuing lists working, but no method continues a count across list wrappers
that are themselves containers, a native `<ol start>` included, except an
explicit start number with `counter-set` on the first item. The classes only
select; continuing comes from a counter's sibling scope. The file sketches a
class-free `counter` with `$continue`, `$start` and `$name`, a 3.0.0 change,
and lists what is still to test first: Firefox and Safari, skipping an item,
`::marker` for screen readers, nested lists. Not planned yet, at the
maintainer's request.

### What `breakpoint-boundaries.md` records

B1 of `fix-plan.md` until 15 September 2026, when the maintainer moved it out
as a piece of work of its own. `breakpoint` subtracts 1 from a map key at the
end of a range, on purpose, so adjacent ranges do not overlap at the key. The
file measures, in Chrome 152 and Safari 26.6.2, where that is not enough: `max`
and `container-query` overlap at the key, half-pixel viewports in Chrome and
fractional container widths fall into the 1px gap, and a rem map loses 16px. It
records the prototype of ending just under the key in its own unit (`.98` in
px, `.99` otherwise), the defect that prototype has with the unitless
`xsmall: 0`, the finding that Chrome compares boundaries with about 1/64px of
tolerance while Safari compares exactly, and the choices still open: whether
`max` changes, and subtraction or range syntax for `@container`. Not planned
yet, at the maintainer's request.

### What the 3.0.0 files record

Six more files came out of `fix-plan.md` on 15 September 2026, B3 to B8, with
`breakpoint-boundaries.md` and `counter-modernisation.md` above. Each describes
what the member compiles to today, the problem the agent trials found, the
proposal, what it would change for existing users, what was measured, and what
still has to be tested. None is planned, and the maintainer's instruction is to
examine and test each on its own.

- `columnizer-gap.md`: gutters as `gap` instead of margins and an
  `:nth-child` reset, and no universal `box-sizing`. Reviewing it found that
  `columnizer(var(--cols), 20px)` fails with Sass's own `Expected "n"`.
- `hide-unhide-position.md`: `unhide` stops writing `position: static`, which
  breaks the skip-link pattern, and `clip` goes. Not measured.
- `before-after-default-content.md`: `content: ""` by default, since a
  pseudo-element without `content` does not render. Not measured; the risk is
  overriding content set elsewhere.
- `font-face-woff2-default.md`: default formats down to `woff2`. The Parcel
  failure is reproduced; format support is not checked.
- `all-text-inputs-list.md`: `[type=color]` out of the list, `select` open,
  and `[type=datetime]`, removed from HTML, questioned. Not measured.
- `aspect-ratio-height-auto.md`: `height: auto`, since a `height` attribute
  defeats `aspect-ratio`. Measured in Chrome only, including the override of an
  earlier `height`.

### What `gradient.md` proposes

Researched 16 September 2026, when the maintainer asked whether
`linear-gradient` and `radial-gradient` could become one `gradient` mixin with
the type as an argument. It records what the two get wrong, measured in Chrome
152: they write the `background` shorthand, which reset a `background-color`
set before them, and `$direction` takes only `deg`. It lists what modern
gradients add, with versions from the compat data: conic and repeating forms,
and `in oklab` or `in oklch longer hue` interpolation, newly available across
browsers since Firefox 127. Conic stops take angles, not lengths, so the shared
stop check cannot be reused as it is. The proposal takes colours first so the
rest can default, keeps the old names as wrappers so their output does not
change, and leaves removing them to 3.0.0. The maintainer decided on the
removal in 3.0.0 with no wrappers, and it is done on the `gradient` branch:
`gradient` and `gradientValue` over a shared builder in
`scss/internal/_gradient.scss` that four other mixins also use, `text-gradient`
with the same arguments colours first, the old two removed with redirects from
their pages, and a `MIGRATION.md` section. What is left is release work: the
playground demos and the two pages in `llms.txt`.

### What `text-gradient-animation.md` proposes

Suggested by the maintainer on 17 September 2026 for later: a shimmer or colour
sweep on `text-gradient`. By hand it needs `background-size`, `@keyframes` and
an `animation`, and the mixin's `background` shorthand resets the size and
position unless they come after it. The file lists the design questions and
what to measure in the three browsers first. Not planned.

### What `fix-plan.md` sets out

The findings of the agent trials turned into work. For each problem: what goes
wrong, with an example; the change that fixes it, with the code; whether that
change alters output anyone relies on; and which specs, `meta/` entries and
documentation pages it touches. It is ordered by release. Guardrails come
first, so that every later fix lands with a test that would have caught it,
then changes that alter no existing output, then additions, and last the
behaviour changes that need a major version.

It also carries what no trial hit but a sweep of `var(--x)` through every
argument found: arithmetic that fails with Sass's own error, CSS function values
that compile into CSS that cannot work, and values dropped without a word
(G4, F8 to F10).

Every item was then validated: examples compiled, the 2.1.1 fixes prototyped in
a throwaway copy and compared call by call with the original, and browser
measurements where CSS behaviour was the question. That moved the `aspect-ratio`
and `counter` fixes to 3.0.0, because each changes what renders for a call that
works today, and corrected four sketches. The plan's Validation section has the
numbers.

Two of the agents' own suggestions are recorded there as wrong, because each
would have introduced a defect: widening `isColor` to accept `var()` breaks
`tint` and `shade`, which pass its result straight to `color.mix`; and adding
logical keywords to the shared direction list makes `border-radius` accept them
and emit nothing.

**Where it stands.** Every item up to 2.3.0 is done and released: the
groundwork and fixes in 2.1.1, the additions and new members in 2.2.0, two
follow-up refusals in 2.2.1, and `position`'s `$logical` (A3) in 2.3.0. What is
was the 3.0.0 group, and nothing of it is left in the file. On 15 September
2026 the maintainer moved every remaining item to its own file in `todos/`, to
be examined and tested one at a time rather than as a batch (see **What the
3.0.0 files record**), and dropped B2's second half: the one-argument breakpoint
keeps its 2.2.0 warning and is not refused, since its CSS is valid and matches
that one width. The status of every done item, with what was measured, is
written under it.

## Pending work

Known and deliberately deferred, roughly in the order it makes sense to pick up.
Verified as of v2.3.0.

### Next

`todos/silent-values-plan.md` is done: S0 to S7 shipped together as 2.3.1,
not as the four patch releases the plan proposed, because fixes to early steps
landed in later commits and tagging each step would have shipped a false
refusal fixed afterwards, such as `only(3n)`. The same version is on RubyGems,
where it differs from npm in three `@warn` texts, `breakpoint`,
`container-query` and `remove`: the gem was built from a branch holding a
commit made after the tag, which `/release` step 6b now prevents.

Two pieces of work are open, and neither is started:

- **3.0.0, gradients**: done on the `gradient` branch, not yet merged; see
  `todos/gradient.md`. At release, regenerate the playground demos (the
  playground compiles the published version, so a demo in the new API fails
  before then) and take `gradient` and `gradientValue` out of
  `WITHOUT_DOCS_PAGE` in `tools/build-llms-txt.js`.
- **3.0.0**: eight behaviour changes, each in its own file in `todos/` and
  each to be tested and decided on its own before any is planned: breakpoint
  boundaries, `columnizer` on `gap`, `hide("unhide")`, a default `content` for
  `before`/`after`, `font-face` formats, `all-text-inputs`, `aspect-ratio` with
  a `height` attribute, and `counter`. Each needs a `MIGRATION.md` section.
- **`todos/design-tokens.md`**: a token layer on `tokens`, starting with the
  decision whether to ship a palette.

### Small, non-breaking

- ~~`columnizer` interpolates its `calc()`~~ — **do not "fix" this.** The
  interpolation is load-bearing: it is what lets `columnizer(var(--cols))` and
  a `var()` gutter work at all. Evaluating the expression would simplify
  `calc(100% / 4)` to `25%` and shorten the output, and would break every call
  whose column count or gutter is a custom property. Verified both ways.
- **One mixin takes arguments and validates none of them** — `counter`.
  This is mostly deliberate: they pass their arguments straight to CSS, which
  accepts `var()`, `calc()`, `clamp()` and whatever ships next, so a strict
  check would reject correct code. Revisit only where the shape of the call can
  be checked without touching the value. `ellipsis` and `resizable` left this
  list in S3 of `todos/silent-values-plan.md`: their keyword arguments now
  check the kind of each word against a measured set and still take `var()`.
  `brand-logo` and `text-image` left it in S4, when `imageValue` in
  `scss/internal/` began refusing a list or a non-string image for them.
  `text-stroke` left it in S6, when its three colours began to be checked by
  `colorProblem`. `circle` and `sizer` left it in S7, when `sizeProblem` began
  refusing a width or height a browser drops, and `adaptive` in S7's third
  chunk, when its gutter began to be checked.
- **`validateLength` warns rather than errors** on a value that is not a
  length, and stays that way on purpose: it is public, and a caller may want a
  warning. `position` used to route its offsets through it, which warned about
  working values such as `AUTO` and said nothing about `10deg`; since S7 of
  `todos/silent-values-plan.md` it checks them itself and raises, decision 3 of
  that plan.

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

**Six of the seven have shipped.** `container-query`, `fluid` and
`line-clamp` are in, `loadify` respects `prefers-reduced-motion`, which was the
accessibility defect the fourth entry existed for, and 2.2.0 added `focus-ring`
(an outline on `:focus-visible`, measured in its source comment) and
`motion-safe`, the standalone reduced-motion guard. What is left, with the trap
each one closes:

1. **`auto-grid`.** Verified in a browser: in a 250px container,
   `repeat(auto-fit, minmax(20rem, 1fr))` lays out a 320px column and overflows
   by 70px, while `minmax(min(100%, 20rem), 1fr)` fits at 250px. Forgetting the
   `min()` is what produces horizontal scrolling on phones. Different enough
   from `columnizer`, which is flexbox and wants a column count.
2. **Decorative, in the spirit of `background-dots` and `scissors`:** `glass`
   (`backdrop-filter` with a `@supports` fallback, which is unreadable without
   it), `edge-fade` (`mask-image` on a scroll container), `theme`
   (`color-scheme` plus `light-dark()`, where forgetting the first makes the
   second silently pick light). `theme` is now part of the token layer in
   `todos/design-tokens.md`.

`auto-grid` is the one that closes a real defect. The rest are decorative and
can wait for a release that wants them.

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

- **Sass is deprecating its own `if()`, and the library calls it 19 times.**
  Compiling `test/smoke.scss`, Dart Sass prints 23 `if-function` warnings (5
  shown, 18 omitted); 1.91 prints none. The gradient work removed one, in
  `background-image`'s default filter direction, now written with `or`. Counted on `main` at d538217 the same
  way, outside comments, it was 22 calls and 26 warnings, so the 21 and 25 this
  line used to give were already stale. `todos/silent-values-plan.md` removed
  two while fixing what each guarded: S1 in `breakpoint` and S5 in
  `background-stripes`, both now an `@if`. Two fixes look obvious and both are wrong,
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

  So all 20 sites need reading individually, and the ones inside interpolation
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
