(function () {
  "use strict";

  var keepass = angular.module('keepass', ['init', 'toast', 'dialog', 'angularTreeview', 'keepass-entries', 'keepass-backend']);

  keepass.controller('keepassManager', function ($scope, toast, dialog, init, kdbxBackendService) {
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

    $scope.createGroup = function (event) {
      var parentGroup = $scope.kdbxTree.currentNode;
      dialog.newGroup(event, parentGroup)
          .then(function (newGroup) {
                  $scope.message = "adding group...";
                  kdbxBackendService.addGroup($scope.selectedDb, parentGroup.UUID, newGroup)
                      .then(function () {
                              $scope.message = '';
                              //TODO update view with new group
                              toast.info("group successfully added");
                            },
                            function (reason) {
                              $scope.message = '';
                              console.log(reason);
                              if (reason.data && reason.data.msg) {
                                toast.error(reason.data.msg);
                              }
                              else {
                                toast.error("add group HTTP status: " + reason.status);
                              }
                            });
                }, function () {
                  // user has cancelled
                });
    };

    $scope.createEntry = function (event) {
      var parentGroup = $scope.kdbxTree.currentNode;
      dialog.newEntry(event, parentGroup)
          .then(function (newEntry) {
                  $scope.message = "adding entry...";
                  kdbxBackendService.addEntry($scope.selectedDb, parentGroup.UUID, newEntry)
                      .then(function () {
                              $scope.message = '';
                              //TODO update view with new entry
                              toast.info("entry successfully added");
                            },
                            function (reason) {
                              $scope.message = '';
                              console.log(reason);
                              if (reason.data && reason.data.msg) {
                                toast.error(reason.data.msg);
                              }
                              else {
                                toast.error("add entry HTTP status: " + reason.status);
                              }
                            });
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
                  return kdbxBackendService.getGroups($scope.selectedDb);
                })
          .then(function (result) {
                  $scope.message = '';
                  toast.info("groups successfully loaded");
                  onGroupsLoaded(result.data);
                }, function (reason) {
                  $scope.message = '';
                  console.log(reason);
                  if (reason.data && reason.data.msg) {
                    toast.error(reason.data.msg);
                  }
                  else {
                    toast.error("load groups HTTP status: " + reason.status);
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
                    toast.info("entries successfully loaded");
                    onGroupSelected(result.data);
                  },
                  function (reason) {
                    $scope.message = '';
                    console.log(reason);
                    if (reason.data && reason.data.msg) {
                      toast.error(reason.data.msg);
                    }
                    else {
                      toast.error("load groups HTTP status: " + reason.status);
                    }
                  });
      }
    };

    init('keepass-manager', [kdbxBackendService.getDatabases()], function (result) {
      $scope.databases = result[0].data.databases;
      if ($scope.databases && $scope.databases.length === 1) {
        $scope.selectedDb = $scope.databases[0];
      }
      $scope.loading = false;
    });

    init.watchAfterInit($scope, 'kdbxTree.currentNode', onNodeSelected, false);
  });
}());
