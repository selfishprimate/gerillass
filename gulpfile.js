const { series, src, dest } = require("gulp");
const concat = require("gulp-concat");
const replace = require("gulp-replace");
const header = require("gulp-header");

function gather_mixins(done) {
  return src(["scss/library/**/*.scss"])
    .pipe(concat("_gerillass-prefix.scss"))
    .pipe(dest("scss"));
  done();
}

function del_charset(done) {
  return src("scss/_gerillass-prefix.scss")
    .pipe(replace('@charset "UTF-8";', ''))
    .pipe(dest("scss"));
  done();
}

function add_charset(done) {
  return src("scss/_gerillass-prefix.scss")
    .pipe(header('@charset "UTF-8";'))
    .pipe(dest("scss"));
  done();
}

function add_sassmath(done) {
  return src("scss/_gerillass-prefix.scss")
    .pipe(header('\n@use "sass:math";'))
    .pipe(dest("scss"));
  done();
}

function add_prefix(done) {
  return src("scss/_gerillass-prefix.scss")
    .pipe(replace('@mixin ', "@mixin gls-"))
    .pipe(dest("scss"));
  done();
}

exports.start = series(gather_mixins, del_charset, add_sassmath, add_charset, add_prefix);