# CLAUDE.md — site/

Guidance for `gerillass.com`. The library it advertises is upstairs; see the
repository root `CLAUDE.md` for that, and `wiki/monorepo-plan.md` for why both
now live here.

Most of this file was carried over from the site's own repository. Where the
move to Vite made something untrue it says so, because the old advice is still
in the archived repository and somebody will read it.

## What this is

The marketing site: a landing page and the playground. React 18 class
components, `react-router-dom` v7, Dart Sass, built by Vite and **generated
statically** — every route is written out as a real HTML file at build time
rather than assembled in the browser, by `scripts/prerender.mjs`. Deployed to
Netlify.

It dogfoods the library for all of its styling. `@import "gerillass"` resolves
to `../scss` through a `loadPaths` entry in `vite.config.js`, so the site is
always built against the library beside it rather than a published copy.

## Commands

```bash
npm run dev --prefix site      # dev server on http://localhost:7001
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
| React 16, `react-router-dom` v5, `ReactDOM.render` | React 18 and router v7; `src/index.jsx` resolves the lazy routes and hydrates |
| One `index.html` for every route | one file per route, from `node scripts/prerender.mjs` |

Everything below is still true.

## `index.html` carries real behaviour

Not boilerplate. It holds the SEO, Open Graph and Twitter meta, the Typekit
stylesheet that loads Jumble, and the **ionicons** module script that makes
`<ion-icon name="...">` render in `Announcement`.

## Analytics

The site measures. It did not for a while and this file said so; that section
is what this one replaces.

What was here before: a Tag Manager container (`GTM-WJBLKX9`), Universal
Analytics (`UA-171697118-1`), Google Ads with a conversion that fired on every
page load, Google Optimize, and 31 `gtm-*` classes that existed only as
click-trigger hooks. Most of it was already dead, none of it could be read off
the code, and it all came out. The container and its account are deleted.

What is here now is one GA4 property, `G-C92FKJBQ1B`, loaded straight from
`index.html` with no container in front of it. The inline guard runs the tag on
`gerillass.com` and on localhost and nowhere else: every Netlify deploy preview
was sending real traffic into the property under a hostname of its own, and
there is a new one per deploy, so there is no list to maintain.

**Every event this site sends, it sends itself**, from `components/Analytics`.
The config sets `send_page_view: false`; the component sends `page_view` on
each navigation with a `content_group` of Documentation, Playground or
Marketing, `scroll` when a reader reaches 90% of a page, and `click` when a
link leaves the domain. The panel's enhanced measurement for the last two is
switched **off**.

That is the part to understand before changing any of it. Enhanced measurement
is built around page loads, and this is one app with 82 routes where only the
first arrival is a load. Switched on, neither event ever arrived. The tag
downloaded for this property carried both modules -- `percent_scrolled` and
`link_url` were in the bundle, while `file_extension`, `video_provider` and
`form_id`, which were off, were not -- and on the page
`google_tag_manager.autoEventsSettings` reported the link listener armed and
the scroll one never started. Nothing was suppressing them: Google signals off,
the cross-domain list that would exclude outbound clicks empty, the tag's own
automatic event detection on, and no legacy Universal Analytics tag on the live
page whatever tag diagnostics still claims. Sending them from the app ended the
guessing and made them testable.

**Do not switch those two toggles back on** without taking the code out first.
The event names and parameters are GA4's own, so both halves would count.

**Verifying a tag is its own problem, and the trap is worth knowing.** A hit
sent by `gtag` leaves over `sendBeacon`, which does not appear in Resource
Timing and which `gtag` holds its own reference to, so nothing patched in after
load can watch it go. From inside the page a working setup and a broken one
look identical. The panel is the only surface that answers: Realtime for
whether events arrive, DebugView for what is in them, which works from
localhost because the guard sets `debug_mode` there.

**A hidden browser tab reports nothing about scrolling.** Its
`visibilityState` is `hidden`, `requestAnimationFrame` never runs, and scroll
events are not dispatched at all, so a scroll test in a background tab measures
the tab and not the site. Two separate rounds of this were mistaken for a
defect in the site.

The `gtm-*` classes are gone and are not coming back: event names belong in the
code that fires them.

## The static build

`npm run build` is `node scripts/prerender.mjs`, not a Vite command. It builds
the client, builds an SSR bundle, walks the route table in `src/routes.jsx`,
renders each path through `src/entry-server.jsx` and writes a flat `.html` file
for it. Then it calls `plugins/docs-head.js` for each page's head,
`plugins/site-metadata.js` for `sitemap.xml` and `llms.txt`, and
`plugins/csp.js` for the policy.

It replaced `vite-react-ssg`, which cannot work with react-router 7 for the
reason under **Known advisories**.

**Flat files rather than directories, deliberately.** React Router's own
framework-mode prerender hardcodes `<path>/index.html`, and Netlify serves the
two layouts differently: with `.html` files `/docs/counter` answers 200 and
`/docs/counter/` answers 301, while with directories both answer 200 and the
trailing slash becomes a second address for every page. Every canonical here is
the bare form.

Two things bit during the move and both showed up the same way, as doubled
content: 44 code blocks on a page that has 22. `StaticRouterProvider` writes
its hydration data as a `<script>` inside the container it renders into, which
put it inside `#root`; `hydrate={false}` stops that. The real cause was the
lazy routes, unresolved in the browser at hydration, so React found a tree that
did not match and rendered its own underneath. `src/index.jsx` runs
`matchRoutes` and awaits `route.lazy()` before it builds the router.
`matchRoutes` hands back the objects the table holds, so resolving them there
patches the table itself.

Hydration errors seen under `vite preview` at an address that does not exist
are the preview server, not the build: it serves `index.html` where Netlify
serves `404.html`, so the browser renders a different page than the one in the
file. Requesting `/404.html` directly hydrates clean.

