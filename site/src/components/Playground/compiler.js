/*
  Compiling Sass in the browser.

  Dart Sass publishes a browser build, but it does not hand you an API on its
  own: `sass.dart.js` pushes a loader onto `globalThis._cliPkgExports`, and that
  loader wants an `immutable` instance injected before it hands the API back.
  Both files come from the CDN and are only ever fetched on the playground
  route — together they are the size of the rest of the site several times over.

  The library itself is pulled from jsDelivr, which serves the `.scss` sources
  of any published version. Everything is fetched up front and in parallel (86
  files, ~95KB for 1.5.0) so that the importer can answer synchronously: letting
  Sass ask for one file at a time over the network turns a 50ms compile into a
  14 second one.
*/

const SASS_VERSION = "1.104.0";
const IMMUTABLE_VERSION = "5.1.5";

const SASS_URL = `https://cdn.jsdelivr.net/npm/sass@${SASS_VERSION}/sass.dart.js`;
const IMMUTABLE_URL = `https://cdn.jsdelivr.net/npm/immutable@${IMMUTABLE_VERSION}/dist/immutable.js`;

/* Canonical urls have to carry a scheme Sass recognises as absolute. */
const SCHEME = "gerillass:";

/* How many library files to pull at once. */
const CONCURRENCY = 12;

let sassPromise = null;
const libraries = new Map();

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });
}

export function loadSass() {
  if (!sassPromise) {
    sassPromise = (async () => {
      await loadScript(IMMUTABLE_URL);
      await loadScript(SASS_URL);
      const loader = window._cliPkgExports && window._cliPkgExports.pop();
      if (!loader) throw new Error("The Sass build did not register itself");
      if (window._cliPkgExports.length === 0) delete window._cliPkgExports;
      const api = {};
      loader.load({ immutable: window.Immutable }, api);
      return api;
    })().catch((error) => {
      /* Let the next attempt try again rather than caching the failure. */
      sassPromise = null;
      throw error;
    });
  }
  return sassPromise;
}

/*
  Sass asks for partials the way it would on disk: `foo/bar` may live at
  `foo/_bar.scss`, `foo/bar.scss` or `foo/bar/_index.scss`.
*/
function candidates(path) {
  const cut = path.lastIndexOf("/");
  const dir = path.slice(0, cut + 1);
  const name = path.slice(cut + 1);
  if (name.endsWith(".scss")) return [path];
  return [
    `${dir}_${name}.scss`,
    `${dir}${name}.scss`,
    `${dir}${name}/_index.scss`,
    `${dir}${name}/index.scss`,
  ];
}

export function loadLibrary(version) {
  if (!libraries.has(version)) {
    const promise = (async () => {
      const base = `https://cdn.jsdelivr.net/npm/gerillass@${version}`;
      const meta = await fetch(
        `https://data.jsdelivr.com/v1/packages/npm/gerillass@${version}`
      ).then((response) => {
        if (!response.ok) throw new Error(`jsDelivr answered ${response.status}`);
        return response.json();
      });

      const paths = [];
      const walk = (nodes, prefix) =>
        nodes.forEach((node) =>
          node.type === "directory"
            ? walk(node.files, `${prefix}/${node.name}`)
            : paths.push(`${prefix}/${node.name}`)
        );
      walk(meta.files, "");

      /*
        Firing all 86 requests at once makes the CDN drop a few of them — they
        come back without the CORS header, which fetch reports as a network
        error. A small window plus one retry is enough, and a library that is
        still missing a file has to fail loudly: a half loaded one only shows up
        later as "Can't find stylesheet", pointing at the wrong culprit.
      */
      const wanted = paths.filter((path) => path.endsWith(".scss"));
      const files = new Map();

      const fetchInto = async (path) => {
        const response = await fetch(base + path);
        if (!response.ok) throw new Error(`${path} answered ${response.status}`);
        files.set(path, await response.text());
      };

      const run = async (queue, onError) => {
        const workers = Array.from({ length: CONCURRENCY }, async () => {
          while (queue.length) {
            const path = queue.pop();
            try {
              await fetchInto(path);
            } catch (error) {
              onError(path, error);
            }
          }
        });
        await Promise.all(workers);
      };

      const retry = [];
      await run(wanted.slice(), (path) => retry.push(path));
      const failed = [];
      await run(retry, (path) => failed.push(path));

      if (failed.length) {
        throw new Error(
          `Could not load gerillass@${version} in full (${failed.length} of ${wanted.length} files failed)`
        );
      }
      return files;
    })().catch((error) => {
      libraries.delete(version);
      throw error;
    });
    libraries.set(version, promise);
  }
  return libraries.get(version);
}

function makeImporter(files) {
  const resolve = (path) =>
    candidates(path).find((candidate) => files.has(candidate)) || null;

  return {
    canonicalize(url) {
      let path = null;
      if (url === "gerillass" || url === `${SCHEME}gerillass`) {
        path = "/scss/_gerillass.scss";
      } else if (url.startsWith(`${SCHEME}/`)) {
        path = url.slice(SCHEME.length);
      }
      if (path === null) return null;
      const hit = resolve(path);
      return hit ? new URL(SCHEME + hit) : null;
    },
    load(canonicalUrl) {
      const hit = resolve(canonicalUrl.pathname);
      return hit ? { contents: files.get(hit), syntax: "scss" } : null;
    },
  };
}

/*
  Warnings from the library are not the visitor's to read: 2.0.0 dropped
  @import internally, but it still calls Sass's own `if()` in 21 places, which
  a recent Dart Sass deprecates, and every 1.x release is loud about @import
  from the first line. All of it belongs to whichever release is loaded rather
  than to whatever was typed, so the logger swallows it.
*/
const quietLogger = { warn() {}, debug() {} };

/*
  Sass colourises the code frame in its error messages with ANSI escapes, which
  only make sense in a terminal. The frame itself is worth keeping — it points
  at the offending line — so strip the escapes rather than the message.
*/
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g;

/* Which Dart Sass does the compiling, for the page to own up to. */
export const COMPILER = `Dart Sass ${SASS_VERSION}`;

export async function compile(source, version, style) {
  const [sass, files] = await Promise.all([loadSass(), loadLibrary(version)]);
  try {
    return sass.compileString(source, {
      importers: [makeImporter(files)],
      logger: quietLogger,
      style,
    }).css;
  } catch (error) {
    const message = (error && error.message) || String(error);
    throw new Error(message.replace(ANSI, ""));
  }
}
