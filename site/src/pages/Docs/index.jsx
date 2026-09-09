import React from "react";

import DocsMdx from "docs/MdxProvider";
import Probe, { frontmatter } from "../../../content/docs/_probe.mdx";

function Docs() {
  return (
    <div className="main-container">
      <div className="main-wrapper">
        <div className="content">
          <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>
            front matter: {JSON.stringify(frontmatter)}
          </p>
          <DocsMdx>
            <Probe />
          </DocsMdx>
        </div>
      </div>
    </div>
  );
}

export default Docs;