### Sections

A section is a folder of `.mdx` under `content/`, and its folder name is the
first segment of the URL. `content/docs` is the only one today; `content/blog`
would be the next, and nothing in the head, the routing or the sitemap would
have to be rewritten for it.

`src/content/pages.js` globs `content/*/*.mdx`, so a new folder is found.
`src/content/sections.js` turns a folder name into the suffix its titles end
with, in title case, so `blog` gives `Gerillass Blog` with nothing registered
anywhere. `routes.jsx` carries a `TEMPLATES` registry naming which component
renders a section: one line per section, and a section with no entry is left
out of the routes and named on the console, because an `.mdx` in a folder
nobody wired up should not quietly not exist.

This closed a real trap. `plugins/docs-head.js` used to read front matter from
`content/docs` and nothing else, and every other path fell through to `null`.
`null` does not mean the page gets no head: it means the generated file keeps
the whole of `index.html`'s, canonical included. A page in an unregistered
section would have declared itself a duplicate of the landing page, which is
exactly what the 404 was doing before it got its own file.

Tried rather than assumed: a temporary `content/blog/deneme.mdx` with no
template registered printed the warning and produced no file; with one line in
`TEMPLATES` it produced `dist/blog/deneme.html`, titled
`... · Gerillass Blog`, canonical to `/blog/deneme`, and listed in the sitemap.

### The policy

`plugins/csp.js` writes the Content-Security-Policy into `_headers`, replacing
a `%CSP%` token. It is generated rather than kept by hand because the policy
has to name the SHA-256 of every inline script in the page, and a hash kept by
hand goes stale silently -- one of those two scripts is the analytics guard, so
the tag would simply stop running with nothing to say so. The build fails if
the token is missing, or if any generated page carries different inline scripts
from `index.html`, because one header covers all 84 of them.

The allowlist was measured, not grepped. Grepping the source found most of the
hosts and missed three: `avatars.githubusercontent.com` behind the supporters
row, `p.typekit.net` behind the font CSS, and Google's `ga-audiences` pixel,
which is gone now because the GA4 property's Google Ads link was removed.

`'unsafe-eval'` is in it for the playground: Dart Sass's browser build compiles
through eval, and without it the page renders one editor instead of two and
prints "Evaluating a string as JavaScript violates the following Content
Security Policy directive".

**It cannot be narrowed to `/playground`, and both halves of that were
measured.** Netlify does replace a same-name header when a more specific block
matches rather than sending both, so the header side works. The site is what
stops it: the playground is a route of this app, not a document of its own, and
a policy belongs to the document that carried it. Served strict at `/` and
loose at `/playground`, opening `/playground` directly gives two editors and
354 characters of CSS, while reaching the same route by clicking Playground on
the home page gives one editor and no compiler. The hero carries that button,
so that is the common way in.

## Announcing a release

`src/release.js` reads the version out of `../../package.json`, and `VERSION`
feeds the header badge while `DOWNLOAD_URL` feeds the Hero download button.
Bumping the library's version is the whole job. It used to read the installed
package, which still meant an install; before that the number was typed by
hand, and the badge sat two releases behind twice.

A release that changes the documented examples also wants
`node scripts/update-playground-demos.cjs`, and the new version seeded into
`FALLBACK` in `src/components/Playground/versions.js` — only a seed, but it
should not be a lie. Refresh the stargazer snapshot with
`node scripts/update-supporters.cjs` in the same pass.

Both scripts were `.js` files using `require`, which `"type": "module"` in
`package.json` turned into an error on the first line, so they are `.cjs`.

**The demo generator reads this repository.** It used to fetch the pages from
the archived `gerillass-docs` repository over `gh api`, parse Hugo
`{{< highlight >}}` shortcodes and look for the manifest in
`node_modules/gerillass`, none of which exists here. It now reads the `scss`
fences of `content/docs/*.mdx`, takes the member from each page's
`<Member name>` rather than its file name, and compiles against the root
`scss/` and `gerillass.json`. It needs no `gh` login. Ported without changing
which example it picks: of the 53 demos, 34 came out identical, 18 changed only
their description, which the pages had rewritten since, and `sprite` took the
page's example, which points at an image the site serves.

Check the tag exists before pointing the download links at it:
`git ls-remote --tags https://github.com/selfishprimate/gerillass.git`.

**`components/Announcement` does not follow `release.js`.** The band across the
top of the page states a *migration*, not a version: it carried a LibSass
deprecation for years, then 2.0.0, and now 3.0.0. A minor or patch release
leaves it alone. **Every major release rewrites it**, a rule the maintainer set
on 17 September 2026: the version, one sentence on what breaks, and a link to
`MIGRATION.md`.

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

`npm audit` in this directory reports **zero**, and `yarn audit` at the
repository root does too.

It reported three for a while, which were two advisories in `react-router`
counted once per package in the chain `react-router` -> `react-router-dom` ->
`vite-react-ssg`: an open redirect through a backslash in `<Link>` and
`useNavigate`, and constructor injection in `deserializeErrors()` during SSR
hydration. Both are fixed in 7.18.0, and the upgrade was blocked on
`vite-react-ssg`, which peers on `react-router-dom ^6.14.1` and imports
`react-router-dom/server`, a subpath version 7 does not export. That is why the
static build is ours; see **The static build**.

A fourth, a prototype pollution advisory in `toml`, reached here through
`remark-mdx-frontmatter` and is pinned away with an `overrides` entry. The
front matter is YAML, so that parser is never called; the override keeps the
alert off the repository rather than fixing a path anything uses.

These live in `site/package-lock.json`, which is the whole reason the site
keeps its own.

## The documentation

