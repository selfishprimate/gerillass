import React, { Component } from 'react';

import './announcement.scss';

class Announcement extends Component {
  render() {
    return (
      <div className="announcement">
        <ion-icon name="alert-circle-outline"></ion-icon>
        <p className="announcement__description">
          Gerillass 2.0.0 is out. It renames every utility function and
          replaces two mixins with one, so{" "}
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