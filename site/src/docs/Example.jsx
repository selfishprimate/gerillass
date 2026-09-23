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
  .list-wrapper { display: flex; gap: 10px; }
  .list-wrapper .list-item {
    flex: 1;
    height: 56px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f2f2eb;
    border-radius: 12px;
    color: #657167;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  @media (min-width: 480px) {
    .list-wrapper .list-item { height: 72px; font-size: 1.25em; }
  }

  .text-shadow-container { height: 100px; display: flex; align-items: center; }
`;

/*
  What each demo measured, by the document it renders. A frame starts at 160px
  and grows to what it holds once srcDoc has been parsed, which on a page of
  eleven demos lands a quarter of a second after the page does: every box on
  the page changes height at once and the reader sees the page jump. A demo
  seen once in this session starts at the height it had, so going back to a
  page, or between two that share a demo, moves nothing.

  A module variable rather than state: it belongs to the session, not to a
  component that is mounted again on every navigation.
*/
const heights = new Map();

function Example({ source, css, html, listing, title, caption, hint, height, interactive = false, resizable = false }) {
  const [measured, setMeasured] = useState(null);
  const frame = useRef(null);

  /*
    A demo whose subject is the width of the viewport shows one width of it in
    a frame of one width. The frame is its own viewport, so a page can mark an
    example `resizable` and the result box takes a drag handle: the media
    queries inside answer the box rather than the window.
  */

  // Re-attach the observer when the demo itself changes, not on every render.
  const rendered = html;
  const srcDocKey = css + String(rendered);
  const remembered = heights.get(srcDocKey) ?? null;

  /*
    The frame is left same-origin so its height can be read back and the box
    sized to what it actually holds; a fixed height either crops a demo or
    leaves a gap under it. `allow-same-origin` alone is the whole sandbox:
    scripts, forms and navigation stay blocked, and the only thing inside is
    markup and CSS this repository compiled.

    Nothing here can be driven by the reader except by the browser's own
    behaviour, and all three ways round it were measured on 21 September 2026
    while the `reveal` page was written. A demo's own script is blocked twice
    over, by this sandbox and by the site's `script-src`. A `:target` link
    navigates the srcdoc document and replaces it. And `allow-forms`, which a
    `<dialog>` needs to close through `<form method="dialog">`, cannot be
    turned on for everything: six pages carry a demo form with
    `onsubmit="return false"`, a handler `script-src` blocks, so with forms
    allowed they would submit on Enter and navigate the frame away. What is
    left is what the browser does on its own, `popovertarget` above all, and
    that is what the demos are written with.
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
  /*
    The reader is kept on a ref as well, because the drag handle below needs
    it. A demo held to a ratio is exactly as tall as it is wide divided by the
    ratio, so narrowing the box without reading the frame again leaves the
    frame at the height it had when it was wide: a 456px box around a 200px
    card. Nothing else tells us the width changed -- `window.resize` does not
    fire for a box a reader drags.
  */
  const reread = useRef(null);

  useEffect(() => {
    const el = frame.current;
    if (!el) return undefined;

    const read = () => {
      const body = el.contentDocument?.body;
      if (!body) return;
      const h = Math.ceil(body.scrollHeight);
      if (h > 0) {
        heights.set(srcDocKey, h);
        setMeasured(h);
      }
    };
    reread.current = read;

    /*
      Read on every frame until the demo has a height, rather than waiting for
      the next timer. srcDoc is parsed off the main thread's critical path, so
      on a page of eleven demos the first reading that finds a body is a
      quarter of a second after the page arrives; a frame callback catches it
      as soon as it is there.
    */
    let frames = 0;
    let raf = 0;
    const poll = () => {
      read();
      if (++frames < 30 && !heights.has(srcDocKey)) raf = requestAnimationFrame(poll);
    };
    poll();

    el.addEventListener("load", read);
    window.addEventListener("resize", read);
    const timers = [250, 800, 2000].map((ms) => setTimeout(read, ms));

    return () => {
      cancelAnimationFrame(raf);
      reread.current = null;
      el.removeEventListener("load", read);
      window.removeEventListener("resize", read);
      timers.forEach(clearTimeout);
    };
  }, [srcDocKey]);

  /*
    A link in a demo must not navigate the frame. A srcdoc document takes its
    base URL from this page, so `href="#content"` resolves to
    `/docs/hide#content`: activating a skip link loaded the whole site into
    the frame, where scripts are off, and the result read "You need to enable
    JavaScript to run this app". A base of `about:srcdoc` would keep fragments
    in the frame but break every `/images/...` path the demos use.

    So the click is handled from here, which the same-origin sandbox allows.
    Enter on a focused link fires the same click. A fragment moves focus to
    its target, as a skip link does, and every other link does nothing.
  */
  useEffect(() => {
    const el = frame.current;
    if (!el) return undefined;

    let doc = null;
    const onClick = (event) => {
      const link = event.target.closest?.("a[href]");
      if (!link) return;
      event.preventDefault();
      const href = link.getAttribute("href");
      if (!href.startsWith("#") || href.length < 2) return;
      const target = doc.getElementById(decodeURIComponent(href.slice(1)));
      if (!target) return;
      target.scrollIntoView({ block: "nearest" });
      target.focus({ preventScroll: true });
    };
    const attach = () => {
      const next = el.contentDocument;
      if (!next || next === doc) return;
      doc?.removeEventListener("click", onClick);
      doc = next;
      doc.addEventListener("click", onClick);
    };

    attach();
    el.addEventListener("load", attach);

    return () => {
      el.removeEventListener("load", attach);
      doc?.removeEventListener("click", onClick);
    };
  }, [srcDocKey]);

  const frameHeight = Math.max(measured ?? remembered ?? 160, height ?? 0);

  /*
    The right edge, dragged. CSS `resize` puts a grabber in the corner and
    nowhere else, and the corner is a small target for a box a reader is meant
    to play with, so the edge is a strip of its own: it sets the box's width
    directly and the corner keeps working beside it.
  */
  const box = useRef(null);
  const dragEdge = (event) => {
    const el = box.current;
    if (!el) return;
    event.preventDefault();
    const start = event.clientX;
    const from = el.getBoundingClientRect().width;
    const room = el.parentElement ? el.parentElement.getBoundingClientRect().width : from;
    /*
      The frame is read again as the box moves, on a frame callback so a fast
      drag does not ask for a dozen readings between two paints. The last
      reading is taken after the pointer is up as well: the demo may still be
      settling on the final width.
    */
    let pending = 0;
    const measure = () => {
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        reread.current?.();
      });
    };
    const follow = (move) => {
      const next = Math.max(280, Math.min(room, from + (move.clientX - start)));
      el.style.width = `${Math.round(next)}px`;
      measure();
    };
    const stop = () => {
      window.removeEventListener("pointermove", follow);
      window.removeEventListener("pointerup", stop);
      document.body.classList.remove("is-resizing-example");
      cancelAnimationFrame(pending);
      reread.current?.();
    };
    document.body.classList.add("is-resizing-example");
    window.addEventListener("pointermove", follow);
    window.addEventListener("pointerup", stop);
  };

  const srcDoc =`<!doctype html><html><head><meta charset="utf-8"><style>${FRAME_BASE}${css}</style></head><body>${rendered}</body></html>`;

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
      {/*
        A demo whose subject is the width of the viewport cannot show anything
        in a frame of one fixed width: adaptive steps its container at every
        breakpoint and a reader would see one step of it. A page marks such an
        example `resizable`, and the result box takes a drag handle: the frame
        is its own viewport, so the media queries inside it answer the box
        rather than the window. The handle is a strip laid over the frame's
        right edge; CSS `resize` puts a grabber in the corner and nowhere else.

        The line above it says what to watch for, and a page can write its own
        with `hint`: what changes with the width is the point of the example,
        and it is not the same thing twice on two different pages.
      */}
      {rendered && resizable ? (
        <p className="example__hint">{inline(hint || "See the changes by resizing the box below.")}</p>
      ) : null}

      {rendered ? (
      <div
        className={`example__result${resizable ? " example__result--resizable" : ""}`}
        ref={resizable ? box : undefined}
      >
        <div className="example__label">Result</div>
        {resizable ? (
          <span
            className="example__grip"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize the result box"
            onPointerDown={dragEdge}
          />
        ) : null}
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
          style={{ height: `${frameHeight}px` }}
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
