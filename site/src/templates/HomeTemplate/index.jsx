import React, { Component } from 'react';
import './home-template.scss';

class HomeTemplate extends Component {
  render() {
    return (
      <div className="main-container">
        {this.props.top}
        <div className="main-wrapper">
          {this.props.header}
          {this.props.content}
          {this.props.footer}
        </div>
        {this.props.bottom}
      </div>
    )
  }
}

export default HomeTemplate;