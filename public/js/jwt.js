"use strict";

var jwt = angular.module('jwt', ['angular-jwt']);

jwt.service('jwtStore', function () {
  this.saveJwt = function (jwt) {
    localStorage.setItem('jwt', jwt);
  };
  this.removeJwt = function () {
    localStorage.removeItem('jwt');
  };
});

jwt.config(function ($httpProvider, jwtInterceptorProvider) {
  jwtInterceptorProvider.tokenGetter = function () {
    return localStorage.getItem('jwt');
  };
  $httpProvider.interceptors.push('jwtInterceptor');
});
