var express = require('express');
var request = require('supertest');
var _ = require('underscore');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var should = chai.should();

var googleDriveConfig = {
  "enabled": false,
  "clientSecret": {
    "client_id": "123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com",
    "client_secret": "aBcDeFgHiJkL987456_01234",
    "redirect_uris": ["https://www.example.com:8843/update/oauth2callback"]
  },
  "fileTitle": 'your_keepass_db_filename_in_google_drive.kdbx'
};
var keepassLib = require('../lib');
var googleTestDrive = _.partial(keepassLib.GoogleDrive, '/test-path');

describe('Configuring with a valid config', function () {

  afterEach(function (done) {
    done();
  });

  it('should return the middleware as a function', function () {
    return googleTestDrive(googleDriveConfig).should.be.an.instanceOf(Function);
  });
});

describe('GET /', function () {
  describe('with empty config', function () {
    it('should redirect to auth refresh uri', function (done) {
      var app = express();
      var middleware = googleTestDrive(googleDriveConfig);
      app.use('/test-path', middleware);

      request(app)
          .get('/test-path')
          .set('Accept', 'application/json')
        //.expect('Content-Type', /json/)
          .expect("Location", "https://accounts.google.com/o/oauth2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.readonly&response_type=code&client_id=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fwww.example.com%3A8843%2Fupdate%2Foauth2callback")
          .expect(302, done);
    });
  });
});
