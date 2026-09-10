import { useSyncExternalStore } from 'react';

/*
  Holds its children back until the browser has the page.

  vite-react-ssg shipped one of these and it went with it -- see
  scripts/prerender.mjs for why that dependency could not stay. The twenty
  lines it was there for are written out rather than replaced with another
  package.

  useSyncExternalStore rather than an effect and a piece of state: it takes a
  server snapshot and a client one, so React knows the first render is meant to
  differ and hydrates it without a mismatch. The store never changes, hence the
  no-op subscribe -- what moves is which snapshot React reads, and it reads the
  client one from the first commit onward.

  Children are a function, matching the interface this replaces, so whatever
  they reach for on document is not evaluated on the build machine at all.
*/
const subscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

function ClientOnly({ children, fallback = null }) {
  const hydrated = useSyncExternalStore(subscribe, onClient, onServer);
  return hydrated ? children() : fallback;
}

export default ClientOnly;
