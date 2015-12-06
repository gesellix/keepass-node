(function () {
    "use strict";

    var init = angular.module('init', []);

    init.factory('init', function ($q, $rootScope, $browser) {

        var initFunctions = [
            'keepass-manager'
        ];
        var registeredInitFunctions = {};
        var initialized = false;

        var initApplication = function () {
            var keepassManager = registeredInitFunctions['keepass-manager'];

            var broadcastAppInitialized = function () {
                $browser.defer(function () {
                    initialized = true;
                    $rootScope.$apply(function () {
                        $rootScope.$broadcast('appInitialized');
                    });
                });
            };
            keepassManager.init()
                    .then(broadcastAppInitialized);
        };

        $rootScope.$on('$routeChangeStart', function () {
            registeredInitFunctions = {};
            initialized = false;
        });

        var initAppWhenReady = function () {
            var registeredInitFunctionNames = _.keys(registeredInitFunctions);
            var isRegistered = _.partial(_.contains, registeredInitFunctionNames);
            if (_.every(initFunctions, isRegistered)) {
                initApplication();
                registeredInitFunctions = null;
            }
        };

        var init = function (name, dependencies, initCallback) {
            registeredInitFunctions[name] = {
                init: function () {
                    var internalDependencies = $q.all(dependencies);
                    return internalDependencies.then(initCallback);
                }
            };
            initAppWhenReady();
        };

        init.watchAfterInit = function (scope, expression, listener, deepEqual) {
            scope.$watch(expression, function (newValue, oldValue, listenerScope) {
                if (initialized) {
                    listener(newValue, oldValue, listenerScope);
                }
            }, deepEqual);
        };

        init.onAfterInit = function (scope, event, listener) {
            scope.$on(event, function (event) {
                if (initialized) {
                    listener(event);
                }
            });
        };

        return init;
    });
}());
