(function () {
    "use strict";
    describe('keepass-manager', function () {
        var $controller;
        var $scope;
        var keepassManager;

        var initMock = sinon.stub();
        initMock.watchAfterInit = sinon.stub();

        beforeEach(function () {
            module("keepass");
            module("templates");
            module({
                toast: {},
                dialog: {},
                init: initMock,
                kdbxBackendService: {
                    getDatabases: sinon.stub()
                }
            });
            inject(function (_$rootScope_, _$controller_) {
                $controller = _$controller_;
                $scope = _$rootScope_.$new();
            });
        });

        describe('after initialization', function () {
            beforeEach(function () {
                keepassManager = $controller("keepassManager", {
                    $scope: $scope
                });
            });
            /*jshint expr: true*/
            it('should have defaults', function () {
                expect($scope.message).to.be.null;
                expect($scope.loading).to.equal(true);
                expect($scope.databases).to.deep.equal([]);

                //$scope.selectedDb = null;
                //$scope.dbPassword = null;
                //
                //$scope.kdbxTree = null;
                //$scope.groupsTree = [];
                //$scope.groupEntries = [];
            });
        });
    });
}());
