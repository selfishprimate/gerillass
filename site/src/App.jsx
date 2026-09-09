import React, { Suspense, lazy } from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    useHistory,
    useLocation
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
  const history = useHistory();
  /*
    useLocation is what subscribes this to navigation. useHistory alone hands
    over the object and never re-renders, so the fallback would keep whatever
    was true when the app first rendered — the cover, on every first opening.
  */
  useLocation();
  const openedOverSite = history.action === 'PUSH';

  return (
    <Suspense fallback={openedOverSite ? null : <PlaygroundCover />}>
      <Route exact path="/playground" component={Playground} />
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
        <Switch>
          <Route exact path={['/', '/playground']} component={Home} />
          <Route exact path="/about" component={About} />
          <Route exact path="*" component={NotFound} />
        </Switch>
      </Suspense>
      <PlaygroundRoute />
    </Router>
  );
}

export default App;
