const gulp = require('gulp');

// use 'gulp-nucleus' in the real world
const gulpNucleus = /*require('gulp-nucleus')*/ require('../..');

gulp.task('html', () => {
  return gulp.src('html/**/*.html')
    .pipe(gulpNucleus({
      dataPath: 'data'
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('default', ['html']);
