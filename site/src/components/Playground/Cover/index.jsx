import React from "react";

import "./cover.scss";

/*
  The playground's ground, painted before the playground itself has arrived.
  Its editor loads on demand, and the home page sits underneath it; without
  this, opening the address directly would show that page for as long as the
  chunk takes and then cover it — a flash of a page nobody asked for.
*/
function Cover() {
  return <div className="playground-cover" aria-hidden="true" />;
}

export default Cover;
