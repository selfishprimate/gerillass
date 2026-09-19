import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import CodeBlock from "components/CodeBlock";
import { ChevronRightIcon, PanelRightCloseIcon, PanelRightOpenIcon } from "components/Icons";
import { collectingLogger, makeImporter } from "components/Playground/compiler";

import manifest from "../../../../gerillass.json";

import "./lab.scss";

/*
  A workbench for developing the library, on the dev server only: routes.jsx
  adds /lab behind import.meta.env.DEV, so a build never contains it.

  The public playground compiles a published version pulled from jsDelivr. This
  compiles the working tree: every .scss under the repository's scss/ is read
  here as text, and saving one of them, from the editor or from this page,
  reloads the page with the new source.

  A case is two files in site/lab/cases, name.scss and name.html. The Sass gets
  `@use "gerillass" as *;` in front of its first line unless it loads the
  library itself, on the same line, so an error's line number is the file's.
  The library files a case calls are found from its Sass and shown beside it.

  Anything typed on the page is a draft, kept per file in localStorage, and the
  compile uses the drafts, so a change to a mixin shows before it is saved.
  Save writes a draft to disk through plugins/lab-save.js.
*/

const LIBRARY = import.meta.glob("../../../../scss/**/*.scss", {
  query: "?raw",
  import: "default",
  eager: true,
});

const CASE_FILES = import.meta.glob("../../../lab/cases/*.{scss,html}", {
  query: "?raw",
  import: "default",
  eager: true,
});

/* The folds of the source column, in their default order. */
const PANELS = ["source", "scss", "css", "html"];

const ALL_OPEN = { html: true, scss: true, source: true, css: true };

/* The left half's share of the window, in percent, and how far it can go. */
const SPLIT = { initial: 50, min: 25, max: 75, step: 2 };

const LOADS_LIBRARY = /@(use|forward|import)\s+["'](pkg:)?gerillass/;

// eslint-disable-next-line no-control-regex
const ANSI = /\[[0-9;]*m/g;

/*
  Every file the lab reads, by its path from the repository root, which is
  also the path the save endpoint takes: scss/library/_triangle.scss,
  site/lab/cases/triangle.scss.
*/
function diskFiles() {
  const disk = new Map();
  Object.entries(LIBRARY).forEach(([key, text]) => {
    disk.set(key.slice(key.indexOf("scss/")), text);
  });
  Object.entries(CASE_FILES).forEach(([key, text]) => {
    disk.set(`site/lab/cases/${key.slice(key.lastIndexOf("/") + 1)}`, text);
  });
  return disk;
}

function caseNames(disk) {
  const names = new Set();
  disk.forEach((_, path) => {
    const match = path.match(/^site\/lab\/cases\/(.+)\.(scss|html)$/);
    if (match) names.add(match[1]);
  });
  return [...names].sort();
}

/*
  Which library files a piece of Sass calls. A mixin is found by its
  `@include`, with or without the gls- prefix, and a function by a call to its
  name; utilities are camelCase in Sass and kebab-case on disk.
*/
function memberIndex(disk) {
  const mixins = new Map();
  const functions = new Map();
  disk.forEach((_, path) => {
    const match = path.match(/^scss\/(library|utilities)\/_([\w-]+)\.scss$/);
    if (!match || match[2] === "index") return;
    if (match[1] === "library") mixins.set(match[2], path);
    else functions.set(match[2].replace(/-(\w)/g, (_, c) => c.toUpperCase()), path);
  });
  return { mixins, functions };
}

function membersIn(scss, { mixins, functions }) {
  const found = [];
  const add = (path) => path && !found.includes(path) && found.push(path);
  for (const match of scss.matchAll(/@include\s+(?:gls-)?([\w-]+)/g)) add(mixins.get(match[1]));
  for (const match of scss.matchAll(/\b(?:gls-)?([a-zA-Z][\w]*)\s*\(/g)) add(functions.get(match[1]));
  return found;
}

/*
  What each library file is for, from the manifest, by the same path the lab
  uses for the file. Only the first sentence: the summaries run on about the
  traps, and under a case's name one line is enough.
*/
const SUMMARIES = new Map(
  manifest.members.map((member) => [
    member.file.replace(/^\.?\//, ""),
    member.summary.split(/(?<=\.)\s/)[0],
  ])
);

/* A case's file name, as a title: line-clamp becomes Line Clamp. */
const titleCase = (slug) =>
  slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

let sassModule = null;
function loadSass() {
  if (!sassModule) sassModule = import("sass");
  return sassModule;
}

/*
  localStorage, so the lab comes back as it was left, drafts included, after a
  refresh or a new tab. It can be missing or throw, and the lab still works
  without it.
*/
function readStored(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Nothing to do: the value just does not survive a reload. */
  }
}

/* A stored order is used only if it still names every panel once. */
function readOrder() {
  const stored = readStored("lab:order", PANELS);
  const valid =
    Array.isArray(stored) &&
    stored.length === PANELS.length &&
    PANELS.every((id) => stored.includes(id));
  return valid ? stored : PANELS;
}

const clampSplit = (value) => Math.min(SPLIT.max, Math.max(SPLIT.min, value));

function move(list, id, to) {
  const rest = list.filter((item) => item !== id);
  rest.splice(Math.max(0, Math.min(rest.length, to)), 0, id);
  return rest;
}

function previewDocument(css, html) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:24px;font:16px/1.5 system-ui,sans-serif;color:#2f3937;background:#fff}</style><style>${css}</style></head><body>${html}</body></html>`;
}

function GripIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true">
      {[2, 8, 14].map((y) =>
        [2, 8].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="currentColor" />)
      )}
    </svg>
  );
}

