"use strict";

var keepass = angular.module('keepass', ['init', 'angularTreeview', 'keepass-entries']);

keepass.provider('jwtInterceptor2', function () {

  this.authHeader = 'Authorization';
  this.authPrefix = 'Bearer ';
  this.tokenGetter = function () {
    return null;
  };

  var config = this;

  this.$get = function ($q, $injector, $rootScope) {
    return {
      request: function (request) {
        if (request.skipAuthorization) {
          return request;
        }

        request.headers = request.headers || {};
        // Already has an Authorization header
        if (request.headers[config.authHeader]) {
          return request;
        }

        var tokenPromise = $q.when($injector.invoke(config.tokenGetter, this, {
          config: request
        }));

        return tokenPromise.then(function (token) {
          if (token) {
            request.headers[config.authHeader] = config.authPrefix + token;
          }
          return request;
        });
      },
      responseError: function (response) {
        // handle the case where the user is not authenticated
        if (response.status === 401) {
          $rootScope.$broadcast('unauthenticated', response);
        }
        return $q.reject(response);
      }
    };
  };
});

keepass.config(function ($httpProvider, jwtInterceptor2Provider) {
  jwtInterceptor2Provider.tokenGetter = function () {
    return localStorage.getItem('jwt');
  };
  $httpProvider.interceptors.push('jwtInterceptor2');
});

keepass.service('kdbxBackendService', function ($http) {
  this.getDatabases = function () {
    return $http({
      "method": "get",
      "url": '/databases'
    });
  };
  this.getDatabaseAuthToken = function (filename, password) {
    return $http({
      "method": "post",
      "url": '/databases/' + encodeURIComponent(filename) + '/auth',
      data: {password: password}
    });
  };
  this.getRaw = function (filename, password) {
    return $http({
      "method": "post",
      "url": '/databases/' + encodeURIComponent(filename),
      data: {password: password}
    });
  };
  this.getGroups = function (filename, password) {
    return $http({
      "method": "post",
      "url": '/' + encodeURIComponent(filename) + '/groups',
      data: {password: password}
    });
  };
  this.getEntries = function (filename, password, group) {
    return $http({
      "method": "post",
      "url": '/' + encodeURIComponent(filename) + '/' + encodeURIComponent(group),
      data: {password: password}
    });
  };
});

keepass.controller('keepassBrowser', function ($scope, init, kdbxBackendService) {
  $scope.messages = [];
  $scope.errors = [];

  $scope.loading = true;
  $scope.databases = [];

  $scope.selectedDb = null;
  $scope.dbPassword = null;

  $scope.db = {};
  $scope.kdbxTree = null;
  $scope.groupEntries = [];

  var onGroupsLoaded = function (groups) {
    $scope.groupsTree = groups;
  };

  var onGroupSelected = function (entries) {
    $scope.groupEntries = entries;
  };

  $scope.loadEntries = function () {
    $scope.errors = [];
    $scope.messages = ["authenticate..."];
    kdbxBackendService.getDatabaseAuthToken($scope.selectedDb, $scope.dbPassword)
        .then(function (result) {
          console.log(result.data);
          localStorage.setItem('jwt', result.data.jwt);
        }, function (reason) {
          console.log(reason);
        });

    $scope.errors = [];
    $scope.messages = ["loading..."];
    $scope.groupsTree = [];
    $scope.groupEntries = [];
    //kdbxBackendService.getRaw($scope.selectedDb, $scope.dbPassword)
    //    .then(function (result) {
    //            console.log(result.data.Root.Group);
    //          });
    kdbxBackendService.getGroups($scope.selectedDb, $scope.dbPassword)
        .then(function (result) {
          $scope.errors = [];
          $scope.messages = [];
          $scope.messages.push("groups successfully loaded");
          onGroupsLoaded(result.data);
        },
        function (reason) {
          $scope.messages = [];
          $scope.errors = [];
          $scope.errors.push("load groups HTTP status: " + reason.status);
          $scope.errors.push(reason.data);
        });
  };

  init('keepassBrowser', [kdbxBackendService.getDatabases()], function (result) {
    $scope.databases = result[0].data.databases;
    if ($scope.databases && $scope.databases.length === 1) {
      $scope.selectedDb = $scope.databases[0];
    }
    $scope.loading = false;
  });

  init.watchAfterInit($scope, 'kdbxTree.currentNode', function () {
    if ($scope.kdbxTree && angular.isObject($scope.kdbxTree.currentNode)) {
      $scope.errors = [];
      $scope.messages = ["loading..."];
      $scope.groupEntries = [];
      kdbxBackendService.getEntries($scope.selectedDb, $scope.dbPassword, $scope.kdbxTree.currentNode.UUID)
          .then(function (result) {
            $scope.errors = [];
            $scope.messages = [];
            $scope.messages.push("entries successfully loaded");
            onGroupSelected(result.data);
          },
          function (reason) {
            $scope.messages = [];
            $scope.errors = [];
            $scope.errors.push("load entries HTTP status: " + reason.status);
            $scope.errors.push(reason.data);
          });
    }
  }, false)
});