module.exports = function (config) {
  config.set(
      {
        basePath: 'public',

        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['mocha', 'sinon-chai'],

        // list of files / patterns to load in the browser
        files: [
          'js/lib/underscore/underscore-min.js',
          'js/lib/jquery/jquery-1.11.1.js',
          'js/lib/angular/angular.min.js',
          'js/lib/angular/angular-mocks.js',
          'js/lib/angular/angular-animate.min.js',
          'js/lib/angular/angular-aria.min.js',
          'js/lib/hammerjs/hammer.min.js',
          'js/lib/angular-material/angular-material.js',
          'js/lib/angular-jwt/angular-jwt.min.js',
          'js/lib/treeview/angular.treeview.min.js',
          'js/lib/zeroclipboard/ZeroClipboard.min.js',
          'js/app/zeroclipboard-config.js',
          'js/app/**/*.js'
        ],

        // list of files to exclude
        exclude: [
          '**/Gruntfile.js',
          '**/karma.conf.js'
        ],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {},

        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['PhantomJS'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false
      });
};
