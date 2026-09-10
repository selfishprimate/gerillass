import React, { Suspense, lazy } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { ClientOnly } from 'vite-react-ssg';

import PlaygroundCover from 'components/Playground/Cover';
import ScrollToTop from 'components/ScrollToTop';

import 'assets/scss/App.scss';

/*
  The playground carries an editor the rest of the site has no use for, so it
  loads on its own route rather than in everybody's first request.
*/
const Playground = lazy(() => import('pages/Playground'));

/*
  The editor's chunk loads on demand, and what should be on screen while it
  does depends on how you got here.

  Asking for the address directly: the home page is rendered underneath but was
  never wanted, so the playground's own ground stands in until the window
  arrives. Clicking through from the site: the page you were reading stays
  where it is and the window fades in over it — covering it first and revealing
  it again as the window fades would be a flicker of its own.
*/
function PlaygroundRoute() {
  /*
    useNavigationType subscribes this to navigation, so the fallback is decided
    afresh on each one. Under react-router 5 this took two hooks: useHistory
    handed over the object without re-rendering, and useLocation was there to
    make it re-render at all -- without it the fallback kept whatever was true
    when the app first rendered, which was the cover on every first opening.
  */
  const openedOverSite = useNavigationType() === 'PUSH';
  const { pathname } = useLocation();

  if (pathname !== '/playground') return null;

  /*
    CodeMirror reaches for document as it initialises, so there is nothing to
    render on a build machine. ClientOnly holds it back until the browser has
    it; the prerendered /playground is the home page, which is what sits under
    the window anyway.
  */
  return (
    <ClientOnly>
      {() => (
        <Suspense fallback={openedOverSite ? null : <PlaygroundCover />}>
          <Playground />
        </Suspense>
      )}
    </ClientOnly>
  );
}

/*
  The shell every route renders inside. The playground sits outside the outlet
  rather than in it, so the page underneath stays mounted while the window is
  up: routing them separately built a second copy of it, and coming back looked
  like a reload. Which page that is comes from routes.jsx, where "/" and
  "/playground" both point at Home.
*/
function Layout() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div />}>
        <Outlet />
      </Suspense>
      <PlaygroundRoute />
    </>
  );
}

export default Layout;
