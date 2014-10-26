"use strict";

var keepassEntries = angular.module('keepass-entries', []);

keepassEntries.constant('supportedProperties', {
  Title: {isProtected: false},
  URL: {isProtected: false},
  UserName: {isProtected: false},
  Password: {isProtected: true},
  Notes: {isProtected: false}
});

keepassEntries.factory('entryTransformer', function (supportedProperties) {

  var getValueFromKdbxEntry = function (kdbxEntry, key) {
    var hit = _.findWhere(kdbxEntry.String, {Key: key});
    if (!hit) {
      return '';
    }
    else {
      if (supportedProperties[key].isProtected) {
        return hit.Value._;
      }
      else {
        return hit.Value;
      }
    }
  };

  var fromKdbxEntry = function (kdbxEntry) {
    var entry = {
      UUID: kdbxEntry.UUID
    };
    _.each(supportedProperties, function (value, key) {
      entry[key] = getValueFromKdbxEntry(kdbxEntry, key);
    });
    return entry;
  };

  var newProtectedEntry = function (key, value) {
    return {
      Key: key,
      Value: {
        "_": value,
        "$": {
          Protected: "True"
        }
      }
    };
  };

  var fromFlatEntry = function (entry) {
    var kdbxEntry = {
      UUID: entry.UUID,
      String: []
    };
    _.each(supportedProperties, function (value, key) {
      if (value.isProtected) {
        kdbxEntry.String.push(newProtectedEntry(key, entry[key]));
      }
      else {
        kdbxEntry.String.push({Key: key, Value: entry[key]});
      }
    });
    return kdbxEntry;
  };

  return {
    fromKdbxEntry: fromKdbxEntry,
    fromFlatEntry: fromFlatEntry
  };
});

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
