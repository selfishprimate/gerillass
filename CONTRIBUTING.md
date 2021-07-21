# Contribution
_To contribute, or not to contribute, that is the question!_

## Hey there!

**The future contributor of Gerillass,**

I'm sure you will find it quite easy to contribute to the project. I encourage you to examine the code in the "scss" folder first to understand the logic behind the structure.

If you don't somehow, you have to read the details below line-by-line, unfortunately.

## Gerillass Style Guide

Please examine the code and match the style with the code you write (**Prettier** plugin for your code editor can pretty much help you to format your code).

### Overview

* Use two spaces indentation (no tabs).
* Use `@charset "UTF-8";` line in every Sass related files to avoid any potential issues with character encoding.
* Use **camelCase** naming convention for function names only and start with two underscore characters (e.g. `__newFunction {}`).
* Use **kebab-case** naming convention for the rest of the code.
* Use `map-for-`prefix for the map names (e.g. `$map-for-directions`).
* Use `list-of-` prefix for the list names (e.g. `$list-of-colors`).
* Don't use single quotes unless you have to.

### Functions

The functions should be placed in the **utilities** folder. The function names start with two underscores and follow **camelCase** naming convention.

    @function __newFunction($parameter) {
        // Your code!
    }

In the entire library, only the function names are following the camelCase naming convention to make a strict distinction between the functions and the mixins. Rest of the code follows **kebab-case** (also known as spinal-case) naming convention.


### Mixins

The mixin files should be placed in the **library** folder and they must follow the kebab-case naming convention.

    @mixin your-mixin($parameter) {
      // Your code!
    }

After you create a mixin, try writing a test to see if your mixin works.

You can find two test examples under the `test` folder, take your time, examine the codes, and then write your test. After that, run the following command to see if the test pass.

    npm test

If the test pass run following command to generate your mixin's prefixed version:

    gulp start

**Important Note:** You must have Gulp installed globally on your machine.

### Lists

The list files should be placed in the **lists** folder, and the name of the list must start with the `list-of` prefix.

    $list-of-buttons: (
      "button",
      "[type='button']",
      "[type='reset']",
      "[type='submit']"
    ) !default;

### Maps

The maps should be placed in the **maps** folder, and the name of the map must be start with `map-for` prefix.

    $map-for-breakpoints: (
      "xsmall": 0,
      "small": 576px,
      "medium": 768px,
      "large": 992px,
      "xlarge": 1200px,
    ) !default;
 
 
 Well, that's all for now.
 
 _This document will soon be updated!_
