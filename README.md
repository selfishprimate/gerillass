<p>
  <a href="https://gerillass.com" target="_blank">
    <img src="https://gerillass.com/images/github/gerillass_logo_sassy.svg">
  </a>
</p>

## _<span><img src="https://gerillass.com/images/github/heart_red.svg"></span> Meet the Coolest Sass Toolset! <span><img src="https://gerillass.com/images/github/heart_red.svg"></span>_

[Gerillass](https://gerillass.com) is a library built on top of [Sass (Syntactically Awesome Style Sheets)](https://sass-lang.com/) to give you flexibility for your projects and accelerate your performance and creativity.

Many of the utilities that come with Gerillass are the solutions I have come up with for the challenges I have faced as a frontend developer over the years. These solutions have been shaped by the inspiration of other popular libraries and frameworks like [Bourbon](https://www.bourbon.io/), [Susy](https://www.oddbird.net/), [Scut](https://github.com/davidtheclark/scut), [Bootstrap](https://getbootstrap.com/), etc. over time and helped me create Gerillass.

Hope you’ll enjoy using it!

**Related Links:**

- [Gerillass Website](https://gerillass.com)
- [Gerillass Documentation](https://docs.gerillass.com)
- [Gerillass Blog](https://medium.com/gerillass)
- [Twitter](https://twitter.com/gerillass)

## Table of Contents

- [Dart Sass Upgrade](#dart-sass-upgrade)
- [Installation](#installation)
  - [Using with Vite](#using-with-vite)
  - [Using with webpack](#using-with-webpack)
  - [Using with Next.js](#using-with-nextjs)
  - [Using with Angular](#using-with-angular)
  - [Using with Gulp](#using-with-gulp)
  - [Using with Grunt](#using-with-grunt)
  - [Cloning the Repository from Github](#cloning-the-repository-from-github)
  - [Versions these examples were tested with](#versions-these-examples-were-tested-with)
- [Namespace Usage](#namespace-usage)
- [Vendor Prefix Support](#vendor-prefix-support)
- [Experimenting](#experimenting)
- [Testing](#testing)
- [Contribution](#contribution)
- [License](#license)
- [Additional Info](#additional-info)

## Dart Sass Upgrade
_We are saying goodbye to LibSass with version 1.3.0_ :cry:

Because LibSass and the packages built on it, including Node Sass, are deprecated, **Gerillass will no longer support LibSass since version 1.3.0** If you're having a problem running Gerillass v1.3.0 please consider using Dart Sass instead of LibSass. If you are running Dart Sass already, you can install and use Gerillass 1.3.0 and later versions safely. If not, however, please use the earlier versions.

## Installation

    npm install gerillass --save-dev

Or with Yarn:

    yarn add gerillass --dev

Then load it. If your setup resolves packages from **node_modules** — Vite, webpack, Next.js and most modern bundlers do — this is all you need:

    @use 'gerillass' as *;

If you call Dart Sass yourself rather than through a bundler, turn on its package importer and use a `pkg:` URL:

    @use 'pkg:gerillass' as *;

```js
// Dart Sass 1.71.0 or later
import * as sass from 'sass';
import { NodePackageImporter } from 'sass';

sass.compile('style.scss', { importers: [new NodePackageImporter()] });
```

Or from the command line:

    sass --pkg-importer=node style.scss style.css

Pointing straight at the file always works too:

    @use '{node_modules_path}/gerillass/scss/gerillass' as *;

The per-tool recipes below were each verified against a real build of Gerillass v1.5.0. The versions used are listed at the end of this section.

> **A note on eyeglass.** Gerillass still ships eyeglass module metadata, but eyeglass has not been released since June 2022 and its importer is broken with current Dart Sass — any `@import` fails with `doneImporting is not a function`, whether Gerillass is involved or not. It also relies on the legacy JS API, which Dart Sass removes in 2.0.0. Use the `pkg:` importer above instead; it is the built-in equivalent.

### Using with Vite

Vite resolves the package by name, so there is nothing to configure. This covers anything built on Vite, including React, Vue, Svelte, SvelteKit and Astro.

    @use 'gerillass' as *;

### Using with webpack

`sass-loader` also resolves the package by name, with no extra options.

    @use 'gerillass' as *;

### Using with Next.js

Next.js needs to be told where the library lives. In `next.config.mjs`:

    export default {
      sassOptions: {
        loadPaths: ["node_modules/gerillass/scss"],
      },
    };

Then, in any `.scss` file:

    @use 'gerillass' as *;

### Using with Angular

Add the library folder to the build target's options in `angular.json`. Angular calls this option `includePaths`, not `loadPaths`:

    "stylePreprocessorOptions": {
      "includePaths": ["node_modules/gerillass/scss"]
    }

Then, in `src/styles.scss`:

    @use 'gerillass' as *;

### Using with Gulp

`gulp-sass` hands its options straight to Dart Sass, so the option is **`loadPaths`**. The old `includePaths` name came from Node Sass and no longer resolves.

    const { src, dest } = require("gulp");
    const sass = require("gulp-sass")(require("sass"));

    function styles() {
      return src("assets/sass/**/*.scss")
        .pipe(sass({ loadPaths: ["node_modules/gerillass/scss"] }).on("error", sass.logError))
        .pipe(dest("assets/css"));
    }

    exports.styles = styles;

Then:

    @use 'gerillass' as *;

### Using with Grunt

Use `grunt-sass` with Dart Sass as the implementation. The option here is **`loadPaths`** as well — not `loadPath`, and not `includePaths`.

    module.exports = function (grunt) {
      grunt.loadNpmTasks("grunt-sass");
      grunt.initConfig({
        sass: {
          dist: {
            options: {
              implementation: require("sass"),
              loadPaths: ["node_modules/gerillass/scss"],
            },
            files: { "css/main.css": "src/main.scss" },
          },
        },
      });
    };

Then:

    @use 'gerillass' as *;

### Cloning the repository from Github

You can clone the repository into your local computer from Github.

    git clone https://github.com/selfishprimate/gerillass.git

Or you can add the library as a submodule into your Git based project ([What is a submodule?](https://git-scm.com/book/en/v2/Git-Tools-Submodules)).

    git submodule add https://github.com/selfishprimate/gerillass.git

Including to the project:

    @use '{folder_path}/gerillass/scss/gerillass' as *;

### Versions these examples were tested with

| Tool | Version |
|---|---|
| Dart Sass | 1.103.1 |
| Vite | 8.2.2 |
| webpack / sass-loader | 5.110.3 / 17.0.1 |
| Next.js | 16.3.4 |
| Angular CLI | 20.3.36 |
| Gulp / gulp-sass | 5.0.1 / 6.0.1 |
| Grunt / grunt-sass | 1.6.3 / 4.1.0 |

## Namespace Usage

You can use Gerillass with or without `gls-` namespace. It is optional, but I strongly recommend you to use it to prevent having conflicts with other Sass libraries or frameworks like Bootstrap.

## Vendor Prefix Support

Because of the vast usage of bundlers like [Gulp](https://gulpjs.com/), [Grunt](https://gruntjs.com/), [Webpack](https://webpack.js.org/), etc.(these frameworks run some other plugins like Autoprefixer to support vendor prefixes), Gerillass doesn't provide vendor prefix support.

So, feel free to use any tool to support that. My suggestion is Autoprefixer. If you are not using one of the bundlers mentioned above, you can also manually add vendor prefixes using the [Autoprefixer CSS Online](https://autoprefixer.github.io/) tool.

## Experimenting

Experimentation with Gerillass is easy: If you're processing Sass files on your computer already, [download the Gerillass Sass library](https://github.com/selfishprimate/gerillass/archive/main.zip), include it in your project, and start using it. If not, use [Gerillass Play](https://github.com/selfishprimate/gerillass-play)! Gerillass Play is a Gulp based playground, built for you to get started with [Sass](https://sass-lang.com/) and [Gerillass](https://gerillass.com/) quickly.

**Important Note**: Don't forget that you must have [Node.js](https://nodejs.org/en/) and [Gulp CLI](https://gulpjs.com/docs/en/getting-started/quick-start) installed on your machine to work with Gerillass Play.

## Testing

Gerillass comes with a unit-testing module named [True](https://github.com/oddbird/true), which makes Sass unit tests possible (endless thanks to the [OddBird Team](https://github.com/oddbird)).

You can find two test examples under the `test` folder, take your time, examine the codes, and then write your unit tests. After that, run the following command to see if the tests pass.

    npm test

## Contribution

Please read the [contribution details](CONTRIBUTING.md) and feel free to contribute to the library.

## License

Gerillass is licensed under the Apache License, Version 2.0. For more [see the license content](https://github.com/selfishprimate/gerillass/blob/main/LICENSE.md).

## Additional Info

This project is created with the loving music of **Anna German** and dedicated to **James Williamson**: The best web educator ever. For more information about James, please check his legacy blog page at [simpleprimate.netlify.app](https://simpleprimate.netlify.app) or watch his video lectures about **Web** and **Accessibility** on [LinkedIn Learning](https://www.linkedin.com/learning/instructors/james-williamson).
