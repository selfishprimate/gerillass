import React, { useEffect, useRef, useState } from "react";
import inline from "./inline";
import CodeBlock from "components/CodeBlock";

import "./example.scss";

/*
  One documented example: the Sass somebody would write, the CSS it compiles
  to, and the result running.

  `source` and `css` come from a `?example` import, so they are two halves of
  one compilation rather than a block of code and a block of output that
  happen to sit near each other. See plugins/sass-example.js.

  The demo runs in an iframe, and that is not tidiness. Some mixins emit CSS
  that belongs to a whole document and would take this page with it, measured
  rather than assumed:

    reset-css        html, body, div, span, ... — flattens the page
    breakpointer     body::before { content: "xsmall" } — writes into the page
    text-selection   ::selection — restyles selection everywhere

  Scoping the selectors instead does not save it. `body::before` cannot be
  rewritten to sit inside a container.
*/

const FRAME_BASE = `
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; padding: 16px; font: 15px/1.5 Inter, ui-sans-serif, system-ui, sans-serif; color: #2f3937; background: #fff; }
  img { max-width: 100%; }

  /*
    A caption is a caption, not the picture's last row of pixels. The figure's
    own margin is deliberately left alone -- zeroing it is what the reset-figure
    mixin is demonstrating, and a base rule doing it first would leave that
    demo with nothing to show.
  */
  figcaption { margin-top: 10px; }

  /*
    The demo surface the documentation has always used. A mixin like center or
    position needs a box with a height before there is anything to see, and the
    pages being ported here mark that box \`sandbox\` with a size beside it.
    Carrying the four rules over is what lets those demos render unchanged.
  */
  .sandbox { margin-bottom: 24px; border-radius: 6px; }
  .sandbox.xsmall { height: 50px; }
  .sandbox.small { height: 100px; }
  .sandbox.medium { height: 150px; }
  .sandbox.large { height: 200px; }
  .sandbox.xlarge { height: 300px; }
  .sandbox.xxlarge { height: 400px; }
  .sandbox.text { font-size: 3em; margin: 0; }

  /*
    The other demo furniture the old documentation carried in its own
    stylesheet rather than on the page: the row of numbered boxes that except,
    only and their neighbours are demonstrated on. Without it those demos are a
    column of bare numerals, which is what they had become.

    The two margins that came with these rules are left out. They separated one
    demo from the next on a page where the demos sat inline; here each one has
    a frame to itself and a 10rem margin only makes the frame taller.
  */
  .list-wrapper { display: flex; }
  .list-wrapper .list-item {
    flex: 1;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #eef2f3;
    border-radius: 5px;
  }
  .list-wrapper .list-item:not(:last-of-type) { margin-right: 1rem; }
  @media (min-width: 480px) {
    .list-wrapper .list-item { height: 70px; font-size: 2em; }
  }

  .text-shadow-container { height: 100px; display: flex; align-items: center; }
`;

function Example({ source, css, html, listing, title, caption, height, interactive = false }) {
  const [measured, setMeasured] = useState(null);
  const frame = useRef(null);

  // Re-attach the observer when the demo itself changes, not on every render.
  const rendered = html;
  const srcDocKey = css + String(rendered);

  /*
    The frame is left same-origin so its height can be read back and the box
    sized to what it actually holds; a fixed height either crops a demo or
    leaves a gap under it. `allow-same-origin` alone is the whole sandbox:
    scripts, forms and navigation stay blocked, and the only thing inside is
    CSS this repository compiled.
  */
  /*
    Watched rather than measured once. A frame grows after it is first laid
    out -- an image inside it decodes, a font arrives, text reflows -- and a
    single reading catches it empty: the image demos came out 32px tall, which
    is the padding and nothing else.

    `body` is also the part that can be missing. A frame has a document from
    the moment it is in the tree, but srcDoc is parsed asynchronously, so on
    mount the document is often still empty. Reading through it threw, and the
    error boundary took the whole page down -- invisibly in the built HTML,
    because none of this runs during a server render.
  */
  /*
    Measured a few times rather than watched. A ResizeObserver was the obvious
    answer and does not work here: created in this document it attaches to the
    frame's body and never delivers a notification, and created from the
    frame's own realm it does the same. Seven observers attached, none fired.

    So: read the height once the frame has a body, then again as its content
    settles. `body` is the part that can be missing -- srcDoc is parsed
    asynchronously, and reading through it threw, which took the component down
    and the error boundary took the page with it. That was invisible in the
    built HTML, because none of this runs during a server render.

    The later readings are what catch an image. A demo is often a photograph
    held to a ratio, and at first paint it has no height at all: the box came
    out 160px tall around a 587px image without them.
  */
  useEffect(() => {
    const el = frame.current;
    if (!el) return undefined;

    const read = () => {
      const body = el.contentDocument?.body;
      if (!body) return;
      const h = Math.ceil(body.scrollHeight);
      if (h > 0) setMeasured(h);
    };

    read();
    el.addEventListener("load", read);
    window.addEventListener("resize", read);
    const timers = [60, 250, 800, 2000].map((ms) => setTimeout(read, ms));

    return () => {
      el.removeEventListener("load", read);
      window.removeEventListener("resize", read);
      timers.forEach(clearTimeout);
    };
  }, [srcDocKey]);

  const srcDoc = `<!doctype html><html><head><meta charset="utf-8"><style>${FRAME_BASE}${css}</style></head><body>${rendered}</body></html>`;

  return (
    <figure className="example">
      {title ? <figcaption className="example__title">{inline(title)}</figcaption> : null}
      {caption ? <p className="example__caption">{inline(caption)}</p> : null}

      <div className="example__panes">
        {/*
          Markup first, where the page wrote one, because it is what the Sass
          below is written against: a reader following the example needs to
          know what is being styled before reading the rules that style it.

          It is printed only where the page wrote a listing. Most examples
          carry markup purely so the demo has something to style, and putting
          that in front of a reader would offer scaffolding as though it were
          the answer.
        */}
        {listing ? <CodeBlock label="HTML" language="html">{listing}</CodeBlock> : null}
        <CodeBlock label="Sass" language="scss">{source}</CodeBlock>
        <CodeBlock label="CSS" language="css">{css}</CodeBlock>
      </div>

      {/*
        No demo, no Result. An example that is only a call and its output --
        a converter like remify, or a mixin whose effect is invisible in an
        empty box -- was showing an empty frame under a Result label, which
        reads as a demo that failed rather than as one that was never there.
      */}
      {rendered ? (
      <div className="example__result">
        <div className="example__label">Result</div>
        <iframe
          ref={frame}
          className="example__frame"
          /*
            A stated height is a floor, not a starting point. Measuring works
            for a demo that takes up room in the flow, and a `position: fixed`
            element takes up none: the body's scrollHeight is its padding, and
            the frame shrank to 32px around an element that filled it. A page
            demonstrating that says how tall the frame should be.
          */
          style={{ height: `${Math.max(measured ?? 160, height ?? 0)}px` }}
          title={title ? `${title}, rendered` : "Rendered example"}
          /*
            Scripts are off unless a demo asks for them. Only one kind does --
            an embed like YouTube, which is script-driven and renders nothing
            under a closed sandbox -- and a page opting in says so at the call
            site rather than the whole set being loosened for one case.
          */
          sandbox={interactive ? "allow-same-origin allow-scripts allow-presentation" : "allow-same-origin"}
          srcDoc={srcDoc}
        />
      </div>
      ) : null}
    </figure>
  );
}


export default Example;
