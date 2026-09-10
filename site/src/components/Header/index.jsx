import React, { Component } from "react";
import "./header.scss";

import { Link } from "react-router-dom";

import { VERSION } from "release";
import SearchCommand from "components/SearchCommand";

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
                <SearchCommand />
              </li>
              <li>
                {/*
                  An in-app link now that the documentation is part of this
                  site rather than a separate one, so it no longer opens a tab
                  or reloads the app.
                */}
                <Link to="/docs/introduction">
                  Docs
                </Link>
              </li>
              <li>
                {/*
                  Support here means sponsoring the project, which is what the
                  repository's FUNDING.yml points at. Getting help is a page of
                  its own under the documentation and is reached from there.
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
