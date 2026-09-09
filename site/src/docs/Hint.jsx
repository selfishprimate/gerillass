import React from "react";

import "./hint.scss";

/*
  An aside. `kind` says why it is set apart: "warning" for something that will
  bite, "info" for something worth knowing. Hugo called these hints and the
  pages use both, so both come across.
*/
function Hint({ kind = "info", children }) {
  return <aside className={`hint hint--${kind}`}>{children}</aside>;
}

export default Hint;
