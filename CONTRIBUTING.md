# Contribution

Hey there! The future contributor of Gerillass! 

I hope you'll find it very easy to contribute to the project. My advice for you to check out the code in the "scss" folder first. I think you'll understand the logic behind the structure at first sight! 

If you don't somehow, you have to read the details below line-by-line, unfortunately.

## Gerillass Style Guide

_I Used Prettier to format the code._

* Indent with two spaces (not with tab)
* Use **camelCase** naming convention for function names only and start with two underscore characters (e.g. `__remify`).
* Use **kebab-case** naming convention for the rest of the code.
* Use `gls-` namespace for mixins (**not for the file names**).
* Use `map-`prefix for the maps you create.
* Use `list-` prefix for the lists you create.

### Functions

The functions should be placed in the **utilities** folder. The function names start with two underscores and follow **camelCase** naming convention (e.g. `__pseudoSelector()`).

In the entire library, only the function names are following the camelCase naming convention to make a strict distinction between the functions and the mixins. Rest of the code follows **kebab-case** (also known as spinal-case) naming convention.

### Mixins

The mixins should be placed in the **library** folder and they must follow the kebab-case naming convention.

### Experimenting Gerillass

The method I recommend for experimenting Gerillass is to use [Gulpazan](https://github.com/selfishprimate/gulpazan). Gulpazan is a Gulp based workflow that I built for to create static pages easily, and it comes with Gerillass. It is very easy to power up a project. Simply download the repository, `npm install` to install all the dependencies that Gulpazan needs, and then write `gulp start` and hit the enter to power up the project.

Well, that's all.
