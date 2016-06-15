var gulp = require('gulp');
var ts = require('gulp-typescript');
var connect = require('gulp-connect');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var merge = require('merge2');

var tsProject = ts.createProject('tsconfig.json', { sortOutput: true });

gulp.task('serve', function () {
  connect.server();
});

// Note: you can only use tsProject.src() if your tsconfig.json file 
// has a files property. If it  doesn't, you should use gulp.src('**/**.ts').

// named "build" so VS Code will run this from sft-cmd-B
gulp.task('build', function () {   
  var tsResult = tsProject.src()
                      // We want sourcemaps to be generated 
                      .pipe(sourcemaps.init()) 
                       .pipe(ts(tsProject));

  return merge([
      tsResult.dts.pipe(gulp.dest('.')),
      tsResult.js
        // if we wanted to concatenate all the js files into one file!
        .pipe(concat('a0.js')) 
        // You can use other plugins that also support gulp-sourcemaps 
        .pipe(sourcemaps.write()) 
        // Now the sourcemaps are added to the .js file 
        .pipe(gulp.dest('js'))
  ])
});

gulp.task('default', ['build', 'serve']);