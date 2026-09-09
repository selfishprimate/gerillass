import React from "react";

import DocsMdx from "docs/MdxProvider";
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

  return (
    <div className="main-container">
      {/*
        The per-page head is not wired yet. react-helmet-async, which
        vite-react-ssg uses for it, does not apply here at all: neither <Head>
        nor a <Helmet> used directly inside its own <HelmetProvider> sets the
        title, on 1.3.0 or 2.0.5, and it leaves no data-rh marks, so it is not
        running its side effects. Nothing in this repository overwrites the
        title. See wiki/monorepo-plan.md; this is the last thing phase 3 needs.
      */}

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
