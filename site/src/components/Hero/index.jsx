import React, { Component } from "react";
import { Link } from "react-router-dom";

// import Images from "assets/images";

import Supporters from "components/Supporters";

import { DOWNLOAD_URL } from "release";

import "./hero.scss";

// `?react` is how Vite asks for the SVG as a component. create-react-app
// spelled the same thing `{ ReactComponent as HeroImage }`.
import HeroImage from "./hero_image.svg?react";

class Hero extends Component {
  render() {
    return (
      <section className="hero">
        <div className="hero__left">
          <h2 className="hero__title">
            The first AI-ready Sass mixin library for modern web design.
          </h2>
          <p className="hero__description">
            Gerillass is a set of mixins and functions built on top of{" "}
            <a
              className="hero__link"
              href="https://sass-lang.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sass
            </a>
            . Every one of them ships with a manifest the test suite verifies,
            so a coding agent cannot work from stale docs.
          </p>
          <div className="hero__buttons buttons">
            <form
              className="hero__buttons__item"
              action={DOWNLOAD_URL}
            >
              <button
                type="link"
                className="button button--primary button--large gtm-hero-download"
              >
                Download
              </button>
            </form>

            {/*
              A link rather than a form posting somewhere: the playground is a
              route of this site, so it opens over the page instead of loading
              one. Sponsoring is in the header now, under Support.
            */}
            <div className="hero__buttons__item">
              <Link
                className="button button--primary button--large button--outlined"
                to="/playground"
              >
                Playground
              </Link>
            </div>

          </div>
          <Supporters />
        </div>
        <div className="hero__right">
          <figure className="hero__figure">
            <HeroImage />
          </figure>
          <div className="hero__figure__caption">
            “Convert your web design ideas into beautiful websites!"
          </div>
        </div>
      </section>
    );
  }
}

export default Hero;
