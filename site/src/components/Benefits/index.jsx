import React, { Component } from 'react';

import Images from "assets/images";

import './benefits.scss';

class Benefits extends Component {
  render () {
    return (
      <section className="benefits section">
        <div className="section__header hidden">
          <h2 className="section__title">Benefits</h2>
        </div>

        <ul className="benefits__list">
          <li className="benefits__list__item">
            <figure className="benefits__figure">
              <img src={Images.library} alt="The best Sass library!" />
            </figure>
            <div className="benefits__content">
              <div className="benefits__label">Organized Code</div>
              <h3 className="benefits__title">
                Create reusable design components with the best SCSS mixins!
              </h3>
              <p className="benefits__description">
                Gerillass will allow you to organize your SCSS and CSS code to
                create reusable design components to use across your
                applications.
              </p>
            </div>
          </li>
          <li className="benefits__list__item">
            <figure className="benefits__figure">
              <img
                src={Images.growth}
                alt="Enhance your productivity with Gerillass."
              />
            </figure>
            <div className="benefits__content">
              <div className="benefits__label">Enhancement</div>
              <h3 className="benefits__title">
                This Sass mixin library will enhance your productivity!
              </h3>
              <p className="benefits__description">
                Gerillass will help you create the most complicated design
                elements, mostly with just a couple of code lines.
              </p>
            </div>
          </li>
          <li className="benefits__list__item">
            <figure className="benefits__figure">
              <img
                src={Images.cup}
                alt="Easily create the best UI components."
              />
            </figure>
            <div className="benefits__content">
              <div className="benefits__label">Ease of Use</div>
              <h3 className="benefits__title">
                SCSS to CSS has never been this easy. Accelerate your
                creativity!
              </h3>
              <p className="benefits__description">
                To get started, you need to download the library and include it
                in your project. You don’t need to be a master in CLIs or npm
                packages.
              </p>
            </div>
          </li>
          <li className="benefits__list__item">
            <figure className="benefits__figure">
              <img
                src={Images.idea}
                alt="Gerillass is readable by coding agents."
              />
            </figure>
            <div className="benefits__content">
              <div className="benefits__label">Agent Ready</div>
              <h3 className="benefits__title">
                Your coding agent can read this library and use it correctly!
              </h3>
              <p className="benefits__description">
                Every mixin and function ships with a machine-readable
                manifest, and the test suite compiles every example in it, so
                it cannot go stale.
              </p>
            </div>
          </li>
        </ul>
      </section>
    );
  }
}

export default Benefits;