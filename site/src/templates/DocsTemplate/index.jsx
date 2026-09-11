import React, { useState } from "react";

import Announcement from "components/Announcement";
import Header from "components/Header";
import SiteFooter from "components/SiteFooter";
import Sidebar from "docs/Sidebar";
import PageContent from "components/PageContent";

import "docs/content.scss";
import "./docs-template.scss";

/*
  The frame around a documentation page: the site's own header, the list of
  pages, and the page itself.

  It is a second template rather than a branch inside HomeTemplate because the
  two want different things. The landing page is a column of full width
  sections; this is two columns, one of which stays put while the other
  scrolls, and folding both shapes into one template would have meant every
  change to either one being made carefully around the other.

  The header is reused unchanged, which is the point: the documentation is part
  of the site now rather than a second site that looks like it. So is the
  notice above it: it is a site-wide announcement, and a reader who arrives on
  a documentation page is exactly the one who needs to be told the API has
  changed.
*/
function DocsTemplate({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="main-container">
      <Announcement />
      <div className="main-wrapper">
        <Header />

        <div className="docs-layout">
          {/*
            On a narrow screen the list is 76 links between the reader and the
            page they asked for, so it collapses behind a button. The button is
            not rendered at all on a wide screen, where the list is beside the
            page rather than above it.
          */}
          <button
            type="button"
            className="docs-layout__toggle"
            aria-expanded={open}
            onClick={() => setOpen((was) => !was)}
          >
            {open ? "Hide" : "Browse"} the documentation
          </button>

          <aside className={`docs-layout__aside${open ? " is-open" : ""}`}>
            {/*
              The list is one box inside another on purpose. The outer one is
              taken out of the flow so it cannot make the page taller than its
              content; the inner one is what sticks and scrolls.
            */}
            <div className="docs-layout__sidebar">
              <Sidebar onNavigate={() => setOpen(false)} />
            </div>
          </aside>

          <PageContent className="docs-layout__main content">{children}</PageContent>
        </div>

        <SiteFooter />
      </div>
    </div>
  );
}

export default DocsTemplate;
