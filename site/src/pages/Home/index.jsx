import React from "react";

import Header from "components/Header";
import Footer from "components/Footer";
import Announcement from "components/Announcement";
import Copyright from "components/Copyright";
import Hero from "components/Hero";
import Featured from "components/Featured";
import Benefits from "components/Benefits";
import Examples from "components/Examples";
import Testimonial from 'components/Testimonial';
import FooterInvitation from "components/Invitations/FooterInvitation";
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
      footer={
        <div className="footer-container section section--stretched">
          <Footer />
          <FooterInvitation />
          <Copyright />
        </div>
      }
      bottom={
        <div className="site-bottom">
          {/* Put some UI components here! */}
        </div>
      }
    />
  );
}

export default Home;
