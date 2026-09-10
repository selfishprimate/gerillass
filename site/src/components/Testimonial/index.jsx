import React, { Component } from 'react';
import './testimonial.scss';

class Testimonial extends Component {
  render() {
    return (
      <section className="testimonial section section--stretched">
        <div className="section__inner">
          <div className="section__header">
            <h2 className="section__title">What they say?</h2>
            <p className="section__description">
              If you like the content, please say something about us. Share your
              thoughts on Twitter, help this project grow!
            </p>
          </div>

          <ul className="testimonial__list">
            <li className="testimonial__list__item">
              <div className="testimonial__list__item__content">
                <div className="testimonial__list__item__role">
                  Frontend Developer
                </div>
                <div className="testimonial__list__item__name">
                  Erdal Yenigul
                </div>
                <p className="testimonial__list__item__statement">
                  This is the one of best Sass mixins toolset. Don't be shy try
                  it! <strong>#sass</strong> <strong>#css</strong>
                </p>
                <div className="testimonial__list__item__user">
                  <a
                    href="https://twitter.com/erdalyenigul/status/1288104704229040130"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @erdalyenigul
                  </a>
                </div>
              </div>
            </li>
            <li className="testimonial__list__item">
              <div className="testimonial__list__item__content">
                <div className="testimonial__list__item__role">
                  Software Engineer
                </div>
                <div className="testimonial__list__item__name">
                  Muhammed M. Kilic
                </div>
                <p className="testimonial__list__item__statement">
                  If you are afraid of <strong>#css</strong> like me, this{" "}
                  <strong>#sass</strong> library is exactly for you:{" "}
                  <strong>@gerillass</strong> is easy to understand and
                  ridiculously simple to implement.
                </p>
                <div className="testimonial__list__item__user">
                  <a
                    href="https://twitter.com/_muhammedmirza/status/1287436940900470785"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @_muhammedmirza
                  </a>
                </div>
              </div>
            </li>

            <li className="testimonial__list__item">
              <div className="testimonial__list__item__content">
                <div className="testimonial__list__item__role">
                  UI/UX Designer
                </div>
                <div className="testimonial__list__item__name">
                  Kenan Gundogan
                </div>
                <p className="testimonial__list__item__statement">
                  It looks great, I will definitely include it in the projects I
                  am developing.
                </p>
                <div className="testimonial__list__item__user">
                  <a
                    href="https://www.producthunt.com/products/gerillass"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @kenangundogan
                  </a>
                </div>
              </div>
            </li>

            <li className="testimonial__list__item">
              <div className="testimonial__list__item__content">
                <div className="testimonial__list__item__role">
                  UI/UX Designer
                </div>
                <div className="testimonial__list__item__name">
                  Halil I. Cakiroglu
                </div>
                <p className="testimonial__list__item__statement">
                  Rapidly-produce consistent and scalable CSS outputs regardless
                  of the size of the projects you're working on.{" "}
                  <strong>#gerillass</strong> <strong>@gerillass</strong>
                </p>
                <div className="testimonial__list__item__user">
                  <a
                    href="https://twitter.com/selfishprimate/status/1287500018543480838"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @selfishprimate
                  </a>
                </div>
              </div>
            </li>
          </ul>

          <div className="section__cta">
            <div className="section__cta__form">
              <a
                href="https://twitter.com/intent/tweet?url=https%3A%2F%2Fgerillass.com%2F&text=The%20coolest%20Sass%20toolset%20for%20the%20guerrilla%20type%20of%20CSS%20authors.%20%40gerillass%20%23gerillass%20%23sass"
                className="section__cta__button button button--accent button--large"
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on Twitter
              </a>
            </div>
            <p className="section__cta__description">SAY SOMETHING ABOUT US!</p>
          </div>
        </div>
      </section>
    );
  }
}

export default Testimonial;
