(function () {
    'use strict';

    var fs = require('fs');
    var q = require('q');
    var _ = require('lodash');
    var keepassio = require('keepass.io');

    var _databaseDirectory;

    var endsWith = function (string, suffix) {
        return string && string.match(suffix + "$") == suffix;
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

    var saveDatabase = function (db, databaseName) {
        var deferred = q.defer();

        if (!exists(databaseName)) {
            deferred.reject("database with name '" + databaseName + "' doesn't exist");
        }

        var filename = _databaseDirectory + databaseName;
        db.saveFile(filename, function (err) {
            if (err) {
                throw err;
            }
            deferred.resolve();
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

    var getGroupEntries = function (databaseName, password, groupId) {
        var deferred = q.defer();

        q.when(getDatabase(databaseName, password)).then(function (result) {
            var basicApi = result.getBasicApi();
            try {
                var entries = basicApi.getEntries(groupId);
                deferred.resolve(entries);
            }
            catch (e) {
                deferred.reject(e);
            }
        }, function (reason) {
            deferred.reject(reason);
        });
        return deferred.promise;
    };

    var saveGroup = function (databaseName, password, parentGroupId, group) {
        var deferred = q.defer();
        q.when(getDatabase(databaseName, password)).then(function (result) {
            var basicApi = result.getBasicApi();
            try {
                var parentGroup = basicApi.getGroup(parentGroupId);
                if (!_.isObject(parentGroup)) {
                    deferred.reject("Expected `parentGroup` to be defined");
                }
                else if (!_.isObject(group)) {
                    deferred.reject("Expected `group` to be defined");
                }
                else {
                    parentGroup.Groups = parentGroup.Groups || [];
                    var groups = parentGroup.Groups;
                    var candidates = _.filter(groups, function (existingGroup) {
                        return existingGroup.UUID == group.UUID;
                    });
                    if (_.isEmpty(candidates)) {
                        groups.push(group);
                        basicApi.setGroup(parentGroupId, parentGroup);

                        saveDatabase(result, databaseName).then(function () {
                            deferred.resolve(group);
                        }, function (reason) {
                            deferred.reject(reason);
                        });
                    }
                    else if (_.size(candidates) == 1) {
                        basicApi.setGroup(group.UUID, group);

                        saveDatabase(result, databaseName).then(function () {
                            deferred.resolve(group);
                        }, function (reason) {
                            deferred.reject(reason);
                        });
                    }
                    else {
                        deferred.reject("more than one group with id '" + group.UUID + "' found.");
                    }
                }
            }
            catch (e) {
                deferred.reject(e);
            }
        }, function (reason) {
            deferred.reject(reason);
        });
        return deferred.promise;
    };

    var saveGroupEntry = function (databaseName, password, parentGroupId, entry) {
        var deferred = q.defer();

        q.when(getDatabase(databaseName, password)).then(function (result) {
            var basicApi = result.getBasicApi();
            try {
                var entries = basicApi.getEntries(parentGroupId);
                if (!_.isObject(entry)) {
                    deferred.reject("Expected `entry` to be defined");
                }
                else {
                    var candidates = _.filter(entries, function (existingEntry) {
                        return existingEntry.UUID == entry.UUID;
                    });
                    if (_.isEmpty(candidates)) {
                        entries.push(entry);
                        basicApi.setEntries(parentGroupId, entries);

                        saveDatabase(result, databaseName).then(function () {
                            deferred.resolve(entry);
                        }, function (reason) {
                            deferred.reject(reason);
                        });
                    }
                    else if (_.size(candidates) == 1) {
                        var candidateIndex = _.indexOf(entries, _.first(candidates));
                        entries[candidateIndex] = entry;
                        basicApi.setEntries(parentGroupId, entries);

                        saveDatabase(result, databaseName).then(function () {
                            deferred.resolve(entry);
                        }, function (reason) {
                            deferred.reject(reason);
                        });
                    }
                    else {
                        deferred.reject("more than one entry with id '" + entry.UUID + "' found.");
                    }
                }
            }
            catch (e) {
                deferred.reject(e);
            }
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
            getGroupEntries: getGroupEntries,
            saveGroup: saveGroup,
            saveGroupEntry: saveGroupEntry,
            exists: exists
        };
    };
})();