81 pages under `content/docs/`, one `.mdx` file each, ported from the Hugo site
in `../../gerillass-docs`. **The filename is the URL and the only registration
there is**: `src/content/pages.js` globs the sections and `src/routes.jsx` turns
each file into a lazy route, which the prerender resolves at build time, so a
new page is a new file and nothing else. See **Sections** under The static
build for what `content/blog` would take.

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

### The hints

`<Hint kind>` is the site's alert, and it carries the same drawn edge as the
code blocks and the buttons: `hand-drawn-block`, the nine piece mask, since a
hint runs from one line to a paragraph with a table in it and a single
stretched drawing pulls its corners out of shape. Two things follow from the
mask. The padding is 22px by 26px, because the corner pieces are 30px and the
edges wobble, and at the old 14px the text sat on the wobble. And the text is
the page's own size: it was 14px on the argument that an aside should be
quieter, which read as small rather than quiet, and the drawn edge is what
sets a hint apart now.

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
  A block with no language of its own is labelled by what it says rather than
  by the fence: all 74 of the `text` fences in the documentation are a message
  from a refused call, so one beginning `Error:` is labelled ERROR and one
  beginning `WARNING` is labelled WARNING. Those two also wrap, with
  `!important` over the theme's inline `white-space: pre`, because an error
  message is a sentence and the library's are long enough that a reader saw
  the first half of it and a scrollbar.
- **A Markdown link goes through the router** when it points inside the site,
  via `src/docs/DocLink.jsx`. Every one of them was a plain `<a>`, so moving
  from one page to the next reloaded the whole application to reach a page the
  router already had. An outbound link keeps `target` and `rel`; a bare
  fragment stays an anchor.

`CodeBlock` carries the look as well as the behaviour: `$primary-color`,
1.5rem of padding, 1rem Roboto Mono, the hand-drawn outline (see **Hand-drawn
shapes**). That is the landing page's
treatment, and the documentation showing a paler, smaller, tighter block read
as a different site. The landing page also reaches the same `<pre>` through
`.highlight pre`, a descendant selector that the component's wrapper does not
come between, and it sets the same values, so it is unchanged.

**The footer rises out of its container, and that needs a block formatting
context.** `.footer` sets `margin-top: -10rem`; without `display: flow-root` on
`.footer-container` that margin collapses through the container's top and the
two move up together, which is what was happening. The two ornaments are
`$alabaster` blobs, the same colour as the container's background, so painted
on the container they cannot be seen: they are meant to sit in the strip the
footer rises through, against the snow of `.main-wrapper`. The footer itself
does not move; the container's top edge does.

**A demo needs the class the example's Sass targets, or the compiled stylesheet
reaches nothing.** Nineteen across five pages had none: they had been written
with the output copied into a `style` attribute by hand, which looks right
until the mixin does something a copy cannot. text-shadow's last example
changes on `:hover` and the copy held only the resting state, so the effect the
page is about did nothing at all. The converter marks the element carrying that
hand copy, or the one carrying an example number, and `DEMO_TARGET` names the
tag where neither rule finds the right one.

**A div marked `sandbox` is the demo surface, whether or not it came from the
shortcode.** Ten demos across three pages were written as a bare
`<div class="sandbox …">` with the compiled CSS copied into a `style` attribute
by hand, and none carried the class the example's Sass targets, so the compiled
stylesheet reached none of them: background-dots lost the photograph under its
dots, since that comes from the mixin's `::before` and the hand copy had left it
out. Those divs get the target class and the same filtering.

**A `sandbox` demo keeps the declarations the mixin does not emit.** The
scissors demo carried `background-color: #5bc0bb` beside the `clip-path`, and
the mixin emits only the clip, so dropping the lot left a correctly clipped box
with no colour in it. Each declaration is checked against the CSS the page
states the example produces: what the mixin emits goes, since the demo should
be painted by the compiled stylesheet, and what it does not emit is the demo's
own presentation and stays.

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
on the way out. `src/docs/inline.jsx` renders backticks, bold and links from
those strings; links were missing until six footnotes were found printing
`See the [examples](#examples) for more.` with the brackets showing. An
`<Argument>` description is different: it becomes JSX children, where a tag is
a tag.

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

`node tools/port-docs.js` did the conversion, and **it now writes nothing it
would overwrite**: every page already exists, so a re-run reports 76 skipped
and stops. The pages are this repository's content and several have been edited
since, so a re-run to pick up a fix in the tool would quietly undo that work.
`--force` regenerates; read the diff before committing it.

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

**A frame is sandboxed with `allow-same-origin` and nothing else**, so the only
demos that work here are the ones the browser drives itself. All three ways
round that were measured on 21 September 2026 while the `reveal` page was
written, and none of them is usable:

- a demo's own script is blocked twice over, by the sandbox and by the policy's
  `script-src`;
- a `:target` link navigates the srcdoc document, which replaces it;
- `allow-forms`, which a `<dialog>` needs to close through
  `<form method="dialog">`, cannot go on. With it the dialog closes in all
  three browsers, but six pages carry a demo form written
  `onsubmit="return false"`, a handler `script-src` blocks, so those would
  submit on Enter and navigate the frame away. It was added behind a check for
  `method="dialog"` for a while and then taken out with the demo that wanted
  it: a dialog can only be opened with `showModal()`, so the demo had to start
  open and could be watched exactly once, leaving an empty box behind.

What is left is `popovertarget`, HTML's own button, which works in all three
browsers inside such a frame and can be pressed as often as the reader likes.
The `reveal` page is five popovers for that reason. A demo that needs anything
more belongs in the lab, which runs scripts.

The `sandbox` shortcode itself rendered an empty div carrying the compiled CSS
again as a hand-written inline style. Here the div takes the class the
example's Sass targets instead, so the demo is painted by the CSS this
repository compiled: if the mixin breaks, the demo breaks and says so.

