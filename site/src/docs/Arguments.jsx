import React from "react";

import manifest from "../../../gerillass.json";
import "./arguments.scss";

/*
  A member's arguments, written by hand and checked against the manifest.

  Generating this table was considered and rejected, for a reason worth
  recording so it is not reconsidered from scratch. The manifest holds the
  signature default; the table shows the effective one, and for `aspect-ratio`
  those differ: the signature says `null` and a reader gets `16/9`, because
  `null` becomes the default inside the mixin. Both are true and they answer
  different questions. A generated table would print `$ratio (null)`, which is
  correct and useless. The manifest also has no notion of a type, and its
  `accepts` is a list where the page wants a sentence.

  So the prose stays with the page and the names are checked instead: an
  argument the manifest does not have, or one the page forgot, fails the
  build. That catches the drift that matters -- a renamed or added argument --
  without pushing editorial writing into a data file.
*/

function Arguments({ of: name, footnote, children }) {
  const member = manifest.members.find((m) => m.name === name);
  if (!member) {
    throw new Error(`No member named "${name}" in gerillass.json.`);
  }

  const documented = React.Children.toArray(children)
    .map((child) => (React.isValidElement(child) ? child.props.name : null))
    .filter(Boolean)
    // The page writes "$ratio (16/9)"; the manifest knows it as "$ratio".
    .map((label) => label.split(/\s|\(/)[0]);

  const expected = member.arguments.map((a) => a.name);

  const missing = expected.filter((a) => !documented.includes(a));
  const extra = documented.filter((a) => !expected.includes(a));

  if (missing.length || extra.length) {
    throw new Error(
      `The arguments documented for "${name}" do not match gerillass.json.` +
        (missing.length ? `\n  Not documented: ${missing.join(", ")}` : "") +
        (extra.length ? `\n  Documented but not in the signature: ${extra.join(", ")}` : "") +
        `\n  The signature is: ${member.signature}`
    );
  }

  return (
    <div className="arguments">
      <table className="arguments__table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {footnote ? <p className="arguments__footnote">{footnote}</p> : null}
    </div>
  );
}

export function Argument({ name, type, children }) {
  return (
    <tr>
      <td>
        <code>{name}</code>
      </td>
      <td className="arguments__type">{type}</td>
      <td>{children}</td>
    </tr>
  );
}

export default Arguments;
