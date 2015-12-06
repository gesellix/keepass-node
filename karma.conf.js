module.exports = function (config) {
    config.set(
            {
                //basePath: 'public',

                // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
                frameworks: ['mocha', 'sinon-chai'],

                // list of files / patterns to load in the browser
                files: [
                    'public/js/lib/underscore/underscore-min.js',
                    'public/js/lib/jquery/jquery-1.11.1.js',
                    'public/js/lib/angular/angular.min.js',
                    'public/js/lib/angular/angular-mocks.js',
                    'public/js/lib/angular/angular-animate.min.js',
                    'public/js/lib/angular/angular-aria.min.js',
                    'public/js/lib/hammerjs/hammer.min.js',
                    'public/js/lib/angular-material/angular-material.js',
                    'public/js/lib/angular-jwt/angular-jwt.min.js',
                    'public/js/lib/treeview/angular.treeview.min.js',
                    'public/js/lib/clipboard/clipboard.min.js',
                    'public/templates/**/*.html',
                    'public/js/app/**/*.js'
                ],

                // list of files to exclude
                exclude: [
                    '**/Gruntfile.js',
                    '**/karma.conf.js'
                ],

                // preprocess matching files before serving them to the browser
                // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
                preprocessors: {
                    'public/templates/**/*.html': ['ng-html2js'],
                    'public/js/app/**/!(*test).js': 'coverage'
                },

                // possible values: 'dots', 'progress'
                // available reporters: https://npmjs.org/browse/keyword/karma-reporter
                reporters: ['progress'],

                coverageReporter: {
                    type: 'lcov',
                    dir: 'coverage-frontend/'
                },

                ngHtml2JsPreprocessor: {
                    stripPrefix: 'public/',

                    // setting this option will create only a single module that contains templates
                    // from all the files, so you can load them all with module('templates')
                    moduleName: 'templates'
                },

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
