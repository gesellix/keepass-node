(function () {
    "use strict";
    describe('<kdbx-entry-list/>', function () {
        var $compile;
        var $scope;
        var element;

        beforeEach(function () {

            module("keepass-entries");
            module("templates");
            inject(function (_$compile_, _$rootScope_) {
                $compile = _$compile_;
                $scope = _$rootScope_.$new();

                element = angular.element('<kdbx-entry-list ng-show="groupEntries" kdbx-entries="groupEntries"></kdbx-entry-list>');
            });
        });

        var compileTemplate = function ($scope) {
            element = $compile(element)($scope);
            $scope.$digest();
        };

        describe('after initialization', function () {
            it('should work', function () {
                $scope.groupEntries = [{foo: "bar"}];
                compileTemplate($scope);
                expect(element.isolateScope().kdbxEntries[0].foo).to.deep.equal("bar");
            });
        });
    });
}());
