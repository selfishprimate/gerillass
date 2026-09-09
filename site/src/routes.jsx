import React from "react";

import Layout from "./App";
import Home from "pages/Home";
import About from "pages/About";
import NotFound from "components/NotFound";
import DocPage from "pages/Docs";
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
      { path: "about", element: <About /> },
      ...docsRoutes,
      { path: "*", element: <NotFound /> },
    ],
  },
];

export default routes;
