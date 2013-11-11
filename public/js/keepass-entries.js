"use strict";

var keepassEntries = angular.module('keepass-entries', []);

keepassEntries.controller('kdbxEntryListController', function () {

});

keepassEntries.controller('kdbxEntryController', function () {

});

keepassEntries.directive('kdbxEntryList', function () {
  return {
    restrict: 'E',
    templateUrl: 'templates/kdbx-entry-list.html',
    controller: 'kdbxEntryListController',
    scope: {
      kdbxEntries: '='
    }
  };
});

keepassEntries.directive('kdbxEntry', function () {
  return {
    restrict: 'E',
    templateUrl: 'templates/kdbx-entry.html',
    controller: 'kdbxEntryController',
    scope: {
      kdbxEntry: '=',
      kdbxEntryIndex: '='
    },
    link: function (scope, element) {
      scope.showPassword = false;
      element.find('.collapse').collapse({toggle: false});
      new ZeroClipboard(element.find('.copy-password-btn'));
    }
  };
});
