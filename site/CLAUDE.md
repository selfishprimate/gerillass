# CLAUDE.md — site/

Guidance for `gerillass.com`. The library it advertises is upstairs; see the
repository root `CLAUDE.md` for that, and `wiki/monorepo-plan.md` for why both
now live here.

Most of this file was carried over from the site's own repository. Where the
move to Vite made something untrue it says so, because the old advice is still
in the archived repository and somebody will read it.

## What this is

The marketing site: a landing page and the playground. React class components,
`react-router-dom` v5, Dart Sass, built by Vite. Deployed to Netlify.

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

The site now builds from this repository, which means three settings have to
change and none of them can be changed from here: base directory `site`, build
command `npm run build`, publish directory `site/dist`, and `NODE_VERSION` off
14.

## Known advisories

`npm audit` in this directory reports **two** open, both medium and both in
`react-router`: an open redirect through a backslash in `<Link>` and
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

The root `package.json` is unaffected and `yarn audit` there stays at zero:
these live in `site/package-lock.json`, which is the whole reason the site
keeps its own.

## Dormant code — do not assume it is live

`src/pages/Contact` (no route), `components/Invitations/TopInvitation` (never
imported), `components/ProductHunt` (import commented out in `Home`),
`src/pages/About` (routed, but placeholder text in `BlogTemplate`), and
`src/assets/scss/abstract/_extends.scss` (empty, not imported).
