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
};

// Values chosen because they are what a caller reaches for when the docs are
// not open: a space separated list, a bool, a colour, a bare number, a word.
const PROBES = ["nonsense", "16 9", "true", "#ff0000", "42", '"a b"'];

function run(snippet) {
  try {
    const css = sass.compileString(`@import "gerillass";\n${snippet}\n`, OPTS).css.trim();
    return { ok: true, css };
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
const mixins = manifest.members
  .filter((m) => m.kind === "mixin")
  .filter((m) => !only.length || only.includes(m.name));

const findings = { silent: [], internal: [], passthrough: [] };

for (const m of mixins) {
  // Mixins that take no arguments have nothing to probe.
  if (!m.arguments.length) continue;

  // Reuse the documented example's context so root-only mixins are called at
  // the root and the rest inside a selector.
  const sample = (m.examples || [])[0] || `.x { @include ${m.name}; }`;
  const atRoot = /^\s*@include/.test(sample);
  // A mixin that takes a @content block emits nothing when called without one,
  // which would read as a silent failure that is really a flaw in this probe.
  const takesContent = new RegExp(`@include\\s+${m.name}\\b[^;{]*\\{`).test(sample);

  for (const probe of PROBES) {
    const call = takesContent
      ? `@include ${m.name}(${probe}) { color: red; }`
      : `@include ${m.name}(${probe});`;
    const snippet = atRoot ? call : `.probe { ${call} }`;
    const result = run(snippet);

    if (!result.ok) {
      if (INTERNAL.test(result.message)) {
        findings.internal.push({ mixin: m.name, probe, message: result.message.slice(0, 90) });
      }
      continue; // a real error is the desired outcome
    }
    if (result.css === "") findings.silent.push({ mixin: m.name, probe });
    else findings.passthrough.push({ mixin: m.name, probe, css: result.css.replace(/\s+/g, " ").slice(0, 60) });
  }
}

const line = (s) => console.log(s);

line(`Probed ${mixins.length} mixins with ${PROBES.length} bad arguments each.\n`);

line(`SILENT — produced no CSS and no error (${findings.silent.length})`);
if (!findings.silent.length) line("  none");
for (const f of findings.silent) line(`  ${f.mixin}(${f.probe})`);

line(`\nUNHELPFUL ERROR — failed, but with a Sass internal message (${findings.internal.length})`);
if (!findings.internal.length) line("  none");
for (const f of findings.internal) line(`  ${f.mixin}(${f.probe})  ${f.message}`);

line(`\nPASSED THROUGH — emitted CSS from a questionable argument (${findings.passthrough.length})`);
if (!findings.passthrough.length) line("  none");
for (const f of findings.passthrough) line(`  ${f.mixin}(${f.probe})  ${f.css}`);

line(
  `\nSilence is always a defect. An unhelpful error is a missing type check. ` +
    `Pass-through is only a defect when the value cannot be valid CSS -- review, do not assume.`
);
