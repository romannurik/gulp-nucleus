/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');
const path = require('path');
const streamCombiner = require('stream-combiner');
const swig = require('swig');
const swigExtras = require('swig-extras');
const through = require('through2');
const yaml = require('js-yaml');

const gulpFrontMatter = require('gulp-front-matter');
const gulpIf = require('gulp-if');
const gulpSwig = require('gulp-swig');
const gulpTap = require('gulp-tap');
const gulpUtil = require('gulp-util');

const PLUGIN_NAME = 'gulp-nucleus';

module.exports = function gulpNucleus(options = {}) {
  let {dataPath, setupSwig} = options;
  let globalData = {};
  let pages = [];

  if (dataPath && fs.existsSync(dataPath)) {
    fs.readdirSync(dataPath).forEach(filename => {
      let path = `${dataPath}/${filename}`;
      let stat = fs.statSync(path);
      if (stat.isFile() && /.yaml$/.test(filename)) {
        let obj = yaml.safeLoad(fs.readFileSync(path, 'utf8'));
        globalData[filename.replace(/\..*/, '')] = obj;
      }
    });
  }

  return streamCombiner(
      // extract frontmatter
      gulpFrontMatter({
        property: 'frontMatter',
        remove: true
      }),
      // start populating context data for the file, globalData, followed by file's frontmatter
      gulpTap((file, t) => file.contextData = Object.assign({}, globalData, file.frontMatter)),
      // handle generator files (e.g. $foo.html)
      gulpIf('**/$*.html', through.obj(function(file, enc, cb) {
        // pull out generator info and find the collection
        let gen = file.frontMatter.generate;
        let collection = globalData[gen.collection];
        if (!collection) {
          this.emit('error', new gulpUtil.PluginError(PLUGIN_NAME, `Collection ${gen.collection} not found.`));
          return cb();
        }
        // create a new file for each item in the collection
        collection.forEach(item => {
          let newFile = file.clone();
          newFile.contextData = Object.assign({}, file.contextData);
          newFile.contextData[gen.variable] = item;
          newFile.path = path.join(newFile.base,
              swig.render(gen.filename, {locals: newFile.contextData}));
          this.push(newFile);
        });
        cb();
      })),
      // populate the global pages collection
      // wait for all files first (to collect all front matter)
      gulpUtil.buffer(),
      through.obj(function (filesArray, enc, cb) {
        filesArray.forEach(file => pages.push({path: file.path, data: file.frontMatter || {}}));
        // re-emit each file into the stream
        filesArray.forEach(file => this.push(file));
        cb();
      }),
      gulpTap((file, t) => {
        // finally, add pages array to collection
        file.contextData = Object.assign(file.contextData, {all_pages: pages});
      }),
      // run everything through swig templates
      gulpSwig({
        setup: sw => {
          swigExtras.useTag(sw, 'markdown');
          swigExtras.useFilter(sw, 'markdown');
          swigExtras.useFilter(sw, 'trim');
          setupSwig && setupSwig(sw);
        },
        data: file => file.contextData,
        defaults: {
          cache: false
        }
      })
      );
};
