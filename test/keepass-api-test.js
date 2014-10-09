var q = require("q");
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var should = chai.should();
var keepass = require('../lib').Keepass(__dirname + '/resources/');

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
});
