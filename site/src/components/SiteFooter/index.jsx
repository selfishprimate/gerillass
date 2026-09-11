import React from "react";

import Footer from "components/Footer";
import Copyright from "components/Copyright";

/*
  The foot of every page: the credit line, then the dark block of links under
  it, which is the last thing on the page.

  The Slack invitation used to sit between them. The component is still in
  `components/Invitations/FooterInvitation`, unused.
*/
function SiteFooter() {
  return (
    <div className="footer-container section section--stretched">
      <Copyright />
      <Footer />
    </div>
  );
}

export default SiteFooter;
