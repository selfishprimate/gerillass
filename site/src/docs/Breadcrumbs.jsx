import React from "react";
import { Link } from "react-router-dom";

import { ChevronRightIcon } from "components/Icons";
import { pages } from "virtual:docs-index";
import "./breadcrumbs.scss";

/*
  Where the reader is: Home, then Docs, then the group, then this page.

  Built on shadcn's breadcrumb, which is the shape people expect: a chevron
  between the crumbs rather than a bullet, the trail muted and the last crumb
  in the page colour. The separators are real elements marked aria-hidden, so
  they align with the text on the same baseline instead of being drawn from a
  pseudo-element that has no line box of its own.

  The group comes from the same place the sidebar's does, so a page cannot be
  filed under one heading in the list and another in the trail. The last crumb
  is not a link, since it is where you already are.
*/

const GROUPS = {
  guide: { label: "Overview", href: "/docs/introduction" },
  mixin: { label: "Mixins", href: null },
  function: { label: "Utilities", href: null },
};

function Separator() {
  return (
    <li className="breadcrumbs__separator" role="presentation" aria-hidden="true">
      <ChevronRightIcon size={14} />
    </li>
  );
}

function Breadcrumbs({ path }) {
  const page = pages.find((p) => p.href === path);
  if (!page) return null;

  const group = GROUPS[page.kind];

  return (
    <nav className="breadcrumbs" aria-label="breadcrumb">
      <ol className="breadcrumbs__list">
        <li className="breadcrumbs__item">
          <Link className="breadcrumbs__link" to="/">
            Home
          </Link>
        </li>
        <Separator />
        <li className="breadcrumbs__item">
          <Link className="breadcrumbs__link" to="/docs/introduction">
            Docs
          </Link>
        </li>
        {group ? (
          <>
            <Separator />
            <li className="breadcrumbs__item">
              {group.href ? (
                <Link className="breadcrumbs__link" to={group.href}>
                  {group.label}
                </Link>
              ) : (
                group.label
              )}
            </li>
          </>
        ) : null}
        <Separator />
        <li className="breadcrumbs__item">
          <span className="breadcrumbs__current" aria-current="page">
            {page.title}
          </span>
        </li>
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
