import React from "react";
import { MDXProvider } from "@mdx-js/react";

import CodeBlock from "components/CodeBlock";
import Example from "./Example";
import Member from "./Member";
import Arguments, { Argument } from "./Arguments";
import Hint from "./Hint";
import DocLink from "./DocLink";
import { CodeIcon, EditIcon } from "components/Icons";
import { DocsLinksContext, useDocsLinks } from "./links";

/*
  The components an .mdx page can use without importing them, and what the
  plain Markdown in a page turns into. A page is content, so it carries neither
  a list of imports before its first sentence nor any markup of its own.
*/

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
  The page title, and opposite it the two ways out of the page: the member's
  source, and the markdown of the page itself.

  They were a bordered block at the end of the member's description, which put
  the loudest thing on the opening screen between the description and the first
  example -- in the reading order, for something nobody reads in order.

  The links are siblings of the heading rather than children of it: in there
  they would be read out as part of the page's name.
*/
function Title({ children, ...rest }) {
  const links = useDocsLinks();

  return (
    <div className="docs-titlebar">
      <h2 id={slug(children)} className="docs-title" {...rest}>
        {children}
      </h2>

      {links?.source || links?.edit ? (
        <div className="docs-titlebar__links">
          {links.source ? (
            <a
              className="docs-iconlink"
              href={links.source}
              target="_blank"
              rel="noopener noreferrer"
              title="Read this member's source"
              aria-label="Read this member's source"
            >
              <CodeIcon size={18} />
            </a>
          ) : null}

          {links.edit ? (
            <a
              className="docs-iconlink"
              href={links.edit}
              target="_blank"
              rel="noopener noreferrer"
              title="Edit this page on GitHub"
              aria-label="Edit this page on GitHub"
            >
              <EditIcon size={18} />
            </a>
          ) : null}
        </div>
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

function DocsMdx({ links = null, children }) {
  return (
    <DocsLinksContext.Provider value={links}>
      <MDXProvider components={components}>{children}</MDXProvider>
    </DocsLinksContext.Provider>
  );
}

export default DocsMdx;
