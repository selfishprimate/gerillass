import React from "react";

import Footer from "components/Footer";
import FooterInvitation from "components/Invitations/FooterInvitation";
import Copyright from "components/Copyright";

/*
  The foot of every page: the dark footer with its two ornaments, the Slack
  invitation under it, and the copyright line.

  It is one component because it is three parts that only work together. The
  documentation had two of them copied across and left the invitation out, and
  the footer pulls itself up by 10rem to tuck under whatever precedes it, so
  what it tucked under instead was the last example on the page.
*/
function SiteFooter() {
  return (
    <div className="footer-container section section--stretched">
      <Footer />
      <FooterInvitation />
      <Copyright />
    </div>
  );
}

export default SiteFooter;