/*
  One fold of the source column. Open folds share the column's height equally
  and a closed one keeps only its heading. Actions sit beside the heading
  rather than inside its button, since a button cannot hold another.

  The grip moves the fold: drag it onto another fold, or focus it and use the
  up and down arrows.

  The whole heading row opens and closes the fold, except the grip and the
  actions, which do their own thing. The heading's button stays the control
  for the keyboard and for a screen reader; its click reaches the row like any
  other, which is why it has no handler of its own.
*/
function Panel({ id, title, meta, warning, actions, open, onToggle, grip, dropTarget, children }) {
  const bodyId = `lab-panel-${id}`;
  const onRowClick = (event) => {
    if (event.target.closest(".lab__panel__grip, .lab__panel__actions")) return;
    onToggle();
  };
  return (
    <section
      className={`lab__panel${open ? " is-open" : ""}${dropTarget ? " is-drop-target" : ""}`}
      {...grip.target}
    >
      <div className="lab__panel__head" onClick={onRowClick}>
        <button type="button" className="lab__panel__grip" {...grip.handle}>
          <GripIcon />
        </button>
        <h3 className="lab__panel__heading">
          <button
            type="button"
            className="lab__panel__toggle"
            aria-expanded={open}
            aria-controls={bodyId}
          >
            {title}
          </button>
        </h3>
        {warning && <span className="lab__panel__warning">{warning}</span>}
        {meta && <span className="lab__panel__meta">{meta}</span>}
        {actions && <span className="lab__panel__actions">{actions}</span>}
        <span className="lab__panel__chevron" aria-hidden="true">
          <ChevronRightIcon size={16} />
        </span>
      </div>
      <div id={bodyId} className="lab__panel__body" hidden={!open}>
        {children}
      </div>
    </section>
  );
}

