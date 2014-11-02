(function () {
  "use strict";

  var dialog = angular.module('dialog', ['uuid', 'ngAnimate', 'ngMaterial']);

  dialog.factory('dialog', function ($mdDialog) {

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

      return $mdDialog.show({
                              templateUrl: 'templates/create-group.html',
                              targetEvent: event,
                              controller: controller
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

      return $mdDialog.show({
                              templateUrl: 'templates/create-entry.html',
                              targetEvent: event,
                              controller: controller
                            });
    };

    return {
      newGroup: newGroupDialog,
      newEntry: newEntryDialog
    };
  });
}());
