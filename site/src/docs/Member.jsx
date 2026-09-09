import React from "react";

import manifest from "../../../gerillass.json";
import "./member.scss";

/*
  The opening of a member's page: what it does, how it is called, and where its
  source lives.

  Not a card. This is the shape the documentation has always had: a rule under
  the title, the type on one side and the call on the other, the namespace note
  under that, then the description as ordinary page prose and a link to the
  source at the end. Boxing the description made the page open on a panel of
  chrome rather than on the sentence a reader came for.

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
      <div className="member__subheader">
        <div className="member__item">
          <span className="member__key">Type:</span>{" "}
          <span className="member__value">{isMixin ? "Mixin" : "Function"}</span>
        </div>
        <div className="member__item">
          <span className="member__call">
            {isMixin ? <span className="member__method">@include </span> : null}
            <span className="member__name">{member.name}();</span>
          </span>
        </div>
      </div>

      {isMixin ? (
        <p className="member__note">
          * You can call mixins with or without the{" "}
          <code>
            <strong>{manifest.prefix}</strong>
          </code>{" "}
          namespace (e.g. <code>@include {manifest.prefix}{member.name}();</code>).
        </p>
      ) : null}

      <div className="member__description">{children}</div>

      <div className="member__actions">
        <a
          className="member__source"
          href={`${REPO}/${member.file}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {/*
            ionicons is loaded by index.html for the whole site, so the element
            hydrates into an icon in the browser and is simply absent before
            that rather than showing a broken one.
          */}
          <ion-icon name="logo-github" class="member__icon"></ion-icon>
          <span>Github Source Code</span>
        </a>
      </div>
    </div>
  );
}

export default Member;