/*
  Highlighted and still editable. The site's CodeBlock draws the code with the
  same colours as the CSS beside it, and a textarea with invisible text lies
  exactly over its <pre>: the caret and the selection are the textarea's, the
  colours are the block's. The two share every metric that decides where a
  character lands, the textarea is the one that scrolls, and the <pre> follows
  it, so they cannot drift apart.

  The block trims one trailing newline, so one is added back: a file ending in
  a newline keeps its empty last line and the caret has a line to sit on.
*/
function EditableCode({ language, value, label, onChange }) {
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const [box, setBox] = useState(null);

  const pre = () => wrapRef.current && wrapRef.current.querySelector("pre");

  useLayoutEffect(() => {
    const target = pre();
    if (!target) return undefined;
    const measure = () =>
      setBox({
        top: target.offsetTop,
        left: target.offsetLeft,
        width: target.offsetWidth,
        height: target.offsetHeight,
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrapRef.current);
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const follow = () => {
    const target = pre();
    const input = inputRef.current;
    if (!target || !input) return;
    target.scrollTop = input.scrollTop;
    target.scrollLeft = input.scrollLeft;
  };

  /* A re-highlight can reset the block's scroll, so it follows after each change too. */
  useLayoutEffect(follow, [value]);

  return (
    <div className="lab__code" ref={wrapRef}>
      <CodeBlock language={language}>{`${value}\n`}</CodeBlock>
      <textarea
        ref={inputRef}
        className="lab__code__input"
        aria-label={label}
        value={value}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        wrap="off"
        style={box ? { top: box.top, left: box.left, width: box.width, height: box.height } : { visibility: "hidden" }}
        onChange={(event) => onChange(event.target.value)}
        onScroll={follow}
      />
    </div>
  );
}

function Lab() {
  const disk = useMemo(diskFiles, [LIBRARY, CASE_FILES]);
  const members = useMemo(() => memberIndex(disk), [disk]);
  const names = caseNames(disk);

  const [params, setParams] = useSearchParams();
  const name = names.includes(params.get("case")) ? params.get("case") : names[0];

  /*
    Everything the page remembers lives in localStorage: the drafts, the order
    and state of the folds, which library file is showing and where the divider
    sits. A draft is stored with the file as it was when the
    draft began, so a file changed on disk since, in the editor say, is noticed
    rather than silently hidden under an old draft.
  */
  const [drafts, setDrafts] = useState(() => readStored("lab:drafts:v2", {}));
  const [open, setOpen] = useState(() => ({ ...ALL_OPEN, ...readStored("lab:open", {}) }));
  const [order, setOrder] = useState(readOrder);
  const [split, setSplit] = useState(() => clampSplit(readStored("lab:split", SPLIT.initial)));
  const [shown, setShown] = useState(() => readStored("lab:shown", {}));
  const [preview, setPreview] = useState(() => readStored("lab:preview", true) !== false);
  const [dragging, setDragging] = useState(false);
  const [movingPanel, setMovingPanel] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [saving, setSaving] = useState(null);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => writeStored("lab:drafts:v2", drafts), [drafts]);
  useEffect(() => writeStored("lab:open", open), [open]);
  useEffect(() => writeStored("lab:order", order), [order]);
  useEffect(() => writeStored("lab:split", split), [split]);
  useEffect(() => writeStored("lab:shown", shown), [shown]);
  useEffect(() => writeStored("lab:preview", preview), [preview]);

  /*
    A draft that matches the file on disk is no longer a draft. This is what
    clears one after Save: the write reloads the page, and whether the reload or
    the save's own answer arrives first, the draft goes once the file says the
    same thing, and is never dropped before. A draft for a file that is gone
    goes too.
  */
  useEffect(() => {
    setDrafts((all) => {
      const kept = Object.fromEntries(
        Object.entries(all).filter(
          ([path, draft]) => draft && disk.has(path) && disk.get(path) !== draft.text
        )
      );
      return Object.keys(kept).length === Object.keys(all).length ? all : kept;
    });
  }, [disk]);

  const read = (path) => drafts[path]?.text ?? disk.get(path) ?? "";
  const isDraft = (path) => path in drafts;
  const isStale = (path) => isDraft(path) && drafts[path].base !== disk.get(path);
  const setDraft = (path, text) =>
    setDrafts((all) => ({
      ...all,
      [path]: { text, base: all[path]?.base ?? disk.get(path) ?? "" },
    }));
  const revert = (path) =>
    setDrafts((all) => {
      const { [path]: _, ...rest } = all;
      return rest;
    });

  const save = async (path) => {
    setSaving(path);
    setSaveError(null);
    try {
      const response = await fetch("/__lab/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content: drafts[path].text }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `The save answered ${response.status}`);
    } catch (error) {
      setSaveError(`${path}: ${error.message}`);
    } finally {
      setSaving(null);
    }
  };

  const htmlPath = `site/lab/cases/${name}.html`;
  const scssPath = `site/lab/cases/${name}.scss`;
  const html = read(htmlPath);
  const scss = read(scssPath);

  const sources = membersIn(scss, members);
  const sourcePath = sources.includes(shown[name]) ? shown[name] : sources[0];

  const caseTouched = (caseName) => {
    const own = [`site/lab/cases/${caseName}.html`, `site/lab/cases/${caseName}.scss`];
    const used = membersIn(read(own[1]), members);
    return [...own, ...used].some(isDraft);
  };

  const fileActions = (path) =>
    isDraft(path) ? (
      <>
        <button
          type="button"
          className="lab__action lab__action--primary"
          onClick={() => save(path)}
          disabled={saving === path}
        >
          {saving === path ? "Saving" : "Save"}
        </button>
        <button type="button" className="lab__action" onClick={() => revert(path)}>
          Revert
        </button>
      </>
    ) : null;

  const staleWarning = (path) =>
    path && isStale(path) ? "Changed on disk since this draft" : null;

  const toggle = (panel) => setOpen((all) => ({ ...all, [panel]: !all[panel] }));

  /* Moving folds: by dragging a grip onto another fold, or with the arrow keys. */
  const gripFor = (id, title) => ({
    handle: {
      draggable: true,
      "aria-label": `Move the ${title} panel. Use the up and down arrow keys.`,
      title: "Drag to reorder",
      onDragStart: (event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
        setMovingPanel(id);
      },
      onDragEnd: () => {
        setMovingPanel(null);
        setDropTarget(null);
      },
      onKeyDown: (event) => {
        const index = order.indexOf(id);
        if (event.key === "ArrowUp") setOrder((all) => move(all, id, index - 1));
        else if (event.key === "ArrowDown") setOrder((all) => move(all, id, index + 1));
        else return;
        event.preventDefault();
      },
    },
    target: {
      onDragOver: (event) => {
        if (!movingPanel || movingPanel === id) return;
        event.preventDefault();
        setDropTarget(id);
      },
      onDragLeave: () => setDropTarget((current) => (current === id ? null : current)),
      onDrop: (event) => {
        event.preventDefault();
        const moving = event.dataTransfer.getData("text/plain") || movingPanel;
        if (moving && moving !== id) setOrder((all) => move(all, moving, all.indexOf(id)));
        setMovingPanel(null);
        setDropTarget(null);
      },
    },
  });

  const labRef = useRef(null);

  /*
    Dragging the divider. The iframe would swallow the pointer as soon as it
    passed over the preview, so while a drag is on it ignores the pointer.
  */
  const startDrag = (event) => {
    event.preventDefault();
    setDragging(true);
    const follow = (moveEvent) => {
      const box = labRef.current.getBoundingClientRect();
      setSplit(clampSplit(((moveEvent.clientX - box.left) / box.width) * 100));
    };
    const stop = () => {
      setDragging(false);
      window.removeEventListener("pointermove", follow);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", follow);
    window.addEventListener("pointerup", stop);
  };

  const nudge = (event) => {
    if (event.key === "ArrowLeft") setSplit((value) => clampSplit(value - SPLIT.step));
    else if (event.key === "ArrowRight") setSplit((value) => clampSplit(value + SPLIT.step));
    else return;
    event.preventDefault();
  };

  /* The library as the compile sees it: the files on disk, with any drafts on top. */
  const compileFiles = useMemo(() => {
    const files = new Map();
    disk.forEach((text, path) => {
      if (path.startsWith("scss/")) files.set(`/${path}`, text);
    });
    Object.entries(drafts).forEach(([path, draft]) => {
      if (path.startsWith("scss/") && draft) files.set(`/${path}`, draft.text);
    });
    return files;
  }, [disk, drafts]);

  const [result, setResult] = useState({ css: "", warnings: [], error: null });
  const [lastGood, setLastGood] = useState("");
  const [compiler, setCompiler] = useState("");

  useEffect(() => {
    if (!name) return undefined;
    let cancelled = false;
    (async () => {
      const sass = await loadSass();
      if (cancelled) return;
      setCompiler(String(sass.info || "").split("\t").slice(0, 2).join(" "));
      const source = LOADS_LIBRARY.test(scss) ? scss : `@use "gerillass" as *; ${scss}`;
      const warnings = [];
      const started = performance.now();
      try {
        const { css } = sass.compileString(source, {
          importers: [makeImporter(compileFiles)],
          logger: collectingLogger(warnings),
          style: "expanded",
        });
        if (cancelled) return;
        setResult({ css, warnings, error: null, ms: Math.round(performance.now() - started) });
        setLastGood(css);
      } catch (error) {
        if (cancelled) return;
        const message = ((error && error.message) || String(error)).replace(ANSI, "");
        setResult({ css: "", warnings, error: message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [name, scss, compileFiles]);

  if (!names.length) {
    return (
      <main className="lab">
        <h1 className="lab__title">Lab</h1>
        <p>No cases yet. Add name.scss and name.html to site/lab/cases.</p>
      </main>
    );
  }

  const panels = {
    source: (
      <Panel
        key="source"
        id="source"
        title="Library"
        meta={sources.length ? null : "no library call found"}
        warning={staleWarning(sourcePath)}
        actions={sourcePath ? fileActions(sourcePath) : null}
        open={open.source}
        onToggle={() => toggle("source")}
        grip={gripFor("source", "Library")}
        dropTarget={dropTarget === "source"}
      >
        {sourcePath ? (
          <>
            {sources.length > 1 && (
              <span className="lab__files" role="group" aria-label="Library files">
                {sources.map((path) => (
                  <button
                    key={path}
                    type="button"
                    aria-pressed={path === sourcePath}
                    onClick={() => setShown((all) => ({ ...all, [name]: path }))}
                  >
                    {path.slice(path.lastIndexOf("/") + 2).replace(/\.scss$/, "")}
                    {isDraft(path) ? " *" : ""}
                  </button>
                ))}
              </span>
            )}
            <p className="lab__path">{sourcePath}</p>
            <EditableCode
              key={sourcePath}
              language="scss"
              label={sourcePath}
              value={read(sourcePath)}
              onChange={(value) => setDraft(sourcePath, value)}
            />
          </>
        ) : (
          <p className="lab__empty">
            Call a mixin with @include, or a function by name, and its file shows here.
          </p>
        )}
      </Panel>
    ),
    scss: (
      <Panel
        key="scss"
        id="scss"
        title="SCSS"
        warning={staleWarning(scssPath)}
        actions={fileActions(scssPath)}
        open={open.scss}
        onToggle={() => toggle("scss")}
        grip={gripFor("scss", "SCSS")}
        dropTarget={dropTarget === "scss"}
      >
        <EditableCode
          language="scss"
          label={scssPath}
          value={scss}
          onChange={(value) => setDraft(scssPath, value)}
        />
      </Panel>
    ),
    css: (
      <Panel
        key="css"
        id="css"
        title="CSS"
        meta={result.error ? "did not compile" : result.ms != null ? `${result.ms} ms` : null}
        open={open.css}
        onToggle={() => toggle("css")}
        grip={gripFor("css", "CSS")}
        dropTarget={dropTarget === "css"}
      >
        <CodeBlock language="css">
          {result.error ? "/* The Sass did not compile. */" : result.css || "/* No CSS. */"}
        </CodeBlock>
      </Panel>
    ),
    html: (
      <Panel
        key="html"
        id="html"
        title="HTML"
        warning={staleWarning(htmlPath)}
        actions={fileActions(htmlPath)}
        open={open.html}
        onToggle={() => toggle("html")}
        grip={gripFor("html", "HTML")}
        dropTarget={dropTarget === "html"}
      >
        <EditableCode
          language="html"
          label={htmlPath}
          value={html}
          onChange={(value) => setDraft(htmlPath, value)}
        />
      </Panel>
    ),
  };

  return (
    /*
      Two halves of the window with a full-height divider between them: the
      lab on the left (the cases and the case's source), and on the right
      nothing but the rendered page, white and edge to edge. The divider can be
      dragged, and a double click puts it back in the middle.

      The switch beside the case's name takes the preview and the divider away
      and gives the lab the whole window. The split is kept for when it comes
      back.
    */
    <main
      ref={labRef}
      className={`lab${dragging ? " is-dragging" : ""}`}
      style={{
        gridTemplateColumns: preview
          ? `minmax(0, ${split}fr) auto minmax(0, ${100 - split}fr)`
          : "minmax(0, 1fr)",
      }}
    >
      <div className="lab__left">
        <div className="lab__body">
          <nav className="lab__cases" aria-label="Cases">
            <header className="lab__header">
              <h1 className="lab__title">Lab</h1>
              <p className="lab__note">
                Dev server only. Compiles <code>scss/</code> with{" "}
                {compiler || "Dart Sass"}. Save writes to disk.
              </p>
            </header>
            <h2 className="lab__cases__title">Cases</h2>
            <ul role="list">
              {names.map((caseName) => (
                <li key={caseName}>
                  <button
                    type="button"
                    className={`lab__cases__link${caseName === name ? " is-current" : ""}`}
                    aria-current={caseName === name ? "true" : undefined}
                    onClick={() => setParams({ case: caseName })}
                  >
                    {titleCase(caseName)}
                    {caseTouched(caseName) ? " *" : ""}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lab__source">
            <div className="lab__case__head">
              <div className="lab__case__text">
                <h2 className="lab__case__name">{titleCase(name)}</h2>
                {sources[0] && SUMMARIES.get(sources[0]) && (
                  <p className="lab__case__summary">{SUMMARIES.get(sources[0])}</p>
                )}
              </div>
              <button
                type="button"
                className="lab__preview-toggle"
                aria-expanded={preview}
                aria-controls="lab-preview"
                aria-label={preview ? "Hide the preview" : "Show the preview"}
                title={preview ? "Hide the preview" : "Show the preview"}
                onClick={() => setPreview((visible) => !visible)}
              >
                {preview ? <PanelRightCloseIcon size={18} /> : <PanelRightOpenIcon size={18} />}
              </button>
            </div>

            {saveError && (
              <pre className="lab__message lab__message--error">{`Not saved. ${saveError}`}</pre>
            )}
            {result.error && (
              <pre className="lab__message lab__message--error">
                {result.error}
                {lastGood ? "\n\nThe preview shows the last successful compile." : ""}
              </pre>
            )}
            {result.warnings.map((warning) => (
              <pre key={warning} className="lab__message lab__message--warning">
                {warning}
              </pre>
            ))}

            <div className="lab__panels">{order.map((id) => panels[id])}</div>
          </div>
        </div>
      </div>

      {preview && (
        <div
          className="lab__divider"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize the lab and the preview"
          aria-valuemin={SPLIT.min}
          aria-valuemax={SPLIT.max}
          aria-valuenow={Math.round(split)}
          tabIndex={0}
          onPointerDown={startDrag}
          onKeyDown={nudge}
          onDoubleClick={() => setSplit(SPLIT.initial)}
        />
      )}

      {preview && (
        <div id="lab-preview" className="lab__render">
          <iframe
            className="lab__frame"
            title={`${name} preview`}
            srcDoc={previewDocument(result.error ? lastGood : result.css, html)}
          />
        </div>
      )}
    </main>
  );
}

export default Lab;