### Demos

An example's demo markup goes in an ```html fence, which is the one pane the
reader never sees, and renders in the sandboxed frame beside the compiled CSS.
Three things make those demos work, all of them from the Hugo site: the
`sandbox` sizing classes and the `list-wrapper` boxes that `except`, `only` and
their neighbours are demonstrated on, both now part of `FRAME_BASE` in
`Example.jsx`, and each page's own `<style>` block, which is decoration for the
demo rather than a restatement of the mixin and rides along in the same fence.

The furniture the old site kept in its own stylesheet had to be carried across
by hand, and it is easy to miss: nothing fails when it is absent, the demo just
renders as bare markup. `except` and `only` were a column of numerals for a
while before anyone noticed they should be a row of boxes.

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

The documentation opens on `/docs/introduction`. Four pages have no member
behind them and say so with `guide: true` in their front matter, plus an
`order` that fixes their sequence: Introduction, Installation, Support,
License. The sidebar groups them under **Overview**, above the catalogue's two
tabs, and `Breadcrumbs` reads the same data so a page cannot be filed under one
heading in the list and another in the trail.

`/docs` itself has no page. The router sends it to the introduction and
`_redirects` carries the same rule for anyone arriving from outside the app.
That also separated the header's two links, which had both been pointing at
`/docs`: Docs goes to the introduction, Installation to the installation page. It is what the header's `Docs` link now points at, as an in-app
`<Link>`, since the documentation is part of this site rather than a separate
one.

The installation page follows the README and the old Getting Started page,
minus what had gone stale in both: the LibSass note from 1.3.0 and the eyeglass warning, whose
metadata was removed in 2.0.0. What it adds is a "Coming from Gerillass 1.x"
section, since the two breaks in that release are what a reader arriving from
an old tutorial will hit first.

**The list is out of the flow, and that is deliberate.** As a grid column it
decided how tall the row was, because it is the whole catalogue and most pages are shorter
than that: on a short page the content ended half a screen above a footer that
had been pushed down to clear a list nobody was looking at. `.docs-layout__aside`
is now absolutely positioned at `height: 100%`, so it contributes no height, and
the inner `.docs-layout__sidebar` is what sticks and scrolls. Its
`max-height: min(calc(100vh - 48px), 100%)` carries both bounds: the viewport,
and the page when the page is the shorter of the two. Without that second one a
long list spills out of a short page and over the footer.

The list is three labelled groups: Overview, then Mixins, then Utilities.

**Watch for prose rules reaching into components.** `content.scss` styles the
documentation's own prose, and three of its rules had to be narrowed to
`:not([class])` after they were found inside components: the link underline was
drawing through the source button's label, the list padding was indenting the
breadcrumb trail past the title, and `li + li { margin-top }` was pushing every
crumb but the first down half its height. A list or a link that carries a class
belongs to a component and brings its own layout.

The sidebar reads `virtual:docs-index`, a module `plugins/docs-index.js`
builds: it takes the title from each page's front matter and the kind and
summary from `gerillass.json`. Front matter is read at build time on purpose —
the pages are lazy so a reader downloads one of them, and importing all 76 to
read their titles would undo that.

That plugin is also where the two directions are checked, and it prints before
it throws, because an error raised in a plugin's load hook does not always
reach the terminal with its message intact -- the build that ran before this
one reported "An internal error occurred" and nothing else:

- a page documenting something not in `gerillass.json` fails the build
- **a member with no page fails the build too**, which is the direction that
  would otherwise be invisible: the sidebar would look complete while the
  member went undocumented. It is the same gap the playground's member menu
  has, three mixins short since 2.1.0 with nothing saying so

It currently holds at 77 member pages for 77 members, one to one, with four guides beside them. `clearfix` was removed in 4.0.0 and its page went with it, with `/docs/clearfix` redirected in `public/_redirects`.

### The header does not fade in

`.header` carried `opacity: 0` and `animation: setBack 0.5s 0.1s forwards`,
which is the landing page's choreography: the hero, Featured, Install and
Benefits come in behind it on a stagger. On a documentation page or the
playground there is nothing behind it, so what the reader gets is the site's
chrome blinking on every load. The four home page sections keep theirs; the
header does not. Captured at four virtual-time budgets from 150ms, the header
is now identical in all of them.

### A page does not animate as it arrives

Two versions were tried and both were reported as a blink: a spring from
`opacity: 0` and ten pixels down, and then a gentler fade from 0.6. The reason
is the same for both. The page being replaced is on screen at full brightness,
so anything that starts below it dips the content the reader is looking at and
brings it back, which is what a blink is. A crossfade is the only shape that
would not, and it means laying out two pages at once.

`components/PageContent` is a plain `<main>` with no key, so React updates the
element in place: measured with a MutationObserver over a navigation, `main` is
never removed and added, it stays at `opacity: 1` the whole way through, and
the content swaps in one commit. The curves in `animation.js` are for the
playground window, the palette and the scrim, which are objects arriving over
the site rather than the site itself.

### A new page opens at the top

`components/ScrollToTop` puts it there, and two details are what make it look
like nothing happened rather than like a jump. It is a layout effect, so the
scroll is set in the same commit as the new page and before the browser paints
it; as a plain effect the reader saw the new page at the old position for a
frame. And the scroll is asked for with `behavior: "instant"`, because `html`
carries `scroll-behavior: smooth` for anchor links and an explicit behaviour is
the only thing that beats it from inside that effect. Setting
`style.scrollBehavior = "auto"` around the call was tried and does not work
there: the scroll is asked for before the style is recalculated, so the browser
still reads `smooth`. Measured on the dev server with `scrollTo` wrapped to
report the position it leaves behind: 2069 of 2400 that way, 0 with the
keyword.

