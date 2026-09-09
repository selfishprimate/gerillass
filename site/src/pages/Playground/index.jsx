import React from "react";

import Playground from "components/Playground";

/*
  The playground opens over the site rather than replacing it: the route keeps
  it linkable, and closing it drops back to the page it covers — which is still
  mounted underneath, since both addresses render it (see App).
*/
function PlaygroundPage({ history }) {
  /*
    Arriving by a click is the playground opening over a page you were already
    reading; arriving by address, back or reload is simply where you are. The
    router's own action says which, and the window fades its ground in only in
    the first case — in the second there would be nothing behind it but the
    home page, showing for exactly as long as the fade.
  */
  return (
    <Playground
      onClose={() => history.push("/")}
      openedOverSite={history.action === "PUSH"}
    />
  );
}

export default PlaygroundPage;
