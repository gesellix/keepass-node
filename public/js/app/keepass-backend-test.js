(function () {
    "use strict";

    describe('keepass-backend', function () {
        var $q;
        var $rootScope;
        var $httpBackend;
        var jwtStore;
        var kdbxBackendService;

        beforeEach(function () {

            module("keepass-backend");
            module({
                jwtStore: {
                    saveJwt: sinon.stub(),
                    removeJwt: sinon.stub()
                }
            });

            inject(function (_kdbxBackendService_, _jwtStore_, _$httpBackend_, _$q_, _$rootScope_) {
                kdbxBackendService = _kdbxBackendService_;
                jwtStore = _jwtStore_;
                $httpBackend = _$httpBackend_;
                $q = _$q_;
                $rootScope = _$rootScope_;
            });
        });

        describe('authenticate', function () {
            it('should delegate to getDatabaseAuthToken', function () {
                sinon.stub(kdbxBackendService, 'getDatabaseAuthToken').returns($q.when({data: {}}));
                kdbxBackendService.authenticate('name', 'secret');
                expect(kdbxBackendService.getDatabaseAuthToken).to.have.been.calledWith('name', 'secret');
            });

            describe('with success', function () {
                it('should store jwt', function (done) {
                    sinon.stub(kdbxBackendService, 'getDatabaseAuthToken').returns($q.when({data: {jwt: "a.token"}}));
                    kdbxBackendService.authenticate('name', 'secret')
                            .then(function () {
                                        expect(jwtStore.saveJwt).to.have.been.calledWith("a.token");
                                        done();
                                    },
                                    function (reason) {
                                        done(reason);
                                    });
                    $rootScope.$apply();
                });
                it('should pass response on to caller', function (done) {
                    var expectedResponse = {data: {jwt: "a.token"}};
                    sinon.stub(kdbxBackendService, 'getDatabaseAuthToken').returns($q.when(expectedResponse));
                    kdbxBackendService.authenticate('name', 'secret')
                            .then(function (result) {
                                        expect(result).to.deep.equal(expectedResponse);
                                        done();
                                    },
                                    function (reason) {
                                        done(reason);
                                    });
                    $rootScope.$apply();
                });
            });

            /*jshint expr: true*/
            describe('with failure', function () {
                it('should clear jwt', function (done) {
                    var expectedResponse = {data: {msg: "auth failed as expected"}};
                    sinon.stub(kdbxBackendService, 'getDatabaseAuthToken').returns($q.reject(expectedResponse));
                    kdbxBackendService.authenticate('name', 'secret')
                            .then(function () {
                                        done(new Error('resolved response not expected'));
                                    },
                                    function () {
                                        expect(jwtStore.removeJwt).to.have.been.called;
                                        done();
                                    });
                    $rootScope.$apply();
                });
                it('should pass response as rejection on to caller', function (done) {
                    var expectedResponse = {data: {msg: "auth failed as expected"}};
                    sinon.stub(kdbxBackendService, 'getDatabaseAuthToken').returns($q.reject(expectedResponse));
                    kdbxBackendService.authenticate('name', 'secret')
                            .then(function () {
                                        done(new Error('resolved response not expected'));
                                    },
                                    function (reason) {
                                        expect(reason).to.deep.equal(expectedResponse);
                                        done();
                                    });
                    $rootScope.$apply();
                });
            });
        });

        describe('backend request', function () {
            afterEach(function (done) {
                $httpBackend.flush();
                $httpBackend.verifyNoOutstandingExpectation();
                $httpBackend.verifyNoOutstandingRequest();
                done();
            });

            describe('getDatabases', function () {
                it('should return result from GET /databases', function () {
                    $httpBackend.whenGET("databases")
                            .respond(200, [{key: "value"}]);
                    kdbxBackendService.getDatabases().success(function (data) {
                        expect(data).to.deep.equal([{key: "value"}]);
                    });
                });
            });

            describe('getDatabaseAuthToken', function () {
                it('should return result from POST /databases/:filename/auth', function () {
                    $httpBackend.whenPOST("databases/a%20filename/auth", {password: "a password"})
                            .respond(200, {jwt: "t.o.k.e.n"});
                    kdbxBackendService.getDatabaseAuthToken('a filename', 'a password').success(function (data) {
                        expect(data).to.deep.equal({jwt: 't.o.k.e.n'});
                    });
                });
            });

            describe('getGroups', function () {
                it('should return result from GET /:filename/groups', function () {
                    $httpBackend.whenGET("a%20filename/groups")
                            .respond(200, [{UUID: "1"}, {UUID: "2"}]);
                    kdbxBackendService.getGroups('a filename').success(function (data) {
                        expect(data).to.deep.equal([{UUID: "1"}, {UUID: "2"}]);
                    });
                });
            });

            describe('getEntries', function () {
                it('should return result from GET /:filename/:group', function () {
                    $httpBackend.whenGET("a%20filename/a%20group")
                            .respond(200, [{UUID: "entry-1"}, {UUID: "entry-2"}]);
                    kdbxBackendService.getEntries('a filename', 'a group').success(function (data) {
                        expect(data).to.deep.equal([{UUID: "entry-1"}, {UUID: "entry-2"}]);
                    });
                });
            });

            describe('addGroup', function () {
                it('should return result from PUT /:filename/:parentGroup/group/:group', function () {
                    $httpBackend.whenPUT("a%20filename/a%20parent-group/group/a%2Fgroup", {group: {UUID: "a/group"}})
                            .respond(200, {UUID: "a/group"});
                    kdbxBackendService.addGroup('a filename', 'a parent-group', {UUID: "a/group"}).success(function (data) {
                        expect(data).to.deep.equal({UUID: "a/group"});
                    });
                });
            });

            describe('addEntry', function () {
                it('should return result from PUT /:filename/:parentGroup/entry/:entry', function () {
                    $httpBackend.whenPUT("a%20filename/a%20parent-group/entry/an%2Fentry", {entry: {UUID: "an/entry"}})
                            .respond(200, {UUID: "an/entry"});
                    kdbxBackendService.addEntry('a filename', 'a parent-group', {UUID: "an/entry"}).success(function (data) {
                        expect(data).to.deep.equal({UUID: "an/entry"});
                    });
                });
            });
        });
    });
}());
