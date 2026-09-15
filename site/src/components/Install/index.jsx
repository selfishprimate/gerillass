import React from "react";
import { Link } from "react-router-dom";

import CodeBlock from "components/CodeBlock";

import "./install.scss";

/*
  The one command that gets the library into a project, between the page's
  introduction and the demonstration of what it does.

  It is the site's CodeBlock rather than a block of its own, so it carries the
  same copy button the documentation and the playground offer. The rest of
  what setting up takes (Yarn, the @use line, the build tool recipes) is on the
  installation page, which is where the link goes.
*/
function Install() {
  return (
    <section className="install section">
      <div className="section__inner">
        <div className="install__block">
          <CodeBlock language="bash" label="npm">
            {/* The installation page's own command: a Sass library is needed
                while the site is built, not by the browser. */}
            {"npm install gerillass --save-dev"}
          </CodeBlock>
        </div>
        <p className="install__hint">
          Using Yarn, or setting up a build tool? See the{" "}
          <Link to="/docs/installation">installation guide</Link>.
        </p>
      </div>
    </section>
  );
}

export default Install;
