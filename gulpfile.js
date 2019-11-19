var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var cache = require('gulp-cache');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');

// Sass Compile
gulp.task('sass', function () {
  return gulp.src(["./**/*.scss", "!node_modules/**/*.scss"], { base: "." })
    // gulp-sass kullanarak Sass dosyasını CSS'e çeviriyor. (nested, compact, expanded, compressed)
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded',
      includePaths: ['./node_modules/susy/sass']
    })).on("error", function swallowError(error) {
      console.log(error.toString())
      this.emit('end')
    })
    //.pipe(sourcemaps.write())
    .pipe(autoprefixer({ browsers: ['last 4 version', 'iOS 6'], cascade: false })) // CSS dosyasına prefixler ekleniyor...
    .pipe(gulp.dest('./'))
    .pipe(browserSync.reload({
      stream: true
    }))
});

// Runs the BrowserSync
gulp.task('browserSync', function () {
  browserSync.init({
    server: {
      baseDir: 'src'
    },
    port: 8080
  })
});

// Cleans the cache
gulp.task('cache:clear', function (callback) {
  return cache.clearAll(callback)
})


// Watches the file changes
//gulp.watch('files-to-watch', ['task-to-run']);
gulp.task('start', ['browserSync', 'sass'], function () {
  gulp.watch('src/**/*.scss', ['sass']);
  gulp.watch('src/*.html', browserSync.reload);
  // Put here all the other files that you want to be watched
});
