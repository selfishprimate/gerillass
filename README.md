# Gerillass

_The best Sass tool set ever for guerrilla type of CSS coders._

## What is Gerillass?

[Gerillass](https://gerillass.com) is a library built on top of [Sass (Syntactically Awesome Style Sheets)](https://sass-lang.com/) to give you flexibility for your projects and accelerate your performance and creativity.

Many of the utilities that come with Gerillass are the solutions I have come up with for the challenges I have faced as a frontend developer over the years. These solutions have been shaped by the inspiration of other popular libraries and frameworks like [Bourbon](https://www.bourbon.io/), [Susy](https://www.oddbird.net/), [Scut](https://davidtheclark.github.io/scut/), [Bootstrap](https://getbootstrap.com/), etc. over time and helped me create Gerillass.

Hope you’ll enjoy using it!

* [Gerillass Website](https://gerillass.com)  
* [Gerillass Documentation](https://docs.gerillass.com)  
* [Twitter](https://twitter.com/gerillass)


## Installation

    npm install gerillass

You can Install the Gerillass Sass library via **npm**, **Yarn**, or you can download it manually into your local computer via Github.

**1. Node.js Installation**

If you are working on a Node project you can add Gerillass as a dependency.

**npm installation:**

    npm install gerillass

**Yarn installation:**

    yarn add gerillass

**2. Cloning the repository ftom Github**

You can clone the repository.

    git clone https://github.com/selfishprimate/gerillass.git
   
Or you can add it as a submodule into you Git based project ([What is a submodule?](https://git-scm.com/book/en/v2/Git-Tools-Submodules)).

    git submodule add https://github.com/selfishprimate/gerillass.git
    

## How to Include?

Import Gerillass at the beginning of your stylesheet:

**1. Using Gulp**

You can add a new Gulp task or change the current if you have one ().

    gulp.task('sass', function() {
      return gulp.src('scss/*.scss')
          .pipe(sass({
              outputStyle: 'compressed',
              includePaths: ['node_modules/gerillass/scss']
          }).on('error', sass.logError))
          .pipe(gulp.dest('dist/css'));
    });

**2. Using Eyeglass**

If you're workin with an eyeglass setup, simply import it without providing the **npm_modules** path.

    @import 'gerillass';
