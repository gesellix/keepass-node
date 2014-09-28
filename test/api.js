var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var should = chai.should();
var keepass = require('../lib').Keepass(__dirname + '/resources/');

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
    return keepass.getDatabase('i do not exist').should.be.rejectedWith("database with name 'i do not exist' doesn't exist");
  });
});

describe('Reading an existing database', function () {

  afterEach(function (done) {
    done();
  });

  describe('with a missing password', function () {
    it('should be rejected', function () {
      return keepass.getDatabase('example.kdbx').should.be.rejectedWith("Expected `rawPassword` to be a string");
    });
  });

  describe('with an invalid password', function () {
    it('should be rejected', function () {
      return keepass.getDatabase('example.kdbx', 'some bad password').should.be.rejectedWith("Could not decrypt database. Either the credentials were invalid or the database is corrupt.");
    });
  });

  describe('with a valid password', function () {
    it('should return the raw database content', function () {
      return keepass.getDatabase('example.kdbx', 'password').should.eventually.deep.have.property("Meta.DatabaseName", "an example kdbc");
    });
  });
});
