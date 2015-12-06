(function () {
    "use strict";
    describe('<kdbx-entry/>', function () {
        var entryTransformer;
        var $compile;
        var $scope;
        var element;

        beforeEach(function () {

            module("keepass-entry");
            module("templates");
            inject(function (_$compile_, _$rootScope_, _entryTransformer_) {
                $compile = _$compile_;
                $scope = _$rootScope_.$new();
                entryTransformer = _entryTransformer_;

                element = angular.element('<kdbx-entry kdbx-entry="entry" kdbx-entry-index="$index"></kdbx-entry>');
            });
        });

        var compileTemplate = function ($scope) {
            element = $compile(element)($scope);
            $scope.$digest();
        };

        describe('after initialization', function () {
            it('should hide the password', function () {
                $scope.entry = {foo: "bar"};
                compileTemplate($scope);
                expect(element.isolateScope().showPassword).to.equal(false);
            });
            it('should transform the kdbxEntry', function () {
                var transformedResult = {transformed: "result"};
                sinon.stub(entryTransformer, 'fromKdbxEntry').returns(transformedResult);

                $scope.entry = {bar: "baz"};
                compileTemplate($scope);

                expect(element.isolateScope().entry).to.equal(transformedResult);
            });
        });
    });
}());
