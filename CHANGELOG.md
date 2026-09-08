# Change Log
_Change is the essence._

## 2.0.0

Gerillass now uses the Sass module system. Two things break; everything else is
a drop-in upgrade, including every `gls-` call site.

### Breaking

- **Removed:** The `__` prefix on all 22 utility functions. `__remify(24px)` is
  now `remify(24px)`, `__isColor` is `isColor`, `__validateRatio` is
  `validateRatio`, and so on. This was not a style change: under `@use`, a
  member whose name starts with `_` is private to its own file, so the prefixed
  names could not survive the migration. With `@use "gerillass" as *` they did
  not even fail loudly, they compiled to literal CSS. A find and replace of
  `__` covers 19 of the 22. Three needed a new name:

  | Was | Now | Why |
  |---|---|---|
  | `__darken` | `shade` | `darken` is a Sass built-in and shadowing it is silent |
  | `__lighten` | `tint` | same, for `lighten` |
  | `__null` | `fillNulls` | `null` is a Sass keyword |

- **Removed:** `ratio-box` and `responsive-video`. CSS `aspect-ratio` is
  Baseline Widely Available and does their job in one declaration. Replace a
  ratio box with `aspect-ratio` on the element itself, and a video embed with
  `aspect-ratio` on the iframe, which needs no wrapper:

  ```scss
  .video iframe { width: 100%; aspect-ratio: 16 / 9; border: 0; }
  ```

  Note that `aspect-ratio` on a *wrapper* does not reproduce the old mixin: an
  `<iframe>` inside keeps its intrinsic 300x150. Put it on the iframe.
  `validateRatio` stays, so `aspect-ratio: validateRatio("16:9")` still parses
  the colon form CSS will not.

### Not breaking

- **Updated:** The library loads through `@use`/`@forward` instead of `@import`,
  and calls namespaced built-ins (`map.get`, `list.nth`, `string.slice`) instead
  of the deprecated global ones. Dart Sass removes `@import` and the globals in
  3.0.0; this gets in front of that.
- **Note:** One deprecation is left, and it is not the module system. Sass has
  begun deprecating its own `if()` function, which Gerillass calls in 21 places,
  so a very recent Dart Sass prints `if-function` warnings when it compiles the
  library. Nothing is broken and older Sass versions say nothing. It is not
  fixed here because the obvious fixes are both wrong: the replacement syntax
  needs a Dart Sass released weeks ago, and a hand-written helper function
  cannot substitute for `if()`, which only evaluates the branch it takes.
  `triangle` relies on that, so a helper would turn `triangle(top, red, 10px)`
  into an error. Each of the 21 sites needs reading, so it gets its own release.
- **Removed:** `scss/_gerillass-prefix.scss` and the Gulp task that generated
  it, along with `gulp`, `gulp-concat` and `gulp-replace`. The prefixed half of
  the API is now one line, `@forward "library" as gls-*`, so **every `gls-*`
  name keeps working exactly as before**. You can also namespace instead:
  `@use "gerillass" as gls;` then `gls.circle(50px)`.
- **Removed:** The `eyeglass` block and the `eyeglass-module` keyword from
  `package.json`. eyeglass rides the legacy JS API that Dart Sass removes in
  2.0.0, and its importer already fails on any `@import` with current Dart Sass,
  with or without Gerillass.
- **Note:** Apart from the two removals above, no valid call changed its output.
  Verified by snapshotting the CSS of every documented invocation before and
  after each step of the migration.

## 1.6.2

- **Fixed:** The `bugs` URL in `package.json` pointed at `github.com/selfihsprimate/gerillass/issues`, one transposition away from the real account, so the Issues link on the npm page led to a 404.
- **Fixed:** `columnizer` rejected a gutter expressed as a CSS function. `columnizer(3, var(--gap))` now works, as does a `calc()` gutter; `calc((100% - (3 - 1) * var(--gap)) / 3)` is valid CSS and there was no reason to refuse it. Anything that is neither a length, a calculation nor a CSS function is still refused.
- **Added:** A README section on using Gerillass with an AI coding agent, covering the `gerillass.json` manifest and the `SKILL.md` guide that have shipped in the package since 1.6.0 without anything pointing at them.

## 1.6.1

