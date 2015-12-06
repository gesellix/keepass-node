(function () {
    "use strict";
    describe('entry-transformer', function () {
        var entryTransformer;

        beforeEach(function () {

            module("entry-transformer");

            inject(function (_entryTransformer_) {
                entryTransformer = _entryTransformer_;
            });
        });

        describe('transforming fromKdbxEntry', function () {
            it('should return a flat entry with supported properties', function () {
                var flatEntry = entryTransformer.fromKdbxEntry(
                        {
                            UUID: "uu-id",
                            String: [
                                {
                                    Key: "Title",
                                    Value: "title"
                                },
                                {
                                    Key: "Password",
                                    Value: {
                                        "_": "secret",
                                        "$": {
                                            Protected: "True"
                                        }
                                    }
                                },
                                {Key: "unsupportedKey", Value: "value"}
                            ]
                        });
                expect(flatEntry).to.deep.equal(
                        {
                            UUID: "uu-id",
                            Title: "title",
                            Password: "secret"
                        });
            });
        });

        describe('transforming fromFlatEntry', function () {
            it('should return a kdbx entry with supported properties', function () {
                var kdbxEntry = entryTransformer.fromFlatEntry(
                        {
                            UUID: "uu-id",
                            Title: "title",
                            Password: "secret",
                            unsupportedKey: "value"
                        });
                expect(kdbxEntry).to.deep.equal(
                        {
                            UUID: "uu-id",
                            String: [
                                {
                                    Key: "Title",
                                    Value: "title"
                                },
                                {
                                    Key: "Password",
                                    Value: {
                                        "_": "secret",
                                        "$": {
                                            Protected: "True"
                                        }
                                    }
                                }
                            ]
                        });
            });
        });
    });
}());
