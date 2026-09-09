import React, { Component } from "react";
import ReactDOM from "react-dom";
import { Controlled as CodeMirror } from "react-codemirror2";
import { motion, AnimatePresence } from "framer-motion";

import "codemirror/lib/codemirror.css";
import "codemirror/mode/css/css";

import {
  CopyIcon,
  EraserIcon,
  LinkIcon,
  CheckIcon,
  CloseIcon,
  AlertIcon,
} from "components/Icons";

import { compile, COMPILER } from "./compiler";
import { fetchVersions, FALLBACK } from "./versions";
import Select from "components/Select";

import { listMixins, mixinTitle } from "./mixins";
import DEMOS from "./demos.json";

import "./playground.scss";

/*
  Opening: the panel comes up over the page and the three bands settle into it
  one after another, close enough together to read as one movement. Springs
  rather than durations — a window that arrives with weight looks less like a
  page swap than one that eases to a stop.
*/
const SETTLE = { type: "spring", stiffness: 320, damping: 34, mass: 0.9 };
/* Leaving is the same movement run backwards, and quicker: nobody waits to go. */
const LEAVE = { duration: 0.18, ease: "easeIn" };

const WINDOW_MOTION = {
  hidden: {
    opacity: 0,
    y: 28,
    scale: 0.99,
    transition: { ...LEAVE, staggerChildren: 0.03, staggerDirection: -1 },
  },
  shown: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...SETTLE, staggerChildren: 0.055, delayChildren: 0.04 },
  },
};

const BAND_MOTION = {
  hidden: { opacity: 0, y: 16, transition: LEAVE },
  shown: { opacity: 1, y: 0, transition: SETTLE },
};

/*
  What the two selectors in the Sass bar are, in a line each. They introduce
  themselves in turn on a first visit and are not shown again: the point is to
  be understood once. Repeating it on hover would only be in the way of the
  person who has already read it — and reaching for a control you understand is
  how you use the bar, not a request to be told about it.
*/
const HINTS = {
  version: "The Gerillass release your Sass is compiled against.",
  mixin: "Load a worked example for any mixin, or start your own.",
};
/* Every mixin's page, named by the directory the demo was read out of. */
const DOCS = "https://docs.gerillass.com/docs";

const HINT_ORDER = ["version", "mixin"];
const HINT_KEY = "gerillass:playground:hints";
/* Long enough to read a line twice, short enough not to sit there. */
const HINT_HOLD = 4500;
const HINT_DELAY = 900;

function hintsSeen() {
  try {
    return window.localStorage.getItem(HINT_KEY) === "seen";
  } catch (error) {
    /* No storage means they are introduced every visit, which is no disaster. */
    return false;
  }
}

function rememberHints() {
  try {
    window.localStorage.setItem(HINT_KEY, "seen");
  } catch (error) {
    /* See above. */
  }
}

/* The mixin the page opens on. */
const DEFAULT_MIXIN = "breakpoint";
const EXAMPLE = DEMOS[DEFAULT_MIXIN].scss;

/* Writing your own starts from the line every snippet needs anyway. */
const BLANK_SNIPPET = '@use "gerillass" as *;\n\n';

/* Long enough to let a thought finish, short enough to feel live. */
const COMPILE_DELAY = 300;

/* One shape for the output: the readable one, which is what you came to read. */
const OUTPUT_STYLE = "expanded";

const INSTALL_STEPS = [
  { note: "Add it to your project", command: "npm install gerillass" },
  { note: "Or, if you keep to Yarn", command: "yarn add gerillass" },
  {
    note: "Then load it once, where your Sass starts",
    command: '@use "gerillass" as *;',
  },
];

/* How long the copy and share buttons stay in their "done" state. */
const FEEDBACK_DELAY = 1600;

const EDITOR_OPTIONS = {
  mode: "text/x-scss",
  lineNumbers: true,
  lineWrapping: true,
  tabSize: 2,
  indentWithTabs: false,
  viewportMargin: Infinity,
};

const OUTPUT_OPTIONS = {
  ...EDITOR_OPTIONS,
  mode: "text/css",
  readOnly: "nocursor",
};

