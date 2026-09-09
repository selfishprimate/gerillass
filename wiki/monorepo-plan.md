# Plan: the sites move into this repository

Folding `gerillass.com` and `docs.gerillass.com` into one Vite application
inside this repository, so a mixin and the page documenting it change in the
same commit.

Not a version note, and the one file in `wiki/` that is not. It is here because
this folder exists to brief sessions in the other two repositories, and this is
the plan to absorb them; when it is finished, most of `wiki/` goes with them.

Every count and colour below was measured against the live sites and the
repositories, not assumed.

---

## Why

Nothing connects a library change to the page that describes it. Both of these
happened while shipping 2.1.0:

- `llms.txt` shipped pointing at a documentation page that did not exist,
  because the check for it was a shell loop somebody had to remember to paste.
- Eighteen function pages were reported as missing, twice. They existed the
  whole time; the probe assumed the wrong URL shape and there was no local
  source of truth to check it against.

Neither is a discipline problem. Both are what happens when the only way to
answer *"does this member have a page?"* is to fetch a website. In one
repository that question is a test.

## One application

Once both live on one domain there is no reason for two builds. One Vite
application — the marketing site — with the documentation mounted underneath it
at `/docs`. One router, one build, one deploy.

They were never as separate as they look. Both need the palette, access to
`gerillass.json`, syntax highlighting and, the expensive one, **a way to render
a live Sass example**. The playground and a documentation example are the same
problem wearing different clothes.

What they do **not** share is components. The marketing site's are hand-built
and staying exactly as they are; documentation has none and gets shadcn. In one
codebase that is two folders, not two projects.

```
gerillass/
  scss/  meta/  tools/  test/   the library. still the only thing published.
  site/                         one Vite app, serving gerillass.com
    content/docs/               76 markdown pages, each with its images
    src/routes/                 / and /docs/*
    src/web/                    marketing components, carried across unchanged
    src/docs/                   documentation UI, shadcn
    src/shared/                 tokens, the example renderer, manifest access
    package.json                the site's own. its own lockfile too.
  package.json                  the library's. no site dependencies here.
```

`site/`, singular, because it is one application. `apps/` would carry a
Turborepo connotation and promise workspace machinery this does not need.

> **Tailwind's preflight would reach the marketing site.** Tailwind ships a base
> reset touching every element, and the marketing CSS is hand-built against
> browser defaults. Dropped in globally it moves type, margins and form controls
> on a design that is supposed to come across untouched. Either turn preflight
> off or scope Tailwind to the documentation subtree. **Decide it in phase 1**;
> finding out in phase 5 means debugging a design nobody meant to change.

A single bundle has one more consequence: a visitor to the landing page should
not download the documentation. Route-level code splitting, from the first
route rather than retrofitted.

## One domain

`docs.gerillass.com/docs/circle/` says *docs* twice. Folding it into
`gerillass.com/docs/circle/` fixes that and collapses much of this plan with it:
one Netlify site, one sitemap, one `robots.txt`, and `llms.txt` at the root of
the site where the format says it belongs — `gerillass.com/llms.txt` currently
returns the app shell.

Worth doing, and the riskiest thing here, because **every documentation URL
changes**:

| What | Count | Handling |
|---|---|---|
| Documentation pages | 76 | 301 from the old URL |
| Preview images at `/docs/<name>/images/` | 76 | 301; cached social previews point at the old host |
| Links inside `llms.txt` | 76 | regenerated here, one command |
| `aliases` that already redirect | 2+ | must chain to the new URL, not the old |
| References in this repository | 9 files | `gerillass.json`, README, SKILL.md, CLAUDE.md, CHANGELOG, `/release` |
| External backlinks | unknown | 301 carries them; some equity is lost |

> **The old subdomain can never be retired.** `gerillass.json` ships inside the
> npm package carrying `"documentation": "https://docs.gerillass.com"`. Verified
> against the published tarballs for 1.6.0, 2.0.0 and 2.1.0 — all three. Those
> are immutable, and an agent reading an installed copy follows that URL for as
> long as anyone has an old version installed. `docs.gerillass.com` stays alive
> as a permanent redirector.

