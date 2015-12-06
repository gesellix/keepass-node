var q = require("q");
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var util = require('./test-util/util');
var resourcesDir = util.resourcesDir;
var keepass = require('../lib').Keepass(resourcesDir);
var uuid = require('node-uuid');

describe('keepass api', function () {
    describe('Requesting the database list', function () {

        afterEach(function (done) {
            done();
        });

        it('should return a list of keepass filenames', function () {
            return keepass.getDatabaseNames().should.eventually.deep.equal({databases: ["example.kdbx"]});
        });
    });

    describe('Existence of a database', function () {
        afterEach(function (done) {
            done();
        });

        describe('which exists', function () {
            it('should return true', function () {
                return keepass.exists('example.kdbx').should.be.true;
            });
        });

        describe('which doesn\'t exist', function () {
            it('should return false', function () {
                return keepass.exists('an_unknown_database').should.be.false;
            });
        });
    });

    describe('Reading a mssing database', function () {
        afterEach(function (done) {
            done();
        });

        it('should be rejected', function () {
            return keepass.getDatabaseRaw('i do not exist').should.be.rejectedWith("database with name 'i do not exist' doesn't exist");
        });
    });

    describe('Reading a raw database', function () {

        afterEach(function (done) {
            done();
        });

        describe('with a missing password', function () {
            it('should be rejected', function () {
                return keepass.getDatabaseRaw('example.kdbx').should.be.rejectedWith("Expected `rawPassword` to be a string");
            });
        });

        describe('with an invalid password', function () {
            it('should be rejected', function () {
                return keepass.getDatabaseRaw('example.kdbx', 'some bad password').should.be.rejectedWith("Could not decrypt database. Either the credentials were invalid or the database is corrupt.");
            });
        });

        describe('with a valid password', function () {
            it('should return the raw database content', function () {
                return keepass.getDatabaseRaw('example.kdbx', 'password').should.eventually.deep.have.property("Meta.DatabaseName", "an example kdbc");
            });
        });
    });

    describe('Reading database groups', function () {

        afterEach(function (done) {
            done();
        });

        describe('with a missing password', function () {
            it('should be rejected', function () {
                return keepass.getDatabaseGroups('example.kdbx').should.be.rejectedWith("Expected `rawPassword` to be a string");
            });
        });

        describe('with an invalid password', function () {
            it('should be rejected', function () {
                return keepass.getDatabaseGroups('example.kdbx', 'some bad password').should.be.rejectedWith("Could not decrypt database. Either the credentials were invalid or the database is corrupt.");
            });
        });

        describe('with a valid password', function () {
            it('should return the graph nodes', function () {
                var databaseGroups = keepass.getDatabaseGroups('example.kdbx', 'password');
                return q.all([
                    databaseGroups.should.eventually.deep.have.property("[0].Name", 'example'),
                    databaseGroups.should.eventually.deep.have.property("[0].UUID", 'n3rnRvvOF0SvPriiFXr+Tg=='),
                    databaseGroups.should.eventually.deep.have.property("[0].Groups.length", 6),

                    databaseGroups.should.eventually.deep.have.property("[0].Groups[0].Name", 'General'),
                    databaseGroups.should.eventually.deep.have.property("[0].Groups[0].UUID", 'wXlnHFx+T0mHRYtNN+WgJg=='),

                    databaseGroups.should.eventually.deep.have.property("[0].Groups[1].Name", 'Windows'),
                    databaseGroups.should.eventually.deep.have.property("[0].Groups[1].UUID", 'PtfRMFDAvkeQBJ/VTfhJ2Q=='),

                    databaseGroups.should.eventually.deep.have.property("[0].Groups[2].Name", 'Network'),
                    databaseGroups.should.eventually.deep.have.property("[0].Groups[2].UUID", 'wjSRP+QXoU+DqHcoyJriMg=='),

                    databaseGroups.should.eventually.deep.have.property("[0].Groups[3].Name", 'Internet'),
                    databaseGroups.should.eventually.deep.have.property("[0].Groups[3].UUID", 'LioZCHxIlU6PH1aIMd24ow=='),

                    databaseGroups.should.eventually.deep.have.property("[0].Groups[4].Name", 'eMail'),
                    databaseGroups.should.eventually.deep.have.property("[0].Groups[4].UUID", 'pQZId+QEuEWzdGipwbiqBg=='),

                    databaseGroups.should.eventually.deep.have.property("[0].Groups[5].Name", 'Homebanking'),
                    databaseGroups.should.eventually.deep.have.property("[0].Groups[5].UUID", 'I+Oc014W5kahembqd91ofA==')
                ]);
            });
        });
    });

    describe('Reading group entries', function () {

        afterEach(function (done) {
            done();
        });

        describe('with a missing password', function () {
            it('should be rejected', function () {
                return keepass.getGroupEntries('example.kdbx').should.be.rejectedWith("Expected `rawPassword` to be a string");
            });
        });

        describe('with an invalid password', function () {
            it('should be rejected', function () {
                return keepass.getGroupEntries('example.kdbx', 'some bad password').should.be.rejectedWith("Could not decrypt database. Either the credentials were invalid or the database is corrupt.");
            });
        });

        describe('with a missing groupId', function () {
            it('should be rejected', function () {
                return keepass.getGroupEntries('example.kdbx', 'password').should.be.rejectedWith("Expected `groupUuid` to be a string");
            });
        });

        describe('with a valid password', function () {
            it('should return all group entries', function () {
                var entries = keepass.getGroupEntries('example.kdbx', 'password', 'n3rnRvvOF0SvPriiFXr+Tg==');
                return q.all([
                    entries.should.eventually.have.property("length", 2),
                    entries.should.eventually.deep.have.property("[0].UUID", 'ZAw4YRw+pEic7TYfVOQ9vg=='),
                    entries.should.eventually.deep.have.property("[1].UUID", '245S+MhtfUaOzVPUwv4KMQ==')
                ]);
            });
        });
    });

    describe('Adding a child group', function () {

        afterEach(function (done) {
            done();
        });

        describe('with a missing password', function () {
            it('should be rejected', function () {
                return keepass.saveGroup('example.kdbx').should.be.rejectedWith("Expected `rawPassword` to be a string");
            });
        });

        describe('with an invalid password', function () {
            it('should be rejected', function () {
                return keepass.saveGroup('example.kdbx', 'some bad password').should.be.rejectedWith("Could not decrypt database. Either the credentials were invalid or the database is corrupt.");
            });
        });

        describe('with a missing parentGroupId', function () {
            it('should be rejected', function () {
                return keepass.saveGroup('example.kdbx', 'password').should.be.rejectedWith("Expected `groupUuid` to be a string");
            });
        });

        describe('with an unknown parentGroupId', function () {
            it('should be rejected', function () {
                return keepass.saveGroup('example.kdbx', 'password', 'an-unknown-group').should.be.rejectedWith("Could not find group with given UUID: an-unknown-group");
            });
        });

        describe('with a missing group', function () {
            it('should be rejected', function () {
                return keepass.saveGroup('example.kdbx', 'password', 'n3rnRvvOF0SvPriiFXr+Tg==').should.be.rejectedWith("Expected `group` to be defined");
            });
        });

        describe('with a valid password', function () {
            describe('and an unknown child groupId', function () {
                var dbUnderTest = 'example-with-new-entry.kdbx';
                before(function (done) {
                    util.createTmpDb('example.kdbx', dbUnderTest, done);
                });
                after(function (done) {
                    util.removeTmpDb(dbUnderTest, done);
                });
                it('should save a new group', function () {
                    var groupId = uuid.v4();
                    var group = {
                        UUID: groupId
                    };
                    return keepass.saveGroup(dbUnderTest, 'password', 'n3rnRvvOF0SvPriiFXr+Tg==', group)
                            .then(function (savedGroup) {
                                savedGroup.UUID.should.equal(groupId);
                                var groups = keepass.getDatabaseGroups(dbUnderTest, 'password');
                                return q.all([
                                    groups.should.eventually.have.property("length", 1),
                                    groups.should.eventually.deep.have.property("[0].UUID", 'n3rnRvvOF0SvPriiFXr+Tg=='),
                                    groups.should.eventually.deep.have.property("[0].Groups.length", 7),
                                    groups.should.eventually.deep.have.property("[0].Groups[6].UUID", groupId)
                                ]);
                            });
                });
            });
            describe('and a known child groupId', function () {
                var dbUnderTest = 'example-with-existing-entry.kdbx';
                before(function (done) {
                    util.createTmpDb('example.kdbx', dbUnderTest, done);
                });
                after(function (done) {
                    util.removeTmpDb(dbUnderTest, done);
                });
                it('should update the existing group', function () {
                    var groupId = uuid.v4();
                    var group = {
                        UUID: groupId,
                        Name: "a new group"
                    };
                    return keepass.saveGroup(dbUnderTest, 'password', 'n3rnRvvOF0SvPriiFXr+Tg==', group).
                    then(function () {
                        var groupsBeforeUpdate = keepass.getDatabaseGroups(dbUnderTest, 'password');
                        return q.all([
                            groupsBeforeUpdate.should.eventually.deep.have.property("[0].Groups[6].UUID", groupId),
                            groupsBeforeUpdate.should.eventually.deep.have.property("[0].Groups[6].Name", "a new group")
                        ]).then(function () {
                            group.Name = "an updated group";
                            return keepass.saveGroup(dbUnderTest, 'password', 'n3rnRvvOF0SvPriiFXr+Tg==', group).
                            then(function () {
                                var groups = keepass.getDatabaseGroups(dbUnderTest, 'password');
                                return q.all([
                                    groups.should.eventually.deep.have.property("[0].Groups[6].UUID", groupId),
                                    groups.should.eventually.deep.have.property("[0].Groups[6].Name", "an updated group")
                                ]);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('Adding a group entry', function () {

        afterEach(function (done) {
            done();
        });

        describe('with a missing password', function () {
            it('should be rejected', function () {
                return keepass.saveGroupEntry('example.kdbx').should.be.rejectedWith("Expected `rawPassword` to be a string");
            });
        });

        describe('with an invalid password', function () {
            it('should be rejected', function () {
                return keepass.saveGroupEntry('example.kdbx', 'some bad password').should.be.rejectedWith("Could not decrypt database. Either the credentials were invalid or the database is corrupt.");
            });
        });

        describe('with a missing parentGroupId', function () {
            it('should be rejected', function () {
                return keepass.saveGroupEntry('example.kdbx', 'password').should.be.rejectedWith("Expected `groupUuid` to be a string");
            });
        });

        describe('with an unkown parentGroupId', function () {
            it('should be rejected', function () {
                return keepass.saveGroupEntry('example.kdbx', 'password', 'unknown-parent-group').should.be.rejectedWith("Could not find group with given UUID: unknown-parent-group");
            });
        });

        describe('with a missing entry', function () {
            it('should be rejected', function () {
                return keepass.saveGroupEntry('example.kdbx', 'password', 'n3rnRvvOF0SvPriiFXr+Tg==').should.be.rejectedWith("Expected `entry` to be defined");
            });
        });

        describe('with a valid password', function () {
            describe('and an unknown entryId', function () {
                var dbUnderTest = 'example-with-new-entry.kdbx';
                before(function (done) {
                    util.createTmpDb('example.kdbx', dbUnderTest, done);
                });
                after(function (done) {
                    util.removeTmpDb(dbUnderTest, done);
                });
                it('should save a new entry', function () {
                    var entryId = uuid.v4();
                    var entry = {
                        UUID: entryId
                    };
                    return keepass.saveGroupEntry(dbUnderTest, 'password', 'n3rnRvvOF0SvPriiFXr+Tg==', entry)
                            .then(function (savedEntry) {
                                savedEntry.UUID.should.equal(entryId);
                                var entries = keepass.getGroupEntries(dbUnderTest, 'password', 'n3rnRvvOF0SvPriiFXr+Tg==');
                                return q.all([
                                    entries.should.eventually.have.property("length", 3),
                                    entries.should.eventually.deep.have.property("[0].UUID", 'ZAw4YRw+pEic7TYfVOQ9vg=='),
                                    entries.should.eventually.deep.have.property("[1].UUID", '245S+MhtfUaOzVPUwv4KMQ=='),
                                    entries.should.eventually.deep.have.property("[2].UUID", entryId)
                                ]);
                            });
                });
            });
            describe('and a known entryId', function () {
                var dbUnderTest = 'example-with-existing-entry.kdbx';
                before(function (done) {
                    util.createTmpDb('example.kdbx', dbUnderTest, done);
                });
                after(function (done) {
                    util.removeTmpDb(dbUnderTest, done);
                });
                it('should update the existing entry', function () {
                    var entryId = uuid.v4();
                    var entry = {
                        UUID: entryId,
                        "String": [
                            {
                                "Key": "key1",
                                "Value": "value1"
                            },
                            {
                                "Key": "key2",
                                "Value": "value2"
                            }]
                    };
                    return keepass.saveGroupEntry(dbUnderTest, 'password', 'n3rnRvvOF0SvPriiFXr+Tg==', entry).
                    then(function () {
                        var entriesBeforeUpdate = keepass.getGroupEntries(dbUnderTest, 'password', 'n3rnRvvOF0SvPriiFXr+Tg==');
                        return q.all([
                            entriesBeforeUpdate.should.eventually.have.property("length", 3),
                            entriesBeforeUpdate.should.eventually.deep.have.property("[2].UUID", entryId),
                            entriesBeforeUpdate.should.eventually.deep.have.property("[2].String[0].Key", "key1"),
                            entriesBeforeUpdate.should.eventually.deep.have.property("[2].String[0].Value", "value1")
                        ]).then(function () {
                            entry.String[1] = {
                                "Key": "TestString",
                                "Value": "TestValue"
                            };
                            return keepass.saveGroupEntry(dbUnderTest, 'password', 'n3rnRvvOF0SvPriiFXr+Tg==', entry).
                            then(function () {
                                var entries = keepass.getGroupEntries(dbUnderTest, 'password', 'n3rnRvvOF0SvPriiFXr+Tg==');
                                return q.all([
                                    entries.should.eventually.have.property("length", 3),
                                    entries.should.eventually.deep.have.property("[0].UUID", 'ZAw4YRw+pEic7TYfVOQ9vg=='),
                                    entries.should.eventually.deep.have.property("[1].UUID", '245S+MhtfUaOzVPUwv4KMQ=='),
                                    entries.should.eventually.deep.have.property("[2].UUID", entryId),
                                    entries.should.eventually.deep.have.property("[2].String[1].Key", "TestString"),
                                    entries.should.eventually.deep.have.property("[2].String[1].Value", "TestValue")
                                ]);
                            });
                        });
                    });
                });
            });
        });
    });
});
