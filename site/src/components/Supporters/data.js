import snapshot from "./stargazers.json";

export const REPO = "selfishprimate/gerillass";

export const REPO_URL = `https://github.com/${REPO}`;
export const STARGAZERS_URL = `${REPO_URL}/stargazers`;
export const DEPENDENTS_URL = `${REPO_URL}/network/dependents`;

/*
  Github has no API for the "Used by" (dependents) count, so it is kept here by
  hand. Read the current number off the dependents page when you update it:
  https://github.com/selfishprimate/gerillass/network/dependents
*/
export const USED_BY = 130;

/*
  The stargazer list is baked into the bundle: Github answers
  "401 Requires authentication" for /stargazers unless the request carries a
  token, and a static site has nowhere safe to keep one. Refresh the snapshot
  with `node scripts/update-supporters.js`. The star count is still fetched live
  at runtime from the public /repos endpoint, so the number stays honest between
  snapshots.
*/
export const PEOPLE = snapshot.people;

/*
  Stargazers who never uploaded an avatar are flagged `generic` by the refresh
  script — Github hands out an identicon for them, and a row of those reads as
  noise. They stay in the dialog, which thanks everybody; only the hero row is
  picky.
*/
export const PEOPLE_WITH_AVATARS = snapshot.people.filter(
  (person) => !person.generic
);

export const SNAPSHOT_STARGAZERS = snapshot.stargazers;

/* Github serves square avatars; ask for the size we actually render. */
export function avatarUrl(url, size) {
  return `${url}${url.indexOf("?") === -1 ? "?" : "&"}s=${size * 2}`;
}
