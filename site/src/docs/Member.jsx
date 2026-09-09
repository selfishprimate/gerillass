import React from "react";

import manifest from "../../../gerillass.json";
import "./member.scss";

/*
  The header of a member's page: what it is, how it is called, and where its
  source lives.

  The name is looked up in the manifest and the lookup is the check. A page for
  a member that does not exist, or one left behind after a member was removed,
  fails the build here rather than sitting on the site describing nothing --
  which is how `ratio-box` lingered on docs.gerillass.com after 2.0.0 deleted
  it.

  Two things come from the manifest rather than from the page: the source path,
  because `scss/library/_name.scss` is wrong for every one of the 23 functions,
  and the kind, because "Mixin" or "Function" is not a thing a page should be
  able to get wrong.
*/

const REPO = "https://github.com/selfishprimate/gerillass/blob/main";

function Member({ name, children }) {
  const member = manifest.members.find((m) => m.name === name);

  if (!member) {
    throw new Error(
      `No member named "${name}" in gerillass.json. ` +
        `Either the page is for something that no longer exists, or the name is misspelt.`
    );
  }

  const isMixin = member.kind === "mixin";

  return (
    <div className="member">
      <div className="member__meta">
        <span className="member__kind">
          {isMixin ? "Mixin" : "Function"}
        </span>
        <code className="member__call">
          {isMixin ? <span className="member__include">@include </span> : null}
          {member.name}();
        </code>
      </div>

      {isMixin ? (
        <p className="member__note">
          Callable with or without the <code>{manifest.prefix}</code> prefix, so{" "}
          <code>@include {manifest.prefix}{member.name}()</code> is the same mixin.
        </p>
      ) : (
        <p className="member__note">
          A function, so it is called directly and never takes <code>@include</code>.
        </p>
      )}

      <div className="member__description">{children}</div>

      <a
        className="member__source"
        href={`${REPO}/${member.file}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Source: {member.file}
      </a>
    </div>
  );
}

export default Member;
