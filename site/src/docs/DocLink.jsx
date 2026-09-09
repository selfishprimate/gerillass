import React from "react";
import { Link } from "react-router-dom";

/*
  A link written in Markdown.

  Left alone, every one of them is an <a>, so a link from one documentation
  page to another reloaded the whole application to reach a page the router
  already had. Anything pointing inside the site goes through the router
  instead; anything pointing out keeps the attributes an outbound link needs.
*/
const INTERNAL = /^\/(?!\/)/;

function DocLink({ href = "", children, ...rest }) {
  if (INTERNAL.test(href)) {
    return (
      <Link to={href} {...rest}>
        {children}
      </Link>
    );
  }

  // A bare fragment stays an anchor: it is a jump within this page.
  if (href.startsWith("#")) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}

export default DocLink;
