import React from "react";

import Example from "docs/Example";

import resetCss from "docs/examples/reset-css.scss?example";
import breakpointer from "docs/examples/breakpointer.scss?example";
import textSelection from "docs/examples/text-selection.scss?example";
import loadify from "docs/examples/loadify.scss?example";

/*
  A holding page for /docs while the documentation is built, and the proof that
  the example renderer works.

  These four are here rather than four prettier ones because they are the four
  that break a naive renderer: each emits CSS belonging to a whole document, so
  each would damage this page if the demo were not in a frame of its own.
*/
function Docs() {
  return (
    <div className="main-container">
      <div className="main-wrapper">
        <div className="content">
          <h1>Examples, rendered</h1>
          <p>
            Each block shows the Sass as written, the CSS the library actually
            compiles it to, and the result running. The two code blocks are
            halves of one compilation, so neither can drift from the other.
          </p>
          <p>
            All four mixins below emit document-wide CSS. Were the demos not
            each in a frame of their own, this page would lose its styling, gain
            a breakpoint label, and have its text selection restyled.
          </p>

          <Example
            title="@include reset-css"
            source={resetCss.source}
            css={resetCss.css}
            height={190}
            html={'<h1>A heading</h1><p>A paragraph, with a <a href="#">link</a> in it.</p><ul><li>First</li><li>Second</li></ul>'}
          />

          <Example
            title="@include breakpointer"
            source={breakpointer.source}
            css={breakpointer.css}
            height={110}
            html={'<p>The label is drawn by the mixin, into <code>body::before</code>.</p>'}
          />

          <Example
            title="@include text-selection"
            source={textSelection.source}
            css={textSelection.css}
            height={110}
            html={'<p>Select this sentence to see the colours the mixin sets. The page around the frame is unaffected.</p>'}
          />

          <Example
            title="@include loadify"
            source={loadify.source}
            css={loadify.css}
            height={190}
            html={'<div class="card">First</div><div class="card">Second</div><div class="card">Third</div>'}
          />
        </div>
      </div>
    </div>
  );
}

export default Docs;
