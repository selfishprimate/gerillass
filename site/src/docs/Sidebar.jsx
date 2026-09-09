import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { pages } from "virtual:docs-index";
import "./sidebar.scss";

/*
  Every documentation page, in two groups.

  The list is not written down anywhere: it comes from the .mdx files through
  virtual:docs-index, and the grouping comes from gerillass.json, so a member
  that gains a page appears here and one that loses its page disappears. The
  old site kept this as a hand-maintained menu file, which is the same shape of
  problem as the playground's member menu, and that one has been three mixins
  short since 2.1.0.

  A filter rather than a search index. Seventy-six titles are already in memory
  and the thing a reader is doing is finding a name they half remember, which
  matching on a substring answers. The old site loaded a search index for this.
*/

const GROUPS = [
  { kind: "guide", label: "Getting Started" },
  { kind: "mixin", label: "Mixins" },
  { kind: "function", label: "Utilities" },
];

function Sidebar({ onNavigate }) {
  const { pathname } = useLocation();
  const [query, setQuery] = useState("");

  const matching = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return pages;
    // The member name is worth matching as well as the title: somebody looking
    // for clearUnit should not have to know the page is called Clear Unit.
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        (p.member && p.member.toLowerCase().includes(needle)) ||
        p.slug.includes(needle)
    );
  }, [query]);

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

      {matching.length === 0 ? (
        <p className="docs-sidebar__empty">Nothing matches “{query}”.</p>
      ) : null}

      {GROUPS.map(({ kind, label }) => {
        const group = matching.filter((p) => p.kind === kind);
        if (!group.length) return null;

        return (
          <div className="docs-sidebar__group" key={kind}>
            <h2 className="docs-sidebar__heading">
              {label}
              {kind === "guide" ? null : (
                <span className="docs-sidebar__count">{group.length}</span>
              )}
            </h2>
            <ul className="docs-sidebar__list">
              {group.map((page) => {
                const to = page.href;
                const current = pathname === to || pathname === `${to}/`;
                return (
                  <li key={page.slug}>
                    <Link
                      className={`docs-sidebar__link${current ? " is-current" : ""}`}
                      to={to}
                      onClick={onNavigate}
                      aria-current={current ? "page" : undefined}
                    >
                      {page.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export default Sidebar;
