(function () {
  'use strict';

  var fs = require('fs');
  var q = require('q');
  var _ = require('underscore');
  var keepassio = require('keepass.io');

  var _databaseDirectory;

  var endsWith = function (string, suffix) {
    return string && string.match(suffix + "$") == suffix
  };

  var readKdbx = function (filename, password) {
    var deferred = q.defer();
    var db = new keepassio.Database();
    try {
      db.addCredential(new keepassio.Credentials.Password(password));
//    db.addCredential(new keepassio.Credentials.Keyfile('my.key');
      db.loadFile(filename, function (error) {
        if (error) {
          deferred.reject(error);
        }
        else {
          deferred.resolve(db);
        }
      });
    }
    catch (e) {
      deferred.reject(e);
    }
    return deferred.promise;
  };

  var getDatabaseNames = function () {
    var deferred = q.defer();
    fs.readdir(_databaseDirectory, function (err, filenames) {
      if (err) {
        deferred.reject(err);
      }
      else {
        var databases = _.filter(filenames, function (filename) {
          return endsWith(filename, '.kdbx');
        });
        deferred.resolve({'databases': databases});
      }
    });
    return deferred.promise;
  };

  var exists = function (databaseName) {
    var filename = _databaseDirectory + databaseName;
    return fs.existsSync(filename);
  };

  var getDatabase = function (databaseName, password) {
    var deferred = q.defer();

    if (!exists(databaseName)) {
      deferred.reject("database with name '" + databaseName + "' doesn't exist");
    }

    var filename = _databaseDirectory + databaseName;
    q.when(readKdbx(filename, password)).then(function (result) {
      deferred.resolve(result);
    }, function (reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  var getDatabaseRaw = function (databaseName, password) {
    var deferred = q.defer();

    q.when(getDatabase(databaseName, password)).then(function (result) {
      deferred.resolve(result.getRawApi().get().KeePassFile);
    }, function (reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  var getDatabaseGroups = function (databaseName, password) {
    var deferred = q.defer();

    q.when(getDatabase(databaseName, password)).then(function (result) {
      var basicApi = result.getBasicApi();
      var groups = basicApi.getGroupTree();
      deferred.resolve(groups);
    }, function (reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  module.exports = function (databaseDirectory) {
    _databaseDirectory = databaseDirectory;
    return {
      getDatabaseNames: getDatabaseNames,
      getDatabaseRaw: getDatabaseRaw,
      getDatabaseGroups: getDatabaseGroups,
      exists: exists
    };
  };
})();
