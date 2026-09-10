import React from "react";
import { Link } from "react-router-dom";

import Header from "components/Header";
import SiteFooter from "components/SiteFooter";
import PageContent from "components/PageContent";
import HomeTemplate from "templates/HomeTemplate";

import "./not-found.scss";

/*
  The page somebody lands on when a URL does not resolve.

  It matters more than usual right now: the documentation is moving off its own
  subdomain, and for a while every mistyped redirect and every stale link
  arrives here. So it does the two things a 404 can actually do -- say plainly
  that the address is wrong, and offer the ways back that people were most
  likely looking for.

  It is the site's own frame rather than a bare message, because a page with no
  header is indistinguishable from a broken site.
*/
function NotFound() {
  return (
    <HomeTemplate
      header={<Header />}
      content={
        <PageContent className="content not-found">
          <p className="not-found__code">404</p>
          <h2 className="not-found__title">This page moved, or never existed.</h2>
          <p className="not-found__lede">
            The documentation used to live at <code>docs.gerillass.com</code> and is
            part of this site now. If you followed a link from somewhere else, it
            may be pointing at the old address.
          </p>

          <div className="not-found__ways">
            <Link className="button button--primary button--large" to="/docs/introduction">
              Documentation
            </Link>
            {/*
              primary + outlined, which is what the hero's second button uses.
              The secondary variant paints its text and border in $snow, which
              on this page's $snow ground is an invisible button.
            */}
            <Link className="button button--primary button--large button--outlined" to="/">
              Home page
            </Link>
          </div>

          <p className="not-found__hint">
            Looking for a particular mixin? Press <kbd>⌘</kbd> <kbd>K</kbd> and type its
            name.
          </p>
        </PageContent>
      }
      footer={<SiteFooter />}
    />
  );
}

export default NotFound;
