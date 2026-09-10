import { StrictMode } from "react";
import { hydrateRoot, createRoot } from "react-dom/client";
import { createBrowserRouter, matchRoutes, RouterProvider } from "react-router-dom";

import { routes } from "./routes";

/*
  The browser half. Every route was already rendered to a real HTML file at
  build time -- see scripts/prerender.mjs -- so this attaches to that markup
  rather than replacing it.

  It matters most for the documentation: every page carries its own title,
  description and preview image, and the scrapers behind a link shared to Slack
  or X do not run JavaScript. A client-rendered page hands them 46 characters
  of "You need to enable JavaScript to run this app."
*/

/*
  Resolve this page's route before hydrating.

  Every documentation route is `lazy`, so on a first render the router has no
  element for the page yet. Hydration then runs against an empty tree: React
  cannot claim the markup the build wrote, and when the module arrives it
  renders the page a second time beside the first. The symptom is the whole
  page twice -- 44 code blocks on a page that has 22, two of every section.

  matchRoutes returns the same objects the table holds, so resolving them here
  patches the table itself and the router is complete before it is built.
*/
async function resolveRoute() {
  for (const match of matchRoutes(routes, window.location) ?? []) {
    if (!match.route.lazy) continue;
    const resolved = await match.route.lazy();
    Object.assign(match.route, resolved);
    delete match.route.lazy;
  }
}

/*
  In its own function rather than at the top level: a top-level await compiles
  to nothing the browser targets in this build can run.
*/
async function start() {
  await resolveRoute();

  const router = createBrowserRouter(routes);
  const app = (
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );

  const container = document.getElementById("root");

  /*
    Hydrate what the build wrote, unless there is nothing there. The empty case
    is `npm run build:spa` and the dev server, where no prerender has run.
  */
  if (container.hasChildNodes()) {
    hydrateRoot(container, app);
  } else {
    createRoot(container).render(app);
  }
}

start();