An anchor link, the back button and the playground are left alone, which the
component says at its head.

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

### Related Links

Every one of the member pages carries the section, and the links are not
guesses. For a mixin that emits properties they point at the properties it
actually emits, taken from compiling its manifest example; for one that wraps a
selector or an at-rule they point at that, so `breakpoint` links `@media` and
`only` links `:nth-child`. A page also links the sibling it is usually reached
from.

**Every external link on the site was fetched.** Four of the six that answered
403 to `curl` load in a browser, which is bot protection rather than a broken
link; the fifth, a listicle-writing article on the `counter` page, now
redirects to a sign-up page and was replaced with MDN's counters guide.

**MDN has restructured its URLs.** Everything under `/Web/CSS/<name>` now
redirects into `/Web/CSS/Reference/Properties/`, `/Reference/Selectors/`,
`/Reference/At-rules/`, `/Reference/Values/` or `/Guides/`. The old form still
works, but the links here are written to where the pages actually live.

Markers on those lists used to need saying out loud, and no longer do: the
site applies the library's own `reset-css` globally, and since 4.0.0 that only
takes the markers off a list carrying `role="list"`. `content.scss` sets the
indent for prose lists and nothing else. The twelve lists the site uses as
layout, the header's two, the footer's four, the sidebar, the supporters' two,
the testimonial, the benefits and the Featured buttons, carry `role="list"`.

**A list with another role has to say `list-style: none` itself.** Examples'
tabs are a `<ul role="tablist">`, written by react-tabs, and cannot claim to be
a list: the markers came back on the home page when the reset narrowed. The
breadcrumb trail, an `<ol>` inside a `<nav>`, was already saying it. Those two
are the only lists on the site with a role of their own; everything else either
says `role="list"` or is prose.

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

### The crawler's files

`sitemap.xml` and `llms.txt` are generated by `plugins/site-metadata.js`,
called from `scripts/prerender.mjs` once the last file is on disk rather than
as a Vite plugin hook: as a plugin it fired at the end of the client build and
found three HTML files, because the pages are written afterwards.

Each entry is dated by the last commit that touched the page's `.mdx`, and the
two marketing pages by the last commit under `site/src` or `index.html`. They
all used to carry the date of the build, which says the whole site changed
whenever any of it did; a lastmod a crawler cannot trust is one it ignores. A
shallow clone would give every file the same date, which looks specific and is
not, so that is checked and falls back to the build date, and the build prints
which of the two it used. The sitemap it replaced
listed a single URL, dated 2020, on the `www` host the site no longer
canonicalises to.

Two kinds of path are held back from it: `/docs`, which redirects, and the demo
pages under `/icons`, which belong to the icon font and are not routes.

`llms.txt` is the library's own, copied in with its links rewritten from
`docs.gerillass.com` to this site. That rewrite falls away when the manifest's
`documentation` field moves with the domain; it is hard-coded in
`tools/build-manifest.js` at the repository root.

**Every page has its own title, description, keywords and canonical**, which is
checkable and worth re-checking after any change here: 84 pages, 82 unique of
each. The one that repeats is `/docs`, which carries the
introduction's head because it redirects there.

### A demo's box does not move twice

A frame starts at 160px and is measured once srcDoc has been parsed, so on a
page of eleven demos every box on it changed height at the same moment, a
quarter of a second after the page arrived, and the page jumped under the
reader. Two things fix it, both in `Example.jsx`:

- **The heights are remembered**, in a module `Map` keyed by the document the
  demo renders. Measured over three navigations: eleven boxes change height on
  the first visit to a page and none on the way back to it, or to any page
  sharing a demo.
- **The first reading is polled on a frame callback** rather than waiting for
  the next timer, which brought the first visit's change from 576ms to 375ms
  in a hidden pane, where frame callbacks are throttled.

### Auditing the demos

A structural check is not enough, and this was learned the hard way: an audit
that asked whether a demo had content and whether its compiled CSS matched a
class in it passed 122 demos, and one of them rendered nothing. The text-image
demo makes its text transparent so a background image shows through, and the
image was hosted on `i.picsum.photos`, which no longer resolves. Content,
matching selector, nothing on screen.

**Render them and measure.** `npm run preview` serves the build; from one page
you can fetch every other, pull the `srcdoc` out of each demo, drop them into
iframes and measure what comes back: body height, how many elements have a
non-zero box, and how many images failed. That is what a demo being empty
actually looks like.

**`$&` in a page corrupts the build, silently, and it came back.** The app is
injected into the template with `String.replace`, where `$&` in the
*replacement* means "the matched substring". A page containing
`data-currency="$"` puts `$` next to the `&` of `&quot;`, and the built file
gets `<div id="root"></div>` spliced into the middle of the attribute instead
of the `$`.

This was documented here, the tool that did it was replaced, and
`scripts/prerender.mjs` reintroduced it in exactly the same place -- `before`
shipped corrupted to production before anybody noticed, which is what "silently"
means. The fix is a **function** replacement, which is never scanned for `$`,
and the same is done in `plugins/docs-head.js` and `plugins/csp.js`. The build
now also counts `<div id="root">` in every page it writes and throws naming the
route if there is more than one, so the third time it will say so.

Writing the sequence as `&#36;` in a page avoids it too, but the guard is the
part that does not depend on remembering.

### A demo the reader can resize

`<Example resizable>` gives the result box a width of its own: a 14px strip
down its right edge with `ew-resize` and a pointer handler that sets the box's
width, and a line of the page's own prose above it saying so. The frame is its
own viewport, so a `@media` query inside it answers the box rather than the
window, which is the only way a page can show a breakpoint.

