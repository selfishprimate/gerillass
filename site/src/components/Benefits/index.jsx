import React, { Component } from 'react';

import './benefits.scss';

/*
  Each item is a real feature, written in the words people search for: "media
  query", "fluid typography", "line clamp", "reduced motion", "Claude Code",
  "Rails". Every claim is checkable against gerillass.json and the test suite,
  so when a count here changes, change it with the release that changed it.

  The illustrations are served from public/images/illustrations, so they are
  referenced by URL rather than imported.
*/
const BENEFITS = [
  {
    image: "/images/illustrations/responsive.png",
    alt: "Sass media query and container query mixins",
    label: "Media Queries",
    title: "Sass media query and container query mixins",
    description:
      "Named sizes or raw lengths, for the viewport or a container. A mistyped size stops the build instead of writing a query that never matches.",
  },
  {
    image: "/images/illustrations/typography.png",
    alt: "Fluid typography and line clamp in Sass",
    label: "Modern CSS",
    title: "Fluid typography and line clamp",
    description:
      "Fluid font sizes with a clamp() that follows browser text zoom, multi-line truncation that works, plus accessible focus rings and reduced motion.",
  },
  {
    image: "/images/illustrations/brain.png",
    alt: "A Sass library AI coding agents can read",
    label: "AI Coding Agents",
    title: "A Sass library AI coding agents use correctly",
    description:
      "A tested manifest and a SKILL.md for Claude Code and other agents. A bad argument stops the build with a clear message.",
  },
  {
    image: "/images/illustrations/installation.png",
    alt: "Install Gerillass from npm or RubyGems",
    label: "Install Anywhere",
    title: "Install from npm or RubyGems",
    description:
      "56 mixins and 23 functions for Dart Sass, with no runtime dependencies. Works with Vite, webpack, Parcel, Rails, Jekyll and plain Ruby.",
  },
];

class Benefits extends Component {
  render () {
    return (
      <section className="benefits section">
        <div className="section__header">
          <h2 className="section__title">Sass mixins for you and your AI agent</h2>
          <p className="section__description">
            Write responsive, accessible modern CSS, with a manifest that tells
            coding agents how every mixin works.
          </p>
        </div>

        <ul className="benefits__list" role="list">
          {BENEFITS.map((benefit) => (
            <li className="benefits__list__item" key={benefit.label}>
              <figure className="benefits__figure">
                <img src={benefit.image} alt={benefit.alt} />
              </figure>
              <div className="benefits__content">
                <div className="benefits__label">{benefit.label}</div>
                <h3 className="benefits__title">{benefit.title}</h3>
                <p className="benefits__description">{benefit.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }
}

export default Benefits;
