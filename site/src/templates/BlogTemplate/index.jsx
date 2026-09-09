import React, { Component } from 'react';
import './blog-template.scss';

class BlogTemplate extends Component {
  render() {
    return (
      <div className="main-container">
        <div className="main-wrapper">
          {this.props.header}
          <main className="blog">
            <div className="blog__content">{this.props.content}</div>
            <aside className="blog__sidebar">{this.props.sidebar}</aside>
          </main>
          {this.props.footer}
        </div>
      </div>
    );
  }
}

export default BlogTemplate;