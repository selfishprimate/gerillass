import React from "react";

import "./hint.scss";

/*
  A note set apart from the prose. `kind` says why: "warning" for something
  that will bite, "info" for something worth knowing. Hugo called these hints
  and the pages use both, so both come across.

  A div with role="note" rather than an <aside>: an aside is a sectioning
  element, so every hint showed up in the page outline as an untitled section,
  and a hint is part of the prose around it rather than a section of its own.
*/
function Hint({ kind = "info", children }) {
  return (
    <div className={`hint hint--${kind}`} role="note">
      {children}
    </div>
  );
}

export default Hint;
