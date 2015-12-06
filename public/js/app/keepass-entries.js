(function () {
    "use strict";

    var keepassEntries = angular.module('keepass-entries', ['keepass-entry']);

    keepassEntries.directive('kdbxEntryList', function () {
        return {
            restrict: 'E',
            templateUrl: 'templates/kdbx-entry-list.html',
            scope: {
                kdbxEntries: '='
            }
        };
    });
}());
