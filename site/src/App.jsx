import React, { Suspense, lazy } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useNavigationType
} from 'react-router-dom';

import Home from 'pages/Home';
import About from 'pages/About';

import NotFound from 'components/NotFound';
import PlaygroundCover from 'components/Playground/Cover';


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

  return (
    <Suspense fallback={openedOverSite ? null : <PlaygroundCover />}>
      <Routes>
        <Route path="/playground" element={<Playground />} />
      </Routes>
    </Suspense>
  );
}

/*
  The playground opens over the home page, so both addresses render the same
  page and it stays mounted while the window is up: routing them separately
  built a second copy of it, and coming back looked like a reload.
*/
function App() {
  return (
    <Router>
      <Suspense fallback={<div />}>
        <Routes>
          {/* Both addresses render Home, so it stays mounted under the
              playground window -- see the note above. */}
          <Route path="/" element={<Home />} />
          <Route path="/playground" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <PlaygroundRoute />
    </Router>
  );
}

export default App;
