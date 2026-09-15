import React, { Component, Suspense, lazy } from "react";
import { Link } from "react-router-dom";

import ClientOnly from "components/ClientOnly";
import { loadModule } from "../../staleModule";
import { VERSION } from "release";
import { demos, compiler } from "virtual:live-playground-demos";

/*
  CodeMirror's own theme has to be loaded before playground.scss, which
  recolours the same classes at the same specificity. This section is in the
  home page's bundle and the full playground loads later, so without this line
  the playground's import of codemirror.css landed after playground.scss and
  put back CodeMirror's blue, red and green on the playground's editors.
*/
import "codemirror/lib/codemirror.css";
import "components/Playground/playground.scss";
import "./live-playground.scss";

/*
  The playground on the home page, as a demonstration rather than an editor:
  Sass is typed out on the left, the CSS it compiles to appears on the right,
  and it moves on through a handful of mixins. Trying it yourself is the full
  playground's job, one click away.

  Nothing is compiled in the browser. plugins/live-playground-demos.js compiles
  the demos while the site is built, so Dart Sass never reaches the home page.

  The animation needs CodeMirror's tokenizer, which is not worth putting in the
  home page's first request, so it loads when the section comes near the
  screen. Until then, and in the prerendered HTML, the first demo is shown
  finished and in plain text on the same metrics, so nothing moves when the
  animation takes over.
*/
const Showcase = lazy(() => loadModule(() => import("./Showcase")));

/* How far below the fold the animation starts loading. */
const LOAD_MARGIN = "600px";

function PlainCode({ text }) {
  return (
    <pre className="live-playground__code">
      {text.split("\n").map((line, row) => (
        <span className="live-playground__line" key={row}>
          <span className="live-playground__gutter">{row + 1}</span>
          <span>{line}</span>
        </span>
      ))}
    </pre>
  );
}

function Placeholder() {
  const demo = demos[0];
  return (
    <div
      className="live-playground__panes"
      role="img"
      aria-label={`The ${demo.title} mixin written in Sass, and the CSS Gerillass compiles it to.`}
    >
      <div className="playground__editor" aria-hidden="true">
        <div className="playground__editor__bar">
          <span className="playground__pane__title">Sass</span>
        </div>
        <PlainCode text={demo.source} />
      </div>
      <div className="playground__editor playground__editor--output" aria-hidden="true">
        <div className="playground__editor__bar">
          <span className="playground__pane__title">CSS</span>
        </div>
        <PlainCode text={demo.css} />
      </div>
    </div>
  );
}

class LivePlayground extends Component {
  constructor(props) {
    super(props);
    this.state = { isNear: false };
    this.ref = React.createRef();
  }

  componentDidMount() {
    if (!("IntersectionObserver" in window)) {
      this.setState({ isNear: true });
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.observer.disconnect();
          this.setState({ isNear: true });
        }
      },
      { rootMargin: `${LOAD_MARGIN} 0px` }
    );
    if (this.ref.current) this.observer.observe(this.ref.current);
  }

  componentWillUnmount() {
    if (this.observer) this.observer.disconnect();
  }

  render() {
    const { isNear } = this.state;
    return (
      <section
        className="live-playground section section--stretched"
        ref={this.ref}
      >
        <div className="section__inner">
          <div className="live-playground__figure">
            <img
              src="/images/mascot/scenes/our-playground-hey.png"
              alt="Our playground. Your rules."
              width="1377"
              height="1142"
              loading="lazy"
            />
          </div>

          <div className="section__header">
            <h2 className="section__title">Sass in, CSS out</h2>
            <p className="section__description">
              A few mixins, written out on the left, and the CSS Gerillass
              generates from each of them on the right.
            </p>
          </div>
        </div>

        {/* Outside the inner column, so the panes run as wide as the header. */}
        <ClientOnly fallback={<Placeholder />}>
          {() =>
            isNear ? (
              <Suspense fallback={<Placeholder />}>
                <Showcase demos={demos} />
              </Suspense>
            ) : (
              <Placeholder />
            )
          }
        </ClientOnly>

        <div className="section__inner">
          <p className="live-playground__note">
            Compiled with {compiler} against Gerillass v{VERSION}.
          </p>

          <div className="section__cta">
            <div className="section__cta__form">
              <Link
                to="/playground"
                className="section__cta__button button button--primary button--large"
              >
                Open the Playground
              </Link>
            </div>
            <p className="section__cta__description">Every mixin, every release</p>
          </div>
        </div>
      </section>
    );
  }
}

export default LivePlayground;
