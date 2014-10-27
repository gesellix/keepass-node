"use strict";

var entryTransformer = angular.module('entry-transformer', []);

entryTransformer.factory('entryTransformer', function () {

  var supportedProperties = {
    Title: {isProtected: false},
    URL: {isProtected: false},
    UserName: {isProtected: false},
    Password: {isProtected: true},
    Notes: {isProtected: false}
  };

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
