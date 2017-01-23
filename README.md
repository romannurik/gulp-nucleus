# gulp-nucleus
An opinionated approach to generating static HTML using gulp and swig templates.

## What is it?

The plugin is a simple static site generator that:

- Is designed for use in [gulp](http://gulpjs.com/). See example usage below.
- Uses [swig](https://github.com/paularmstrong/swig) for templating.
- Adds markdown support from [swig-extras](https://github.com/paularmstrong/swig-extras).
- Supports YAML [front-matter](https://github.com/jxson/front-matter) to pass data to swig templates.
- Supports YAML data files as additional data to pass to swig templates. See example below.
- Supports generating new pages from YAML data files. See example below.

## Basic usage

gulpfile.js

    gulp.task('html', () => {
      return gulp.src('html/**/*.html')
        .pipe(gulpNucleus())
        .pipe(gulp.dest('dist'));
    });

html/index.html

    ---
    title: hello
    ---
    <!doctype html>
    <html>
    <head><title>
      {{ title }} <!-- rendered using swig -->
    </title></head>
    <body>
    Hello world!
    </body>
    </html>

## Using YAML data files

gulpfile.js:

    gulp.task('html', () => {
      return gulp.src('html/**/*.html')
        .pipe(gulpNucleus({
          dataPath: 'data'
        }))
        .pipe(gulp.dest('dist'));
    });

data/apikeys.yaml:

    fooApi: 2346b3166bdb60a0506d

html/index.html:

    ...
    <script src="foo.js?key={{apikeys.fooApi}}

## Generate new pages from YAML data files:

HTML pages that start with a `$` are considered generator pages. For example:

gulpfile.js:

    gulp.task('html', () => {
      return gulp.src('html/**/*.html')
        .pipe(gulpNucleus({
          dataPath: 'data'
        }))
        .pipe(gulp.dest('dist'));
    });

data/people.yaml:

    - id: jane
      name: Jane
    - id: john
      name: John

html/$person.html:

    ---
    generate:
      collection: people
      variable: person
      filename: '{{person.id}}.html'
    ---
    Hi, my name is {{person.name}}
