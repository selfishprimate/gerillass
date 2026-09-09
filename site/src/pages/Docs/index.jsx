import React from "react";

import DocsMdx from "docs/MdxProvider";
import useDocumentHead from "docs/useDocumentHead";
import Page, { frontmatter } from "../../../content/docs/aspect-ratio.mdx";

/*
  One documentation page, wired up end to end, while the rest of phase 3
  settles the component set. The head comes from the page's own front matter,
  which is what every page will carry.
*/
function Docs() {
  const title = `${frontmatter.page_title} · Gerillass Documentation`;
  const url = "https://gerillass.com/docs/aspect-ratio/";
  const image = `https://gerillass.com/images/docs/${frontmatter.page_image}`;

  useDocumentHead(frontmatter, "/docs/aspect-ratio/");

  return (
    <div className="main-container">

      <div className="main-wrapper">
        <div className="content">
          <DocsMdx>
            <Page />
          </DocsMdx>
        </div>
      </div>
    </div>
  );
}

export default Docs;
