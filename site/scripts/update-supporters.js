#!/usr/bin/env node
/*
  Regenerates src/components/Supporters/stargazers.json.

  Github removed anonymous access to the stargazer list (it answers 401
  "Requires authentication"), so the browser cannot build the avatar row on its
  own. This script pulls the list with your own credentials through the Github
  CLI and bakes the result into the bundle. The star count itself stays live —
  /repos/:owner/:repo is still public.

  Usage: node scripts/update-supporters.js   (needs `gh auth login` once)
*/

const { execFileSync } = require("child_process");
const https = require("https");
const fs = require("fs");
const path = require("path");

const REPO = "selfishprimate/gerillass";
const PER_PAGE = 100;
const OUTPUT = path.join(
  __dirname,
  "..",
  "src",
  "components",
  "Supporters",
  "stargazers.json"
);

function gh(endpoint) {
  const raw = execFileSync("gh", ["api", endpoint], { encoding: "utf8" });
  return JSON.parse(raw);
}

const repo = gh(`repos/${REPO}`);
const pages = Math.max(1, Math.ceil(repo.stargazers_count / PER_PAGE));

let people = [];
for (let page = 1; page <= pages; page++) {
  people = people.concat(
    gh(`repos/${REPO}/stargazers?per_page=${PER_PAGE}&page=${page}`)
  );
}

/*
  Github has no field for "this account never uploaded an avatar", but its CDN
  gives it away: an uploaded image is resized to whatever ?s= asks for, while a
  generated identicon ignores the parameter and always comes back at its native
  420x420. Reading the PNG header is enough, so the request is aborted after the
  first few kilobytes. A failed request counts as a real avatar — better to show
  one identicon than to drop somebody over a flaky connection.
*/
const THUMB_SIZE = 80;
const IDENTICON_SIZE = 420;

function isGenerated(avatarUrl) {
  return new Promise((resolve) => {
    const url = `${avatarUrl}${
      avatarUrl.indexOf("?") === -1 ? "?" : "&"
    }s=${THUMB_SIZE}`;
    https
      .get(url, { headers: { "user-agent": "gerillass-web" } }, (response) => {
        const chunks = [];
        let length = 0;
        response.on("data", (chunk) => {
          chunks.push(chunk);
          length += chunk.length;
          if (length > 4096) response.destroy();
        });
        response.on("close", () => {
          const buffer = Buffer.concat(chunks);
          const isPng = buffer.slice(1, 4).toString() === "PNG";
          resolve(isPng && buffer.readUInt32BE(16) === IDENTICON_SIZE);
        });
      })
      .on("error", () => resolve(false));
  });
}

async function classify(users) {
  const out = [];
  /* A few at a time: 171 sequential round trips take a couple of minutes. */
  for (let i = 0; i < users.length; i += 8) {
    const batch = users.slice(i, i + 8);
    const flags = await Promise.all(batch.map((u) => isGenerated(u.avatar_url)));
    batch.forEach((user, n) => {
      const person = { login: user.login, avatar: user.avatar_url };
      if (flags[n]) person.generic = true;
      out.push(person);
    });
    process.stdout.write(`\rChecking avatars ${Math.min(i + 8, users.length)}/${users.length}`);
  }
  process.stdout.write("\n");
  return out;
}

(async () => {
  /* Most recent stargazers first — they lead the avatar row. */
  const classified = (await classify(people)).reverse();
  const data = {
    updatedAt: new Date().toISOString().slice(0, 10),
    stargazers: repo.stargazers_count,
    people: classified,
  };

  fs.writeFileSync(OUTPUT, `${JSON.stringify(data, null, 2)}\n`);
  const generic = classified.filter((p) => p.generic).length;
  console.log(
    `Wrote ${classified.length} stargazers (${generic} still on a generated avatar) to ${path.relative(
      process.cwd(),
      OUTPUT
    )}`
  );
})();
