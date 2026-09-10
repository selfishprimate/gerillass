import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { pages } from "virtual:docs-index";
import "./sidebar.scss";

/*
  Every documentation page: the guides above, then the catalogue behind two
  tabs.

  The list is not written down anywhere. It comes from the .mdx files through
  virtual:docs-index and the grouping from gerillass.json, so a member that
  gains a page appears here and one that loses its page disappears. The old
  site kept this as a hand-maintained menu file, which is the same shape of
  problem as the playground's member menu, three mixins short since 2.1.0.
*/

const TABS = [
  { kind: "mixin", label: "Mixins" },
  { kind: "function", label: "Utilities" },
];

function Sidebar({ onNavigate }) {
  const { pathname } = useLocation();
  const current = pages.find((p) => pathname === p.href || pathname === `${p.href}/`);

  /*
    Mixins by default, but the tab follows the page: arriving at a function's
    page with the other tab open would hide the very entry the reader is on.
  */
  const [tab, setTab] = useState(current?.kind === "function" ? "function" : "mixin");

  useEffect(() => {
    if (current && current.kind !== "guide") setTab(current.kind);
  }, [current]);

  const guides = pages.filter((p) => p.kind === "guide");
  const listed = pages.filter((p) => p.kind === tab);

  const item = (page) => {
    const to = page.href;
    const isCurrent = pathname === to || pathname === `${to}/`;
    return (
      <li key={page.slug}>
        <Link
          className={`docs-sidebar__link${isCurrent ? " is-current" : ""}`}
          to={to}
          onClick={onNavigate}
          aria-current={isCurrent ? "page" : undefined}
        >
          {page.title}
        </Link>
      </li>
    );
  };

  return (
    <nav className="docs-sidebar" aria-label="Documentation">
      {guides.length ? (
        <div className="docs-sidebar__group">
          <h2 className="docs-sidebar__heading">Overview</h2>
          <ul className="docs-sidebar__list">{guides.map(item)}</ul>
        </div>
      ) : null}

      <div className="docs-sidebar__tabs" role="tablist" aria-label="Catalogue">
        {TABS.map(({ kind, label }) => (
          <button
            key={kind}
            type="button"
            role="tab"
            aria-selected={tab === kind}
            className={`docs-sidebar__tab${tab === kind ? " is-active" : ""}`}
            onClick={() => setTab(kind)}
          >
            {label}{" "}
            <span className="docs-sidebar__count">
              ({pages.filter((p) => p.kind === kind).length})
            </span>
          </button>
        ))}
      </div>

      <ul className="docs-sidebar__list">{listed.map(item)}</ul>
    </nav>
  );
}

export default Sidebar;
