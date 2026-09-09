import React from "react";

import Header from "components/Header";
import SiteFooter from "components/SiteFooter";
import Announcement from "components/Announcement";
import Hero from "components/Hero";
import Featured from "components/Featured";
import Benefits from "components/Benefits";
import Examples from "components/Examples";
import Testimonial from 'components/Testimonial';
// import ProductHunt from "components/ProductHunt";

import HomeTemplate from "templates/HomeTemplate";

function Home() {
  return (
    <HomeTemplate
      top={
        <div className="site-top">
          <Announcement />
          {/* <ProductHunt /> */}
        </div>
      }
      header={<Header />}
      content={
        <main className="content">
          <Hero />
          <Featured />
          <Benefits />
          <Examples />
          <Testimonial />
        </main>
      }
      footer={<SiteFooter />}
      bottom={
        <div className="site-bottom">
          {/* Put some UI components here! */}
        </div>
      }
    />
  );
}

export default Home;
