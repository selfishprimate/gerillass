const { series, src, dest, watch } = require("gulp");

const rename = require("gulp-rename");


function namify(done) {
  return src("./scss/_gerillass.scss")
    .pipe(rename({ prefix: "_gls-", basename: "gerillass", extname: ".scss" }))
    .pipe(dest("./scss"));
  done();
}

exports.start = series(namify);