**The strip is laid over the frame, not beside it.** CSS `resize` was tried
first and does work -- but it puts a grabber in the corner and nowhere else,
and hit-testing it meant a band of padding down the right and along the bottom,
which read as a gap inside the box. An element painted over an iframe takes the
pointer normally; it was the native resizer, hit-tested under the box's own
children, that the iframe was swallowing. Measured in Chrome 152, Firefox 156
and Safari 26.6.2: `elementFromPoint` over the frame's right edge answers the
strip in all three, the frame beyond it, and a `pointerdown` on the strip
reaches the handler.

### Which pages still have no demo

Nine mixins show none, and the reason differs:

- **A device is the subject.** `smartphone`, `tablet` and `screen-agent` read
  `device-width`, `device-height` and the pixel ratio, which belong to the
  screen and not to the frame, so resizing the box proves nothing. `breakpoint`
  and `remove` were on this list until 4.0.0 and now carry a `resizable` demo,
  as does `adaptive`.
- **Nothing is meant to be visible.** `container` sets `container-type`,
  which shows nothing until a `@container` rule reads it. `hide` was on this
  list until 4.0.0, when its page gained an icon toolbar, skip links revealed
  with the Tab key, and labels hidden on narrow screens.
- **It needs something the frame has not got.** `font-face` wants font files
  and `reset-css` a page to reset. `escape-to-parent` was on this list until
  4.0.0, when its page gained three demos that carry the theme or state class
  on a wrapper inside the frame itself.

`border-box` and `antialias` were on this list too, as comparisons that only
read against an unchanged control. Both now have one: the mixin goes on one
element and the other is left alone, which takes no CSS the mixin did not emit
-- except in `border-box`, where the frame's own base sets `box-sizing:
border-box` on everything, so the control carries `content-box` of its own.

None of these is a defect. They are recorded so nobody spends an afternoon
rediscovering why.

### Not done yet

No page has been read end to end for prose quality since the port; what has
been done is a sweep for the things a scan can find. The `/docs` question in this
paragraph is answered: it is a `301!` in `public/_redirects` now, checked
against the live site along with the trailing-slash form and the two aliases.

## Search

**The playground's output editor is mounted once.** It used to be returned
*instead of* the message: an error while typing, or the moment before the
compiler is warm, rendered a `<div>` in its place, so CodeMirror was torn down
and a fresh one built as soon as the error cleared. That is the right half of
the window closing and opening again on every keystroke that does not parse,
and it is what the flicker there turned out to be. Measured with a
MutationObserver on a first open: a `playground__message` removed and a whole
new `react-codemirror2` mounted 700ms in; now only the message moves, the two
editors are created once, and an error leaves the last CSS that compiled on
screen with the message above it.

**Nothing in the palette animates**, and that is a fix rather than a taste. The
scrim carries a `backdrop-filter` and the dialog a nine piece mask inside a
`drop-shadow` frame; a filter and a mask are re-rasterised on every frame of an
opacity or a transform, so the spring the palette used to open on was reported
as flicker rather than as movement. The playground window lost its own
entrance, and its three staggered bands with it, for the same reason: its
editors carry the same mask. The scrim behind the playground still fades, since
it carries neither.

The palette is **anchored near the top, not centred**. Centred, the dialog is
recentred on every keystroke: the list is as tall as its results, so narrowing
them from thirty-three to one moved the whole box up the screen under the
reader's eyes, which is what reads as flicker. Measured from a probe page in
`site/public`, typing `c`, `col`, `colum`: the dialog's top was 96px at each of
them, where before it moved with every letter.

The list carries `height: var(--cmdk-list-height)` with a 120ms transition and
`max-height: 46vh`. cmdk measures its own results and writes that variable from
a frame callback, so the height is a value to animate rather than a layout to
reflow; if the variable never arrives the list is simply 46vh, which is stable
too.

`components/SearchCommand` is a command palette over `virtual:docs-index`, the
same module the sidebar reads, so it cannot fall behind the pages. Eighty of
them is more than a menu holds, and what a reader is doing is looking for a
name they half remember.

`cmdk` does the keyboard and the accessibility, which is why it is worth a
dependency: arrows move, Enter opens, the list is announced. Two things it does
not do and this component does: `Cmd`/`Ctrl` + `K` to open, and `Escape` to
close, since the dialog is ours.

An item's search value carries the member's own name as well as its title, so
`clearUnit` finds the page called Clear Unit, and the summary is matched too,
so `grad` finds `background-image` for the filter it can lay over one.

It lists mixins first: fifty-three of them against twenty-four functions and
four guides, and a mixin is what somebody opening a search box here is looking
for. The guides are on every page in the sidebar, so they sit at the bottom.

Two things make words work that no page is called. `ALIASES` gives the guides
the terms people actually type, so "docs" and "documentation" reach the
introduction and "npm" reaches installation. `ONLY_WHEN_SEARCHED` holds
destinations that appear once there is a query and stay out of the opening
list, which is where the playground lives: it is not a documentation page, but
somebody typing its name should not be told there is nothing.

**The trigger is a menu item, not a box.** It takes its size, weight and colour
from `header.scss` along with the links beside it, and the icon is the only
thing marking it out: both parts are `$link-color` and both turn
`$accent-color` on hover, which is what an `<a>` does here.

Two things were needed to sit it on the same line as those links, and each was
worth a try before it worked. `line-height: inherit`, because a button takes
its font from the user agent, which resets line-height to `normal`. And
`inline-block` rather than `inline-flex`: a flex box takes its baseline from
its first item, the first item is an icon, an icon has no baseline, so the
box's bottom edge stood in for one. An inline-block takes its baseline from its
own text. After both, all three baselines land on the same sub-pixel.

### Icons: two sets, and which to use

`gerillass-v2` is the house icon font, loaded in `_icons.scss` and used through
`gls-` classes; the header's social links are the visible example. It has 48
glyphs, including `close`, `chevron-*` and `arrow-*`, and **no search glyph**.

`components/Icons` inlines Lucide paths as components, which is where the
breadcrumb chevron, the copy button and the palette's icons come from.

Reach for the house font when a glyph exists in it and it stands on its own.
Reach for `components/Icons` inside a cluster that has to look like one set:
the palette's footer needs a search, an up-down and a return, and the font has
only one of the three.

## The home page

Hero, Featured, Install, Benefits, Examples, Testimonial. Examples' wave and
mascot rise out of its own box into the section above it, and the footer rises
10rem into the section above it, so moving a section changes the spacing of
its neighbours. That happened several times while this order was settled;
measure the joints after any reorder rather than trusting the paddings.

### Install

`components/Install` shows the installation page's own command,
`npm install gerillass --save-dev`, in the site's `CodeBlock`, so it has the
same copy button as the documentation.

### Benefits

Four items, each a real feature written in the words people search for, from
keyword research on 15 September 2026: media and container queries, fluid
typography and line clamp, AI coding agents, and npm or RubyGems. Every claim
and count in the copy is checkable against `gerillass.json`; change a count in
the release that changed it.

The illustrations are PNGs in `public/images/illustrations`, referenced by URL,
and were generated with ChatGPT from the template in
`prompts/illustrations.md`. Use that template for any new one, so a
replacement keeps the same style. Each PNG carries its background blob.

`prompts/` holds the prompts used to generate the site's images, one file per
kind (`illustrations.md`, and `mascot.md` once there is one). It sits outside
`public/` on purpose, since everything there is deployed.

### Hand-drawn shapes

The buttons, the code blocks, the playground's editors and the command palette
are cut to shapes that look drawn by hand. Four separate mechanisms, each
chosen for a reason:

- **Blocks of any height: nine pieces.** `hand-drawn-block` in
  `src/assets/scss/abstract/_mixins.scss` masks an element with the install
  block's drawing cut into nine files under `public/images/shapes/code-block/`:
  four corners at their drawn size, four edges that stretch along their own
  length, and a plain fill in the middle. `CodeBlock`, the playground's
  `__editor` and the palette's `__dialog` use it, because their heights run
  from one line to hundreds and a single stretched drawing pulls the corners
  out of shape. A mask cuts away a `box-shadow`, so the palette's shadow is a
  `drop-shadow` filter on `.palette__frame` around the dialog. The selected
  Examples tab below xlarge takes the large button's filled drawing on a
  `::before`, with `inset: 0` because the tab list scrolls sideways and would
  clip anything outside a tab.

- **Large buttons: a mask, not a background.** Every `.button` in
  `_buttons.scss` has a `::before` layer behind its label, masked to
  `public/images/shapes/button-large-filled.svg` or `-outlined.svg` and painted
  with `--button-shape`, which each variant and each hover sets. The drawing's
  colour is baked into its file, so as a background it could not follow the
  hover colours. The masks are copies of `public/images/buttons/btn-large-*`
  with `viewBox="0 0 85 30"` and `preserveAspectRatio="none"`, which the
  originals lack, so one drawing stretches to any button. Button sizes and text
  colours were compared before and after and did not change; hover was checked
  for filled and outlined primary. The `secondary` variant is used nowhere and
  its hover was not tested, and the footer invitation's button was not
  checked because it does not render on the home page.
- **Featured's Star, Fork and Discussions: backgrounds.** They use the small
  drawings as they are (`btn-small-outlined`, filled on hover and for
  Discussions); those files carry `#222c25`, a shade darker than
  `$primary-color`. The lines joining them are the fiddly part. An outlined
  button is hollow, so a line that goes past the drawn outline shows inside it,
  and one that stops short leaves a hairline. Measured at mid height, where the
  line sits: the outline is about 1.6px thick, and the drawings end 1.1px to
  2.1px inside their boxes. The lengths in `featured.scss` put each end 0.7px to
  0.8px into the outline it meets. **Changing a label or the 3px margin changes
  the boxes, and the lines need measuring again.**
