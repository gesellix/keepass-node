(function () {
  "use strict";

  var keepassEntry = angular.module('keepass-entry', ['entry-transformer']);

  keepassEntry.directive('kdbxEntry', function (entryTransformer) {
    return {
      restrict: 'E',
      templateUrl: 'templates/kdbx-entry.html',
      scope: {
        kdbxEntry: '=',
        kdbxEntryIndex: '='
      },
      link: function (scope, element) {
        scope.showPassword = false;
        new ZeroClipboard(element.find('.copy-password-btn'));
      },
      controller: function ($scope) {
        $scope.entry = entryTransformer.fromKdbxEntry($scope.kdbxEntry);
      }
    };
  });
}());
