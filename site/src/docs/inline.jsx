import React from "react";

/*
  The small amount of markup an attribute is allowed to carry.

  A caption or a footnote reaches its component as a string, and a string
  rendered by React is text: `<code>$gutter</code>` written into one shows up
  on the page as those characters, angle brackets and all. That is what the
  ported pages were doing on 47 of them, because the Hugo shortcodes they came
  from took the same prose as an attribute and ran it through a Markdown filter
  on the way out.

  So the attributes keep their Markdown and it is rendered here: backticks,
  bold and links, which is what these captions use. Anything longer than a
  sentence belongs in the page body rather than in an attribute.

  Links were the third of those and were missing, so six footnotes printed
  `See the [examples](#examples) for more.` with the brackets showing. A link
  inside the site goes through the router the way the prose ones do; a bare
  fragment stays an anchor, since it is a jump within the page.
*/
import DocLink from "./DocLink";

const PATTERN = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

export default function inline(text) {
  if (!text) return null;

  const out = [];
  let last = 0;
  let key = 0;
  let match;

  // A fresh regex per call: the pattern is global, so sharing one across a
  // page would carry lastIndex from one caption into the next.
  const pattern = new RegExp(PATTERN.source, "g");

  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));

    if (match[3] !== undefined) {
      out.push(
        <DocLink key={key++} href={match[4]}>
          {inline(match[3])}
        </DocLink>
      );
    } else if (match[1] !== undefined) {
      // Code is literal all the way down: backticks win, and nothing inside
      // them is markup.
      out.push(<code key={key++}>{match[1]}</code>);
    } else {
      /*
        Bold recurses. `**the `$fill` argument**` is one bold run containing a
        code span, and matching the bold first swallows the backticks whole --
        which put them on the page as characters until this recursed.
      */
      out.push(<strong key={key++}>{inline(match[2])}</strong>);
    }

    last = pattern.lastIndex;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}
