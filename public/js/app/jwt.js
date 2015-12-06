(function () {
    "use strict";

    var jwt = angular.module('jwt', ['angular-jwt']);

    jwt.service('jwtStore', function () {
        this.saveJwt = function (jwt) {
            sessionStorage.setItem('jwt', jwt);
        };
        this.removeJwt = function () {
            sessionStorage.removeItem('jwt');
        };
    });

    jwt.config(function ($httpProvider, jwtInterceptorProvider) {
        jwtInterceptorProvider.tokenGetter = function () {
            return sessionStorage.getItem('jwt');
        };
        $httpProvider.interceptors.push('jwtInterceptor');
    });
}());
