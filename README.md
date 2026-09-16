<p>
  <a href="https://gerillass.com" target="_blank">
    <img src="https://gerillass.com/images/github/gerillass_logo_sassy.svg">
  </a>
</p>

## _<span><img src="https://gerillass.com/images/github/heart_red.svg"></span> Meet the Coolest Sass Toolset! <span><img src="https://gerillass.com/images/github/heart_red.svg"></span>_

[Gerillass](https://gerillass.com) is a library built on top of [Sass (Syntactically Awesome Style Sheets)](https://sass-lang.com/) to give you flexibility for your projects and accelerate your performance and creativity.

It is also built to be read by coding agents. Every mixin and function ships with a machine-readable manifest, and the test suite compiles every documented example and asserts every documented refusal. So what the manifest says the library does is what the library does. The docs cannot drift away from the code, because a stale manifest fails the build.

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
  - [Using with Parcel](#using-with-parcel)
  - [Using with Next.js](#using-with-nextjs)
  - [Using with Angular](#using-with-angular)
  - [Using with Gulp](#using-with-gulp)
  - [Using with Grunt](#using-with-grunt)
  - [Using with Ruby: Rails, Jekyll, or plain Sass](#using-with-ruby-rails-jekyll-or-plain-sass)
  - [Cloning the Repository from Github](#cloning-the-repository-from-github)
  - [Versions these examples were tested with](#versions-these-examples-were-tested-with)
- [Using Gerillass with an AI coding agent](#using-gerillass-with-an-ai-coding-agent)
- [Three ways to call the same mixin](#three-ways-to-call-the-same-mixin)
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

Then load it. If your setup resolves packages from **node_modules**, which Vite, webpack, Next.js and most modern bundlers do, this is all you need:

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


### Using with Vite

Vite resolves the package by name, so there is nothing to configure. This covers anything built on Vite, including React, Vue, Svelte, SvelteKit and Astro.

    @use 'gerillass' as *;

### Using with webpack

`sass-loader` also resolves the package by name, with no extra options.

    @use 'gerillass' as *;

### Using with Parcel

Parcel resolves the package by name too, so the usual line needs no configuration:

    @use 'gerillass' as *;

**Remove `main` from your project's own `package.json`.** `npm init -y` writes `"main": "index.js"`, and Parcel reads that field as a library build target. With it present an app build fails, and the error names the stylesheet rather than the field: `Can't find stylesheet to import`. No Sass option gets around it. If you need to keep the field, turn that target off instead:

    "targets": { "main": false }

To use a `pkg:` URL, create the importer in a `.sassrc.js`. Setting `pkgImporter` in `.sassrc.json` does not work: Parcel switches Sass to its legacy API for that option, and the import is not found.

    // .sassrc.js
    const { NodePackageImporter } = require("sass");
    module.exports = { importers: [new NodePackageImporter()] };

Two more things worth knowing:

- **Pass the font formats you actually have to `font-face`.** It lists five by default, and Parcel resolves every `url()` in the output, so a folder holding only `.woff2` fails with `Failed to resolve './fonts/inter.eot'`. `$file-formats: woff2` fixes it.
- **`quietDeps` hides the library's own deprecation warnings.** Dart Sass reports its `if()` deprecation from inside the package on every build. A `.sassrc.json` of `{ "quietDeps": true }` silences those and still reports the ones in your own files.

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

Use `grunt-sass` with Dart Sass as the implementation. The option here is **`loadPaths`** as well, not `loadPath`, and not `includePaths`.

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

### Using with Ruby: Rails, Jekyll, or plain Sass

Gerillass is also a gem. It installs the same Sass files and nothing else: no runtime dependencies, because each kind of project already brings its own Dart Sass. It needs Dart Sass; the LibSass-based `sass-rails` and `sassc-rails` cannot compile it.

    bundle add gerillass

**Rails.** With `dartsass-rails` on Propshaft, the Rails 8 default, or `dartsass-sprockets` on Sprockets, there is nothing to configure: the gem hands the library's folder to Sass, and none of its files end up in `public/assets`. Then, in `app/assets/stylesheets/application.scss`:

    @use 'gerillass' as *;

**Jekyll.** Put the gem in the plugins group of your `Gemfile`:

    group :jekyll_plugins do
      gem "gerillass"
    end

Then, in a stylesheet with front matter such as `assets/css/main.scss`:

    ---
    ---
    @use 'gerillass' as *;

**Plain Ruby.** Pass the library's folder to `sass-embedded` yourself:

    require "sass-embedded"
    require "gerillass"

    Sass.compile("style.scss", load_paths: [Gerillass.load_path])

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
| Parcel / @parcel/transformer-sass | 2.16.4 / 2.16.4, with Dart Sass 1.104.1 and Gerillass 2.1.0 |
| Ruby / Rails | 4.0.1 / 8.1.3.1 |
| Propshaft / dartsass-rails | 1.3.2 / 0.5.1 |
| sprockets-rails / dartsass-sprockets | 3.5.2 / 3.2.1 |
| Jekyll / jekyll-sass-converter | 4.4.1 / 3.1.0 |
| sass-embedded (Ruby) | 1.104.1 |

## Using Gerillass with an AI coding agent

A library this size has no training data behind it, so an agent asked to use Gerillass will guess at the argument forms and get them wrong. Two files ship with the package to stop that. Both live inside the installed package, so an agent working in your project can read them straight out of `node_modules/gerillass/`, or, in a Ruby project, out of the gem's folder, which `bundle info gerillass --path` prints.

**`gerillass.json`** describes every mixin and function: its signature, what each argument accepts, examples that compile, and inputs that are refused.

    const api = require("gerillass/gerillass.json");

**`SKILL.md`** is a written guide generated from that manifest. It covers how to load the library, the full catalogue, and the argument forms that are easy to get wrong. If your agent supports [Agent Skills](https://code.claude.com/docs/en/skills), copy it into your skills folder:

    mkdir -p .claude/skills/gerillass
    cp node_modules/gerillass/SKILL.md .claude/skills/gerillass/

In a Ruby project, copy it from the gem instead:

    cp "$(bundle info gerillass --path)/SKILL.md" .claude/skills/gerillass/

Otherwise, point your agent at the file and it will read it as plain Markdown.

### Why you can trust what they say

Neither file is written by hand. Signatures are parsed from the Sass sources, and the semantics come from a separate set of notes, so nobody can describe a mixin that does not exist.

The part that matters is what happens next. The test suite takes every example in the manifest and compiles it. It takes every input the manifest claims is refused and checks that the library really does refuse it, with its own error message rather than an internal Sass one. It runs every example a second time under the `gls-` prefixed name and requires byte-identical CSS. And it fails the build if either generated file is out of date.

So the manifest cannot claim behaviour the library does not have. That is the whole point of it. Documentation drifts away from code in most projects, quietly, and an agent reading stale docs writes code that does not work. Here it cannot happen without turning the test suite red first.


## Three ways to call the same mixin

None of them is required. Pick whichever reads best in your project, and stay with it in a given file.

**Bare.** The shortest, and fine unless another library defines the same name.

    @use 'gerillass' as *;
    .avatar { @include circle(50px); }

**With the `gls-` prefix.** Every mixin also answers to a prefixed name, which avoids collisions with Bootstrap and friends.

    @use 'gerillass' as *;
    .avatar { @include gls-circle(50px); }

**Through a namespace.** Sass's own mechanism, and the tidiest of the three: nothing enters your global scope at all, so a collision is impossible. The name after `as` is yours to choose.

    @use 'gerillass' as gls;
    .avatar { @include gls.circle(50px); }

All three produce identical CSS. The prefix predates the Sass module system; if you are starting fresh, the namespace does the same job without the extra name.

## Vendor Prefix Support

Because of the vast usage of bundlers like [Gulp](https://gulpjs.com/), [Grunt](https://gruntjs.com/), [Webpack](https://webpack.js.org/), etc.(these frameworks run some other plugins like Autoprefixer to support vendor prefixes), Gerillass doesn't provide vendor prefix support.

So, feel free to use any tool to support that. My suggestion is Autoprefixer. If you are not using one of the bundlers mentioned above, you can also manually add vendor prefixes using the [Autoprefixer CSS Online](https://autoprefixer.github.io/) tool.

## Experimenting

The quickest way to try Gerillass is the [playground](https://gerillass.com/playground). It runs in your browser, so there is nothing to install: write Sass on one side and read the CSS it compiles to on the other. Pick a mixin to start from an example, and pick any published Gerillass version to compile against, which makes it easy to see how a call behaves before and after an upgrade.

When you are ready to use it in a project, follow the [installation](#installation) steps for your build tool.

## Testing

The test suite runs with [Jest](https://jestjs.io/) and [True](https://github.com/oddbird/true), which makes Sass unit tests possible (endless thanks to the [OddBird Team](https://github.com/oddbird)).

    npm test

It checks more than hand-written assertions: every mixin is called at least once, every documented example is compiled and compared with a snapshot, and every input a mixin should refuse must stop the build with the library's own error message. [CONTRIBUTING.md](CONTRIBUTING.md#testing) explains which of these a change needs.

## Contribution

Please read the [contribution details](CONTRIBUTING.md) and feel free to contribute to the library. If you are working on a mixin, the site's dev server has a lab that renders your working copy of the library as you edit it; [CONTRIBUTING.md](CONTRIBUTING.md#seeing-what-it-renders) shows how to use it.

## License

Gerillass is licensed under the Apache License, Version 2.0. For more [see the license content](https://github.com/selfishprimate/gerillass/blob/main/LICENSE.md).

## Additional Info

This project is created with the loving music of **Anna German** and dedicated to **James Williamson**: The best web educator ever. For more information about James, please check his legacy blog page at [simpleprimate.netlify.app](https://simpleprimate.netlify.app) or watch his video lectures about **Web** and **Accessibility** on [LinkedIn Learning](https://www.linkedin.com/learning/instructors/james-williamson).
