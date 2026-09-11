import React, { Component } from 'react';

import './copyright.scss';

class Copyright extends Component {
  render() {
    return (
      <div className="copyright">
        {/*
          The dedication, which used to sit at the foot of the dark block; the
          credit line it traded places with is down there now. The links carry
          no class on purpose: `footer__link` is nested under `.footer` in the
          stylesheet and could not reach them here, and this box paints its own
          links already.
        */}
        <p className="copyright__info">
          Made with the loving music of{" "}
          <a
            href="https://open.spotify.com/track/7cmusjrA2X3w6eExZuskZp"
            target="_blank"
            rel="noopener noreferrer"
          >
            Anna German
          </a>{" "}
          and dedicated to{" "}
          <a
            href="https://simpleprimate.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            James Williamson
          </a>
          : The best web educator ever.
        </p>
      </div>
    );
  }
}

export default Copyright;