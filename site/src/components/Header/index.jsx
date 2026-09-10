import React, { Component } from "react";
import "./header.scss";

import { Link } from "react-router-dom";

import { VERSION } from "release";

class Header extends Component {
  render() {
    return (
      <header className="header">
        <input id="navbar__toggler__input" type="checkbox" />
        <label
          htmlFor="navbar__toggler__input"
          className="gls-toggler navbar__toggler"
        ></label>

        <div className="header__brand">
          <div className="header__brand__face"></div>
          <div className="header__brand__mark">
            <h1 className="header__brand__logo">
              <Link to="/">Gerillass</Link>
            </h1>
            <span className="header__brand__version">v{VERSION}</span>
          </div>
        </div>

        <div className="navbar">
          <nav className="navbar__nav">
            <h2 className="navbar__title">Site Navigation</h2>
            <ul className="navbar__nav__menu">
              <li>
                {/*
                  An in-app link now that the documentation is part of this
                  site rather than a separate one, so it no longer opens a tab
                  or reloads the app. gtm-navbar-documentation is a Google Tag
                  Manager trigger and has to stay exactly as it is.
                */}
                <Link className="gtm-navbar-documentation" to="/docs/introduction">
                  Docs
                </Link>
              </li>
              <li>
                <Link className="gtm-navbar-playground" to="/playground">
                  Playground
                </Link>
              </li>
              <li>
                {/*
                  Support here means sponsoring the project, which is what the
                  repository's FUNDING.yml points at. Getting help is a page of
                  its own under the documentation and is reached from there.

                  It carries no gtm- class: every other item in this menu has a
                  trigger that predates it, and inventing a name would give
                  Tag Manager a class nothing in it is listening for.
                */}
                <a
                  href="https://github.com/sponsors/selfishprimate"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Support
                </a>
              </li>
              {/* <li><Link to="/contact">CONTACT</Link></li> */}
            </ul>

            <ul className="navbar__nav__channels">
              <li data-tooltip="Twitter">
                <a
                  className="gtm-channels-twitter"
                  href="https://twitter.com/gerillass"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Twitter"
                >
                  <i className="navbar__nav__channels__icon gls-twitter-circle"></i>
                </a>
              </li>
              <li data-tooltip="Github">
                <a
                  className="gtm-channels-github"
                  href="https://github.com/selfishprimate/gerillass"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Github"
                >
                  <i className="navbar__nav__channels__icon gls-github-circle"></i>
                </a>
              </li>
              <li data-tooltip="Medium">
                <a
                  className="gtm-channels-medium"
                  href="https://medium.com/gerillass"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Medium"
                >
                  <i className="navbar__nav__channels__icon gls-medium-circle"></i>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    );
  }
}

export default Header;
