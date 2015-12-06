(function () {
    "use strict";
    describe('uuid', function () {
        var uuid;

        beforeEach(function () {

            module("uuid");

            inject(function (_uuid_) {
                uuid = _uuid_;
            });
        });

        it('should create 32 digit hexadecimal string', function () {
            var newUuid = uuid.create();
            expect(newUuid).to.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
        });
    });
}());