- **Fixed:** `__validateLength` warned about `var()`, `calc()`, `clamp()`, `min()`, `max()` and `env()`, which are all valid CSS lengths. Anyone using a custom property or a calculation with `position` was being told their correct code looked wrong. It now accepts Sass calculations and CSS functions, along with `unset` and `revert`.
- **Fixed:** Nine more arguments answered bad input with an internal Sass message instead of their own. `linear-gradient` and `text-gradient` `$direction`, `background-stripes` `$rotation` and `$image`, `background-dots` `$image`, `radial-gradient` `$shape` and `$position`, and `font-face` `$font-family` and `$file-path` now check the type first and name what they accept.
- **Fixed:** `after` and `before` given a non-string, `scissors` given a non-number, `text-shadow` given a malformed group, and `breakpointer` and `escape-to-parent` given a non-selector all leaked messages naming a Sass builtin's own parameter, such as `$n: Invalid index 2 for a list with 1 elements`. All now explain what the mixin wanted.
- **Fixed:** Four utility functions did the same — `__clearWhitespace`, `__convertToNumber`, `__null` and `__pixelify`.
- **Note:** No valid call changed. Verified by diffing the output of every documented invocation before and after.

## 1.6.0

- **Fixed:** Thirteen mixins silently emitted nothing when given an argument that matched none of their branches. `antialias`, `border-box`, `text-selection`, `center`, `border-radius` with three arguments, `scissors` with two corners, `sprite` with a path that is not an image, and `only`/`except` given a colour all produced a completely empty rule, with no error to explain it. They now `@error` with a message naming what they accept.
- **Fixed:** `smartphone` and `tablet` used `@warn` for an unknown device, so the build passed with a warning most pipelines never surface while the media query vanished. Both now `@error`, and both also reject an orientation other than `portrait` or `landscape`.
- **Fixed:** `triangle`, `all-buttons`, `all-text-inputs`, `border-radius` and `background-image` each interpolated a list into their `@error` via `quote()`, which throws on a list. Their messages never rendered; callers saw a cryptic Sass internal error instead. The messages now appear as written.
- **Fixed:** `columnizer` rejects an unsupported argument count and a second argument that is neither a gutter nor a boolean; `background-dots` rejects a non-boolean `$diagonal`; `remove` replaces `@error "Error!"` with a message that names the argument shapes it accepts.
- **Added:** `gerillass.json`, a machine-readable description of every mixin and function — signature, accepted argument values, worked examples, and inputs that are rejected. Ships in the package and resolves through the `exports` map.
- **Added:** `SKILL.md`, generated from that manifest, so coding agents can load how to use the library instead of guessing at it.
- **Note:** Output for every documented valid call is unchanged; only previously silent failures now error. Verified by diffing 56 invocations before and after.
- **Note:** The manifest and the skill are generated and cannot drift: the test suite compiles every example, asserts every recorded rejection actually fails, and fails the build if either file is out of date.
- **Added:** Coverage for the `gls-` prefixed mixins, which had none. Every example now runs under both names and the CSS must be byte-identical, so a fault in the generated bundle can no longer ship unnoticed. Test count went from 14 to 308.

## 1.5.0

- **Added:** An `exports` map in `package.json` with a `sass` condition, so Dart Sass's built-in package importer can resolve the library by name. `@use "pkg:gerillass"` now works with `NodePackageImporter` or `sass --pkg-importer=node`; it failed before. `@use "gerillass"` now also works under Vite, which does not read the `main` field.
- **Note:** The map includes a `"./*"` wildcard on purpose. `exports` is a whitelist, and without it every subpath such as `pkg:gerillass/scss/library/ellipsis` would have become unreachable.
- **Note:** Verified against a packed tarball with no regressions anywhere. Load-path based setups such as Gulp and Grunt resolve through the filesystem and cannot be affected by `exports` at all.
- **Updated:** The installation section of the README has been rewritten around the tools people actually use. Vite, webpack, Next.js, Angular, Gulp and Grunt each get their own recipe, and every one of them was verified by installing that toolchain and building a real stylesheet against the packed tarball. The versions used are listed in the README.
- **Fixed:** The Gulp and Grunt recipes in the README did not work. Gulp used `includePaths`, which is the Node Sass option name and no longer resolves under Dart Sass, and Grunt used `loadPath`. Both are `loadPaths`. Angular is the exception and wants `stylePreprocessorOptions.includePaths`.
- **Removed:** The React.js section, which described a Create React App setup. Anything Vite based, React included, now needs no configuration at all.
- **Updated:** The README now leads with `@use "gerillass"` and the `pkg:` importer, and documents that the eyeglass route no longer works. eyeglass 3.0.3 has been unmaintained since June 2022 and its importer fails on any `@import` with current Dart Sass, independently of Gerillass. The eyeglass metadata is left in place for now and is queued for removal in 2.0.0.

## 1.4.0

