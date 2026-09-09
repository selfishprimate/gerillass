import React, { useCallback, useEffect, useRef, useState } from "react";

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
`;

function Example({ source, css, html, title, height = 160 }) {
  const [measured, setMeasured] = useState(null);
  const frame = useRef(null);

  /*
    The frame is left same-origin so its height can be read back and the box
    sized to what it actually holds; a fixed height either crops a demo or
    leaves a gap under it. `allow-same-origin` alone is the whole sandbox:
    scripts, forms and navigation stay blocked, and the only thing inside is
    CSS this repository compiled.
  */
  const measure = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    // body.scrollHeight, not documentElement's box: the html element fills the
    // frame it is given, so measuring it reports the height already set and
    // the box never grows to its content.
    const h = Math.ceil(doc.body.scrollHeight);
    if (h > 0) setMeasured(h);
  }, []);

  /*
    Measured after mount as well as on load. The page is prerendered, so on a
    first visit the frame has already loaded by the time React attaches its
    onLoad and the event never arrives. Two measurements are cheap; a frame
    stuck at its default height is not.
  */
  useEffect(() => {
    measure();
  }, [measure]);

  const srcDoc = `<!doctype html><html><head><meta charset="utf-8"><style>${FRAME_BASE}${css}</style></head><body>${html}</body></html>`;

  return (
    <figure className="example">
      {title ? <figcaption className="example__title">{title}</figcaption> : null}

      <div className="example__panes">
        <div className="example__pane">
          <div className="example__label">Sass</div>
          <pre className="example__code">
            <code>{source}</code>
          </pre>
        </div>

        <div className="example__pane">
          <div className="example__label">CSS</div>
          <pre className="example__code">
            <code>{css}</code>
          </pre>
        </div>
      </div>

      <div className="example__result">
        <div className="example__label">Result</div>
        <iframe
          ref={frame}
          className="example__frame"
          style={{ height: `${measured ?? height}px` }}
          title={title ? `${title}, rendered` : "Rendered example"}
          sandbox="allow-same-origin"
          onLoad={measure}
          srcDoc={srcDoc}
        />
      </div>
    </figure>
  );
}

export default Example;
