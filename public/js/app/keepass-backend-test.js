(function () {
  "use strict";

  describe('keepass-backend', function () {
    var $httpBackend;
    var kdbxBackendService;

    beforeEach(function () {

      module("keepass-backend");

      inject(function (_kdbxBackendService_, _$httpBackend_) {
        kdbxBackendService = _kdbxBackendService_;
        $httpBackend = _$httpBackend_;
      });
    });

    afterEach(function (done) {
      $httpBackend.flush();
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
      done();
    });

    describe('getDatabases', function () {
      it('should GET /databases', function () {
        $httpBackend.expectGET("/databases")
            .respond(200);
        var databases = kdbxBackendService.getDatabases();
      });
      it('should return result from $http', function () {
        $httpBackend.whenGET("/databases")
            .respond(200, [{key: "value"}]);
        kdbxBackendService.getDatabases().success(function (databases) {
          expect(databases).to.deep.equal([{key: "value"}]);
        });
      });
    });
  });
}());
