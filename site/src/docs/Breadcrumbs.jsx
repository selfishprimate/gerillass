import React from "react";
import { Link } from "react-router-dom";

import { ChevronRightIcon, HomeIcon } from "components/Icons";
import { pages } from "virtual:docs-index";
import "./breadcrumbs.scss";

/*
  Where the reader is: Home, then Docs, then this page.

  Built on shadcn's breadcrumb, which is the shape people expect: a chevron
  between the crumbs rather than a bullet, the trail muted and the last crumb
  in the page colour. The separators are real elements marked aria-hidden, so
  they align with the text on the same baseline instead of being drawn from a
  pseudo-element that has no line box of its own.

  No group crumb between Docs and the page. Mixins and Utilities are how the
  list beside it is divided, not steps on the way to a page: neither is a place
  a reader can go, so a trail that named them was offering a stop that does not
  exist.
*/

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

  return (
    <nav className="breadcrumbs" aria-label="breadcrumb">
      <ol className="breadcrumbs__list">
        <li className="breadcrumbs__item">
          <Link className="breadcrumbs__link breadcrumbs__home" to="/">
            <HomeIcon size={14} />
            <span>Home</span>
          </Link>
        </li>
        <Separator />
        <li className="breadcrumbs__item">
          <Link className="breadcrumbs__link" to="/docs/introduction">
            Docs
          </Link>
        </li>
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
