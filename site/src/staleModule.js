/*
  Reload when a page's module no longer exists.

  Every deploy renames the files under /assets, since Vite fingerprints them,
  and removes the old ones. A tab opened before the deploy still asks for the
  old names, so the next page it navigates to fails to load. Measured against
  `vite preview`: a tab on one build, a rebuild with one page changed, then a
  click to that page.

  The address bar still shows the page being left when this runs, since the
  router commits a navigation only once the page's module has loaded, so a
  plain reload put the reader back where they started. The router's pending
  navigation is the page they asked for, and that is where this goes. On the
  first load there is no router yet, and the current address is the page.

  Once only. A module that is missing from the new build as well would reload
  forever, so a second failure within ten seconds is left alone. Measured with
  the page's module deleted from the build: one reload, and then the page stayed
  on the HTML the build wrote for it, readable but without scripts, rather than
  reloading again. sessionStorage can refuse to be read or written, and then the
  page reloads without the guard, which is still better than the error screen.
*/
const RELOADED_AT = "gerillass:reloaded-for-stale-module";

let router = null;
let reloading = false;

export function watchRouter(value) {
  router = value;
}

/*
  Starts the reload and says whether it did, so a caller knows to hold its page
  rather than fail it. Called from the vite:preloadError listener and from
  loadModule, and the first call wins.
*/
export function reloadForStaleModule() {
  if (reloading) return true;

  let last = 0;
  try {
    last = Number(sessionStorage.getItem(RELOADED_AT)) || 0;
  } catch {}
  if (Date.now() - last < 10000) return false;

  try {
    sessionStorage.setItem(RELOADED_AT, String(Date.now()));
  } catch {}
  reloading = true;
  const pending = router?.state.navigation.location;
  if (pending) {
    window.location.assign(pending.pathname + pending.search + pending.hash);
  } else {
    window.location.reload();
  }
  return true;
}

/*
  Loads a lazy module, and holds it while a reload is under way.

  Reloading alone did not stop the error screen. The reload takes as long as the
  new page takes to arrive, and until then the failed import still reached the
  router, which painted "Unexpected Application Error" over the page. Measured
  through a proxy holding page responses for two seconds, the way a deployed
  site answers: the error screen 9ms after vite:preloadError, and the new page
  2 seconds later. Its message was "Cannot destructure property 'default'",
  because cancelling vite:preloadError makes Vite resolve the import with
  nothing rather than reject it; with the event not cancelled it is "Failed to
  fetch dynamically imported module".

  A promise that never settles keeps the router on its pending navigation, so
  the page being left stays on screen until the reload replaces it. React
  Router does the same for route modules in its framework mode.
*/
const never = () => new Promise(() => {});

export async function loadModule(load) {
  let module;
  try {
    module = await load();
  } catch (error) {
    if (reloadForStaleModule()) return never();
    throw error;
  }
  if (module === undefined && reloading) return never();
  return module;
}
