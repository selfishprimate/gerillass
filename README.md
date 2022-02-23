<p>
  <a href="https://gerillass.com" target="_blank">
    <img src="https://gerillass.com/images/github/gerillass_logo_sassy.svg">
  </a>
</p>

## _<span><img src="https://gerillass.com/images/github/heart_red.svg"></span> Meet the Coolest Sass Toolset! <span><img src="https://gerillass.com/images/github/heart_red.svg"></span>_

[Gerillass](https://gerillass.com) is a library built on top of [Sass (Syntactically Awesome Style Sheets)](https://sass-lang.com/) to give you flexibility for your projects and accelerate your performance and creativity.

Many of the utilities that come with Gerillass are the solutions I have come up with for the challenges I have faced as a frontend developer over the years. These solutions have been shaped by the inspiration of other popular libraries and frameworks like [Bourbon](https://www.bourbon.io/), [Susy](https://www.oddbird.net/), [Scut](https://davidtheclark.github.io/scut/), [Bootstrap](https://getbootstrap.com/), etc. over time and helped me create Gerillass.

Hope you’ll enjoy using it!

**Related Links:**

- [Gerillass Website](https://gerillass.com)
- [Gerillass Documentation](https://docs.gerillass.com)
- [Gerillass Blog](https://medium.com/gerillass)
- [Twitter](https://twitter.com/gerillass)

## Table of Contents

- [Dart Sass Upgrade](#dart-sass-upgrade)
- [Installation](#installation)
  - [Node.js Installation](#nodejs-installation)
  - [Using with React.js](#using-with-reactjs)
  - [Using with Gulp](#using-with-gulp)
  - [Using with Grunt](#using-with-grunt)
  - [Cloning the Repository from Github](#cloning-the-repository-from-github)
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

You can **import** Gerillass with **node_modules** path.

    @import '{node_modules_path}/gerillass/scss/gerillass';

**To add the library without using the {node_modules_path} see the examples below.**

If you're working with an **eyeglass** setup, simply import it without providing the **node_modules** path.

    @import 'gerillass';

### Node.js Installation

If you are working on a Node project you can add Gerillass as a dependency.

#### npm installation

    npm install gerillass --save-dev

#### Yarn installation

    yarn add gerillass

### Using with React.js

Simply `@import` the library at the beginning of your App.scss file without using the **node_modules** path.

    @import 'gerillass';

### Using with Gulp

You can add a new Gulp task as in the below example or simply add `includePath: ['node_modules/gerillass/scss']` option to the task if you have one already.

    function sassify(done) {
      return (
        src("assets/sass/**/*.scss")
        .pipe(sass({
          outputStyle: "expanded",
          includePaths: ["node_modules/gerillass/scss"],
        }).on('error', sass.logError))
        .pipe(dest("assets/css"))
      );
      done()
    }

Including to the project:
  
    @import 'gerillass';

### Using with Grunt

You can add the Gerillass library by editing your Gruntfile.js at the root level of your project. Simply find the sass related rules and add `loadPath: ['node_modules/gerillass/scss']` inside the `options` object.

    sass: {
      dist: {
        options: {
          style: "expanded",
          loadPath: ['node_modules/gerillass/scss']
        },
        files: {
          "main.css": "main.scss"
        }
      }
    }

Including to the project:
  
    @import 'gerillass';
    
### Cloning the repository from Github

You can clone the repository into your local computer from Github.

    git clone https://github.com/selfishprimate/gerillass.git

Or you can add the library as a submodule into your Git based project ([What is a submodule?](https://git-scm.com/book/en/v2/Git-Tools-Submodules)).

    git submodule add https://github.com/selfishprimate/gerillass.git

Including to the project:

    @import '{folder_path}/gerillass/scss/gerillass';

## Namespace Usage

You can use Gerillass with or without `gls-` namespace. It is optional, but I strongly recommend you to use it to prevent having conflicts with other Sass libraries or frameworks like Bootstrap.

## Vendor Prefix Support

Because of the vast usage of bundlers like [Gulp](https://gulpjs.com/), [Grunt](https://gruntjs.com/), [Webpack](https://webpack.js.org/), etc.(these frameworks run some other plugins like Autoprefixer to support vendor prefixes), Gerillass doesn't provide vendor prefix support.

So, feel free to use any tool to support that. My suggestion is Autoprefixer. If you are not using one of the bundlers mentioned above, you can also manually add vendor prefixes using the [Autoprefixer CSS Online](https://autoprefixer.github.io/) tool.

## Experimenting

Experimentation with Gerillass is easy: If you're processing Sass files on your computer already, [download the Gerillass Sass library](https://github.com/selfishprimate/gerillass/archive/master.zip), include it in your project, and start using it. If not, use [Gerillass Play](https://github.com/selfishprimate/gerillass-play)! Gerillass Play is a Gulp based playground, built for you to get started with [Sass](https://sass-lang.com/) and [Gerillass](https://gerillass.com/) quickly.

**Important Note**: Don't forget that you must have [Node.js](https://nodejs.org/en/) and [Gulp CLI](https://gulpjs.com/docs/en/getting-started/quick-start) installed on your machine to work with Gerillass Play.

## Testing

Gerillass comes with a unit-testing module named [True](https://github.com/oddbird/true), which makes Sass unit tests possible (endless thanks to the [OddBird Team](https://github.com/oddbird)).

You can find two test examples under the `test` folder, take your time, examine the codes, and then write your unit tests. After that, run the following command to see if the tests pass.

    npm test

## Contribution

Please read the [contribution details](CONTRIBUTING.md) and feel free to contribute to the library.

## License

Gerillass is licensed under the Apache License, Version 2.0. For more [see the license content](https://github.com/selfishprimate/gerillass/blob/master/LICENSE.md).

## Additional Info

This project is created with the loving music of **Anna German** and dedicated to **James Williamson**: The best web educator ever. For more information about James, please check his legacy blog page at www.simpleprimate.com or watch his video lectures about **Web** and **Accessibility** on [LinkedIn Learning](https://www.linkedin.com/learning/instructors/james-williamson).
