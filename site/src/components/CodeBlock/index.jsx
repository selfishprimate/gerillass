import React, { useCallback, useEffect, useRef, useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { zenburn } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { CopyIcon, CheckIcon } from "components/Icons";

import "./code-block.scss";

/*
  Every block of code on the site, highlighted the same way.

  It takes its language either as a prop or from the `language-*` class MDX
  puts on a fenced block, so the same component answers a hand-written call and
  a Markdown fence.

  The label sits inside the block rather than above it, and is opt-in: the
  documentation names each block, the landing page does not, and a "SCSS" chip
  appearing over the hero's examples would be a change to a page nobody asked
  to change. The copy button is on all of them.
*/

const FROM_CLASS = /language-([\w-]+)/;

/*
  What a page calls a language, and what the highlighter calls it.

  react-syntax-highlighter's hljs build lists the canonical names only -- no
  aliases -- and a name it does not know does not raise anything: it falls back
  to auto-detection. That is why the markup blocks looked wrong in a way no
  stylesheet explained. On one line `class` came out as an attribute and on the
  next as a tag name, and the class values were being split at every hyphen,
  because 160 fences marked `html` were never highlighted as markup at all.

  Left as the page wrote them: `html` is what an author types and what the
  label says, so the mapping belongs here rather than in the content.
*/
const HLJS_NAMES = { html: "xml", js: "javascript", text: "plaintext" };

function CodeBlock({ label, language, children, className, ...rest }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  /*
    MDX hands a fence over as <pre><code class="language-scss">{string}</code>,
    so when this is mapped onto `pre` the real content is one element down.
  */
  const inner =
    React.isValidElement(children) && children.props?.children !== undefined
      ? children.props
      : { children, className };

  const source = String(inner.children ?? "").replace(/\n$/, "");
  const named =
    language ||
    inner.className?.match(FROM_CLASS)?.[1] ||
    className?.match(FROM_CLASS)?.[1] ||
    "text";
  const lang = HLJS_NAMES[named] ?? named;

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // A denied or missing clipboard is not worth an error on the page: the
      // code is right there to select. The button simply does not confirm.
      setCopied(false);
    }
  }, [source]);

  return (
    <div className="code-block">
      <div className="code-block__bar">
        {label ? <span className="code-block__label">{label}</span> : null}
        {/*
          The same icon button the playground uses, down to the icons: two
          places on the site let you copy code and they should not be two
          different controls.
        */}
        <button
          type="button"
          className="code-block__copy"
          onClick={copy}
          title={copied ? "Copied" : "Copy to the clipboard"}
          aria-label={`Copy the ${label || named} to the clipboard`}
        >
          {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
        </button>
      </div>

      <SyntaxHighlighter language={lang} style={zenburn} wrapLines {...rest}>
        {source}
      </SyntaxHighlighter>
    </div>
  );
}

export default CodeBlock;