### Analytics

Both sites are still on **Universal Analytics** — `UA-171697118-1` on the
marketing site, `-2` on the documentation — and Google stopped processing UA
data on 1 July 2023. The marketing site also loads **Google Optimize**, shut
down in September 2023. Neither site carries a GA4 tag.

So this is not a consolidation of two working properties. Neither has collected
anything for three years. The move is the occasion to set GA4 up properly and
drop two dead scripts costing every visitor a request.

One property and **one web data stream**, not two. GA4 allows several streams
per property but they are meant for different platforms. Two web streams on one
domain split sessions and count the same visitor twice, so the journey from the
landing page into a mixin page arrives as two unrelated visits — precisely the
thing worth seeing. Reporting the halves apart is a **content group** keyed on
the `/docs` path: separate in reports, one session in reality.

## What Hugo is doing that nobody wrote

The documentation runs on a **customised Hugo Book theme**, not a theme built
from nothing. A set of behaviours arrive free today and every one has to be
rebuilt or dropped deliberately. Checked against the live site:

| Feature | Today | Decision |
|---|---|---|
| Search | Client-side index from the theme, `id="book-search-input"`, `s` hotkey | **Must be replaced.** A local index over 76 pages is small; a service is overkill. |
| Syntax highlighting | Chroma at build, `dracula`, `noClasses` so styles are inline, line numbers in a table | Shiki or Prism at build. Match the look or change it on purpose. |
| Table of contents | Configured for `h2`–`h3` | Rebuild, or drop it knowingly. |
| RSS at `/index.xml` | Generated, carrying the **full rendered HTML of every page** | Reproduce or retire. If retired, redirect rather than 404. |
| `robots.txt` | `User-agent: * / Disallow:` | One file, easily forgotten. |
| "Edit this page" | Links to the docs repository | Correct by construction once content sits beside the library. |
| Sidebar order and grouping | `content/menu/index.md`, hand-maintained | Could be derived from the manifest instead, which is how the playground list went stale. |

**The internationalisation is dead weight.** Six language files — `cn`, `en`,
`es`, `jp`, `ko`, `ru` — inherited from the theme, but `/es/`, `/jp/` and
`/cn/` all return 404 and no language switcher renders. Nothing is translated
and nothing needs porting. Written down so no one spends a day carrying it
across.

## Metadata, and what it forces

Every page carries its own head, generated by Hugo from front matter. Measured
on `aspect-ratio`:

| Tag | Source | Scope |
|---|---|---|
| `<title>` | `page_title` + " · Gerillass Documentation" | per page |
| `description`, `keywords` | `page_description`, `page_keywords` | per page |
| `og:title`, `og:description`, `og:url`, `og:type` | front matter | per page |
| `og:image` + `alt`, `width`, `height`, `type` | **a separate image per page**, in the page bundle | per page |
| `twitter:card`, `site`, `creator`, `og:site_name` | site config | site-wide |
| `aliases` | front matter, becomes a redirect page | per page |

All of it comes across unchanged and stays per page. Two consequences follow,
and the first settles the stack.

> **The documentation has to be pre-rendered, not client-rendered.** Social
> scrapers do not run JavaScript. A Vite app setting its head with
> `react-helmet` at runtime serves crawlers one empty `index.html`, and every
> link shared to Slack, X or LinkedIn loses its title, description and preview
> image. Each route has to be emitted as real HTML at build time, which is
> exactly what Hugo does today.

The second is a payload: **76 preview images**, one per page, around 55 kB each
and roughly 4 MB together, in Hugo page bundles at
`content/docs/<name>/images/`. They migrate as they are, and the route has to
keep resolving `/docs/<name>/images/<file>` so the `og:image` URLs already in
the wild keep working.

`aliases` is not decoration either: it is what makes `/docs/ratio-box/` land on
`/docs/aspect-ratio/`, checked and working. Every alias has to survive.

