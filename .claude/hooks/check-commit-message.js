#!/usr/bin/env node
//
// PreToolUse guard: a commit made through Claude Code follows the standard in
// .claude/skills/commit-and-pr/SKILL.md.
//
// It reads the Bash command about to run, and when that command is a
// `git commit`, finds the message and checks three things: the subject is at
// most 72 characters, the subject does not end in a full stop, and there is a
// body, meaning at least one line after the blank line that is not a trailer
// such as Co-Authored-By.
//
// The message is found in the forms a commit is written in here: `-m`, once or
// more (git joins them as paragraphs), `-F -` with a heredoc, and `-F path`.
// A message built from a shell variable, `-m "$MSG"`, cannot be read from the
// command, so it is refused rather than guessed at: that is exactly how
// commits without a body got through before this hook. Commits that reuse an
// existing message (`--amend --no-edit`, `-C`, `-c`, `--fixup`, `--squash`)
// are left alone.
//
// Exit 2 blocks the command and feeds stderr back to Claude. It only sees
// commands Claude Code runs; commits made in a terminal are not its business.

const fs = require("fs");
const path = require("path");

const SUBJECT_LIMIT = 72;
const TRAILER = /^[A-Za-z][A-Za-z-]*: /;

function readPayload() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8"));
  } catch {
    return null;
  }
}

