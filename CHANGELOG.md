# Change Log
_Change is the essence._

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
