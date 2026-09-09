import React from "react";
import { Link } from "react-router-dom";

import { pages } from "virtual:docs-index";
import useDocumentHead from "docs/useDocumentHead";
import { INDEX_FRONTMATTER } from "docs/head";
import DocsTemplate from "templates/DocsTemplate";

import "./docs-index.scss";

/*
  The landing page of the documentation: every member, with what it does.

  Nothing here is written by hand. The titles come from the pages and the
  summaries from gerillass.json, which the library's own test suite compiles
  and snapshots, so this page cannot describe a mixin the library does not
  have or describe one differently from the manifest.
*/

const GROUPS = [
  {
    kind: "mixin",
    label: "Mixins",
    blurb: "Included with @include, and named in kebab-case.",
  },
  {
    kind: "function",
    label: "Utilities",
    blurb: "Called like any Sass function, and named in camelCase.",
  },
];

function DocsIndex() {
  useDocumentHead(INDEX_FRONTMATTER, "/docs/");

  return (
    <DocsTemplate>
      <h1>Documentation</h1>
      <p className="docs-index__lede">
        {pages.length} pages, one for every mixin and function in the library.
        Each shows what the member does, the arguments it takes, and the CSS it
        emits, compiled from the Sass beside it rather than written out by hand.
      </p>

      {GROUPS.map(({ kind, label, blurb }) => {
        const group = pages.filter((page) => page.kind === kind);

        return (
          <section className="docs-index__group" key={kind}>
            <h2>
              {label} <span className="docs-index__count">{group.length}</span>
            </h2>
            <p className="docs-index__blurb">{blurb}</p>

            <ul className="docs-index__list">
              {group.map((page) => (
                <li className="docs-index__item" key={page.slug}>
                  <Link className="docs-index__link" to={`/docs/${page.slug}`}>
                    {page.title}
                  </Link>
                  <span className="docs-index__summary">{page.summary}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </DocsTemplate>
  );
}

export default DocsIndex;
