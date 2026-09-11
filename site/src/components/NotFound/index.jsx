import React from "react";
import { Link } from "react-router-dom";

import Announcement from "components/Announcement";
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
  header is indistinguishable from a broken site. The notice belongs to that
  frame for the same reason, and it earns its place here twice over: a stale
  link is one of the ways somebody arrives still expecting the 1.x API.

  Passed bare rather than wrapped in `.site-top`, which is the home page's box
  for grouping the notice with the Product Hunt badge beside it. There is
  nothing to group with here, and the class carries no styles of its own.
*/
function NotFound() {
  return (
    <HomeTemplate
      top={<Announcement />}
      header={<Header />}
      content={
        <PageContent className="content not-found">
          {/*
            `width` and `height` are the file's own 1142x1377. They are what
            stops the text below jumping up the page while the PNG downloads:
            the browser reserves the box from the ratio before a byte of the
            image arrives.
          */}
          <img
            className="not-found__mascot"
            src="/images/mascot/scenes/where-am-i.png"
            width="1142"
            height="1377"
            alt="The Gerillass ninja looking up from an open map, asking where am I."
          />
          <h2 className="not-found__title">This page moved, or never existed.</h2>
          <p className="not-found__lede">
            The documentation moved here from <code>docs.gerillass.com</code>. A
            link from elsewhere may still point at the old address.
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