/*
  The part of the command that belongs to one `git commit`: from its start to
  the first unquoted `&&`, `||`, `;`, `|` or newline. A heredoc body is not
  part of it; it is looked up separately.
*/
function commitSegments(command) {
  const segments = [];
  const pattern = /\bgit\s+(?:-C\s+\S+\s+)?commit\b/g;
  let match;
  while ((match = pattern.exec(command))) {
    let i = match.index;
    let quote = null;
    let end = command.length;
    for (; i < command.length; i++) {
      const ch = command[i];
      if (quote) {
        if (ch === "\\" && quote === '"') i++;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'") quote = ch;
      else if (ch === "\n" || ch === ";" || (ch === "|" && command[i + 1] !== "|")) {
        end = i;
        break;
      } else if ((ch === "&" && command[i + 1] === "&") || (ch === "|" && command[i + 1] === "|")) {
        end = i;
        break;
      }
    }
    segments.push({ start: match.index, text: command.slice(match.index, end), end });
  }
  return segments;
}

/* Shell words of a segment, with their quoting remembered. */
function words(segment) {
  const out = [];
  let i = 0;
  while (i < segment.length) {
    while (i < segment.length && /\s/.test(segment[i])) i++;
    if (i >= segment.length) break;
    let word = "";
    let dynamic = false;
    while (i < segment.length && !/\s/.test(segment[i])) {
      const ch = segment[i];
      if (ch === "'") {
        const close = segment.indexOf("'", i + 1);
        const stop = close < 0 ? segment.length : close;
        word += segment.slice(i + 1, stop);
        i = stop + 1;
      } else if (ch === '"') {
        i++;
        while (i < segment.length && segment[i] !== '"') {
          if (segment[i] === "\\" && i + 1 < segment.length) {
            word += segment[i + 1];
            i += 2;
          } else {
            if (segment[i] === "$" || segment[i] === "`") dynamic = true;
            word += segment[i];
            i++;
          }
        }
        i++;
      } else {
        if (ch === "$" || ch === "`") dynamic = true;
        word += ch;
        i++;
      }
    }
    out.push({ word, dynamic });
  }
  return out;
}

function heredocAfter(command, segmentEnd, segmentText) {
  const marker = segmentText.match(/<<-?\s*(['"]?)([A-Za-z_][\w]*)\1/);
  if (!marker) return null;
  const bodyStart = command.indexOf("\n", segmentEnd === command.length ? command.length : segmentEnd);
  if (bodyStart < 0) return null;
  const rest = command.slice(bodyStart + 1);
  const lines = rest.split("\n");
  const closing = lines.findIndex((line) => line.trim() === marker[2]);
  if (closing < 0) return null;
  return { text: lines.slice(0, closing).join("\n"), dynamic: marker[1] === "" && /\$|`/.test(lines.slice(0, closing).join("\n")) };
}

/*
  The message of one commit, or a reason it cannot be known. Returns
  { skip: true } for a commit that reuses a message, { message } when found,
  { unreadable } when the command builds it where the hook cannot see.
*/
function messageOf(command, segment, cwd) {
  const tokens = words(segment.text);
  const flags = tokens.map((t) => t.word);

  if (flags.some((f) => /^(-C|-c|--reuse-message|--reedit-message|--fixup|--squash)(=|$)/.test(f))) {
    return { skip: true };
  }
  const amend = flags.includes("--amend");

  const parts = [];
  let fromFile = null;
  for (let i = 0; i < tokens.length; i++) {
    const { word } = tokens[i];
    let value = null;
    let valueToken = null;
    if (word === "-m" || word === "--message") {
      valueToken = tokens[i + 1];
      value = valueToken && valueToken.word;
      i++;
    } else if (/^--message=/.test(word)) {
      value = word.slice("--message=".length);
      valueToken = tokens[i];
    } else if (/^-m./.test(word)) {
      value = word.slice(2);
      valueToken = tokens[i];
    } else if (word === "-F" || word === "--file") {
      fromFile = tokens[i + 1] ? tokens[i + 1].word : null;
      i++;
      continue;
    } else if (/^--file=/.test(word)) {
      fromFile = word.slice("--file=".length);
      continue;
    } else {
      continue;
    }
    if (valueToken && valueToken.dynamic) {
      return { unreadable: "the message comes from a shell variable or command substitution" };
    }
    if (value != null) parts.push(value);
  }

  if (fromFile !== null) {
    if (fromFile === "-") {
      const heredoc = heredocAfter(command, segment.end, segment.text);
      if (!heredoc) return { unreadable: "the message is read from standard input without a heredoc" };
      if (heredoc.dynamic) {
        return { unreadable: "the heredoc is unquoted and expands shell variables; quote its delimiter, <<'EOF'" };
      }
      return { message: heredoc.text };
    }
    const file = path.resolve(cwd || process.cwd(), fromFile);
    if (!fs.existsSync(file)) return { unreadable: `the message file ${fromFile} does not exist yet` };
    return { message: fs.readFileSync(file, "utf8") };
  }

  if (parts.length) return { message: parts.join("\n\n") };
  if (amend) return { skip: true };
  // No -m and no -F: git opens an editor, which cannot happen here.
  return { skip: true };
}

function problemsWith(message) {
  const lines = message.replace(/\r/g, "").split("\n").filter((line) => !line.startsWith("#"));
  while (lines.length && !lines[0].trim()) lines.shift();
  const subject = (lines[0] || "").trim();
  const problems = [];

  if (!subject) problems.push("the subject line is empty");
  if (subject.length > SUBJECT_LIMIT) {
    problems.push(`the subject is ${subject.length} characters; the limit is ${SUBJECT_LIMIT}`);
  }
  if (/\.$/.test(subject)) problems.push("the subject ends in a full stop");

  const rest = lines.slice(1);
  if (rest.length && rest[0].trim()) {
    problems.push("there is no blank line between the subject and the body");
  }
  const body = rest.filter((line) => line.trim() && !TRAILER.test(line.trim()));
  if (!body.length) problems.push("there is no body: add a paragraph saying what changed and why");

  return problems;
}

const payload = readPayload();
const command = payload && payload.tool_input && payload.tool_input.command;
if (!command || !/\bgit\b[\s\S]*\bcommit\b/.test(command)) process.exit(0);

const failures = [];
for (const segment of commitSegments(command)) {
  const found = messageOf(command, segment, payload.cwd);
  if (found.skip) continue;
  if (found.unreadable) {
    failures.push(`The commit message cannot be checked: ${found.unreadable}.`);
    continue;
  }
  const problems = problemsWith(found.message);
  if (problems.length) {
    failures.push(`The commit message breaks the standard:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  }
}

if (!failures.length) process.exit(0);

process.stderr.write(`${failures.join("\n\n")}

Write the message with a quoted heredoc, with a subject of at most 72
characters and no full stop, a blank line, a body saying what changed and
why, and the trailer last:

  git commit -F - <<'EOF'
  Subject line

  Body.

  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  EOF

The standard is in .claude/skills/commit-and-pr/SKILL.md.
`);
process.exit(2);
