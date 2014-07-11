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
      element.find('.collapse').collapse({toggle: false});
      new ZeroClipboard(element.find('.copy-password-btn'));
    },
    controller: function ($scope) {
      _.each(['Title', 'URL', 'UserName', 'Notes'], function (key) {
        $scope['get' + key] = function () {
          var hit = _.findWhere($scope.kdbxEntry.String, {Key: key});
          return hit ? hit.Value : '';
        }
      });
      $scope.getPassword = function () {
        var hit = _.findWhere($scope.kdbxEntry.String, {Key: 'Password'});
        return hit ? hit.Value._ : '';
      };
    }
  };
});
