import React from "react";
import { MDXProvider } from "@mdx-js/react";

import CodeBlock from "components/CodeBlock";
import Example from "./Example";
import Member from "./Member";
import Arguments, { Argument } from "./Arguments";
import Hint from "./Hint";

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

const components = {
  Example,
  Member,
  Arguments,
  Argument,
  Hint,

  h1: heading(2, "docs-title"),
  h2: heading(3),
  h3: heading(4),
  h4: heading(5),
  h5: heading(6),

  // A fenced block. Mapping `pre` rather than `code` keeps inline code alone,
  // which is a different thing and styled as one.
  pre: CodeBlock,
};

function DocsMdx({ children }) {
  return <MDXProvider components={components}>{children}</MDXProvider>;
}

export default DocsMdx;
