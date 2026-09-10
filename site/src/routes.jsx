import React from "react";

import Layout from "./App";
import Home from "pages/Home";
import NotFound from "components/NotFound";
import DocPage from "pages/Docs";
import { Navigate } from "react-router-dom";
import { pages } from "docs/pages";

/*
  The routes as data rather than JSX, which is what vite-react-ssg needs in
  order to walk them at build time and write a file per path.

  The documentation routes are generated from the .mdx files themselves, so a
  new page is a new file and nothing else. They are lazy, which vite-react-ssg
  resolves at build time before it walks them, so every page is still written
  out as a real file while each one keeps its own chunk. Eagerly importing 76
  pages, each carrying its compiled examples, would put all of them in the
  bundle the landing page loads.

  Home is mounted at both "/" and "/playground" on purpose: the playground
  opens over the page rather than replacing it, so the page underneath has to
  stay mounted. Routing them separately built a second copy of it and coming
  back looked like a reload.
*/
const docsRoutes = pages.map(({ path, load }) => ({
  path,
  lazy: async () => {
    const { default: Page, frontmatter } = await load();
    return { element: <DocPage Page={Page} frontmatter={frontmatter} path={path} /> };
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
      ...docsRoutes,
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