- **The install block: a mask per shape.** `code-block-wide.svg` (720x102) and
  `code-block-narrow.svg` (317x95), switched below medium. One drawing
  stretched across both flattened its corners. The clearance was measured by
  drawing each mask onto a canvas at the block's real size and sampling it at
  the corners of the copy button, the label and the command: all inside.

A mask image that fails to load masks the whole element away, per the CSS
Masking spec (not tested here), which is why every mask lives in `public/`,
same-origin. The policy's `img-src 'self'` covers them; the deployed header was
not tested against a mask.

The hero's buttons are as wide as their labels from medium, where they sit side
by side and centred; from large, where the hero itself turns into a row at
992px, they start under the heading. Stacked below medium they are larger than
the rem-sized `button--large` (68px tall with 27px text at 375px, against 59px
and 23px) and take the column's width up to 288px, so a narrow phone shrinks
them rather than letting them overflow. That rule is `breakpoint(xsmall,
medium)`, since `breakpoint(max, medium)` compiles to `max-width: 768px` and
reached the first side-by-side width.

### The error page

A page that throws renders `components/ErrorPage` instead of React Router's
bare "Unexpected Application Error". It is the 404's frame, the announcement
band included.

It is the `errorElement` of the **root** route in `routes.jsx`, so it replaces
the whole shell. A path-less wrapper route would have kept the shell, but
`scripts/prerender.mjs` builds each file name from `route.path`, and a wrapper
without one would have written its children under `/undefined`.

On the dev server it navigates to the same address after every hot update, since
an error boundary only resets on navigation. Tested: a module broken on purpose
showed the page, and restoring it brought the home page back without a reload.
`/error-test` throws on purpose to show the page; it is added only when
`import.meta.env.DEV`, and a build writes no `error-test.html` and lists none in
the sitemap. If `Header` itself threw, the error page would throw too and the
router's own screen would show; that was not tried.

