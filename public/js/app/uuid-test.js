(function () {
  "use strict";
  describe('uuid', function () {
    var uuid;

    beforeEach(function () {

      module("uuid");

      inject(function (_uuid_) {
        uuid = _uuid_;
        //$scope = $rootScope.$new();
        //ctrl = $controller("NameOfYourController", {
        //  $scope: $scope
        //});
      });
    });

    it('should create 32 digit hexadecimal string', function (done) {
      var newUuid = uuid.create();
      expect(newUuid).to.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
      done();
    });
  });
}());
