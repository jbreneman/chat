var gulp = require('gulp'),
	sass = require('gulp-sass'),
	rename = require('gulp-rename'),
	autoprefixer = require('gulp-autoprefixer'),
	babel = require('gulp-babel');

var dirs = {
	src: './src/',
	build: './public/assets/'
};

// scss building
gulp.task('sass', function(){
	return gulp.src(dirs.src + 'scss/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(rename('app.min.css'))
		.pipe(gulp.dest(dirs.build + 'css/'));
});

// js transpilation
gulp.task('js', function(){
	return gulp.src(dirs.src + 'js/*.js')
		.pipe(babel({
            presets: ['es2015']
        }))
		.pipe(rename('app.min.js'))
		.pipe(gulp.dest(dirs.build + 'css/'));
});

gulp.task('default', ['sass', 'js'], function() {
	gulp.watch(dirs.src + 'scss/**/*.scss', ['sass']);
	gulp.watch(dirs.src + 'js/**/*.js', ['js']);
});