<p>
  <a href="http://sketchize.com/" target="_blank">
    <img src="https://gerillass.com/images/logo/logo-sassy.svg">
  </a>
</p>

## _Meet the coolest Sass toolset!_

[Gerillass](https://gerillass.com) is a library built on top of [Sass (Syntactically Awesome Style Sheets)](https://sass-lang.com/) to give you flexibility for your projects and accelerate your performance and creativity.

Many of the utilities that come with Gerillass are the solutions I have come up with for the challenges I have faced as a frontend developer over the years. These solutions have been shaped by the inspiration of other popular libraries and frameworks like [Bourbon](https://www.bourbon.io/), [Susy](https://www.oddbird.net/), [Scut](https://davidtheclark.github.io/scut/), [Bootstrap](https://getbootstrap.com/), etc. over time and helped me create Gerillass.

Hope you’ll enjoy using it!

**Related Links:**

* [Gerillass Website](https://gerillass.com)  
* [Gerillass Documentation](https://docs.gerillass.com)  
* [Twitter](https://twitter.com/gerillass)

## Table of Contents

* [Installation](#installation)
   * [Cloning the Repository from Github](#cloning-the-repository-from-github)
   * [Node.js Installation](#nodejs-installation)
   * [Using with React.js](#using-with-reactjs)
   * [Using with Gulp](#using-with-gulp)
   * [Using with Grunt](#using-with-grunt)
* [Vendor Prefix Support](#vendor-prefix-support)
* [Experimenting Gerillass](#experimenting-gerillass)
* [Contribution](#contribution)
* [License](#license)
* [Additional Info](#additional-info)

## Installation

    npm install gerillass

You can **import** Gerillass with **node_modules** path.

    @import '{node_modules_path}/gerillass/scss/gerillass';

**To add the library without using the {node_modules_path} see the examples below.**

If you're working with an **eyeglass** setup, simply import it without providing the **node_modules** path.

    @import 'gerillass';
    
### Cloning the repository from Github

You can clone the repository into your local computer from Github.

    git clone https://github.com/selfishprimate/gerillass.git
   
Or you can add the library as a submodule into your Git based project ([What is a submodule?](https://git-scm.com/book/en/v2/Git-Tools-Submodules)).

    git submodule add https://github.com/selfishprimate/gerillass.git
    
Including to the project:

    @import 'gerillass/scss/gerillass';

### Node.js Installation

If you are working on a Node project you can add Gerillass as a dependency.

#### npm installation

    npm install gerillass

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

## Vendor Prefix Support

Because of the vast usage of bundlers like Gulp, Grunt, Webpack, etc.(these frameworks run some other plugins like Autoprefixer to support vendor prefixes), Gerillass doesn't provide vendor prefix support.

So, feel free to use any tool to support that. My suggestion is Autoprefixer. If you are not using one of the bundlers mentioned above, you can also manually add vendor prefixes using the [Autoprefixer CSS Online](https://autoprefixer.github.io/) tool.

## Experimenting Gerillass

Experimenting Gerillass is easy. You can [download the Gerillass library](https://github.com/selfishprimate/gerillass/archive/master.zip), include it in your project, or use [Gulpazan](https://github.com/selfishprimate/gulpazan). Gulpazan is a Gulp based workflow, and it comes with Gerillass and all the packages and configurations that you'll need to work with Sass. [Learn how you can install Gulpazan](https://github.com/selfishprimate/gulpazan).

**Important Note**: Don't forget that you must have [Node.js](https://nodejs.org/en/) and [Gulp](https://gulpjs.com/docs/en/getting-started/quick-start) installed globally on your machine.

## Contribution

Please read the [contribution details](CONTRIBUTING.md) and feel free to contribute to the library.

## License

Gerillass is licensed under the Apache License, Version 2.0. For more [see the license content](https://github.com/selfishprimate/gerillass/blob/master/LICENSE.md).

## Additional Info

This project is created with the loving music of **Anna German** and dedicated to **James Williamson**: The best web educator ever. For more information about James, please check his legacy blog page at www.simpleprimate.com or watch his video lectures about **Web** and **Accessibility** on [LinkedIn Learning](https://www.linkedin.com/learning/instructors/james-williamson).

