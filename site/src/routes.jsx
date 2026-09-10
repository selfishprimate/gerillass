import React from "react";

import Layout from "./App";
import Home from "pages/Home";
import NotFound from "components/NotFound";
import DocPage from "pages/Docs";
import { Navigate } from "react-router-dom";
import { pages } from "content/pages";
import { suffixFor } from "content/sections";

/*
  The routes as data rather than JSX, so both halves of the app can walk the
  same table: scripts/prerender.mjs collects the paths to write a file for, and
  react-router builds a router from it in the browser.

  The documentation routes are generated from the .mdx files themselves, so a
  new page is a new file and nothing else. They are lazy, and both halves
  resolve that before rendering -- the build through createStaticHandler, the
  browser in src/index.jsx -- so every page is still written out as a real file
  while each one keeps its own chunk. Eagerly importing 76 pages, each carrying
  its compiled examples, would put all of them in the bundle the landing page
  loads.

  Home is mounted at both "/" and "/playground" on purpose: the playground
  opens over the page rather than replacing it, so the page underneath has to
  stay mounted. Routing them separately built a second copy of it and coming
  back looked like a reload.
*/
/*
  Which component renders a section's pages. content/docs is the only entry
  today; content/blog would add one line here beside its own template, and
  nothing else in the routing would move.

  A section with no entry is left out and said so out loud. Rendering it
  through a frame written for something else would be worse than not routing
  it, and doing either silently would be worse still: an .mdx dropped into a
  folder nobody wired up would just quietly not exist.
*/
const TEMPLATES = { docs: DocPage };

const contentRoutes = pages
  .filter(({ section }) => {
    if (TEMPLATES[section]) return true;
    console.warn(
      `content/${section} has no template in routes.jsx, so its pages are not routed.`
    );
    return false;
  })
  .map(({ section, path, load }) => ({
    path,
    lazy: async () => {
      const { default: Page, frontmatter } = await load();
      const Template = TEMPLATES[section];
      /*
        The suffix a title ends with belongs to the section rather than to the
        page, so it is filled in here instead of being repeated in eighty
        files. A page that sets its own still wins, which is how the two
        marketing routes carry the bare brand.
      */
      const head = { ...frontmatter, page_suffix: frontmatter.page_suffix ?? suffixFor(section) };
      return { element: <Template Page={Page} frontmatter={head} path={path} /> };
    },
  }));

export const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "playground", element: <Home /> },
      /*
        The documentation opens on its introduction. /docs itself has no page
        behind it any more, and netlify.toml carries the same redirect for
        anyone arriving at it from outside the app.
      */
      { path: "docs", element: <Navigate to="/docs/introduction" replace /> },
      ...contentRoutes,
      /*
        Two entries for the same page, and both are needed.

        The named one is what the static build writes out, as dist/404.html.
        Netlify serves that file, with a 404 status, for any address it has no
        file for -- which is what a crawler has to be told. Before this the
        catch-all in _redirects answered every wrong address with the home page
        at status 200, so a mistyped URL looked like a real page to Google.
        That matters most right now: the documentation is changing address and
        every stale link lands on it.

        The wildcard is for the browser, once the app is running: a link to
        nothing inside the app never asks the server.
      */
      { path: "404", element: <NotFound /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

export default routes;
