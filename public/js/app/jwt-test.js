(function () {
    "use strict";

    describe('jwt', function () {

        describe('jwtInterceptor', function () {
            var $httpProvider;
            var jwtInterceptorProvider;

            beforeEach(function () {
                module("jwt", function (_$httpProvider_, _jwtInterceptorProvider_) {
                    $httpProvider = _$httpProvider_;
                    jwtInterceptorProvider = _jwtInterceptorProvider_;
                });
                inject(function () {
                });
            });

            it('should be configured as $http interceptor', function () {
                expect($httpProvider.interceptors).to.contain('jwtInterceptor');
            });
            it('should be implemented to use sessionStorage as token storage', function () {
                var expectedTokenData = _.uniqueId(_.random(100));
                sessionStorage.setItem('jwt', expectedTokenData);
                expect(jwtInterceptorProvider.tokenGetter()).to.equal(expectedTokenData);
            });
        });

        describe('jwtStore', function () {
            var jwtStore;

            beforeEach(function () {
                module("jwt");
                inject(function (_jwtStore_) {
                    jwtStore = _jwtStore_;
                });
            });

            it('should save the jwt token in sessionStorage', function () {
                var oldTokenData = _.uniqueId(_.random(100));
                var expectedTokenData = _.uniqueId(_.random(100));
                expect(oldTokenData).to.not.equal(expectedTokenData);

                sessionStorage.setItem('jwt', oldTokenData);
                jwtStore.saveJwt(expectedTokenData);
                expect(sessionStorage.getItem('jwt')).to.equal(expectedTokenData);
            });
            it('should remove the jwt token from sessionStorage', function () {
                var oldTokenData = _.uniqueId(_.random(100));
                sessionStorage.setItem('jwt', oldTokenData);
                jwtStore.removeJwt();
                expect(sessionStorage.getItem('jwt')).to.equal(null);
            });
        });
    });
}());
