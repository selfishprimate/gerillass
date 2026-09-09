import React from "react";

import DocsMdx from "docs/MdxProvider";
import useDocumentHead from "docs/useDocumentHead";
import DocsTemplate from "templates/DocsTemplate";

/*
  The frame every documentation page renders inside. The page itself arrives as
  a prop, compiled from markdown, so this component is the same for all of
  them and nothing here knows which member is being documented.

  The head comes from the page's own front matter. The build writes those same
  tags into the generated file through plugins/docs-head.js; this keeps them
  right when somebody moves between pages without a reload.
*/
function DocPage({ Page, frontmatter, slug }) {
  useDocumentHead(frontmatter, `/docs/${slug}/`);

  return (
    <DocsTemplate>
      <DocsMdx>
        <Page />
      </DocsMdx>
    </DocsTemplate>
  );
}

export default DocPage;
