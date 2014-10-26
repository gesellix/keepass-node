"use strict";

var keepass = angular.module('keepass', ['jwt', 'init', 'uuid', 'ngAnimate', 'ngMaterial', 'angularTreeview', 'keepass-entries']);

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
  this.addGroup = function (filename, parentGroup, group) {
    return $http({
                   "method": "put",
                   "url": '/' + encodeURIComponent(filename) + '/' + encodeURIComponent(parentGroup) + '/group/' + encodeURIComponent(group.UUID),
                   "data": {group: group}
                 });
  };
  this.addEntry = function (filename, parentGroup, entry) {
    return $http({
                   "method": "put",
                   "url": '/' + encodeURIComponent(filename) + '/' + encodeURIComponent(parentGroup) + '/entry/' + encodeURIComponent(entry.UUID),
                   "data": {entry: entry}
                 });
  };
});

keepass.controller('ToastCtrl', function ($scope, $mdToast, message) {
  $scope.message = message;
  $scope.closeToast = function () {
    $mdToast.hide();
  };
});

keepass.controller('keepassBrowser', function ($scope, $mdToast, $mdDialog, init, kdbxBackendService) {
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

  var newGroupDialog = function (event, parentGroup) {

    var controller = function ($scope, $mdDialog, uuid) {
      $scope.parent = parentGroup;
      $scope.group = {
        UUID: uuid.create()
      };

      $scope.cancel = $mdDialog.cancel;
      $scope.save = function () {
        $mdDialog.hide($scope.group);
      };
    };

    return {
      templateUrl: 'templates/create-group.html',
      targetEvent: event,
      controller: controller
    }
  };

  $scope.createGroup = function (event) {
    var parentGroup = $scope.kdbxTree.currentNode;
    $mdDialog
        .show(newGroupDialog(event, parentGroup))
        .then(function (newGroup) {
                $scope.message = "adding group...";
                kdbxBackendService.addGroup($scope.selectedDb, parentGroup.UUID, newGroup)
                    .then(function () {
                            $scope.message = '';
                            //TODO update view with new group
                            toastInfo("group successfully added");
                          },
                          function (reason) {
                            $scope.message = '';
                            console.log(reason);
                            if (reason.data && reason.data.msg) {
                              toastError(reason.data.msg);
                            }
                            else {
                              toastError("add group HTTP status: " + reason.status);
                            }
                          })
              }, function () {
                // user has cancelled
              });
  };

  var newEntryDialog = function (event, parentGroup) {

    var controller = function ($scope, $mdDialog, uuid, entryTransformer) {
      $scope.parent = parentGroup;
      $scope.entry = {
        UUID: uuid.create()
      };

      $scope.cancel = $mdDialog.cancel;
      $scope.save = function () {
        var kdbxEntry = entryTransformer.fromFlatEntry($scope.entry);
        $mdDialog.hide(kdbxEntry);
      };
    };

    return {
      templateUrl: 'templates/create-entry.html',
      targetEvent: event,
      controller: controller
    }
  };

  $scope.createEntry = function (event) {
    var parentGroup = $scope.kdbxTree.currentNode;
    $mdDialog
        .show(newEntryDialog(event, parentGroup))
        .then(function (newEntry) {
                $scope.message = "adding entry...";
                kdbxBackendService.addEntry($scope.selectedDb, parentGroup.UUID, newEntry)
                    .then(function () {
                            $scope.message = '';
                            //TODO update view with new entry
                            toastInfo("entry successfully added");
                          },
                          function (reason) {
                            $scope.message = '';
                            console.log(reason);
                            if (reason.data && reason.data.msg) {
                              toastError(reason.data.msg);
                            }
                            else {
                              toastError("add entry HTTP status: " + reason.status);
                            }
                          })
              }, function () {
                // user has cancelled
              });
  };

  $scope.loadGroups = function () {
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