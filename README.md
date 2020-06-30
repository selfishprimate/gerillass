# Gerillass

_The best Sass tool set ever for guerrilla type of CSS authors._

## What is Gerillass?

[Gerillass](https://gerillass.com) is a library built on top of [Sass (Syntactically Awesome Style Sheets)](https://sass-lang.com/) to give you flexibility for your projects and accelerate your performance and creativity.

Many of the utilities that come with Gerillass are the solutions I have come up with for the challenges I have faced as a frontend developer over the years. These solutions have been shaped by the inspiration of other popular libraries and frameworks like [Bourbon](https://www.bourbon.io/), [Susy](https://www.oddbird.net/), [Scut](https://davidtheclark.github.io/scut/), [Bootstrap](https://getbootstrap.com/), etc. over time and helped me create Gerillass.

Hope you’ll enjoy using it!

**Related Links:**

* [Gerillass Website](https://gerillass.com)  
* [Gerillass Documentation](https://docs.gerillass.com)  
* [Twitter](https://twitter.com/gerillass)

## Table of Contents

- [Installation](#installation)
    - [Node.js Installation](#nodejs-installation)
    - [Cloning the Repository from Github](#cloning-the-repository-from-github)
    - [Using with React.js](#using-with-reactjs)
    - [Using with Gulp](#using-with-gulp)
    - [Using with Grunt](#using-with-grunt)
- [Contribution](#contribution)
- [Experimenting](#experimenting)
- [Additional Info](#additional-info)

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
   
Or you can add it as a submodule into your Git based project ([What is a submodule?](https://git-scm.com/book/en/v2/Git-Tools-Submodules)).

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

    
## Contribution

Please read the [contribution text](CONTRIBUTING.md) and feel free to contribute to the library.

## Experimenting Gerillass

Experimenting Gerillass is easy. You can either [download the Gerillass library](https://github.com/selfishprimate/gerillass/archive/master.zip) and include it into your project or you can use [Gulpazan](https://github.com/selfishprimate/gulpazan). Gulpazan is a Gulp based workflow and it comes with Gerillass and Sass integration that Gerillass needs. [Learn how you can install Gulpazan](https://github.com/selfishprimate/gulpazan). 

**Important Note:** Don't forget that you must have [Node.js](https://nodejs.org/en/) and [Gulp](https://gulpjs.com/docs/en/getting-started/quick-start) installed globally on your machine.


## Additional Info

This project is made with the loving music of **Anna German** and dedicated to **James Williamson**: The best web educator ever. For more information about James, please check out his legacy blog page at www.simpleprimate.com or watch his video lectures about **Web** and **Accessibility** on [LinkedIn Learning](https://www.linkedin.com/learning/instructors/james-williamson).

