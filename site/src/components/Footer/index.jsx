import React, { Component } from "react";

import { Link } from "react-router-dom";

import "./footer.scss";

class Footer extends Component {
  render() {
    return (
      <footer className="footer">
        <div className="footer__ghost-image"></div>
        <div className="section__inner">
          <div className="section__header hidden">
            <h2 className="section__title">Footer Navigation</h2>
          </div>

          <div className="footer__menu">
            <div className="footer__menu__item">
              <input id="footer__menu__home" type="checkbox" />
              <label
                className="footer__menu__toggler"
                htmlFor="footer__menu__home"
              >
                <h3>Home</h3>
              </label>
              <ul className="footer__menu__list">
                <li className="footer__menu__list__item">How to use?</li>
                <li className="footer__menu__list__item">
                  <Link className="gtm-navbar-documentation" to="/docs">
                    Docs
                  </Link>
                </li>
                <li className="footer__menu__list__item">
                  <Link className="gtm-navbar-installation" to="/docs">
                    Installation
                  </Link>
                </li>
                <li className="footer__menu__list__item">
                  {/* A route rather than a page: a plain link would reload the
                      site to open a window that sits on top of it. */}
                  <Link className="gtm-navbar-playground" to="/playground">
                    Playground
                  </Link>
                </li>
                <li className="footer__menu__list__item">
                  <a
                    className="gtm-navbar-change-log"
                    href="https://github.com/selfishprimate/gerillass/blob/master/CHANGELOG.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Change Log
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer__menu__item">
              <input id="footer__menu__team" type="checkbox" />
              <label
                className="footer__menu__toggler"
                htmlFor="footer__menu__team"
              >
                <h3>Team</h3>
              </label>
              <ul className="footer__menu__list">
                <li className="footer__menu__list__item">Who we are?</li>
                <li className="footer__menu__list__item">
                  <a
                    className="gtm-creator-linkedin gtm-team-halil"
                    href="https://www.linkedin.com/in/selfishprimate/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Halil İbrahim Çakıroğlu
                  </a>
                </li>
                <li className="footer__menu__list__item">
                  <a
                    className="gtm-team-muhammed"
                    href="https://www.linkedin.com/in/muhammedmirza/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Muhammed Mirza Kılıç
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer__menu__item">
              <input id="footer__menu__channels" type="checkbox" />
              <label
                className="footer__menu__toggler"
                htmlFor="footer__menu__channels"
              >
                <h3>Channels</h3>
              </label>
              <ul className="footer__menu__list">
                <li className="footer__menu__list__item">Join us!</li>
                <li className="footer__menu__list__item">
                  <a
                    className="gtm-channels-twitter"
                    href="https://twitter.com/gerillass"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Twitter
                  </a>
                </li>
                <li className="footer__menu__list__item">
                  <a
                    className="gtm-channels-instagram"
                    href="https://www.instagram.com/sassgerillass/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instagram
                  </a>
                </li>
                <li className="footer__menu__list__item">
                  <a
                    className="gtm-channels-slack"
                    href="https://gerillass.slack.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Slack
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer__menu__item">
              <input id="footer__menu__contribution" type="checkbox" />
              <label
                className="footer__menu__toggler"
                htmlFor="footer__menu__contribution"
              >
                <h3>Contribution</h3>
              </label>
              <ul className="footer__menu__list">
                <li className="footer__menu__list__item">Help it grow!</li>
                <li className="footer__menu__list__item">
                  <a
                    className="gtm-contribution-github"
                    href="https://github.com/selfishprimate/gerillass"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Github
                  </a>
                </li>
                <li className="footer__menu__list__item">
                  <a
                    className="gtm-contribution-patreon"
                    href="https://www.patreon.com/selfishprimate"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Patreon
                  </a>
                </li>
                <li className="footer__menu__list__item">
                  <a
                    className="gtm-contribution-sponsors"
                    href="https://github.com/sponsors/selfishprimate"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Github Sponsors
                  </a>
                </li>
                <li className="footer__menu__list__item">
                  <a
                    className="gtm-contribution-product-hunt"
                    href="https://www.producthunt.com/posts/gerillass"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Product Hunt
                  </a>
                </li>
                {/* <li className="footer__menu__list__item"><a className="gtm-contribution-open-collective" href="https://twitter.com/selfishprimate" target="_blank" rel="noopener noreferrer">Open Collective</a></li> */}
              </ul>
            </div>
          </div>

          <p className="footer__note">
            Made with the loving music of{" "}
            <a
              className="footer__link"
              href="https://open.spotify.com/track/7cmusjrA2X3w6eExZuskZp"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anna German
            </a>{" "}
            and dedicated to{" "}
            <a
              className="footer__link"
              href="https://simpleprimate.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              James Williamson
            </a>
            : The best web educator ever.
          </p>
        </div>
      </footer>
    );
  }
}

export default Footer;
