import { hydrateRoot, createRoot } from "react-dom/client";
import { createBrowserRouter, matchRoutes, RouterProvider } from "react-router-dom";

import { routes } from "./routes";
import { reloadForStaleModule, watchRouter } from "./staleModule";

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
  A module that no longer exists after a deploy reloads the page instead of
  failing it. The reasoning and the measurements are in staleModule.js; the
  lazy imports in routes.jsx and App.jsx go through loadModule from there, so
  the router never paints its error screen while the reload is under way.
*/
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForStaleModule()) event.preventDefault();
});

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
  watchRouter(router);
  /*
    No StrictMode. In development it mounts every component, unmounts it and
    mounts it again, and react-codemirror2 does not take its first editor out
    of the page on that unmount. The playground ended up with two editors
    stacked in each box: measured on the dev server, four CodeMirror instances
    where the page has two, and typing into the visible source editor changed
    the hidden copy below it instead, so the playground could not be typed in
    at all. A production build never double mounts, and there the same page had
    two editors and took typing, which is why only localhost showed it. The
    server render in entry-server.jsx never used StrictMode either.
  */
  const app = <RouterProvider router={router} />;

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