One gap worth closing while the head is being rebuilt: **no documentation page
emits a `canonical` link.** The marketing site does.

## Rendering the examples

The part with a real technical answer, and where the monorepo pays for itself
beyond tidiness.

Today a page shows a Sass call, a block of CSS output, and a live demo. The CSS
output block is **hand-copied into the markdown** — 143 of them — and the demo
is styled by a **separate hand-written class** approximating what the mixin
emits. On the `aspect-ratio` page the mixin emits five declarations and the demo
class carries two, with the rest made up elsewhere. It happens to be equivalent.
Nothing keeps it that way.

With the library in the same repository, all three come from one compilation:

````
<Example>
```scss
.element { @include aspect-ratio("16:9"); }
```
```html
<img class="element" src="/images/hero.jpg" alt="">
```
</Example>
````

At build time the component compiles that Sass against the local `scss/` and
produces the source block, the CSS output block, and the stylesheet the demo
actually uses. The only hand-written part is the demo markup, which is the only
part a manifest cannot know.

> **Each demo has to be an iframe.** Not for tidiness. Injecting demo CSS into
> the page is impossible for some members, and scoping selectors does not save
> it. Measured:
>
> | Member | Emits | If injected |
> |---|---|---|
> | `reset-css` | `html, body, div, span, …` | flattens the page |
> | `breakpointer` | `body::before { content: "xsmall" }` | writes text into the page body |
> | `text-selection` | `::selection` | restyles selection site-wide |
>
> `body::before` cannot be scoped to a container. An `<iframe srcdoc>` per demo
> is the only mechanism holding for all 76 members.

## What stops being written by hand

| On the page | Today | After |
|---|---|---|
| Signature | typed into a shortcode | `manifest.signature` |
| Arguments table | one row written per argument | `manifest.arguments[].accepts` |
| CSS output block | pasted from a terminal | compiled at build |
| Prose, demo markup, guidance | written | still written — this is the actual work |

## Stack

| Choice | Reason |
|---|---|
| Vite, one application | One router, one build, one deploy. Two entries only made sense while there were two domains. |
| **Static generation** | Forced by the metadata above, not a preference. Something that pre-renders every route to HTML with its own head — a Vite SSG plugin, or Astro if a plugin proves thin. **Decide it in phase 1**; it is the one choice expensive to reverse. |
| Markdown content, components for structure | The 76 pages are already markdown with Hugo shortcodes. Content migrates; the ~8 shortcodes become ~8 components. |
| Tailwind + shadcn, **docs only** | Docs has no component library and needs one. shadcn is copied in rather than installed, so it adds components without adding a dependency to audit. The marketing site keeps its own and is not touched. |
| Sass at build time | Already a devDependency of the library. No second toolchain. |

### Colour, from the existing site

`#2F3937` ink · `#FAFAF8` ground · `#F2F2EB` surface · `#DEE0CD` sage ·
`#668F80` accent · `#DCDCDC` hairline, with Inter as the body face.

Read off `gerillass.com` rather than invented. They become the Tailwind theme
and the shadcn base for the documentation.

**The direction runs one way.** The marketing site's design is hand-built and
stays exactly as it is. It is the reference the documentation borrows from —
the palette certainly, and as much of its detailing as suits a reading surface.
Nothing flows back.

## Keeping the package safe

The most consequential defect this package can ship is a dependency, and it has
shipped one: 24 Dependabot alerts, fixed in 1.3.3 by moving everything to
`devDependencies`. The marketing site repeats that pattern today — 13 packages,
all in `dependencies`, `devDependencies` empty.

Four rules, none optional:

- `site/` goes in `.npmignore`. `npm pack --dry-run` must stay at **98 files**
  through the whole migration, checked at every phase.
- The site keeps its own `package.json` and lockfile. The root gains nothing, so
  `yarn audit` at the root keeps measuring the library alone.
- The root `dependencies` block stays empty. The `guard-dependencies` hook
  already blocks otherwise.
