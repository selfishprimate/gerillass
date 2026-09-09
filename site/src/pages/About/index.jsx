import React from 'react';

import Header from "components/Header";
import Footer from "components/Footer";

import BlogTemplate from "templates/BlogTemplate";

function About() {
    return (
      <BlogTemplate
        header={<Header />}
        content={
          <div>This is the content!</div>
        }
        sidebar={
          <div>This is the sidebar!</div>
        }
        footer={<Footer />}
      />
    );
}

export default About;