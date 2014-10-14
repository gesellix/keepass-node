"use strict";

var keepassEntries = angular.module('keepass-entries', []);

keepassEntries.directive('kdbxEntryList', function () {
  return {
    restrict: 'E',
    templateUrl: 'templates/kdbx-entry-list.html',
    scope: {
      kdbxEntries: '='
    }
  };
});

keepassEntries.directive('kdbxEntry', function () {
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
      $scope.entry = {
        UUID: $scope.kdbxEntry.UUID
      };
      _.each(['Title', 'URL', 'UserName', 'Notes'], function (key) {
        var hit = _.findWhere($scope.kdbxEntry.String, {Key: key});
        $scope.entry[key] = hit ? hit.Value : '';
      });

      var hit = _.findWhere($scope.kdbxEntry.String, {Key: 'Password'});
      $scope.entry['Password'] = hit ? hit.Value._ : '';
    }
  };
});
