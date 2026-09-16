import React, { Component } from 'react';

import './announcement.scss';

class Announcement extends Component {
  render() {
    return (
      <div className="announcement">
        <ion-icon name="alert-circle-outline"></ion-icon>
        <p className="announcement__description">
          Gerillass 3.0.0 is out. One gradient mixin replaces two, and
          text-gradient takes its colours first, so{" "}
          <a
            href="https://github.com/selfishprimate/gerillass/blob/main/MIGRATION.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            read the migration guide
          </a>{" "}
          before you upgrade.
        </p>
      </div>
    );
  }
}

export default Announcement;