- The site imports the library by relative path in development and the published
  package in its own build. It never becomes a dependency of the root.

## Deployment

One Netlify site: `gerillass.com` builds `site/` and serves everything. A
second, near-empty site keeps `docs.gerillass.com` alive, 301ing every path to
its counterpart, permanently.

Netlify builds on push to `main`, so a library commit triggers a site build it
does not affect. Path-based build filtering avoids the noise and is worth
setting up in phase 1.

## Order

The marketing site goes first, which reverses the obvious instinct. Everything
lands under `gerillass.com` in one application, so that application *is* the
marketing site, and documentation cannot mount underneath a host that does not
exist yet. It also means nothing is built from nothing: phase 1 moves something
that already works.

**1. Move the marketing site in, unchanged.**
Bring `gerillass-web` into `site/` and port it from create-react-app and React
16.12 to Vite and a current React. *The design and the components come across as
they are.* The scaffolding lands with it, because these are the choices
expensive to reverse: the static-generation approach, Tailwind scoped so
preflight cannot reach the marketing CSS, shadcn on the palette, route-level
code splitting, `site/` in `.npmignore`. Its 13 packages move to
`devDependencies` on the way.
*Done when: gerillass.com is served from this repository and looks identical,
and `npm pack --dry-run` still reports 98 files.*

**2. The example renderer.**
The hardest piece, built before the content that depends on it and before the
playground that will reuse it. Proven against the four members that break naive
approaches: `reset-css`, `breakpointer`, `text-selection`, `loadify`.
*Done when: those four render correctly and leave the page around them
untouched.*

**3. One documentation page end to end.**
Built from scratch under `/docs` rather than ported, since Hugo's templates do
not come across. `aspect-ratio` is the page to start with: hints, an arguments
table, seven examples, aliases from two removed mixins, its own preview image.
Porting it settles the component set before it is repeated 75 times.
*Done when: the new page matches the live one, head for head, and its CSS blocks
come from the compiler.*

**4. The other 75, and the tests.**
Mechanical once phase 3 settles the shapes, and it carries the metadata with it:
front matter, the 76 preview images, every alias. The tests are the point of the
whole exercise. `llms.txt` is generated straight into the build output and the
hand-maintained page lists are deleted. The playground's member list stops being
a typed array and comes from the manifest.
*Done when: the live documentation and the new one agree, page for page.*

**5. The domain move.**
Last and on its own, because it is the only step that changes URLs and the only
one whose blast radius reaches outside this repository. Keeping it separate
means the rewrite can ship and settle at the old address first.
*Done when: every old URL 301s to a page that exists.*

## What this makes testable

Checked by hand today, or not at all:

- Every member has a documentation page — the question answered wrongly twice.
- Every example on every page compiles against the current library.
- Every CSS output block equals what the library actually emits.
- No page documents a member that no longer exists, which is how `ratio-box`
  lingered.
- The playground lists exactly the mixins that exist.
- Every page emits a title, a description and an `og:image` that resolves.
- Every alias still redirects.
- Every `docs.gerillass.com` path 301s to a page that exists.
- `llms.txt` links resolve, because the pages are local files rather than a
  website to fetch.

## Open questions

- **Does the wiki survive?** Most of `wiki/` exists to brief sessions in other
  repositories. When there are none, only the release-notes part is still
  useful.
- **What happens to the two old repositories?** Archived rather than deleted,
  history intact, README pointing here.
- **The blog.** `gerillass-blog` is on Medium and outside this plan.
- **Timing of the domain move.** With the rewrite, or a release later. Together
  is one disruption; apart is a smaller blast radius.
- **Does anything run outside a laptop?** The library has no CI —
  `.github/` holds funding and issue templates. Netlify will build the site, but
  nothing runs `npm test` anywhere but here. A repository that now contains a
  website is a reasonable moment to change that, or to decide not to.
- **Node.** The library has no build and so has never pinned a version. A site
  does. Pick one and record it, or the first contributor with a different Node
  finds out the hard way.
