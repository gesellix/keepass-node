"use strict";

var keepass = angular.module('keepass', ['jwt', 'init', 'ngAnimate', 'ngMaterial', 'angularTreeview', 'keepass-entries']);

keepass.service('kdbxBackendService', function ($http, $q, jwtStore) {
  var self = this;
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
  this.authenticate = function (filename, password) {
    return self.getDatabaseAuthToken(filename, password)
        .then(function (result) {
                jwtStore.saveJwt(result.data.jwt);
                return result;
              }, function (reason) {
                jwtStore.removeJwt();
                return $q.reject(reason);
              });
  };
  this.getRaw = function (filename, password) {
    return $http({
                   "method": "post",
                   "url": '/databases/' + encodeURIComponent(filename),
                   data: {password: password}
                 });
  };
  this.getGroups = function (filename) {
    return $http({
                   "method": "get",
                   "url": '/' + encodeURIComponent(filename) + '/groups'
                 });
  };
  this.getEntries = function (filename, group) {
    return $http({
                   "method": "get",
                   "url": '/' + encodeURIComponent(filename) + '/' + encodeURIComponent(group)
                 });
  };
});

keepass.controller('ToastCtrl', function ($scope, $mdToast, message) {
  $scope.message = message;
  $scope.closeToast = function () {
    $mdToast.hide();
  };
});

keepass.controller('keepassBrowser', function ($scope, $mdToast, init, kdbxBackendService) {
  $scope.message = null;

  $scope.loading = true;
  $scope.databases = [];

  $scope.selectedDb = null;
  $scope.dbPassword = null;

  $scope.kdbxTree = null;
  $scope.groupsTree = [];
  $scope.groupEntries = [];

  var onGroupsLoaded = function (groups) {
    $scope.groupsTree = groups;
  };

  var onGroupSelected = function (entries) {
    $scope.groupEntries = entries;
  };

  var toastError = function (message) {
    $mdToast.show({
                    controller: 'ToastCtrl',
                    templateUrl: 'templates/error-toast.html',
                    locals: {message: message},
                    hideDelay: false,
                    position: 'bottom'
                  });
  };

  var toastInfo = function (message) {
    $mdToast.show({
                    template: '<md-toast><span flex>' + message + '</span></md-toast>',
                    hideDelay: 3000,
                    position: 'bottom'
                  });
  };

  $scope.loadGroups = function () {
    //kdbxBackendService.getRaw($scope.selectedDb, $scope.dbPassword)
    //    .then(function (result) {
    //            console.log(result.data.Root.Group);
    //          });
    $scope.groupsTree = [];
    $scope.groupEntries = [];
    $scope.message = "authenticate...";
    kdbxBackendService.authenticate($scope.selectedDb, $scope.dbPassword)
        .then(function () {
                $scope.message = "loading...";
                return kdbxBackendService.getGroups($scope.selectedDb)
              })
        .then(function (result) {
                $scope.message = '';
                    toastInfo("groups successfully loaded");
                onGroupsLoaded(result.data);
              }, function (reason) {
                $scope.message = '';
                console.log(reason);
                if (reason.data && reason.data.msg) {
                  toastError(reason.data.msg);
                }
                else {
                  toastError("load groups HTTP status: " + reason.status);
                }
              });
  };

  var onNodeSelected = function () {
    if ($scope.kdbxTree && angular.isObject($scope.kdbxTree.currentNode)) {
      $scope.message = "loading...";
      $scope.groupEntries = [];
      kdbxBackendService.getEntries($scope.selectedDb, $scope.kdbxTree.currentNode.UUID)
          .then(function (result) {
                  $scope.message = '';
                        toastInfo("entries successfully loaded");
                  onGroupSelected(result.data);
                },
                function (reason) {
                  $scope.message = '';
                  console.log(reason);
                  if (reason.data && reason.data.msg) {
                    toastError(reason.data.msg);
                  }
                  else {
                    toastError("load groups HTTP status: " + reason.status);
                  }
                });
    }
  };

  init('keepassBrowser', [kdbxBackendService.getDatabases()], function (result) {
    $scope.databases = result[0].data.databases;
    if ($scope.databases && $scope.databases.length === 1) {
      $scope.selectedDb = $scope.databases[0];
    }
    $scope.loading = false;
  });

  init.watchAfterInit($scope, 'kdbxTree.currentNode', onNodeSelected, false)
});