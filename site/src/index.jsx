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
  Reload once when a page's module no longer exists.

  Every deploy renames the files under /assets, since Vite fingerprints them,
  and removes the old ones. A tab opened before the deploy still asks for the
  old names, so the next page it navigates to fails to load and React Router
  shows "Unexpected Application Error: Failed to fetch dynamically imported
  module". Measured against `vite preview`: a tab on one build, a rebuild with
  one page changed, then a click to that page gave exactly that screen, and
  Vite fired `vite:preloadError` with the same message first.

  The address bar still shows the page being left when the event fires, since
  the router commits a navigation only once the page's module has loaded, so a
  plain reload put the reader back where they started. The router's pending
  navigation is the page they asked for, and that is where this goes. On the
  first load there is no router yet, and the current address is the page.

  Once only. A module that is missing from the new build as well would reload
  forever, so a second failure within ten seconds is left alone. Measured with
  the page's module deleted from the build: one reload, and then the page stayed
  on the HTML the build wrote for it, readable but without scripts, rather than
  reloading again.
  sessionStorage can refuse to be read or written, and then the page reloads
  without the guard, which is still better than the error screen.
*/
const RELOADED_AT = "gerillass:reloaded-for-stale-module";
let router = null;

window.addEventListener("vite:preloadError", (event) => {
  let last = 0;
  try {
    last = Number(sessionStorage.getItem(RELOADED_AT)) || 0;
  } catch {}
  if (Date.now() - last < 10000) return;

  try {
    sessionStorage.setItem(RELOADED_AT, String(Date.now()));
  } catch {}
  event.preventDefault();
  const pending = router?.state.navigation.location;
  if (pending) {
    window.location.assign(pending.pathname + pending.search + pending.hash);
  } else {
    window.location.reload();
  }
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

  router = createBrowserRouter(routes);
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
