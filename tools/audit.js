#!/usr/bin/env node
//
// Adversarial sweep over every mixin.
//
// The test suite only checks inputs somebody thought of. This throws the kinds
// of arguments an agent actually guesses -- a list where a string is wanted, a
// bare number, a boolean, the wrong arity -- at every mixin and reports what
// happens. Silence is the finding: a mixin that accepts nonsense without
// complaint teaches its caller that the call worked.
//
// This is a report, not a pass/fail gate. Some mixins legitimately pass their
// arguments through to CSS, so read the output rather than trusting a count.
//
// Usage: node tools/audit.js [mixin-name ...]

const fs = require("fs");
const path = require("path");
const sass = require("sass");

const ROOT = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "gerillass.json"), "utf8"));

const OPTS = {
  loadPaths: [path.join(ROOT, "scss")],
  quietDeps: true,
  silenceDeprecations: ["import", "global-builtin"],
  // @warn output would drown the report. Warnings are captured per probe below
  // instead, because a mixin that only warns still lets the build succeed.
  logger: {
    warn(message) {
      lastWarning = message;
    },
    debug() {},
  },
};

let lastWarning = null;

// Values chosen because they are what a caller reaches for when the docs are
// not open: a space separated list, a bool, a colour, a bare number, a word.
const PROBES = ["nonsense", "16 9", "true", "#ff0000", "42", '"a b"'];

function run(snippet) {
  lastWarning = null;
  try {
    const css = sass.compileString(`@import "gerillass";\n${snippet}\n`, OPTS).css.trim();
    return { ok: true, css, warning: lastWarning };
  } catch (e) {
    return { ok: false, message: e.message.split("\n")[0] };
  }
}

// A Sass internal error means the mixin failed, but with a message that tells
// the caller nothing about what the mixin wanted. Sass's own "Missing argument
// $name" is excluded on purpose: it names the argument, which is all a caller
// needs.
const INTERNAL = /is not a string|Invalid index|\$number: .* is not a number|no element|Undefined (variable|mixin)|expected (a |an )?["'a-z]/i;

const only = process.argv.slice(2);
const members = manifest.members.filter((m) => !only.length || only.includes(m.name));

const findings = { silent: [], internal: [], warned: [], passthrough: [] };

for (const m of members) {
  // A member that takes no arguments has nothing to probe.
  if (!m.arguments.length) continue;

  // Reuse the documented example's context so root-only mixins are called at
  // the root and the rest inside a selector.
  const sample = (m.examples || [])[0] || `.x { @include ${m.name}; }`;
  const atRoot = /^\s*@include/.test(sample);
  // A mixin that takes a @content block emits nothing when called without one,
  // which would read as a silent failure that is really a flaw in this probe.
  const takesContent = new RegExp(`@include\\s+${m.name}\\b[^;{]*\\{`).test(sample);

  // Probe every argument position, not just the first. A mixin often validates
  // its first argument and then hands a later one straight to unit(), unquote()
  // or nth(), and probing position 1 alone never reaches that.
  const positions = m.arguments.some((a) => a.variadic)
    ? [0]
    : m.arguments.map((_, i) => i);

  // Named arguments remove the need to fill the positions before the one being
  // probed. That matters: background-dots defaults $gutter to `$size * 5`, and
  // passing that text positionally fails with "Undefined variable" -- a finding
  // about this tool rather than the library. Required arguments have no default
  // to fall back on, so those are still taken from the documented example.
  const required = m.arguments.filter((a) => a.required);
  const exampleArgs = (() => {
    const at = sample.indexOf(`@include ${m.name}`);
    const open = at === -1 ? -1 : sample.indexOf("(", at);
    if (open === -1) return [];
    let depth = 1, quote = null, out = "";
    for (let i = open + 1; i < sample.length && depth; i++) {
      const c = sample[i];
      if (quote) { out += c; if (c === quote) quote = null; continue; }
      if (c === '"' || c === "'") quote = c;
      else if (c === "(") depth++;
      else if (c === ")") { depth--; if (!depth) break; }
      out += c;
    }
    const parts = []; let d = 0; let q = null; let cur = "";
    for (const c of out) {
      if (q) { cur += c; if (c === q) q = null; continue; }
      if (c === '"' || c === "'") q = c;
      else if (c === "(") d++;
      else if (c === ")") d--;
      if (c === "," && !d) { parts.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts;
  })();

  for (const pos of positions) {
    for (const probe of PROBES) {
      const target = m.arguments[pos];
      // A variadic argument cannot be named -- `$params: x` would be read as a
      // keyword argument rather than a value -- so it stays positional.
      let args;
      if (target.variadic) {
        args = probe;
      } else {
        const parts = required
          .filter((a) => a.name !== target.name)
          .map((a) => `${a.name}: ${exampleArgs[m.arguments.indexOf(a)] || "10px"}`);
        parts.push(`${target.name}: ${probe}`);
        args = parts.join(", ");
      }
      const label = m.arguments[pos] ? `${m.name} ${m.arguments[pos].name}=${probe}` : `${m.name}(${probe})`;

      let snippet;
      if (m.kind === "function") {
        // A function is only reachable from a value position, so give it one.
        snippet = `.probe { --probe: #{${m.name}(${args})}; }`;
      } else {
        const call = takesContent
          ? `@include ${m.name}(${args}) { color: red; }`
          : `@include ${m.name}(${args});`;
        snippet = atRoot ? call : `.probe { ${call} }`;
      }
      const result = run(snippet);

      if (!result.ok) {
        if (INTERNAL.test(result.message)) {
          findings.internal.push({ mixin: label, probe, message: result.message.slice(0, 90) });
        }
        continue; // a real error is the desired outcome
      }
      if (result.css === "") findings.silent.push({ mixin: label, probe });
      else if (result.warning) findings.warned.push({ mixin: label, probe, warning: result.warning.split("\n")[0].slice(0, 70) });
      else findings.passthrough.push({ mixin: label, probe, css: result.css.replace(/\s+/g, " ").slice(0, 60) });
    }
  }
}

const line = (s) => console.log(s);

const nMixins = members.filter((m) => m.kind === "mixin").length;
const nFns = members.filter((m) => m.kind === "function").length;
line(`Probed ${nMixins} mixins and ${nFns} functions, every argument position, ${PROBES.length} bad values each.\n`);

line(`SILENT — produced no CSS and no error (${findings.silent.length})`);
if (!findings.silent.length) line("  none");
for (const f of findings.silent) line(`  ${f.mixin}`);

line(`\nUNHELPFUL ERROR — failed, but with a Sass internal message (${findings.internal.length})`);
if (!findings.internal.length) line("  none");
for (const f of findings.internal) line(`  ${f.mixin}  ${f.message}`);

line(`\nWARNED ONLY — the build still succeeded (${findings.warned.length})`);
if (!findings.warned.length) line("  none");
for (const f of findings.warned) line(`  ${f.mixin}  ${f.warning}`);

line(`\nPASSED THROUGH — emitted CSS from a questionable argument (${findings.passthrough.length})`);
if (!findings.passthrough.length) line("  none");
for (const f of findings.passthrough) line(`  ${f.mixin}  ${f.css}`);

line(
  `\nSilence is always a defect. An unhelpful error is a missing type check. ` +
    `Pass-through is only a defect when the value cannot be valid CSS -- review, do not assume.`
);
