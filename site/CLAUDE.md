# CLAUDE.md — site/

Guidance for `gerillass.com`. The library it advertises is upstairs; see the
repository root `CLAUDE.md` for that, and `wiki/monorepo-plan.md` for why both
now live here.

Most of this file was carried over from the site's own repository. Where the
move to Vite made something untrue it says so, because the old advice is still
in the archived repository and somebody will read it.

## What this is

The marketing site: a landing page and the playground. React 18 class
components, `react-router-dom` v6, Dart Sass, built by Vite and **generated
statically** — every route is written out as a real HTML file at build time
rather than assembled in the browser. Deployed to Netlify.

It dogfoods the library for all of its styling. `@import "gerillass"` resolves
to `../scss` through a `loadPaths` entry in `vite.config.js`, so the site is
always built against the library beside it rather than a published copy.

## Commands

```bash
npm run dev --prefix site      # dev server on http://localhost:5173
npm run build --prefix site    # production build into site/dist
npm run preview --prefix site  # serve that build
```

There is no lint step and there are no tests. The library's suite at the
repository root does not cover this directory.

## What the Vite port changed

The old repository's guidance is wrong on these, and only these:

| Was | Now |
|---|---|
| `yarn start` / `yarn build`, create-react-app 3.4 | `npm run dev` / `npm run build`, Vite |
| `NODE_OPTIONS=--openssl-legacy-provider` needed locally | not needed; that was `react-scripts` 3 on modern Node |
| `NODE_VERSION=14` pinned on Netlify | **must be raised.** Vite needs 18+; `.nvmrc` and `site/package.json` say 22 |
| Absolute imports work via `jsconfig.json` | via generated aliases in `vite.config.js` |
| JSX lives in `.js` files | `.jsx`; Vite will not parse JSX from `.js` |
| `require()` for image URLs, `ReactComponent` SVG imports | static imports, and `?react` for SVG components |
| `src/serviceWorker.js` | deleted; it was already unregistered |
| `graphql`, `graphql.macro` dependencies | dropped; nothing imported them |
| `src/release.js` reads the installed `gerillass` package | reads `../../package.json`, so no install is involved |
| React 16, `react-router-dom` v5, `ReactDOM.render` | React 18 and router v6; the entry is `ViteReactSSG` in `src/index.jsx` |
| One `index.html` for every route | one file per route, from `vite-react-ssg build` |

Everything below is still true.

## `index.html` carries real behaviour

Not boilerplate. It holds the SEO, Open Graph and Twitter meta, Google Tag
Manager (`GTM-WJBLKX9`), Google Analytics (`UA-171697118-1`), Google Ads with a
conversion snippet, Google Optimize, the Typekit stylesheet that loads Jumble,
and the **ionicons** module script that makes `<ion-icon name="...">` render in
`Announcement`. `public/js/script.js` is loaded and entirely commented out — an
old hero parallax.

Two of those are dead and should go when the analytics are rebuilt:
Universal Analytics stopped collecting on 1 July 2023, and Google Optimize shut
down in September 2023. See `wiki/monorepo-plan.md`.

## `gtm-*` classes are triggers, not styling

`gtm-hero-download`, `gtm-channels-github`, `gtm-navbar-documentation` and 24
others are click-trigger hooks for Google Tag Manager. **Renaming or dropping
one silently breaks a trigger**, and nothing in this repository will tell you.
Keep them when editing markup, and expect them to have drifted from their
labels: `gtm-navbar-documentation` now sits on a link that reads "Docs".

## Announcing a release

`src/release.js` reads the version out of `../../package.json`, and `VERSION`
feeds the header badge while `DOWNLOAD_URL` feeds the Hero download button.
Bumping the library's version is the whole job. It used to read the installed
package, which still meant an install; before that the number was typed by
hand, and the badge sat two releases behind twice.

A release that changes the documented examples also wants
`node scripts/update-playground-demos.js`, and the new version seeded into
`FALLBACK` in `src/components/Playground/versions.js` — only a seed, but it
should not be a lie. Refresh the stargazer snapshot with
`node scripts/update-supporters.js` in the same pass.

Check the tag exists before pointing the download links at it:
`git ls-remote --tags https://github.com/selfishprimate/gerillass.git`.

**`components/Announcement` does not follow `release.js`.** The band across the
top of the page states a *migration*, not a version: it carried a LibSass
deprecation for years and now carries 2.0.0. A routine version bump leaves it
alone. It changes when something breaks.

## Deployment (Netlify)

Netlify site `gerillass` → https://gerillass.com. Settings live in the Netlify
UI, not in the repository.

- `public/_redirects` is the SPA fallback, `/*  /index.html  200`. Vite copies
  `public/` into `dist/`, so it still lands in the build — verified.
- `public/netlify.toml` is **inert**. Netlify only reads `netlify.toml` from the
  repository root. Its contents are commented out, so nothing is lost, but
  enabling those cache headers means moving it.
- Deploys are rare, so a broken build can sit unnoticed for a long time.

The build settings now live in `netlify.toml` at the repository root rather
than in the dashboard, which is where `NODE_VERSION=14` sat unread for years
after create-react-app stopped needing it. Netlify reads a `netlify.toml` only
from the repository root, which is why the inert one in `public/` is inert.

