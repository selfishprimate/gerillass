import React, { Component } from 'react';

import './footer-invitation.scss';

class FooterInvitation extends Component {
  render() {
    return (
      <div className="footer-invitation">

        <div className="section__inner">
          <div className="footer-invitation__container">
            <div className="footer-invitation__left">
              <h2 className="footer-invitation__title">Do you want to join our Slack group?</h2>
              <p className="footer-invitation__description">Meet the Gerillass community. If you have any trouble using Gerillass, join the groups, ask people, and share your experiences with the others.</p>
            </div>
            <div className="footer-invitation__right">
              <div className="section__cta">
                <form className="section__cta__form" action="https://join.slack.com/t/gerillass/shared_invite/zt-ffn16ou9-Vur9hA6oP1GCxNd3hE6OVQ">
                  <button type="link" className="section__cta__button button button--accent button--large gtm-join-to-slack" formTarget="_blank">Join to Slack</button>
                </form>
                <p className="section__cta__description">JOIN OUR SLACK GROUP!</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }
}

export default FooterInvitation;