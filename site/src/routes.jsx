import React from "react";

import Layout from "./App";
import Home from "pages/Home";
import About from "pages/About";
import NotFound from "components/NotFound";

/*
  The routes as data rather than JSX, which is what vite-react-ssg needs in
  order to walk them at build time and write a file per path.

  Home is mounted at both "/" and "/playground" on purpose: the playground
  opens over the page rather than replacing it, so the page underneath has to
  stay mounted. Routing them separately built a second copy of it and coming
  back looked like a reload.
*/
export const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "playground", element: <Home /> },
      { path: "about", element: <About /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

export default routes;
