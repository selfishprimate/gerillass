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

Markdown tables need `remark-gfm`, which is in the plugin list. Without it a
table renders as a paragraph of pipes, silently. Two pages use one, and
`src/docs/content.scss` is what styles them: nothing on this site had a table
in its prose before the port.

### How a member's page opens

`<Member>` reproduces the shape the documentation has always had, and it is not
a card: a rule under the title with **Type** on one side and the call on the
other, the `gls-` namespace note beneath it, then the description as ordinary
page prose, then an outlined link to the source. Boxing the description made
the page open on a panel of chrome rather than on the sentence a reader came
for.

The source link is an `<a>` with a class, which is why `content.scss`
underlines `a:not([class])` rather than every link: a link carrying a class is
a component and brings its own treatment.

### What a page turns into

`MdxProvider` is where plain Markdown becomes markup, and three of its mappings
are load-bearing:

- **Headings move down one level.** A page writes its title as `#`, because
  that is what a Markdown document does, but the header already has an `h1` on
  every page: the logo. Two of them leaves a screen reader with two competing
  roots for the page outline. So `#` renders as `h2.docs-title`, `##` as `h3`,
  and so on.
- **Headings get an `id`**, slugged from their text. Nothing was giving them
  one, so a link to a section of a page had nothing to land on.
- **A fenced block renders through `components/CodeBlock`**, the same component
  the landing page uses. Before this a fence was unstyled text, which is what
  made a listing of demo markup look like output that had failed to render.
- **A Markdown link goes through the router** when it points inside the site,
  via `src/docs/DocLink.jsx`. Every one of them was a plain `<a>`, so moving
  from one page to the next reloaded the whole application to reach a page the
  router already had. An outbound link keeps `target` and `rel`; a bare
  fragment stays an anchor.

`CodeBlock` carries the look as well as the behaviour: `$primary-color`,
1.5rem of padding, 1rem Roboto Mono, a 16px radius. That is the landing page's
treatment, and the documentation showing a paler, smaller, tighter block read
as a different site. The landing page also reaches the same `<pre>` through
`.highlight pre`, a descendant selector that the component's wrapper does not
come between, and it sets the same values, so it is unchanged.

**The `!important` in `code-block.scss` is load-bearing.**
react-syntax-highlighter writes the theme's padding, size and background as
*inline styles* on the `<pre>`, and an inline style beats a stylesheet. A rule
without it is silently ignored, which is how the documentation's blocks sat at
zenburn's grey and 0.5em of padding while looking, in the source, as though
they had been styled. The landing page's rule has always carried the same three.

Adopting that size forced a layout change: **the Sass and CSS panes of an
`<Example>` stack rather than sitting side by side.** At 16px a pane holds
about thirty characters and a compiled selector runs to sixty five; measured on
columnizer, a 365px pane held 694px of CSS. Two readable panes would want a
content column near 1380px.

**Attributes carry Markdown, not markup.** A `caption` or a `footnote` reaches
its component as a string, and a string rendered by React is text: 47 pages
were showing a literal `<code>$gutter</code>`, angle brackets and all, because
the Hugo shortcodes they came from ran the same prose through a Markdown filter
on the way out. `src/docs/inline.jsx` renders backticks and bold from those
strings. An `<Argument>` description is different: it becomes JSX children,
where a tag is a tag.

### The type scale

`src/docs/content.scss` sets the documentation's own, scoped to
`.docs-layout__main`. These pages inherited the landing page's until now, which
is built for a headline over a hero image: 1.1rem body text under a 3.25rem
`h1`. That reads as a poster rather than as a reference somebody scans for an
argument name.

The rhythm there reaches the prose only. Setting it on every child flattened
the `<Example>` card's own 2.5rem to 1.15rem, with nothing to say it had.

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

### Examples

An `<Example>` is not a card. The caption is prose, the Sass and the CSS are
ordinary `CodeBlock`s carrying their own labels, and the only framed thing is
the demo, which needs a surface to be a demo.

