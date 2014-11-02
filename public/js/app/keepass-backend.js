(function () {
  "use strict";

  var keepassBackend = angular.module('keepass-backend', ['jwt']);

  keepassBackend.service('kdbxBackendService', function ($http, $q, jwtStore) {
    var self = this;
    this.getDatabases = function () {
      return $http({
                     "method": "get",
                     "url": '/databases'
                   });
    };
    this.getDatabaseAuthToken = function (filename, password) {
      return $http({
                     "method": "post",
                     "url": '/databases/' + encodeURIComponent(filename) + '/auth',
                     data: {password: password}
                   });
    };
    this.authenticate = function (filename, password) {
      return self.getDatabaseAuthToken(filename, password)
          .then(function (result) {
                  jwtStore.saveJwt(result.data.jwt);
                  return result;
                }, function (reason) {
                  jwtStore.removeJwt();
                  return $q.reject(reason);
                });
    };
    this.getGroups = function (filename) {
      return $http({
                     "method": "get",
                     "url": '/' + encodeURIComponent(filename) + '/groups'
                   });
    };
    this.getEntries = function (filename, group) {
      return $http({
                     "method": "get",
                     "url": '/' + encodeURIComponent(filename) + '/' + encodeURIComponent(group)
                   });
    };
    this.addGroup = function (filename, parentGroup, group) {
      return $http({
                     "method": "put",
                     "url": '/' + encodeURIComponent(filename) + '/' + encodeURIComponent(parentGroup) + '/group/' + encodeURIComponent(group.UUID),
                     "data": {group: group}
                   });
    };
    this.addEntry = function (filename, parentGroup, entry) {
      return $http({
                     "method": "put",
                     "url": '/' + encodeURIComponent(filename) + '/' + encodeURIComponent(parentGroup) + '/entry/' + encodeURIComponent(entry.UUID),
                     "data": {entry: entry}
                   });
    };
  });
}());
