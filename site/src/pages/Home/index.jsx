import React from "react";

import Header from "components/Header";
import SiteFooter from "components/SiteFooter";
import Announcement from "components/Announcement";
import Hero from "components/Hero";
import Featured from "components/Featured";
import Install from "components/Install";
import Benefits from "components/Benefits";
import Examples from "components/Examples";
import Testimonial from 'components/Testimonial';
// import ProductHunt from "components/ProductHunt";
// The typed Sass-to-CSS section, off the page while its design is unfinished:
// import LivePlayground from "components/LivePlayground";

import PageContent from "components/PageContent";
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
        <PageContent>
          <Hero />
          <Featured />
          <Install />
          <Benefits />
          <Examples />
          {/* <LivePlayground /> */}
          <Testimonial />
        </PageContent>
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