**A listing and a demo are two different things.** Fourteen examples across ten
pages carry both: an ```html fence showing the markup to write, and a separate
`{{< sandbox >}}` rendering the result. The fence always holds what gets
rendered, because that keeps the `.mdx` readable; what gets *printed* is the
`listing` attribute, set only where the old page chose to print one. The other
hundred and one carry markup purely so the demo has something to style, an
empty div with a sizing class, and printing that would offer scaffolding as
though it were the answer.

The `sandbox` shortcode itself rendered an empty div carrying the compiled CSS
again as a hand-written inline style. Here the div takes the class the
example's Sass targets instead, so the demo is painted by the CSS this
repository compiled: if the mixin breaks, the demo breaks and says so.

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

### The shell around a page

`templates/DocsTemplate` is the documentation's own layout: the site's `Header`
unchanged, the list of pages, the page, then `components/SiteFooter`.

**`SiteFooter` is one component because its three parts only work together.**
`.footer` sets `margin-top: -10rem` so it tucks under whatever precedes it, and
the landing page's last section carries 256px of bottom padding for exactly
that. The documentation had two of the three copied across, without the Slack
invitation and without the room, so the footer climbed over the last example on
the page. `.docs-layout` now carries the same 256px, and both pages measure
identically: the container 1149px at x=66, the footer 1021px at x=130, with the
two ornaments 64px square at -64px on each side, and 96px of visible space
above the footer.

**That 256px is a margin, not padding, and the distinction is the whole
point.** `.docs-layout` is the grid and therefore the containing block for the
sticky list of pages. As padding it extended how far that list could travel, so
it slid down into the room made for the footer and ended up behind it, the
footer drawing over it at `z-index: 200`. As a margin the grid ends where the
content does, the list stops with it, and the footer pulls up into empty space. It is a second
template rather than a branch inside `HomeTemplate` because the landing page is
a column of full width sections and this is two columns, one of them sticky.

`/docs` is the installation page, `content/docs/index.mdx`. It is the one page
here with no member behind it, which its front matter declares with
`guide: true`; the sidebar puts those in a Getting Started group above the
catalogue. It is what the header's `Docs` link now points at, as an in-app
`<Link>`, since the documentation is part of this site rather than a separate
one. **`gtm-navbar-documentation` is still on that link** and must stay.

Its content follows the README and the old Getting Started page, minus what had
gone stale in both: the LibSass note from 1.3.0 and the eyeglass warning, whose
metadata was removed in 2.0.0. What it adds is a "Coming from Gerillass 1.x"
section, since the two breaks in that release are what a reader arriving from
an old tutorial will hit first.

The sidebar reads `virtual:docs-index`, a module `plugins/docs-index.js`
builds: it takes the title from each page's front matter and the kind and
summary from `gerillass.json`. Front matter is read at build time on purpose —
the pages are lazy so a reader downloads one of them, and importing all 76 to
read their titles would undo that.

That plugin is also where the two directions are checked, and it prints before
it throws, because an error raised in a plugin's load hook reaches the terminal
as vite-react-ssg's "An internal error occurred" and nothing else:

- a page documenting something not in `gerillass.json` fails the build
- **a member with no page fails the build too**, which is the direction that
  would otherwise be invisible: the sidebar would look complete while the
  member went undocumented. It is the same gap the playground's member menu
  has, three mixins short since 2.1.0 with nothing saying so

It currently holds at 76 pages for 76 members, one to one.

### The head, on a client-side navigation

`useDocumentHead` takes out the `index.html` tags a documentation page replaces
and puts them back on the way out, rather than appending beside them. Without
that, arriving at a page from the landing page rather than by URL left **two
canonical links** in the document, one pointing at the page and one at the home
page. The build already stripped them from each generated file, so this was
only ever visible after an in-app navigation.

### Aliases, and the trailing slash

`plugins/docs-redirects.js` turns the `aliases` in a page's front matter into
rules at the top of the built `_redirects`, above the `/*` SPA fallback, since
Netlify takes the first rule that matches. `aspect-ratio` claims the two URLs
it replaced. The plugin refuses to build if an alias would shadow a real page,
or if two pages claim the same one.

**The URLs have no trailing slash, and that was measured rather than assumed.**
`gerillass.com/about/` answers 301 to `gerillass.com/about` today, so Netlify
serves these from files and normalises the slash away. That means:

- the canonical and `og:url` on every page drop the slash, which `headFor` does
  centrally. Before this they carried one, inherited from Hugo where a page
  really was a directory, and every canonical pointed at a URL that redirected
- redirect targets drop it too, so an old link is one hop rather than two

The old site's URLs are the same shape, `docs.gerillass.com/docs/<slug>/`, so
the domain move is a host swap rather than a path rewrite.

### Editorial consistency

Two things the upstream pages disagreed with themselves about, normalised in
`tools/port-docs.js` rather than only in the files, so a re-run keeps them:

- the section of outbound links was written three ways across sixteen pages,
  **Related Links**, *Related Articles* and *Related links*, for the same
  mixture of references, articles and links to other pages here. It is
  `## Related Links` everywhere now
- an internal link written with a trailing slash is answered with a 301, since
  these pages are served from files. Seven of them carried one, inherited from
  Hugo where the URLs really were directories

A page's list marker is still `*` on the converted pages and `-` on the two
written here. It is invisible to a reader, so it was left rather than churned.

### Not done yet

No page has been read end to end for prose quality since the port; what has
been done is a sweep for the things a scan can find. And whether
Netlify resolves `/docs` to `dist/docs.html` ahead of the `/*` fallback has not
been seen in production; it is the same convention `/about` already ships
under, so it should hold, but it has not been watched.

## Dormant code — do not assume it is live

`src/pages/Contact` (no route), `components/Invitations/TopInvitation` (never
imported), `components/ProductHunt` (import commented out in `Home`),
`src/pages/About` (routed, but placeholder text in `BlogTemplate`), and
`src/assets/scss/abstract/_extends.scss` (empty, not imported).
