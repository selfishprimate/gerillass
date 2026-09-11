import React, { Component } from "react";
import ReactDOM from "react-dom";

import {
  StarIcon,
  PackageIcon,
  EllipsisIcon,
  CloseIcon,
} from "components/Icons";
import {
  REPO,
  STARGAZERS_URL,
  DEPENDENTS_URL,
  USED_BY,
  PEOPLE,
  PEOPLE_WITH_AVATARS,
  SNAPSHOT_STARGAZERS,
  avatarUrl,
} from "./data";

import "./supporters.scss";

/* How many avatars sit in the row before the "show all" button. */
const AVATARS_IN_ROW = 8;
const ROW_AVATAR_SIZE = 48;
const DIALOG_AVATAR_SIZE = 48;

const CACHE_KEY = "gerillass:stargazer-count";
const CACHE_TTL = 1000 * 60 * 60 * 24;

function readCachedCount() {
  try {
    const cached = JSON.parse(window.localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.savedAt < CACHE_TTL) {
      return cached.stargazers;
    }
  } catch (error) {
    /* Private mode, disabled storage, stale shape — the API call covers us. */
  }
  return null;
}

function writeCachedCount(stargazers) {
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ stargazers, savedAt: Date.now() })
    );
  } catch (error) {
    /* The cache is an optimisation, not a requirement. */
  }
}

/*
  A different handful on every page load, and it has to be picked after the
  page is in the browser rather than while it is being rendered.

  The site is generated statically: every route is rendered to a real HTML file
  at build time, so anything chosen during that render is chosen once, for
  everyone, and written into the file. React then hydrates that markup, and
  hydration reuses the attributes the server wrote -- it repairs mismatched
  text, not a different `src` on an <img> -- so a second pick made while
  rendering would be discarded without a word.

  This worked when it was written: the site was assembled in the browser on
  every visit, and the pick ran once per visit because the render did.
  Prerendering arrived a day later and moved that render to build time.
*/
function pickRandom(people, count) {
  const pool = people.slice();
  const picked = [];
  while (picked.length < count && pool.length) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
}

