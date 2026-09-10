import React from "react";
import { Link, useLocation } from "react-router-dom";

import { pages } from "virtual:docs-index";
import "./sidebar.scss";

/*
  Every documentation page, in three labelled groups.

  The list is not written down anywhere. It comes from the .mdx files through
  virtual:docs-index and the grouping from gerillass.json, so a member that
  gains a page appears here and one that loses its page disappears. The old
  site kept this as a hand-maintained menu file, which is the same shape of
  problem as the playground's member menu, three mixins short since 2.1.0.
*/

const GROUPS = [
  { kind: "guide", label: "Overview" },
  { kind: "mixin", label: "Mixins" },
  { kind: "function", label: "Utilities" },
];

function Sidebar({ onNavigate }) {
  const { pathname } = useLocation();

  return (
    <nav className="docs-sidebar" aria-label="Documentation">
      {GROUPS.map(({ kind, label }) => {
        const group = pages.filter((page) => page.kind === kind);
        if (!group.length) return null;

        return (
          <div className="docs-sidebar__group" key={kind}>
            <h2 className="docs-sidebar__heading">
              {label}
              {kind === "guide" ? null : (
                <span className="docs-sidebar__count"> ({group.length})</span>
              )}
            </h2>
            <ul className="docs-sidebar__list">
              {group.map((page) => {
                const isCurrent =
                  pathname === page.href || pathname === `${page.href}/`;
                return (
                  <li key={page.slug}>
                    <Link
                      className={`docs-sidebar__link${isCurrent ? " is-current" : ""}`}
                      to={page.href}
                      onClick={onNavigate}
                      aria-current={isCurrent ? "page" : undefined}
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
