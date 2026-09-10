import React, { Component } from 'react';

import './featured.scss';

class Featured extends Component {
  render() {
    return (
      <section className="featured section section--stretched">
        <div className="section__header hidden">
          <h2 className="section__title">Give a star on Github!</h2>
        </div>

        <div className="featured__left">
          <div className="featured__author">
            <a
              className="featured__author__link linkedin"
              href="https://www.linkedin.com/in/selfishprimate/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="featured__author__label">Created by</span> Halil
              İbrahim Çakıroğlu
            </a>
          </div>
        </div>
        <div className="featured__right">
          <ul className="github-buttons">
            <li className="github-buttons__item star">
              <a
                href="https://github.com/selfishprimate/gerillass"
                target="_blank"
                rel="noopener noreferrer"
                title="Give the library a star"
              >
                Star
              </a>
            </li>
            <li className="github-buttons__item fork">
              <a
                href="https://github.com/selfishprimate/gerillass/fork"
                target="_blank"
                rel="noopener noreferrer"
                title="Fork the library"
              >
                Fork
              </a>
            </li>
            <li className="github-buttons__item discussions github-buttons__item--dark">
              <a
                href="https://github.com/selfishprimate/gerillass/discussions"
                target="_blank"
                rel="noopener noreferrer"
                title="Welcome to Gerillas dicussions"
              >
                Discussions
              </a>
            </li>
            {/* <li className="github-buttons__item github-buttons__item--dark">
              <a
                href="https://github.com/selfishprimate/gerillass/archive/refs/tags/v1.3.3.zip"
                target="_blank"
                rel="noopener noreferrer"
                title="Download it from Github"
              >
                Download
              </a>
            </li> */}
          </ul>
        </div>
      </section>
    );
  }
}

export default Featured;