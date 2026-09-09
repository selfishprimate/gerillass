import { loadLibrary } from "./compiler";

/*
  The mixin selector is filled from the version that is already in memory for
  compiling, so it lists the release the visitor picked rather than whatever was
  true when this file was written.
*/

const LIBRARY = "/scss/library/";

/* Every mixin the library exposes, with the parameter list as written. */
function parse(contents) {
  const found = [];
  const declaration = /@mixin\s+([\w-]+)\s*(\(|\{)/g;
  let match;

  while ((match = declaration.exec(contents))) {
    const [, name, opener] = match;
    if (opener === "{") {
      found.push({ name, params: "" });
      continue;
    }
    /* Walk to the matching bracket: defaults can hold parens of their own. */
    let depth = 1;
    let index = declaration.lastIndex;
    while (index < contents.length && depth > 0) {
      const character = contents[index];
      if (character === "(") depth += 1;
      else if (character === ")") depth -= 1;
      index += 1;
    }
    found.push({
      name,
      params: contents
        .slice(declaration.lastIndex, index - 1)
        .replace(/\s+/g, " ")
        .trim(),
    });
    declaration.lastIndex = index;
  }
  return found;
}

/* Names the library writes as `aspect-ratio` read better as "Aspect Ratio". */
const ACRONYMS = { css: "CSS" };

export function mixinTitle(name) {
  return name
    .split("-")
    .map((word) =>
      ACRONYMS[word] ? ACRONYMS[word] : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

export async function listMixins(version) {
  const files = await loadLibrary(version);
  const mixins = new Map();

  files.forEach((contents, path) => {
    if (path.indexOf(LIBRARY) !== 0) return;
    parse(contents).forEach((mixin) => mixins.set(mixin.name, mixin));
  });

  return Array.from(mixins.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
