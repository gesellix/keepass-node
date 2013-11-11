"use strict";

var keepass = angular.module('keepass', ['init', 'keepass-entries']);

keepass.service('kdbxBackendService', function ($http) {
  this.getDatabases = function () {
    return $http({ "method": "get", "url": '/databases' });
  };
  this.getEntries = function (filename, password) {
    return $http({ "method": "post", "url": '/databases/' + filename, data: {password: password} });
  };
});

keepass.controller('keepassBrowser', function ($scope, init, kdbxBackendService) {
  $scope.loading = true;
  $scope.databases = [];
  $scope.selectedDb = null;
  $scope.dbPassword = null;
  $scope.dbEntries = [];
  $scope.messages = [];
  $scope.errors = [];

  $scope.loadEntries = function () {
    $scope.messages = [];
    $scope.errors = [];
    kdbxBackendService.getEntries($scope.selectedDb, $scope.dbPassword)
        .then(function (success) {
                $scope.dbEntries = success.data.entries;
                $scope.messages = [
//                  "HTTP status: " + success.status,
                  success.data.entries.length + " entries found"];
              },
              function (error) {
                $scope.errors = [
                  "HTTP status: " + error.status,
                  error.data
                ];
              });
  };

  init('keepassBrowser', [kdbxBackendService.getDatabases()], function (result) {
    $scope.databases = result[0].data.databases;
    if ($scope.databases && $scope.databases.length === 1) {
      $scope.selectedDb = $scope.databases[0];
    }
    $scope.loading = false;
  });
});