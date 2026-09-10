import React, { Component } from 'react';

import './copyright.scss';

class Copyright extends Component {
  render() {
    return (
      <div className="copyright">
        <p className="copyright__info">
          Copyright © 2020, Designed and built by{" "}
          <a
            href="https://github.com/selfishprimate"
            target="_blank"
            rel="noopener noreferrer"
          >
            @selfishprimate
          </a>
          . The code licensed under the Apache License, Version 2.0
        </p>
      </div>
    );
  }
}

export default Copyright;