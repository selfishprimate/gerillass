const path = require("path");
const sassTrue = require("sass-true");
const glob = require("glob");

describe("Sass", () => {
  // Find all of the Sass files that end in `*.spec.scss` in any directory of this project.
  // I use path.resolve because True requires absolute paths to compile test files.
  const sassTestFiles = glob.sync(
    path.resolve(process.cwd(), "test/**/*.spec.scss")
  );

  // Run True on every file found with the describe and it methods provided.
  //
  // if-function is silenced because it is deliberately deferred; see CLAUDE.md.
  // `import` and `global-builtin` are deliberately left unsilenced: 2.0.0
  // removed both from the library and from these specs, so a warning for
  // either one is a regression and should be visible.
  sassTestFiles.forEach((file) =>
    sassTrue.runSass(
      { describe, it },
      file,
      { sass: require("sass"), silenceDeprecations: ["if-function"] }
    )
  );
});

// Above code is taken from Dale Sande's article about Sass Unit Tests (https://www.educative.io/blog/sass-tutorial-unit-testing-with-sass-true)