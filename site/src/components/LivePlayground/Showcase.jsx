import React, { Component } from "react";
import CodeMirror from "codemirror";
import "codemirror/mode/css/css";
import "codemirror/addon/runmode/runmode";

/*
  Types a demo's Sass into the left pane as a person would, shows the CSS pane
  compiling for a moment, writes the CSS into it one line at a time, holds,
  and moves to the next demo. Nothing here compiles, the compiling included:
  the pairs arrive already built (plugins/live-playground-demos.js), and the
  loader is there because a playground is somewhere you wait for a compiler,
  and output that appears the instant the last key lands reads as pasted.

  Both panes are drawn with CodeMirror's tokenizer alone, through runMode, so
  the code carries the same cm-* classes as the full playground and picks up
  its colours from playground.scss, without an editor instance per keystroke.

  It opens on the first demo already written, which is what the server
  rendered, so the page does not blink from a finished snippet to an empty one
  when this takes over. With reduced motion asked for there is no typing and
  no loader: the demos are swapped whole on a slower beat.

  It stops while it cannot be seen, off screen or in a background tab, and
  resumes where it was.
*/

const LINE_DELAY = 70; // per line of CSS
const HOLD = 5000; // once the CSS is fully written, before the next demo
const STILL_HOLD = 5000; // a whole demo, with reduced motion
const AFTER_TYPING = 300; // between the last key and the loader
const COMPILING = 1100; // how long the loader turns

/*
  How long to wait before the next character, so it reads as typed by hand
  rather than printed at a fixed rate: an uneven gap between keys, a short
  pause after a statement or a brace, a longer one at the end of a line, and
  now and then a hesitation, the way somebody stops to think of a value.
*/
function keyDelay(previous) {
  let delay = 22 + Math.random() * 38;
  if (previous === "\n") delay += 110 + Math.random() * 90;
  else if (previous === ";" || previous === "{" || previous === "}") delay += 70;
  else if (previous === "(" || previous === ",") delay += 40;
  if (Math.random() < 0.03) delay += 150 + Math.random() * 150;
  return delay;
}

function highlight(text, mode) {
  const lines = [[]];
  CodeMirror.runMode(text, mode, (token, style) => {
    if (token === "\n") {
      lines.push([]);
      return;
    }
    lines[lines.length - 1].push({ token, style });
  });
  return lines;
}

function Code({ text, mode, caret }) {
  const lines = highlight(text, mode);
  return (
    <pre className="live-playground__code">
      {lines.map((tokens, row) => (
        <span className="live-playground__line" key={row}>
          <span className="live-playground__gutter">{row + 1}</span>
          <span>
            {tokens.map((part, i) =>
              part.style ? (
                <span
                  key={i}
                  className={part.style
                    .split(" ")
                    .map((style) => `cm-${style}`)
                    .join(" ")}
                >
                  {part.token}
                </span>
              ) : (
                <React.Fragment key={i}>{part.token}</React.Fragment>
              )
            )}
            {caret && row === lines.length - 1 && (
              <span className="live-playground__caret" />
            )}
          </span>
        </span>
      ))}
    </pre>
  );
}

/*
  The phases a demo goes through, in order:
    typing     the Sass grows a character at a time
    waiting    the Sass is finished and nothing has happened yet
    compiling  the loader turns in the CSS pane
    writing    the CSS grows a line at a time
    hold       both are finished and on screen
*/
class Showcase extends Component {
  constructor(props) {
    super(props);
    const first = props.demos[0];
    this.state = {
      index: 0,
      typed: first.source.length,
      lines: first.css.split("\n").length,
      phase: "hold",
    };
    this.ref = React.createRef();
    this.tick = this.tick.bind(this);
    this.updateRunning = this.updateRunning.bind(this);
  }

  componentDidMount() {
    this.still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.onScreen = true;
    if ("IntersectionObserver" in window && this.ref.current) {
      this.observer = new IntersectionObserver((entries) => {
        this.onScreen = entries.some((entry) => entry.isIntersecting);
        this.updateRunning();
      });
      this.observer.observe(this.ref.current);
    }
    document.addEventListener("visibilitychange", this.updateRunning);
    this.updateRunning();
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
    if (this.observer) this.observer.disconnect();
    document.removeEventListener("visibilitychange", this.updateRunning);
  }

  updateRunning() {
    const shouldRun = this.onScreen && document.visibilityState === "visible";
    if (shouldRun === this.running) return;
    this.running = shouldRun;
    clearTimeout(this.timer);
    if (shouldRun) this.schedule();
  }

  schedule() {
    const { demos } = this.props;
    const { index, typed, phase } = this.state;
    const delays = {
      hold: this.still ? STILL_HOLD : HOLD,
      typing: () => keyDelay(demos[index].source[typed - 1]),
      waiting: AFTER_TYPING,
      compiling: COMPILING,
      writing: LINE_DELAY,
    };
    const delay = typeof delays[phase] === "function" ? delays[phase]() : delays[phase];
    this.timer = setTimeout(this.tick, delay);
  }

  tick() {
    if (!this.running) return;
    const { demos } = this.props;
    const { index, typed, lines, phase } = this.state;
    const demo = demos[index];
    const total = demo.css.split("\n").length;
    let next;

    if (phase === "hold") {
      const following = (index + 1) % demos.length;
      next = this.still
        ? {
            index: following,
            typed: demos[following].source.length,
            lines: demos[following].css.split("\n").length,
            phase: "hold",
          }
        : { index: following, typed: 0, lines: 0, phase: "typing" };
    } else if (phase === "typing") {
      /*
        Indentation arrives at once, the way an editor puts it there after
        Enter; nobody presses the space bar four times and waits between.
      */
      let end = typed + 1;
      if (demo.source[typed] === "\n") {
        while (end < demo.source.length && demo.source[end] === " ") end += 1;
      }
      next =
        end >= demo.source.length
          ? { typed: demo.source.length, phase: "waiting" }
          : { typed: end };
    } else if (phase === "waiting") {
      next = { phase: "compiling" };
    } else if (phase === "compiling") {
      next = { lines: 1, phase: total > 1 ? "writing" : "hold" };
    } else {
      next = lines + 1 >= total ? { lines: total, phase: "hold" } : { lines: lines + 1 };
    }

    this.setState(next, () => {
      if (this.running) this.schedule();
    });
  }

  render() {
    const { demos } = this.props;
    const { index, typed, lines, phase } = this.state;
    const demo = demos[index];
    const css = demo.css.split("\n").slice(0, lines).join("\n");
    const isCompiling = phase === "compiling";

    return (
      <div
        className="live-playground__panes"
        ref={this.ref}
        role="img"
        aria-label={`The ${demo.title} mixin written in Sass, and the CSS Gerillass compiles it to.`}
      >
        <div className="playground__editor" aria-hidden="true">
          <div className="playground__editor__bar">
            <span className="playground__pane__title">Sass</span>
          </div>
          <Code
            text={demo.source.slice(0, typed)}
            mode="text/x-scss"
            caret={phase === "typing" || phase === "waiting"}
          />
        </div>
        <div className="playground__editor playground__editor--output" aria-hidden="true">
          <div className="playground__editor__bar">
            <span className="playground__pane__title">CSS</span>
            {isCompiling && (
              <span className="playground__status playground__status--busy">
                compiling…
              </span>
            )}
          </div>
          {isCompiling ? (
            <div className="live-playground__loader">
              <span className="live-playground__spinner" />
            </div>
          ) : (
            <Code text={css} mode="text/css" caret={false} />
          )}
        </div>
      </div>
    );
  }
}

export default Showcase;