/*
  Links shared before the playground moved to `as *` carry the namespaced form
  it used to produce. The two are equivalent, so rather than greeting somebody
  with a style the page no longer teaches, the header and the prefixes are
  rewritten on the way in.
*/
function modernise(source) {
  if (!/@use\s+["']gerillass["']\s*;/.test(source)) return source;
  return source
    .replace(/@use\s+["']gerillass["']\s*;/, '@use "gerillass" as *;')
    .replace(/\bgerillass\./g, "");
}

/* Which demo a snippet is, for links written before the mixin was named. */
function demoFor(source) {
  const names = Object.keys(DEMOS);
  for (let i = 0; i < names.length; i++) {
    if (DEMOS[names[i]].scss === source) return names[i];
  }
  return "";
}

function readShared() {
  try {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return null;
    const params = new URLSearchParams(hash);
    const encoded = params.get("code");
    if (!encoded) return null;
    const source = modernise(decodeURIComponent(escape(window.atob(encoded))));
    const mixin = params.get("m");
    return {
      source,
      version: params.get("v"),
      /* Older links carry the code alone; the snippet still names its demo. */
      mixin: mixin && DEMOS[mixin] ? mixin : demoFor(source),
    };
  } catch (error) {
    /* A hand-edited link is not worth an error message. */
    return null;
  }
}

function shareUrl(source, version, mixin) {
  const params = new URLSearchParams();
  params.set("v", version);
  if (mixin) params.set("m", mixin);
  params.set("code", window.btoa(unescape(encodeURIComponent(source))));
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${params.toString()}`;
}

/*
  What you were working on outlives a reload. Only the three things you chose
  are kept — the CSS is a compile away, and a stale one would flash up before
  the real one lands.

  A draft that still names a mixin is a demo nobody has typed into: the mixin
  is cleared the moment the source stops matching it (see handleChange), so the
  name is enough to know that. Such a draft is read back as a bookmark to the
  demo rather than a copy of it, and comes back as whatever the demo says
  today. Otherwise somebody who opened the playground once would keep being
  handed the snippet as it was that day, and never see it improve.

  The release is deliberately not part of it. Trying an older one is a thing
  you do for a minute, not a preference to be remembered, and remembering it
  pinned people there: the mixin list is built from the release that is
  selected, so a visitor who had once looked at 1.5.0 came back to a menu with
  the newer mixins quietly missing from it and nothing saying why. A link is
  different — whoever sent it chose that release, and the snippet may need it.
*/
const DRAFT_KEY = "gerillass:playground:draft";

function readDraft() {
  try {
    const saved = window.localStorage.getItem(DRAFT_KEY);
    if (!saved) return null;
    const draft = JSON.parse(saved);
    if (typeof draft.source !== "string") return null;
    const mixin = draft.mixin && DEMOS[draft.mixin] ? draft.mixin : "";
    return {
      source: mixin ? DEMOS[mixin].scss : modernise(draft.source),
      version: null,
      mixin,
    };
  } catch (error) {
    /* Private windows and cleared storage both land here; start fresh. */
    return null;
  }
}

function writeDraft(draft) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    /* Storage the browser will not give us costs the visitor nothing. */
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  /* Older Safari and any non-secure origin. */
  return new Promise((resolve, reject) => {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;top:-1000px;opacity:0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(field);
    return ok ? resolve() : reject(new Error("Copying is not available"));
  });
}

class Playground extends Component {
  constructor(props) {
    super(props);
    /* A link is what you were sent; a draft is what you left behind. */
    const opening = readShared() || readDraft();
    this.state = {
      source: opening ? opening.source : EXAMPLE,
      version: opening && opening.version ? opening.version : null,
      versions: FALLBACK.versions,
      css: "",
      error: null,
      isCompiling: true,
      copied: null,
      /* The route only changes once the window has finished leaving. */
      isOpen: true,
      /* Which selector is introducing itself, on a first visit only. */
      hint: null,
      /*
        Both lists start from what the bundle already knows and are replaced by
        the live ones a moment later. An empty select would otherwise be laid
        out at its narrowest and jump wider as the options land.
      */
      mixins: Object.keys(DEMOS).map((name) => ({ name })),
      mixin: opening ? opening.mixin : DEFAULT_MIXIN,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleVersion = this.handleVersion.bind(this);
    this.handleCopy = this.handleCopy.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.handleShare = this.handleShare.bind(this);
    this.handleMixin = this.handleMixin.bind(this);
    this.handleCopyCss = this.handleCopyCss.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleBackdrop = this.handleBackdrop.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.finishClose = this.finishClose.bind(this);
    this.endHints = this.endHints.bind(this);
    this.handleCopyCommand = this.handleCopyCommand.bind(this);
  }

  async componentDidMount() {
    this.isRendered = true;
    document.addEventListener("keydown", this.handleKeyDown);
    /*
      Locking the page also takes its scrollbar away, and the page underneath
      reflows into the space it leaves — a shift you would watch happen through
      the window fading in over it. Hold the width open instead.
    */
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    this.previousOverflow = document.body.style.overflow;
    this.previousPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    this.startHints();
    const { latest, versions } = await fetchVersions();
    if (!this.isRendered) return;
    const version =
      this.state.version && versions.indexOf(this.state.version) !== -1
        ? this.state.version
        : latest;
    this.setState({ versions, version }, this.compile);
    this.loadMixins(version);
  }

  /* One after the other, then never again. Touching anything cuts it short. */
  startHints() {
    if (hintsSeen()) return;
    this.hintTimers = HINT_ORDER.map((name, step) =>
      setTimeout(
        () => this.setState({ hint: name }),
        HINT_DELAY + HINT_HOLD * step
      )
    );
    this.hintTimers.push(
      setTimeout(this.endHints, HINT_DELAY + HINT_HOLD * HINT_ORDER.length)
    );
  }

  endHints() {
    if (!this.hintTimers) return;
    this.hintTimers.forEach(clearTimeout);
    this.hintTimers = null;
    rememberHints();
    if (this.state.hint) this.setState({ hint: null });
  }

  /* What is written is what is read back: the snippet, and the demo it is. */
  componentDidUpdate(previousProps, previousState) {
    const { source, mixin } = this.state;
    if (source !== previousState.source || mixin !== previousState.mixin) {
      writeDraft({ source, mixin });
    }
  }

  /* The index describes the selected release, so it follows the selector. */
  loadMixins(version) {
    listMixins(version)
      .then((mixins) => {
        if (this.isRendered && this.state.version === version) {
          this.setState({ mixins });
        }
      })
      .catch(() => {
        /* Keep whatever list is on screen rather than emptying the control. */
      });
  }

  handleKeyDown(event) {
    if (event.key === "Escape") this.handleClose();
  }

  handleClose() {
    if (!this.state.isOpen) return;
    this.setState({ isOpen: false });
    /*
      Leaving cannot wait on the animation reporting back. A tab that is not on
      screen is given no frames, so the movement never finishes there — and the
      route change, not the movement, is what actually closes the playground.
    */
    this.leaveTimer = setTimeout(this.finishClose, 400);
  }

  finishClose() {
    if (this.hasClosed) return;
    this.hasClosed = true;
    clearTimeout(this.leaveTimer);
    this.props.onClose();
  }

  componentWillUnmount() {
    this.isRendered = false;
    document.removeEventListener("keydown", this.handleKeyDown);
    document.body.style.overflow = this.previousOverflow || "";
    document.body.style.paddingRight = this.previousPadding || "";
    clearTimeout(this.compileTimer);
    clearTimeout(this.feedbackTimer);
    clearTimeout(this.leaveTimer);
    if (this.hintTimers) this.hintTimers.forEach(clearTimeout);
  }

  /*
    Two counters, because these are different questions. The token says whose
    result may reach the screen — the library and the compiler load over the
    network, so a slow run can land after a newer one. The pending count says
    whether anything is still running at all, which is what the label reports;
    deriving that from the token alone leaves it stuck on "compiling" whenever a
    superseded run is the last to settle.
  */
  compile() {
    const { source, version } = this.state;
    if (!version) return;
    const token = (this.token = (this.token || 0) + 1);
    this.pending = (this.pending || 0) + 1;
    this.setState({ isCompiling: true });

    const settle = (state) => {
      this.pending -= 1;
      if (!this.isRendered) return;
      if (token !== this.token) {
        this.setState({ isCompiling: this.pending > 0 });
        return;
      }
      this.setState({ ...state, isCompiling: this.pending > 0 });
    };

    compile(source, version, OUTPUT_STYLE).then(
      (css) => settle({ css, error: null }),
      (error) => settle({ error: error.message || String(error) }),
    );
  }

  scheduleCompile() {
    clearTimeout(this.compileTimer);
    this.compileTimer = setTimeout(() => this.compile(), COMPILE_DELAY);
  }

  /*
    The address bar keeps whatever link was last shared. Left there it outlives
    its snippet — the next reload would restore the shared code over whatever
    has been written since.
  */
  dropStaleLink() {
    if (!window.location.hash) return;
    const { pathname, search } = window.location;
    window.history.replaceState(null, "", pathname + search);
  }

  handleChange(editor, data, source) {
    this.endHints();
    this.dropStaleLink();
    const { mixin } = this.state;
    const demo = DEMOS[mixin];
    /* Typing makes it your snippet; loading one leaves it the demo's. */
    const untouched = Boolean(demo) && demo.scss === source;
    this.setState({ source, mixin: untouched ? mixin : "" }, () =>
      this.scheduleCompile(),
    );
  }

  handleVersion(event) {
    const version = event.target.value;
    this.endHints();
    this.setState({ version }, this.compile);
    this.loadMixins(version);
  }

  flash(which) {
    clearTimeout(this.feedbackTimer);
    this.setState({ copied: which });
    this.feedbackTimer = setTimeout(() => {
      if (this.isRendered) this.setState({ copied: null });
    }, FEEDBACK_DELAY);
  }

  handleCopy() {
    copyToClipboard(this.state.source).then(
      () => this.flash("source"),
      () => {},
    );
  }

  handleShare() {
    const { source, version, mixin } = this.state;
    const url = shareUrl(source, version, mixin);
    window.history.replaceState(null, "", url);
    /*
      The address bar now holds the link whether or not the clipboard was
      willing, so the confirmation is honest either way.
    */
    copyToClipboard(url).then(
      () => this.flash("link"),
      () => this.flash("link"),
    );
  }

  handleClear() {
    /*
      Clearing empties what you wrote, not the line every snippet needs — and
      it hands the editor back with the caret already on the line you would
      have clicked into.
    */
    this.dropStaleLink();
    this.setState(
      { source: BLANK_SNIPPET, css: "", error: null, mixin: "" },
      () => {
        this.compile();
        if (this.editor) {
          this.editor.focus();
          this.editor.setCursor({ line: 2, ch: 0 });
        }
      },
    );
  }

  handleMixin(event) {
    const mixin = event.target.value;
    this.endHints();
    const demo = DEMOS[mixin];
    /* The empty entry is "your own snippet": hand over an empty stylesheet
       with the library already loaded. */
    this.dropStaleLink();
    this.setState(
      { mixin, source: demo ? demo.scss : BLANK_SNIPPET, css: "", error: null },
      this.compile,
    );
  }

  handleCopyCss() {
    copyToClipboard(this.state.css).then(
      () => this.flash("css"),
      () => {},
    );
  }

  handleCopyCommand(step) {
    copyToClipboard(step.command).then(
      () => this.flash(step.command),
      () => {},
    );
  }

  handleBackdrop(event) {
    if (event.target === event.currentTarget) this.handleClose();
  }

  renderOutput() {
    const { css, error, isCompiling, version } = this.state;

    if (error) {
      return (
        <div className="playground__message playground__message--error">
          <AlertIcon size={18} className="playground__message__icon" />
          <pre>{error}</pre>
        </div>
      );
    }
    if (!version || (isCompiling && !css)) {
      return (
        <div className="playground__message">
          <p>Warming up the Sass compiler…</p>
        </div>
      );
    }
    return (
      <CodeMirror
        value={css}
        options={OUTPUT_OPTIONS}
        onBeforeChange={() => {}}
      />
    );
  }

  render() {
    const {
      source,
      css,
      version,
      versions,
      isCompiling,
      error,
      copied,
      mixins,
      mixin,
      isOpen,
      hint,
    } = this.state;
    /* Only the mixins this release ships and the docs have an example for. */
    const demoable = mixins.filter((item) => DEMOS[item.name]);
    const bytes = css ? new Blob([css]).size : 0;
    const status = isCompiling ? "compiling…" : error ? "error" : `${bytes} B`;

    return ReactDOM.createPortal(
      <AnimatePresence onExitComplete={this.finishClose}>
        {isOpen && (
          <motion.div
            className="playground"
            onClick={this.handleBackdrop}
            role="presentation"
            initial={{ opacity: this.props.openedOverSite ? 0 : 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <motion.div
              className="playground__window"
              role="dialog"
              aria-modal="true"
              aria-labelledby="playground-title"
              variants={WINDOW_MOTION}
              initial="hidden"
              animate="shown"
              exit="hidden"
            >
              <motion.header className="playground__bar" variants={BAND_MOTION}>
                <div className="playground__bar__intro">
                  <h2 className="playground__title" id="playground-title">
                    Playground
                  </h2>
                  <p className="playground__subtitle">
                    Sass on the left, the CSS Gerillass generates on the right.
                  </p>
                </div>

                <div className="playground__bar__actions">
                  <button
                    type="button"
                    className="playground__share"
                    onClick={this.handleShare}
                    title="Copy a link to this snippet"
                  >
                    {copied === "link" ? (
                      <CheckIcon size={16} />
                    ) : (
                      <LinkIcon size={16} />
                    )}
                    <span>Share</span>
                  </button>
                  <button
                    type="button"
                    className="playground__close"
                    onClick={this.handleClose}
                    title="Close the playground"
                    aria-label="Close the playground"
                  >
                    <CloseIcon size={22} />
                  </button>
                </div>
              </motion.header>

              <motion.div className="playground__panes" variants={BAND_MOTION}>
                <div className="playground__pane">
                  <div className="playground__pane__head">
                    <p className="playground__pane__note">
                      Write your Sass here, with every Gerillass mixin already
                      loaded.
                    </p>
                  </div>
                  <div className="playground__editor">
                    <div className="playground__editor__bar">
                      <span className="playground__pane__title">Sass</span>
                      <span className="playground__pane__buttons">
                        <Select
                          label="Gerillass version"
                          value={version || ""}
                          options={versions.map((item) => ({
                            value: item,
                            label: `v${item}`,
                          }))}
                          onChange={this.handleVersion}
                          className="playground__pick playground__pick--version"
                          describe={HINTS.version}
                          showDescription={hint === "version"}
                          tone="dark"
                          bare
                          hideLabel
                        />
                        <Select
                          label="Mixin"
                          value={mixin}
                          options={demoable.map((item) => ({
                            value: item.name,
                            label:
                              DEMOS[item.name].title || mixinTitle(item.name),
                          }))}
                          onChange={this.handleMixin}
                          placeholder="Custom Snippet"
                          className="playground__pick"
                          describe={HINTS.mixin}
                          describeAlign="right"
                          showDescription={hint === "mixin"}
                          tone="dark"
                          bare
                          hideLabel
                        />
                        <button
                          type="button"
                          className="playground__action playground__action--onDark"
                          onClick={this.handleCopy}
                          title="Copy the Sass"
                          aria-label="Copy the Sass"
                        >
                          {copied === "source" ? (
                            <CheckIcon size={16} />
                          ) : (
                            <CopyIcon size={16} />
                          )}
                        </button>
                        <button
                          type="button"
                          className="playground__action playground__action--onDark"
                          onClick={this.handleClear}
                          title="Clear the editor"
                          aria-label="Clear the editor"
                        >
                          <EraserIcon size={16} />
                        </button>
                      </span>
                    </div>
                    {DEMOS[mixin] && (
                      <motion.p
                        className="playground__editor__note"
                        key={mixin}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      >
                        <span aria-hidden="true">{"// "}</span>
                        {DEMOS[mixin].description} Learn more about{" "}
                        {DEMOS[mixin].title || mixinTitle(mixin)}:{" "}
                        <a
                          className="playground__editor__link"
                          href={`${DOCS}/${mixin}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {`${DOCS.replace(/^https:\/\//, "")}/${mixin}`}
                        </a>
                      </motion.p>
                    )}
                    <CodeMirror
                      value={source}
                      options={EDITOR_OPTIONS}
                      onBeforeChange={this.handleChange}
                      editorDidMount={(editor) => {
                        this.editor = editor;
                      }}
                    />
                  </div>
                </div>

                <div className="playground__pane">
                  <div className="playground__pane__head">
                    <p className="playground__pane__note">
                      The plain CSS it compiles to, rewritten as you type.
                    </p>
                  </div>
                  <div className="playground__editor playground__editor--output">
                    <div className="playground__editor__bar">
                      <span className="playground__pane__title">CSS</span>
                      <span className="playground__pane__buttons">
                        <span
                          className={`playground__status${
                            isCompiling ? " playground__status--busy" : ""
                          }`}
                        >
                          {status}
                        </span>
                        <button
                          type="button"
                          className="playground__action playground__action--onDark"
                          onClick={this.handleCopyCss}
                          title="Copy the CSS"
                          aria-label="Copy the CSS"
                        >
                          {copied === "css" ? (
                            <CheckIcon size={16} />
                          ) : (
                            <CopyIcon size={16} />
                          )}
                        </button>
                      </span>
                    </div>
                    {this.renderOutput()}
                  </div>
                </div>
              </motion.div>

              <motion.footer
                className="playground__footer"
                variants={BAND_MOTION}
              >
                <p className="playground__compiler">Compiled with {COMPILER}</p>
                <div className="playground__footer__actions">
                  <code>{INSTALL_STEPS[0].command}</code>
                  <button
                    type="button"
                    className="playground__action"
                    onClick={() => this.handleCopyCommand(INSTALL_STEPS[0])}
                    title={`Copy "${INSTALL_STEPS[0].command}"`}
                    aria-label={`Copy "${INSTALL_STEPS[0].command}"`}
                  >
                    {copied === INSTALL_STEPS[0].command ? (
                      <CheckIcon size={16} />
                    ) : (
                      <CopyIcon size={16} />
                    )}
                  </button>
                </div>
              </motion.footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    );
  }
}

export default Playground;
