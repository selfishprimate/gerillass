import React, { useState } from "react";
import { Link } from "react-router-dom";

import CodeBlock from "components/CodeBlock";

import "./install.scss";

/*
  The one command that gets the library into a project, between the page's
  introduction and the demonstration of what it does.

  Gerillass ships twice, to npm and to RubyGems, so the block's label is a
  switch: npm and Yarn for the npm package, and RubyGems for the gem, npm by
  default. The names are written as each project writes its own, npm in lower
  case; the capitals on screen come from the stylesheet. Each command is the installation page's own. It is the site's
  CodeBlock rather than a block of its own, so the copy button copies whichever
  command is showing. The rest of what setting up takes (build tools, Rails,
  Jekyll) is on the installation page, which is where the link goes.
*/
const SOURCES = [
  {
    id: "npm",
    name: "npm",
    // A Sass library is needed while the site is built, not by the browser.
    command: "npm install gerillass --save-dev",
    hint: "Setting up Vite, webpack or another build tool?",
  },
  {
    id: "yarn",
    name: "Yarn",
    command: "yarn add gerillass --dev",
    hint: "Setting up Vite, webpack or another build tool?",
  },
  {
    id: "ruby",
    name: "RubyGems",
    command: "bundle add gerillass",
    hint: "Rails, Jekyll or plain Ruby?",
  },
];

function Install() {
  const [active, setActive] = useState(SOURCES[0].id);
  const source = SOURCES.find((s) => s.id === active);

  const label = (
    <span className="install__switch" role="group" aria-label="Install with">
      {SOURCES.map((s) => (
        <button
          key={s.id}
          type="button"
          aria-pressed={s.id === active}
          onClick={() => setActive(s.id)}
        >
          {s.name}
        </button>
      ))}
    </span>
  );

  return (
    <section className="install section">
      <div className="section__inner">
        <div className="install__block">
          <CodeBlock language="bash" label={label}>
            {source.command}
          </CodeBlock>
        </div>
        <p className="install__hint">
          {source.hint} See the{" "}
          <Link to="/docs/installation">installation guide</Link>.
        </p>
      </div>
    </section>
  );
}

export default Install;
