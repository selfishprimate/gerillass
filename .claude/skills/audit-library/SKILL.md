---
name: audit-library
description: Sweep every mixin in Gerillass and report where it misbehaves — silent failures, unhelpful errors, questionable output, and gaps in test coverage. Use when asked to audit or comprehensively test the library, before a release, or after a change that touches many mixins.
---

# Audit the library

`npm test` only checks inputs somebody already thought of. This audit throws
arguments nobody wrote a test for at all 51 mixins, and reports what the library
does with them. Run it before a release and after any change that touches more
than a couple of mixins.

Work through all five steps. Report findings; do not fix anything until the user
has seen the list.

## 1. The suite

```bash
npm test
```

All of it must pass before an audit means anything. This covers: the sass-true
specs, the smoke test that includes every mixin, and the manifest suite that
compiles every documented example, asserts every recorded rejection fails, runs
all of it again under the `gls-` names demanding byte-identical CSS, and fails if
`gerillass.json` or `SKILL.md` is out of date.

## 2. The adversarial sweep

```bash
node tools/audit.js              # every mixin
node tools/audit.js ratio-box    # just one
```

It calls each mixin with a list, a boolean, a colour, a bare number and a couple
of strings, then sorts the results into three buckets:

**SILENT — no CSS, no error.** Always a defect. The caller is told the call
worked and ships a missing declaration. Fix by adding the `@else` the `@if` chain
is missing. This was 14 mixins before v1.6.0 and should stay at zero.

**UNHELPFUL ERROR — failed, but with a Sass internal message.** The mixin
rejected the input, but the caller sees `$string: 42 is not a string` instead of
a sentence naming what the argument accepts. Fix by checking the type before
reaching for `str-slice`, `nth` or `unit`. Sass's own `Missing argument $name` is
not in this bucket: it names the argument, which is enough.

**PASSED THROUGH — emitted CSS from a questionable argument.** Read these; do not
act on the count. Some are correct — `after(nonsense)` really should emit
`content: "nonsense"`. Others are real, like a colour argument that lands in the
CSS as the literal word `true`. The question to ask is whether the emitted value
could ever be valid CSS.

### Two false positives this probe has hit before

- A mixin that takes a `@content` block emits nothing when called without one.
  The tool mirrors the block from the documented example; if you add a mixin
  whose example omits its block, expect a spurious SILENT finding.
- A mixin with required arguments reports `Missing argument` for every probe,
  because the probe only supplies one. That is Sass working correctly.

When something looks broken, confirm it by hand before writing it down:

```bash
printf '@import "gerillass";\n.x { @include center(diagonal); }\n' | sass --stdin --load-path=scss
```

## 3. Generated files

```bash
npm run manifest && git diff --stat
```

A non-empty diff means `gerillass.json` or `SKILL.md` was committed stale. The
suite catches this too, but check it here so the audit report is complete.

```bash
npx gulp start && git diff --stat scss/_gerillass-prefix.scss
```

Same for the `gls-` bundle.

## 4. What the tests do not assert

The manifest proves every example compiles and emits something. It does not
prove the CSS is correct. Only a handful of members assert actual output:

```bash
ls test/library/*.spec.scss test/utilities/*.spec.scss
```

List which mixins have a real spec and which rely on "it compiled". A mixin
carrying only the compile check can still be quietly wrong — that is exactly how
`ratio-box` emitted a ratio box with no ratio through several releases. Use
`/sass-test` to add assertions for the ones that matter most.

Also report mixins that take arguments and still validate none of them:

```bash
for f in scss/library/_*.scss; do
  grep -q '^@mixin [a-z-]*(' "$f" || continue          # takes no arguments
  grep -q '@error' "$f" && continue                    # validates inline
  grep -q '__validate\|__is[A-Z]' "$f" && continue     # validates through a utility
  basename "$f" .scss | sed 's/^_//'
done
```

The last filter matters: `ratio-box` and `responsive-video` carry no `@error` of
their own but reject bad input through `__validateRatio`, so a plain grep for
`@error` reports them as unvalidated and is wrong.

## 5. The packed artifact

```bash
npm pack --dry-run
```

Expect 91 files. `meta/` and `tools/` must not appear; `gerillass.json` and
`SKILL.md` must. For a release-grade audit, install the tarball somewhere else
and compile against it — `.npmignore` and the `exports` map mean the working
tree and the published package are not the same thing.

## Reporting

Give counts per bucket, then the specific mixins, then a recommendation on what
is worth fixing now versus deferring. Say plainly what the audit did **not**
cover: it probes single arguments, so multi-argument combinations, `@content`
behaviour and visual correctness are all outside it.
