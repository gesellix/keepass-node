"use strict";

var keepassEntries = angular.module('keepass-entries', ['entry-transformer']);

keepassEntries.directive('kdbxEntryList', function () {
  return {
    restrict: 'E',
    templateUrl: 'templates/kdbx-entry-list.html',
    scope: {
      kdbxEntries: '='
    }
  };
});

keepassEntries.directive('kdbxEntry', function (entryTransformer) {
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