### Testing in the browser pane, two traps

- **When the pane is not on screen, the page reports itself hidden**, the same
  trap described under Analytics. `IntersectionObserver` never fires, so
  anything that loads or animates as it nears the viewport stays paused, and
  screenshots come back blank or unscrolled. The pane's `zoom` action is not
  supported either. For a close look, clone the element into `body` and give
  the clone CSS `zoom`: `position: fixed` inside the page's transformed wrapper
  attaches to that wrapper rather than the screen.
- **Resize, then reload.** Emulating a width under 768px and resizing to a
  desktop width without reloading kept the phone's 14.4px root, and buttons
  measured narrower than they are. Every measurement above was taken on a fresh
  load at its width.

## The lab

`/lab` is a workbench for developing the library, not for users. It exists on
the dev server only: `routes.jsx` adds it behind `import.meta.env.DEV` with a
lazy import, so a build writes no `lab.html` and bundles neither the page nor
its compiler.

The public playground compiles a published version from jsDelivr; the lab
compiles the working tree. `pages/Lab` reads every file under the repository's
`scss/` as text through `import.meta.glob`, and compiles with the site's own
`sass` package through the playground's importer, so it shows whatever the
checked-out branch holds.

Every mixin has a case, and the maintainer wants them simple: the core effect
in two to four variants, usually the same element "Without" and "With" the
mixin, captions in plain words rather than Sass calls, and nested HTML. Traps
and edge cases belong in `meta/` and the docs, not here. Three cannot show a
match by dragging the divider: `smartphone` and `tablet` read the screen's
size and `screen-agent` its pixel density.

A case is two files in `site/lab/cases`: `name.scss` and `name.html`. The Sass
gets `@use "gerillass" as *;` on its first line unless it loads the library
itself, on the same line so an error's line number is the file's. For the open
case the page shows the case's source and the compiled CSS on the left half of
the window, and the HTML rendered with that CSS in an iframe filling the right
half, with a divider between them that can be dragged. A button beside the
case's name hides the preview and the divider and gives the lab the whole
window; the choice is kept in localStorage, and the divider comes back where it
was.

**The library's `@warn` and `@error` messages are a strip under the preview**,
with a divider of its own that drags the same way and remembers where it was
left. They sat above the source until 23 September 2026, where an error
arriving pushed every fold down the page while somebody was typing in one of
them. In the strip a message is a band the width of the column rather than a
card, because the strip is a half of the window like the other two and a rounded
box floating in it read as something else. With the preview hidden there is no
column to sit under, so the messages go back above the source and keep their
own edges there. The library files the case calls are found from its Sass (an
`@include`, with or without `gls-`, or a call to a function's camelCase name)
and shown in a Library panel. The case's name is its file name in title case,
and the line under it is the first sentence of that first member's summary in
`gerillass.json`, which the page imports, so it follows the manifest and waits
for `npm run manifest` like everything else there.

The source column is four folds, Library, SCSS, CSS and HTML by default, which
can be reordered by their grips. Open folds share the column's height, and each
keeps its code block at least 400px tall; when that is more than the window
has, the column scrolls. The block's `<pre>` carries `contain: size`, because
without it a fold's minimum height was the whole file, 1588px for
`_focus-ring.scss`. The HTML, the Sass and the library files can
all be edited on the page. An edit is a draft, kept per file in localStorage
with the rest of the page's state so a refresh or a new tab keeps it, and the
compile uses drafts, so a change to a mixin shows before it is saved. A draft
remembers the file as it was when it began, and says so when the file has
changed on disk since, since a long-lived draft could otherwise hide an edit
made in the editor. Save writes the draft to disk
through `plugins/lab-save.js`, a dev-server-only endpoint that writes only files
that already exist, and only `.scss` under `scss/` or `.scss` and `.html` under
`site/lab/cases`; new mixins and cases are created in the editor.

Any save, from the page or the editor, reloads the page rather than
hot-updating it. A draft that matches the file on disk after the reload is
dropped, which is how Save clears its own. **The repository's hooks do not run
on a file the lab saves**, so after changing the library here, run
`npm run manifest` and the tests as for a change made in a shell. The lab does
not replace the checks in the root CLAUDE.md either: a change that looks right
here still needs the before and after compile and the browser check.

## Dormant code — do not assume it is live

`src/pages/Contact` (no route), `components/Invitations/TopInvitation` (never
imported), `components/ProductHunt` (import commented out in `Home`), and
`src/assets/scss/abstract/_extends.scss` (empty, not imported).

`components/LivePlayground` is parked, not dead: a section that types a mixin's
Sass out on the left and writes the CSS it compiles to on the right, cycling
through six demos. Its import and its element are commented out in `Home`, and
it comes back by uncommenting both. What to know before it does:

- `plugins/live-playground-demos.js`, still registered in `vite.config.js`,
  compiles the demos from the playground's `demos.json` while the site builds,
  so the section never loads Dart Sass (measured: `sass.dart.js` stayed in the
  full playground's chunk) and a demo that stops compiling fails the build.
- **It imports `codemirror/lib/codemirror.css` before `playground.scss`, and
  that order matters beyond the section.** With the section in the home page's
  bundle and that line missing, the full playground loaded CodeMirror's default
  theme after `playground.scss` and its editors showed blue, red and green.
- Its layout was tuned for sitting directly after Examples: its mascot overlaps
  Examples by a set amount, and on a phone it came within 15px of Examples'
  text. The design was left unfinished.

`src/pages/About` is gone, and `templates/BlogTemplate` with it since nothing
else used it. It was routed and live, rendering "This is the content! This is
the sidebar!" to anyone who found it. `/about` is a 301 to the home page in
`public/_redirects`, because the URL had been answering 200 for years.
