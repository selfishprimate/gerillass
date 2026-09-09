import React, { Component } from 'react';
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import { Link } from 'react-router-dom';
import Images from 'assets/images';
import './examples.scss';

import CodeBlock from 'components/CodeBlock';

class Examples extends Component {
  render () {
    return (
      <section className="examples section section--stretched">
        <div className="section__header hidden">
          <h2 className="section__title">How to use SCSS, CSS, Sass, and Gerillass?</h2>
        </div>

        <div className="examples__figure">
          <img
            src={Images.face_thinking}
            alt="How to use Gerillass Sass library?"
          />
        </div>

        <div className="section__inner">
          <Tabs className="examples__tab-panels">
            <TabList className="examples__tab-panels__tabs">
              <Tab className="examples__tab-panels__tabs__tab">
                <div className="examples__tab-panels__tabs__tab__title">
                  Breakpoint
                </div>
                <p className="examples__tab-panels__tabs__tab__description">
                  Create responsive design layouts via Sass, Gerillass and{" "}
                  <strong>CSS3 Media Queries</strong>.
                </p>
              </Tab>

              <Tab className="examples__tab-panels__tabs__tab">
                <div className="examples__tab-panels__tabs__tab__title">
                  Font Face
                </div>
                <p className="examples__tab-panels__tabs__tab__description">
                  Generate cross-browser compatible <strong>@font-face</strong>{" "}
                  declerations with one line of code.
                </p>
              </Tab>

              <Tab className="examples__tab-panels__tabs__tab">
                <div className="examples__tab-panels__tabs__tab__title">
                  Remove
                </div>
                <p className="examples__tab-panels__tabs__tab__description">
                  Remove any element from the document flow with the power of{" "}
                  <strong>Remove</strong> and <strong>Breakpoint</strong> Sass
                  mixins together.
                </p>
              </Tab>

              <Tab className="examples__tab-panels__tabs__tab">
                <div className="examples__tab-panels__tabs__tab__title">
                  Except
                </div>
                <p className="examples__tab-panels__tabs__tab__description">
                  You want to apply some style changes to the items within a
                  list, but not all. Well, consider it done.
                </p>
              </Tab>
            </TabList>

            <div className="examples__tab-panels__panels">
              <TabPanel className="examples__tab-panels__panels__panel highlight">
                <div className="highlight__header">
                  <h3 className="highlight__title">
                    Breakpoint Sass mixin for CSS Media Queries
                  </h3>
                  <p className="highlight__description">
                    This Sass mixin will help you to{" "}
                    <strong>write CSS media queries in Sass</strong>, and
                    generate consistent responsive layouts. Provides an easy to
                    use one-line method.
                  </p>
                </div>
                <div className="highlight__item">
                  <p className="highlight__item__description">
                    You can set a range between two values ​​(predefined or
                    custom values will be just fine) to apply our styles.
                  </p>
                  <CodeBlock language="scss">
                    {
                      ".element {\n  @include breakpoint(small, large) {\n    background-color: red;\n  } \n}"
                    }
                  </CodeBlock>
                </div>
                <div className="highlight__item">
                  <p className="highlight__item__description">
                    It will generate the CSS code below..
                  </p>
                  <CodeBlock language="scss">
                    {
                      "//CSS Output\n@media (min-width: 576px) and (max-width: 991px) {\n  .element {\n    background-color: red;\n  }\n}"
                    }
                  </CodeBlock>
                </div>
                <p className="highlight__footnote">
                  * This is just a simple demonstration of Breakpoint Sass
                  mixin. For more cool features please checkout the{" "}
                  <a
                    href="/docs/breakpoint"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    documentation
                  </a>{" "}
                  or see the{" "}
                  <a
                    href="https://github.com/selfishprimate/gerillass/blob/master/scss/library/_breakpoint.scss"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    source code on Github!
                  </a>
                </p>
              </TabPanel>

              <TabPanel className="examples__tab-panels__panels__panel highlight">
                <div className="highlight__header">
                  <h3 className="highlight__title">
                    A handy CSS font face generator
                  </h3>

                  <p className="highlight__description">
                    Font Face Sass mixin is a <strong>webfont generator</strong>{" "}
                    to help you create cross-browser compatible{" "}
                    <strong>CSS @font-face declerations</strong>.
                  </p>
                </div>
                <div className="highlight__item">
                  <p className="highlight__item__description">
                    Simply call the mixin and pass values for{" "}
                    <code>$font-family</code> and <code>$file-path</code>{" "}
                    arguments.
                  </p>
                  <CodeBlock language="scss">
                    {
                      '@include font-face("Fanwood Text", "fonts/fanwood-text/fanwood-text-regular");'
                    }
                  </CodeBlock>
                </div>
                <div className="highlight__item">
                  <p className="highlight__item__description">
                    It will generate the CSS code below..
                  </p>
                  <CodeBlock language="scss">
                    {
                      '//CSS Output\n@font-face {\n  font-family: "Fanwood Text";\n  src: url("fonts/fanwood-text/fanwood-text-regular.eot");\n  src: url("fonts/fanwood-text/fanwood-text-regular.eot?#iefix") format("embedded-opentype"),\n       url("fonts/fanwood-text/fanwood-text-regular.woff2") format("woff2"),\n       url("fonts/fanwood-text/fanwood-text-regular.woff") format("woff"),\n       url("fonts/fanwood-text/fanwood-text-regular.ttf") format("truetype"),\n       url("fonts/fanwood-text/fanwood-text-regular.svg#FanwoodText") format("svg");\n  font-style: normal;\n  font-weight: 400;\n}'
                    }
                  </CodeBlock>
                </div>
                <p className="highlight__footnote">
                  * This is just a simple demonstration of Font Face Sass mixin.
                  For more cool features please checkout the{" "}
                  <Link
                    to="/docs/font-face"
                  >
                    documentation
                  </Link>{" "}
                  or see the{" "}
                  <a
                    href="https://github.com/selfishprimate/gerillass/blob/master/scss/library/_font-face.scss"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    source code on Github!
                  </a>
                </p>
              </TabPanel>

              <TabPanel className="examples__tab-panels__panels__panel highlight">
                <div className="highlight__header">
                  <h3 className="highlight__title">
                    A flexible Sass approach to the CSS display: none property
                  </h3>
                  <p className="highlight__description">
                    This Sass mixin helps you to{" "}
                    <stong>
                      set the <code>display</code> property of an element to{" "}
                      <code>none</code>
                    </stong>
                    .
                  </p>
                </div>
                <div className="highlight__item">
                  <p className="highlight__item__description">
                    You can use <strong>$mode</strong> values to set the{" "}
                    <strong>width media feature</strong>. Accepts{" "}
                    <code>only</code>, <code>min</code>, <code>max</code> or{" "}
                    <code>between</code> values.
                  </p>
                  <CodeBlock language="scss">
                    {".element {\n  @include remove(min, 1200px);\n}"}
                  </CodeBlock>
                </div>
                <div className="highlight__item">
                  <p className="highlight__item__description">
                    It will generate the CSS code below..
                  </p>
                  <CodeBlock language="scss">
                    {
                      "//CSS Output\n@media (min-width: 1200px) {\n  .element {\n    display: none;\n  } \n}"
                    }
                  </CodeBlock>
                </div>
                <p className="highlight__footnote">
                  * This is just a simple demonstration of Remove Sass mixin.
                  For more cool features please checkout the{" "}
                  <Link
                    to="/docs/remove"
                  >
                    documentation
                  </Link>{" "}
                  or see the{" "}
                  <a
                    href="https://github.com/selfishprimate/gerillass/blob/master/scss/library/_remove.scss"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    source code on Github!
                  </a>
                </p>
              </TabPanel>

              <TabPanel className="examples__tab-panels__panels__panel highlight">
                <div className="highlight__header">
                  <h3 className="highlight__title">
                    A Sass mixin to exclude a specific element with CSS :not()
                    selector
                  </h3>
                  <p className="highlight__description">
                    This Sass mixin will help you <strong>filter element(s) </strong> from a list <strong>that you do not want to apply style changes</strong>, but you do for the others.
                    You can pass negative values and multiple arguments.
                  </p>
                </div>
                <div className="highlight__item">
                  <p className="highlight__item__description">
                    You can exclude the items within a list based on their
                    numeric positions.
                  </p>
                  <CodeBlock language="scss">
                    {
                      ".element {\n  @include except(1, 4, 8) {\n    background-color: purple;\n  }\n}"
                    }
                  </CodeBlock>
                </div>
                <div className="highlight__item">
                  <p className="highlight__item__description">
                    It will generate the CSS code below..
                  </p>
                  <CodeBlock language="scss">
                    {
                      "//CSS Output\n.element:not(:nth-of-type(1)):not(:nth-of-type(4)):not(:nth-of-type(8)) {\n  background-color: purple;\n}"
                    }
                  </CodeBlock>
                </div>
                <p className="highlight__footnote">
                  * This is just a simple demonstration of Except Sass mixin.
                  For more cool features please checkout the{" "}
                  <Link
                    to="/docs/except"
                  >
                    documentation
                  </Link>{" "}
                  or see the{" "}
                  <a
                    href="https://github.com/selfishprimate/gerillass/blob/master/scss/library/_except.scss"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    source code on Github!
                  </a>
                </p>
              </TabPanel>
            </div>
          </Tabs>
        </div>
      </section>
    );
  }
}

export default Examples;