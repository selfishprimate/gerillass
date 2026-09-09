import React from "react";
import { motion } from "framer-motion";

import "./tooltip.scss";

/*
  A small bubble under whatever it explains. It carries no state of its own —
  whoever owns the control decides when it is up — and no pointer events, so it
  can sit over the content below without getting in the way of it.

  `align` is the edge it hangs from: a control near the right of its bar wants
  "right", or the bubble runs off the panel.
*/
function Tooltip({ align = "left", children }) {
  return (
    <motion.span
      className={`tooltip tooltip--${align}`}
      role="tooltip"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.span>
  );
}

export default Tooltip;
