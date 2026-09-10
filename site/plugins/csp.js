import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";

/*
  The Content-Security-Policy, written into _headers after the build.

  It is generated rather than kept by hand for one reason: the policy has to
  name the SHA-256 of every inline script in the page, and a hash kept by hand
  drifts the moment somebody edits one. The failure is silent in the worst
  direction -- the script is the analytics guard, so the tag would simply stop
  running and nothing would say so. Reading the hashes off the built file means
  they cannot disagree with it.

  index.html carries two inline scripts, the analytics guard and the ionicons
  loader, and every generated page inherits both. That is checked below rather
  than assumed: a page whose inline scripts differ from the landing page's
  would need its own policy, and this writes one policy for the whole site.
*/

// Any <script> with no src attribute.
const INLINE = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;

const TOKEN = "%CSP%";

/*
  Every host the site actually reaches, measured by loading the landing page,
  a documentation page, the playground and an example with an embedded video
  and reading what the browser asked for. Grepping the source found most of
  them and missed three: avatars.githubusercontent.com behind the supporters
  row, p.typekit.net behind the font CSS, and the analytics cookie-sync pixel.
*/
const SOURCES = {
  // Typekit serves the font CSS from use. and the faces from p.
  typekit: ["https://use.typekit.net", "https://p.typekit.net"],
  // The tag itself, then where it sends what it collects.
  analytics: [
    "https://www.googletagmanager.com",
    "https://analytics.google.com",
    "https://*.google-analytics.com",
  ],
  // <ion-icon>, loaded as a module from unpkg by the second inline script.
  icons: ["https://unpkg.com"],
  // The playground: Dart Sass and immutable as scripts, then the library's
  // own .scss sources and the file listing that enumerates them.
  playground: [
    "https://cdn.jsdelivr.net",
    "https://data.jsdelivr.com",
    "https://registry.npmjs.org",
  ],
};

function policy(hashes) {
  /*
    'unsafe-eval' is the playground's, and it was measured rather than
    anticipated: with the policy on, the page rendered one editor instead of
    two and the app printed "Evaluating a string as JavaScript violates the
    following Content Security Policy directive". Dart Sass's browser build
    compiles through eval, so without this the playground has no compiler. The
    same build served without the header produced both editors and 354
    characters of CSS, which is what identified the header as the cause.

    It could be narrowed to /playground alone, since _headers takes a path per
    block. That is not done here because two blocks both matching a request
    may well send two Content-Security-Policy headers, and a browser given two
    enforces both, which would put the eval block straight back. Worth an
    experiment against Netlify rather than a guess.
  */
  const script = [
    "'self'",
    "'unsafe-eval'",
    ...hashes,
    ...SOURCES.analytics.slice(0, 1),
    ...SOURCES.icons,
    SOURCES.playground[0],
  ];

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    /*
      The same thing X-Frame-Options: SAMEORIGIN says, in the header that
      replaced it. Both are sent, because the older one is what some scanners
      still look for.
    */
    "frame-ancestors 'self'",
    // The Download button and the Slack invitation are both <form action>.
    "form-action 'self' https://github.com https://join.slack.com",
    `script-src ${script.join(" ")}`,
    /*
      'unsafe-inline' is unavoidable here and costs little: React writes style
      attributes, Typekit injects a <style>, and every example iframe carries
      its own <style> block. A style attribute cannot carry a hash, and CSP has
      no nonce that survives a static header.
    */
    `style-src 'self' 'unsafe-inline' ${SOURCES.typekit.join(" ")}`,
    `font-src 'self' data: ${SOURCES.typekit.join(" ")}`,
    "img-src 'self' data: https://avatars.githubusercontent.com https://api.producthunt.com https://www.googletagmanager.com https://*.google-analytics.com",
    `connect-src 'self' ${SOURCES.analytics.join(" ")} https://api.github.com ${SOURCES.playground.join(" ")} ${SOURCES.icons.join(" ")}`,
    /*
      The examples are srcdoc frames, which inherit this policy rather than
      being fetched, and one of them embeds a YouTube player inside itself.
    */
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
    "upgrade-insecure-requests",
  ].join("; ");
}

function inlineHashes(html) {
  return [...html.matchAll(INLINE)]
    .map((m) => m[1])
    .filter((body) => body.trim())
    .map((body) => `'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
}

function pages(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`;
    if (statSync(full).isDirectory()) {
      // The icon font's own demo pages are not built from index.html.
      if (entry !== "assets" && entry !== "icons") pages(full, out);
    } else if (entry.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

export default function writeCsp(outDir) {
  const hashes = inlineHashes(readFileSync(`${outDir}/index.html`, "utf8"));
  if (!hashes.length) {
    throw new Error("csp: index.html has no inline script, which it should. Check the regex.");
  }

  /*
    Every generated page has to carry the same inline scripts, because one
    header covers all of them. A page that differs would be served a policy
    that forbids its own script, so this fails the build rather than shipping
    a page that silently loses its analytics.
  */
  const wanted = hashes.join(" ");
  for (const file of pages(outDir)) {
    const found = inlineHashes(readFileSync(file, "utf8")).join(" ");
    if (found !== wanted) {
      throw new Error(`csp: ${file} carries different inline scripts from index.html.`);
    }
  }

  const path = `${outDir}/_headers`;
  const headers = readFileSync(path, "utf8");
  if (!headers.includes(TOKEN)) {
    throw new Error(`csp: ${TOKEN} is not in public/_headers, so the policy has nowhere to go.`);
  }

  writeFileSync(path, headers.replace(TOKEN, `Content-Security-Policy: ${policy(hashes)}`));
  return { hashes: hashes.length };
}
