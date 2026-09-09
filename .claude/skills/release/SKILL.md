---
name: release
description: Cut and publish a Gerillass release — version bump, changelog, tag, GitHub release, npm publish, and post-publish verification. Use when the user asks to release, publish, ship a version, or push a fix out to npm.
---

# Release Gerillass

The repository and the npm package are separate things. Fixing `main` changes
nothing for anyone using the library — the fix reaches users only when a new
version is published. Never stop at the git tag.

Take the target version from the user. If they did not name one, propose one and
confirm before touching anything:

- **patch** for dependency, security and bugfix work. This is what almost every
  release here has been, including dependency restructuring (see 1.2.6, 1.3.3).
- **minor** for a new mixin or function.
- `2.0.0` is **reserved** for the `@use`/`@forward` module migration. Do not
  spend it on anything else.

## 1. Verify the tree before anything else

```bash
npm test                    # must pass: specs, smoke test and the manifest suite
yarn audit                  # must be zero across all severities
node tools/audit.js         # the SILENT bucket must be empty
node tools/check-docs.js    # the docs must not claim a count the repo lacks
git status --short          # know exactly what is going out
```

The library must no longer trip the two deprecations the module migration was
about. This must print nothing:

```bash
npx sass --load-path=scss test/smoke.scss 2>&1 >/dev/null | grep -E 'DEPRECATION.*(import|global-builtin)'
```

A plain `grep DEPRECATION` will still find something, and that is expected: Sass
is deprecating its own `if()`, which the library calls in 21 places. Use `npx`,
not a system `sass` — an older one has nothing to say about `if()` and will make
a stale tree look clean.

If `dependencies` in `package.json` is non-empty, stop and fix that first — it is
the single most consequential defect this package can ship. See CLAUDE.md.

## 2. Bump and document

Edit `version` in `package.json`, then add an entry at the top of
`CHANGELOG.md`, directly above the previous version heading. Match the existing
bullet style exactly:

```markdown
## 1.3.4

- **Security:** ...
- **Added:** ...
- **Updated:** ...
- **Removed:** ...
- **Fixed:** ...
```

Write what changed for a **user of the library**, not what changed in the repo.

## 3. Confirm the tarball

```bash
npm pack --dry-run
```

`llms.txt` is generated too, and its links are the one thing no test can check,
because they point at a site this repository does not build. A new mixin has no
documentation page until someone writes one, so verify them by hand when the
release adds a member:

```bash
grep -o 'https://[^)]*' llms.txt | sort -u | while read u; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' -L --max-time 20 "$u") $u"
done | grep -v '^200'
```

Expect 98 files / ~38 kB as of v2.0.0: everything under `scss/`, the generated
`gerillass.json` and `SKILL.md`, plus `README.md`, `LICENSE.md` and
`package.json`. If `test/`, `meta/`, `tools/`, `yarn.lock` or
`node_modules` appear, `.npmignore` is broken — stop and fix it.

## 4. Commit, tag, push

```bash
git add package.json CHANGELOG.md
git commit                       # subject: "Release vX.Y.Z"
git tag -a vX.Y.Z -m "vX.Y.Z"    # tag format is vX.Y.Z — no dot after the v
git push origin main
git push origin vX.Y.Z
```

The default branch is `main`, protected against force-push and deletion but open
to direct pushes.

## 5. GitHub release

```bash
gh release create vX.Y.Z --repo selfishprimate/gerillass \
  --title "vX.Y.Z" --latest --notes-file <file>
```

Reuse the changelog entry as the notes, and end with a compare link:
`https://github.com/selfishprimate/gerillass/compare/vPREV...vX.Y.Z`

## 6. Publish to npm

```bash
npm whoami       # must print selfishprimate
npm publish
```

The account has **2FA enabled**, so `npm publish` fails with `EOTP`. The
one-time code is a credential — do not ask for it and do not type it. Tell the
maintainer to run this themselves:

```bash
npm publish --otp=<code>
```

## 7. Verify what actually shipped

npm reports "may take a few minutes to become available", so the registry lags
the publish. Poll rather than assuming:

```bash
until [ "$(npm view gerillass version)" = "X.Y.Z" ]; do sleep 10; done
npm view gerillass@X.Y.Z dependencies      # MUST be empty
npm view gerillass@X.Y.Z dist.shasum       # must match the shasum npm pack printed
```

Then confirm the consumer experience end to end:

```bash
cd "$(mktemp -d)" && npm init -y >/dev/null && npm install gerillass@X.Y.Z
ls node_modules | grep -v '^\.'            # expect gerillass and nothing else
npm audit
```

Report the published version, the dependency count a consumer now installs, and
the audit result. If any Dependabot alerts or PRs were resolved by this release,
close them and say so.
