"use strict";

var keepass = angular.module('keepass', ['init', 'angularTreeview', 'keepass-entries']);

keepass.service('kdbxBackendService', function ($http) {
  this.getDatabases = function () {
    return $http({"method": "get", "url": '/databases'});
  };
  this.getEntries = function (filename, password) {
    return $http({"method": "post", "url": '/databases/' + filename, data: {password: password}});
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

  var onDbLoaded = function (db) {
    $scope.db = db;
    $scope.groupsTree = [db.Root.Group];
  };

  var onGroupSelected = function (group) {
    $scope.groupEntries = group.Entry;
  };

  $scope.loadEntries = function () {
    $scope.errors = [];
    $scope.messages = ["loading..."];
    $scope.groupsTree = [];
    $scope.groupEntries = [];
    kdbxBackendService.getEntries($scope.selectedDb, $scope.dbPassword)
        .then(function (success) {
                $scope.errors = [];
                $scope.messages = [];
//                $scope.messages.push("HTTP status: " + success.status);
                $scope.messages.push("db successfully loaded");
                onDbLoaded(success.data);
              },
              function (error) {
                $scope.messages = [];
                $scope.errors = [];
                $scope.errors.push("HTTP status: " + error.status);
                $scope.errors.push(error.data);
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
      onGroupSelected($scope.kdbxTree.currentNode);
    }
  }, false)
});