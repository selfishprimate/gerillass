/*
  The version list comes from the npm registry so the playground keeps offering
  new releases without a redeploy. If the request fails we fall back to the
  versions that existed when this file was last touched — the playground still
  works, it just stops learning about newer ones.
*/

const REGISTRY = "https://registry.npmjs.org/gerillass";

/* Older releases predate the move to Dart Sass and do not compile here. */
const OLDEST_SUPPORTED = "1.3.0";

/*
  The 1.x releases stay on the list: trying a snippet against the release you
  actually have is what the selector is for. The demos are written for the
  current one, though, so an older release will refuse what a later one added
  — the three 2.1.0 mixins, and the two 2.0.0 replaced — and will pass a
  renamed utility function through as literal CSS, which is Sass's behaviour
  for an unknown function rather than something the playground can catch.
*/

export const FALLBACK = {
  latest: "2.1.0",
  versions: [
    "2.1.0",
    "2.0.1",
    "2.0.0",
    "1.6.2",
    "1.6.1",
    "1.6.0",
    "1.5.0",
    "1.4.0",
    "1.3.3",
    "1.3.2",
    "1.3.1",
    "1.3.0",
  ],
};

function compare(a, b) {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
}

export async function fetchVersions() {
  try {
    const response = await fetch(REGISTRY, {
      headers: { accept: "application/vnd.npm.install-v1+json" },
    });
    if (!response.ok) throw new Error(`Registry answered ${response.status}`);
    const data = await response.json();

    const versions = Object.keys(data.versions || {})
      .filter((version) => /^\d+\.\d+\.\d+$/.test(version))
      .filter((version) => compare(version, OLDEST_SUPPORTED) >= 0)
      .sort(compare)
      .reverse();

    const latest = (data["dist-tags"] || {}).latest;
    if (!versions.length) throw new Error("No usable versions");

    return {
      latest: versions.indexOf(latest) === -1 ? versions[0] : latest,
      versions,
    };
  } catch (error) {
    return FALLBACK;
  }
}
