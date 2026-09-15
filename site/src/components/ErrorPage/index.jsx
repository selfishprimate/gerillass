import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Announcement from "components/Announcement";
import Header from "components/Header";
import SiteFooter from "components/SiteFooter";
import PageContent from "components/PageContent";
import HomeTemplate from "templates/HomeTemplate";

import "components/NotFound/not-found.scss";

/*
  What renders when a page throws, in place of React Router's bare
  "Unexpected Application Error". It is the 404's frame and layout, the
  announcement band included, because a page with no header reads as a broken
  site rather than a broken page.

  It sits on the root route, so it replaces the whole shell rather than the
  outlet inside it. A wrapper route without a path would have kept the shell,
  but scripts/prerender.mjs builds file names from every route's path, and a
  route with none would have sent its children to /undefined.

  It cannot be hidden instead: this is the only thing the router has to show
  when a page fails to render, and without it a real error in production would
  be an empty page.

  The error's own message is not shown. The console already carries it for
  whoever is developing, and on the page it only sat between the sentence and
  the buttons telling a visitor nothing.

  On the dev server it closes itself. Editing a file in several saves can load
  a module mid-edit that throws, and the router keeps showing its error after
  the next save has fixed it, since an error boundary only resets on
  navigation. So each hot update navigates to the same address again, and a
  transient error lasts until the next save rather than until a manual reload.
*/
function ErrorPage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!import.meta.hot) return undefined;
    const retry = () =>
      navigate(location.pathname + location.search + location.hash, {
        replace: true,
      });
    import.meta.hot.on("vite:afterUpdate", retry);
    return () => import.meta.hot.off("vite:afterUpdate", retry);
  }, [location, navigate]);

  return (
    <HomeTemplate
      top={<Announcement />}
      header={<Header />}
      content={
        <PageContent className="content not-found">
          <img
            className="not-found__mascot"
            src="/images/mascot/scenes/oops.png"
            width="1312"
            height="1199"
            alt="The Gerillass ninja saying oops, next to a question mark."
          />
          <h2 className="not-found__title">Something broke on this page.</h2>
          <p className="not-found__lede">
            It is our fault, not yours. Reloading usually brings it back; if it
            does not, the rest of the site still works.
          </p>

          <div className="not-found__ways">
            <button
              type="button"
              className="button button--primary button--large"
              onClick={() => window.location.reload()}
            >
              Reload the page
            </button>
            <Link
              className="button button--primary button--large button--outlined"
              to="/"
            >
              Home page
            </Link>
          </div>
        </PageContent>
      }
      footer={<SiteFooter />}
    />
  );
}

export default ErrorPage;