class Supporters extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stargazers: SNAPSHOT_STARGAZERS,
      isDialogOpen: false,
      /*
        The first render has to be identical on the server and in the browser,
        or hydration is a mismatch. So it is the head of the list, in order,
        and the random set replaces it on mount.
      */
      rowPeople: PEOPLE_WITH_AVATARS.slice(0, AVATARS_IN_ROW),
    };
    this.closeButton = React.createRef();
    this.openDialog = this.openDialog.bind(this);
    this.closeDialog = this.closeDialog.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleBackdropClick = this.handleBackdropClick.bind(this);
  }

  componentDidMount() {
    this.isRendered = true;
    document.addEventListener("keydown", this.handleKeyDown);

    /*
      Before the cache check, which returns early. Behind it, a visitor with a
      stored star count would keep the row the build wrote and the bug would
      survive for exactly the people who had been here before.

      Picked once here rather than in render, so the later re-renders -- the
      star count landing, the dialog opening -- keep the same faces.
    */
    this.setState({
      rowPeople: pickRandom(PEOPLE_WITH_AVATARS, AVATARS_IN_ROW),
    });

    const cached = readCachedCount();
    if (cached) {
      this.setState({ stargazers: cached });
      return;
    }
    this.fetchStargazerCount();
  }

  componentWillUnmount() {
    this.isRendered = false;
    document.removeEventListener("keydown", this.handleKeyDown);
    this.unlockScroll();
  }

  /*
    One anonymous call to the public repo endpoint. Any failure — offline, or
    the 60 calls an hour anonymous budget spent — leaves the bundled snapshot
    count on screen.
  */
  fetchStargazerCount() {
    fetch(`https://api.github.com/repos/${REPO}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Github responded with ${response.status}`);
        }
        return response.json();
      })
      .then((repo) => {
        const stargazers = repo.stargazers_count;
        if (!this.isRendered || typeof stargazers !== "number") return;
        this.setState({ stargazers });
        writeCachedCount(stargazers);
      })
      .catch(() => {
        /* Keep the bundled snapshot. */
      });
  }

  handleKeyDown(event) {
    if (event.key === "Escape" && this.state.isDialogOpen) {
      this.closeDialog();
    }
  }

  handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      this.closeDialog();
    }
  }

  lockScroll() {
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  unlockScroll() {
    if (this.previousOverflow !== undefined) {
      document.body.style.overflow = this.previousOverflow;
      this.previousOverflow = undefined;
    }
  }

  openDialog() {
    this.lockScroll();
    this.setState({ isDialogOpen: true }, () => {
      if (this.closeButton.current) {
        this.closeButton.current.focus();
      }
    });
  }

  closeDialog() {
    this.unlockScroll();
    this.setState({ isDialogOpen: false });
  }

  renderAvatar(person, className, size) {
    return (
      <a
        className={className}
        href={`https://github.com/${person.login}`}
        target="_blank"
        rel="noopener noreferrer"
        title={person.login}
      >
        <img
          src={avatarUrl(person.avatar, size)}
          alt={person.login}
          loading="lazy"
        />
      </a>
    );
  }

  /*
    The dialog is portalled to the body: the hero runs a filling transform
    animation, and that turns it into the containing block for any fixed
    positioned descendant, which would trap the overlay inside the hero.
  */
  renderDialog() {
    const { stargazers } = this.state;
    return ReactDOM.createPortal(
      <div
        className="supporters__dialog"
        onClick={this.handleBackdropClick}
        role="presentation"
      >
        <div
          className="supporters__dialog__card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="supporters-dialog-title"
        >
          <button
            type="button"
            className="supporters__dialog__close"
            onClick={this.closeDialog}
            ref={this.closeButton}
            aria-label="Close"
          >
            <CloseIcon size={20} className="supporters__icon" />
          </button>
          <h3
            className="supporters__dialog__title"
            id="supporters-dialog-title"
          >
            Stargazers
          </h3>
          <p className="supporters__dialog__description">
            These wonderful people starred Gerillass on Github and keep the
            project going. Thank you!
          </p>
          <ul className="supporters__dialog__list">
            {PEOPLE.map((person) => (
              <li key={person.login}>
                {this.renderAvatar(
                  person,
                  "supporters__dialog__avatar",
                  DIALOG_AVATAR_SIZE
                )}
              </li>
            ))}
          </ul>
          <p className="supporters__dialog__footnote">
            Showing {PEOPLE.length} of {stargazers} stargazers.{" "}
            <a href={STARGAZERS_URL} target="_blank" rel="noopener noreferrer">
              See all on Github
            </a>
          </p>
        </div>
      </div>,
      document.body
    );
  }

  render() {
    const { stargazers, isDialogOpen, rowPeople } = this.state;

    return (
      <div className="supporters">
        <div className="supporters__people">
          <ul className="supporters__avatars">
            {rowPeople.map((person) => (
              <li key={person.login}>
                {this.renderAvatar(
                  person,
                  "supporters__avatar",
                  ROW_AVATAR_SIZE
                )}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="supporters__more"
            onClick={this.openDialog}
            aria-label={`See all ${stargazers} stargazers`}
          >
            <EllipsisIcon size={18} className="supporters__icon" />
          </button>
        </div>

        <p className="supporters__stats">
          <a
            className="supporters__stats__item"
            href={DEPENDENTS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <PackageIcon size={15} className="supporters__icon" />
            {USED_BY} Used by
          </a>
          <span className="supporters__stats__separator" aria-hidden="true">
            ·
          </span>
          <a
            className="supporters__stats__item"
            href={STARGAZERS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <StarIcon size={15} className="supporters__icon" />
            {stargazers} Stargazers
          </a>
        </p>

        {isDialogOpen && this.renderDialog()}
      </div>
    );
  }
}

export default Supporters;