Both dashboard steps are done: the site points at this repository, and its
environment variables are gone entirely — `NODE_VERSION` (answered in
`netlify.toml`), `NETLIFY_USE_YARN` (the site is on npm) and
`NETLIFY_PRERENDER_ENABLED` with its token. `selfishprimate/gerillass-web` is
archived.

That last one is worth understanding rather than just deleting. Netlify's
prerendering service was serving crawlers a rendered copy of the app, which is
how a client-rendered site kept its search and social previews. Static
generation does the same thing at build time, for every route, without a
service. Netlify has deprecated it.

## Known advisories

`npm audit` in this directory reports **three**, which are the same two
advisories counted once per package in the chain `react-router` →
`react-router-dom` → `vite-react-ssg`. Both are in `react-router`: an open redirect through a backslash in `<Link>` and
`useNavigate`, and constructor injection in `deserializeErrors()` during SSR
hydration. Neither has a fix on the 6.x line; both are fixed in 7.18.0, and
`vite-react-ssg` at its latest version peers on `react-router-dom ^6.14.1`. So
the upgrade that clears them is blocked on the tool that made static
generation possible.

They are carried deliberately, not overlooked. This site navigates only to its
own paths and takes nothing from a URL, and it is generated at build time
rather than served by a live renderer, so neither advisory has a way in here.

**This clears when `vite-react-ssg` supports react-router 7, or when the site
moves to a generator that already does.** Check on any dependency pass.

A fourth, a prototype pollution advisory in `toml` reached here through
`remark-mdx-frontmatter`, and is pinned away with an `overrides` entry. The
front matter is YAML, so that parser is never called; the override keeps the
alert off the repository rather than fixing a path anything uses.

The root `package.json` is unaffected and `yarn audit` there stays at zero:
these live in `site/package-lock.json`, which is the whole reason the site
keeps its own.

## The documentation

76 pages under `content/docs/`, one `.mdx` file each, ported from the Hugo site
in `../../gerillass-docs`. **The filename is the URL and the only registration
there is**: `src/docs/pages.js` globs the directory and `src/routes.jsx` turns
each file into a lazy route, which vite-react-ssg resolves at build time, so a
new page is a new file and nothing else.

Four components carry the page, and three of them refuse to render rather than
drift:

| | |
|---|---|
| `<Member name>` | throws if the name is not in `gerillass.json` |
| `<Arguments of>` | throws if the documented argument names differ from the signature. Variadic members are exempt: `border-radius($args...)` says nothing to check against |
| `<Example>` | **compiles** the Sass. A page cannot state an output the library does not produce |
| `<Hint kind>` | info, warning or danger |

`<Example>` takes a `setup` attribute for Sass that has to run first but is not
part of what the example shows. One member needs it: `loadify(init)` defines the
placeholder every later call `@extend`s, so a `loadify()` call compiled on its
own fails with "the target selector was not found".

### The port, and what it found

`node tools/port-docs.js` does the conversion, and it is a migration tool, not
a build step — the pages under `content/docs/` are this repository's content
now, and re-running it would overwrite anything edited by hand. `aspect-ratio`
is already excluded because the copy here was written against measurements and
the upstream one was written from the release notes.

Compiling the examples rather than trusting them is the point, and it earned
its place immediately. `node tools/check-ported-css.js` compiles all 230 and
diffs them against the "CSS Output" the Hugo pages stated by hand: **179 match
byte for byte and 51 do not.** None of the 51 is a broken conversion; they are
the pages having gone stale, in three shapes:

- output the page under-reported, such as the `box-sizing` block `columnizer`
  emits and the page never showed
- output that is no longer emitted, such as the `-webkit-clip-path` on `hide`
- declarations listed in a different order from the one the mixin writes them in

Those 51 statements are now gone rather than corrected: nothing on these pages
claims an output any more, because every block shown is compiled.

The conversion also turned up one documentation defect the manifest could
prove: the `scissors` page wrote its argument as `--`, so a reader was never
told it is `$corners`. It was the only mismatch across all 76 pages.

### Demos

An example's demo markup goes in an ```html fence, which is the one pane the
reader never sees, and renders in the sandboxed frame beside the compiled CSS.
Two things make those demos work and both came from the Hugo site: the
`sandbox` sizing classes, now part of `FRAME_BASE` in `Example.jsx`, and each
page's own `<style>` block, which is decoration for the demo boxes rather than
a restatement of the mixin, and rides along in the same fence.

Per-example `<style>` blocks are dropped instead. They were hand-prefixed
copies of the compiled output, scoped to one demo, and keeping them would let a
demo go on looking right after the mixin behind it broke.

### Not done yet

**The documentation pages have no navigation.** `Header` belongs to `Home`, not
to `Layout`, so a docs page renders with no header, no sidebar and no link to
any other page — one anchor on the whole page, the GitHub source link in
`<Member>`. A reader can only arrive by URL. The sidebar wants building from
`gerillass.json` rather than a list, for the same reason the routes are.

Also outstanding: the aliases in front matter (`aspect-ratio` claims
`/docs/ratio-box/` and `/docs/responsive-video/`) are not served as redirects,
and no page has been read end to end for prose quality since the port.

## Dormant code — do not assume it is live

`src/pages/Contact` (no route), `components/Invitations/TopInvitation` (never
imported), `components/ProductHunt` (import commented out in `Home`),
`src/pages/About` (routed, but placeholder text in `BlogTemplate`), and
`src/assets/scss/abstract/_extends.scss` (empty, not imported).
