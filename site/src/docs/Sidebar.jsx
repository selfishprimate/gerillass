import React, { useEffect, useMemo, useState } from "react";
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

  A filter rather than a search index. Seventy-seven titles are already in
  memory and the thing a reader is doing is finding a name they half remember,
  which matching on a substring answers. It searches the member name as well as
  the title: somebody looking for clearUnit should not have to know the page is
  called Clear Unit.
*/

const TABS = [
  { kind: "mixin", label: "Mixins" },
  { kind: "function", label: "Utilities" },
];

function Sidebar({ onNavigate }) {
  const { pathname } = useLocation();
  const [query, setQuery] = useState("");

  const current = pages.find((p) => pathname === p.href || pathname === `${p.href}/`);

  /*
    Mixins by default, but the tab follows the page: arriving at a function's
    page with the other tab open would hide the very entry the reader is on.
  */
  const [tab, setTab] = useState(current?.kind === "function" ? "function" : "mixin");

  useEffect(() => {
    if (current && current.kind !== "guide") setTab(current.kind);
  }, [current]);

  const matching = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return pages;
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        (p.member && p.member.toLowerCase().includes(needle)) ||
        p.slug.includes(needle)
    );
  }, [query]);

  const guides = matching.filter((p) => p.kind === "guide");
  const counts = {
    mixin: matching.filter((p) => p.kind === "mixin").length,
    function: matching.filter((p) => p.kind === "function").length,
  };

  /*
    A filter that matches nothing in the open tab opens the other one. Typing
    "validate" with Mixins showing otherwise leaves a reader looking at an
    empty list while four matches sit one unnoticed click away.
  */
  const other = tab === "mixin" ? "function" : "mixin";
  const active = counts[tab] === 0 && counts[other] > 0 ? other : tab;
  const listed = matching.filter((p) => p.kind === active);

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
      <input
        className="docs-sidebar__filter"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Filter ${pages.length} pages`}
        aria-label="Filter the documentation"
      />

      {guides.length ? (
        <div className="docs-sidebar__group">
          <h2 className="docs-sidebar__heading">Getting Started</h2>
          <ul className="docs-sidebar__list">{guides.map(item)}</ul>
        </div>
      ) : null}

      <div className="docs-sidebar__tabs" role="tablist" aria-label="Catalogue">
        {TABS.map(({ kind, label }) => {
          const count = counts[kind];
          return (
            <button
              key={kind}
              type="button"
              role="tab"
              aria-selected={active === kind}
              className={`docs-sidebar__tab${active === kind ? " is-active" : ""}`}
              onClick={() => setTab(kind)}
            >
              {label} <span className="docs-sidebar__count">({count})</span>
            </button>
          );
        })}
      </div>

      {listed.length ? (
        <ul className="docs-sidebar__list">{listed.map(item)}</ul>
      ) : (
        <p className="docs-sidebar__empty">
          {query ? `Nothing here matches “${query}”.` : "Nothing to list."}
        </p>
      )}
    </nav>
  );
}

export default Sidebar;
