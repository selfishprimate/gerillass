import React, { createContext, useContext } from "react";
import { MDXProvider } from "@mdx-js/react";

import CodeBlock from "components/CodeBlock";
import Example from "./Example";
import Member from "./Member";
import Arguments, { Argument } from "./Arguments";
import Hint from "./Hint";
import DocLink from "./DocLink";

/*
  The components an .mdx page can use without importing them, and what the
  plain Markdown in a page turns into. A page is content, so it carries neither
  a list of imports before its first sentence nor any markup of its own.
*/

/*
  Where the page's source is, for the title row to link to. It travels by
  context because the title is written in the page as `#`, so what renders it
  is this file, while what knows which member the page documents is the route.
*/
const SourceContext = createContext(null);

const slug = (node) =>
  text(node)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

function text(node) {
  if (node === null || node === undefined || node === false) return "";
  if (Array.isArray(node)) return node.map(text).join("");
  if (typeof node === "object") return text(node.props?.children);
  return String(node);
}

/*
  Headings move down one level. The page's own title is written as `#` because
  that is what a Markdown document does, but the site already has an h1 on
  every page: the logo in the header. Two of them on one page leaves a screen
  reader with no single answer to what the page is, and the outline it reads
  out has two competing roots.

  They also get an id, which nothing else was giving them, so a link to a
  section of a page has something to land on.
*/
function heading(level, className) {
  const Tag = `h${level}`;
  return function Heading({ children, ...rest }) {
    return (
      <Tag id={slug(children)} className={className} {...rest}>
        {children}
      </Tag>
    );
  };
}

/*
  The page title, with a way to the source beside it.

  The link used to be a bordered block at the end of the member's description,
  where it was the loudest thing on the opening screen and sat between the
  description and the first example. Reading the source is what somebody does
  after reading the page, or instead of it -- either way it is a destination,
  not a step, so it belongs in the furniture at the top rather than in the
  reading order.

  The link is a sibling of the heading rather than inside it: in there it would
  be read out as part of the page's name.
*/
function Title({ children, ...rest }) {
  const href = useContext(SourceContext);

  return (
    <div className="docs-titlebar">
      <h2 id={slug(children)} className="docs-title" {...rest}>
        {children}
      </h2>

      {href ? (
        <a
          className="docs-source"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          title="Read this member's source on GitHub"
        >
          {/* Gerillass's own icon font, the same one the header's links use. */}
          <i className="gls-github" aria-hidden="true"></i>
          Source Code
        </a>
      ) : null}
    </div>
  );
}

const components = {
  Example,
  Member,
  Arguments,
  Argument,
  Hint,

  h1: Title,
  h2: heading(3),
  h3: heading(4),
  h4: heading(5),
  h5: heading(6),

  /*
    A fenced block. Mapping `pre` rather than `code` keeps inline code alone,
    which is a different thing and styled as one. The fence's language becomes
    the label inside the block, so a reader can tell Sass from CSS from markup
    without the page saying so in prose.
  */
  pre: Fence,

  a: DocLink,
};

const LANGUAGE_NAMES = { scss: "Sass", css: "CSS", html: "HTML", js: "JavaScript", json: "JSON", bash: "Terminal", text: null, nix: "Terminal" };

function Fence(props) {
  const lang = String(props.children?.props?.className || "").match(/language-([\w-]+)/)?.[1];
  const label = lang ? (lang in LANGUAGE_NAMES ? LANGUAGE_NAMES[lang] : lang.toUpperCase()) : null;
  return <CodeBlock label={label} {...props} />;
}

function DocsMdx({ source = null, children }) {
  return (
    <SourceContext.Provider value={source}>
      <MDXProvider components={components}>{children}</MDXProvider>
    </SourceContext.Provider>
  );
}

export default DocsMdx;