- **Fixed:** `ratio-box` and `responsive-video` silently emitted no `padding-top` when the ratio was not a string or a number. A list argument produced a ratio box with no ratio at all, with no error to explain it. Both now validate their argument and `@error` with a message naming the accepted forms.
- **Added:** `__validateRatio` function, which both mixins now share instead of duplicating the same parsing logic.
- **Note:** This matters for Dart Sass 2.0.0. Once slash division is removed, the documented unquoted `ratio-box(16/9)` form becomes a slash separated list rather than a number, which is exactly the case that used to fail silently. Prefer the quoted `"16/9"` form, which is unaffected.
- **Added:** Unit tests for `ratio-box`, `remove` and `__validateRatio`, plus a smoke test that includes all 51 mixins so a broken one cannot pass unnoticed.

## 1.3.3

- **Security:** Fixed 24 security vulnerabilities (20 high, 4 moderate) reported by Dependabot.
- **Fixed:** Gerillass publishes only the `scss/` directory and therefore has no runtime dependencies. `glob`, `jest`, `sass` and `sass-true` were declared under `dependencies`, which forced everyone installing the package to pull in the whole test toolchain and its transitive tree. They have been moved to `devDependencies`, where they belong.
- **Removed:** `sass-loader` package. It is a webpack loader and was never used in this project.
- **Updated:** `yarn.lock` has been regenerated and now resolves the patched versions of `brace-expansion`, `minimatch`, `picomatch`, `browserslist` and `glob`.
- **Changed:** The default branch of the repository has been renamed from `master` to `main`.

## 1.3.2

- **Security:** Fixed 57 security vulnerabilities in dependency tree.
- **Updated:** Jest from ^27.5.1 to ^30.0.5 (major security and feature updates).
- **Updated:** Sass from ^1.49.7 to ^1.90.0 (latest stable with performance improvements).
- **Updated:** Gulp from ^4.0.2 to ^5.0.1 (major version bump with security fixes).
- **Updated:** sass-true from ^6.0.1 to ^9.0.0 (updated API integration).
- **Updated:** glob from ^7.2.0 to ^11.0.0, sass-loader from ^12.5.0 to ^16.0.3.
- **Removed:** gulp-header package (vulnerable lodash.template dependency).
- **Added:** gulp-replace as secure alternative to gulp-header functionality.
- **Added:** Security resolutions for braces (>=3.0.3) and micromatch (>=4.0.8).
- **Fixed:** Updated test suite to work with sass-true v9.0.0 API.
- **Verified:** All tests passing, build system fully functional, zero vulnerabilities.

## 1.3.1

- **Added:** `yarn.lock`file is added due to the development problems with **npm**. If you're willing to develop a feature for Gerillass, please consider using **Yarn** instead.

## 1.3.0

- **Important Note:** Because LibSass and the packages built on it, including Node Sass, are deprecated, **Gerillass will no longer support LibSass since v1.3.0** If you're having a problem running Gerillass v1.3.0 please consider using Dart Sass instead of LibSass. [Read more about the issue!](https://sass-lang.com/blog/libsass-is-deprecated)

- **Updated:** The usage of division outside of calc() has been updated for the future versions of Dart Sass. Deprecated codes have been replaced with math.div() method. **Updated mixins and functions are as follows:** `background-dots`, `ratio-box`, `responsive-video`, `triangle`, `clear-unit`, `convert-to-em`, `remify`.

- **Added:** `@use "sass:math";` at rule has been added at the top of `gerillass.scss` and `gerillass-prefix.scss` files in order to be able to use `math.div()` method.

## 1.2.7

- **Removed:** `yarn.lock` file is removed.

## 1.2.6

- **Added:** `sass-loader` package has been added.
- **Added:** `sass` package has been added.
- **Removed:** `node-sass` package is removed in order to fix vulnerability issues.

## 1.2.5

- **Updated:** `node-sass` version is updated from ^4.14.1 to ^7.0.1.

## 1.2.4

- **Updated:** `extend` usage is updated for Loadify mixin.
- **Updated:** The title of `CHANGELOG.md` file has been changed.

## 1.2.3

- **Added:** `__isTime` function is added to validate the time values.
- **Updated:** Loadify mixin has been refactored.

## 1.2.2

- **Updated:** Loadify mixin has been updated. The `init` argument is now available to initialize the mixin at the root level of stylesheet.
- **Removed:** `.travis.yml` file. Travis CI integration no longer available.

## 1.2.1

- **Added:** The `extend` directive has been added to use Loadify mixin for multiple selectors.

## 1.2.0

- **Added:** Loadify mixin added to the library in order to help page elements render more natural during the time of page loads.

## 1.1.3

- **Updated:** `box-sizing` property has been added to the Columnizer mixin.

## 1.1.2

- **Uptaded:** An update for security vulnerabilities.

## 1.1.1

- Bugfix for a comment.

## 1.1.0

- Remove all the `gls-` prefixes from the mixin files under the `library` folder and make prefix usage optional (`gls-` prefix still can ben use).

## 0.0.1

- Changelog created!
