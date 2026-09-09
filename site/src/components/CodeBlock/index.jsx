import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { zenburn } from "react-syntax-highlighter/dist/esm/styles/hljs";

import "./code-block.scss";

/*
  Every block of code on the site, highlighted the same way.

  There was one of these on the landing page, written out at each of its six
  call sites, and none in the documentation, where a fenced block rendered as
  unstyled text. That is what made a listing of demo markup look like output
  that had failed to render rather than like a listing.

  It takes its language either as a prop or from the `language-*` class MDX
  puts on a fenced block, so the same component answers a hand-written call and
  a Markdown fence.
*/

const FROM_CLASS = /language-([\w-]+)/;

function CodeBlock({ language, children, className, ...rest }) {
  const fromClass = className?.match(FROM_CLASS)?.[1];

  /*
    MDX hands a fence over as <pre><code class="language-scss">{string}</code>,
    so when this is mapped onto `pre` the real content is one element down.
  */
  const inner =
    React.isValidElement(children) && children.props?.children !== undefined
      ? children.props
      : { children, className };

  const source = String(inner.children ?? "").replace(/\n$/, "");
  const lang = language || inner.className?.match(FROM_CLASS)?.[1] || fromClass || "text";

  return (
    <div className="code-block">
      <SyntaxHighlighter language={lang} style={zenburn} wrapLines {...rest}>
        {source}
      </SyntaxHighlighter>
    </div>
  );
}

export default CodeBlock;
