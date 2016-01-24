var express = require('express');
var request = require('supertest');
var _ = require('lodash');

var googleDriveConfig = {
    "clientSecret": {
        "client_id": "client-id-0.apps.googleusercontent.com",
        "client_secret": "aBcDeFgHiJkL987456_01234",
        "redirect_uris": ["https://www.example.com:8843/update/oauth2callback"]
    },
    "fileTitle": 'your_keepass_db_filename_in_google_drive.kdbx'
};
var keepassLib = require('../lib');
var googleTestDrive = _.partial(keepassLib.GoogleDrive, '/test-path');

describe('google drive middleware', function () {
    describe('Configuring with a valid config', function () {

        afterEach(function (done) {
            done();
        });

        it('should return the middleware as a function', function () {
            return googleTestDrive(googleDriveConfig).should.be.an.instanceOf(Function);
        });
    });

    describe('GET /any-unknown-path', function () {
        it('should use .next()', function (done) {
            var app = express();

            var googleDrive = googleTestDrive(googleDriveConfig);
            app.use(googleDrive);

            var catchallMiddleware = function (req, res) {
                var buf = '';
                res.setHeader('Content-Type', 'application/json');
                req.setEncoding('utf8');
                req.on('data', function (chunk) {
                    buf += chunk;
                });
                req.on('end', function () {
                    res.end(buf);
                });
            };
            app.use(catchallMiddleware);

            request(app)
                    .get('/any-unknown-path')
                    .set('Content-Type', 'application/json')
                    .send({"foo": "bar"})
                    .expect('Content-Type', /json/)
                    .end(function (err, res) {
                        if (err) {
                            return done(err);
                        }
                        res.headers.should.have.property('content-type', 'application/json');
                        res.statusCode.should.equal(200);
                        res.text.should.equal('{"foo":"bar"}');
                        done();
                    });
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
                        .expect("Location", "https://accounts.google.com/o/oauth2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.readonly&response_type=code&client_id=client-id-0.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fwww.example.com%3A8843%2Fupdate%2Foauth2callback")
                        .expect(302, done);
            });
        });

        describe('with empty oauth2Tokens', function () {
            it('should redirect to auth refresh uri', function (done) {
                var googleDriveConfig = {
                    "oauth2Tokens": {},
                    "clientSecret": {
                        "client_id": "client-id-1.apps.googleusercontent.com",
                        "client_secret": "aBcDeFgHiJkL987456_01234",
                        "redirect_uris": ["https://www.example.com:8843/update/oauth2callback"]
                    },
                    "fileTitle": 'your_keepass_db_filename_in_google_drive.kdbx'
                };

                var app = express();
                var middleware = googleTestDrive(googleDriveConfig);
                app.use('/test-path', middleware);

                request(app)
                        .get('/test-path')
                        .set('Accept', 'application/json')
                        .expect("Location", "https://accounts.google.com/o/oauth2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.readonly&response_type=code&client_id=client-id-1.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fwww.example.com%3A8843%2Fupdate%2Foauth2callback")
                        .expect(302, done);
            });
        });

        describe('with empty clientSecret', function () {
            describe('and existing clientSecretFilename', function () {
                it('should set clientSecret clientSecretFile contents', function (done) {
                    var googleDriveConfig = {
                        "oauth2Tokens": {},
                        clientSecretFilename: __dirname + '/resources/googleapis_client_secret.json',
                        clientSecretType: 'web',
                        "fileTitle": 'your_keepass_db_filename_in_google_drive.kdbx'
                    };

                    var app = express();
                    var middleware = googleTestDrive(googleDriveConfig);
                    app.use('/test-path', middleware);

                    request(app)
                            .get('/test-path')
                            .set('Accept', 'application/json')
                            .expect("Location", "https://accounts.google.com/o/oauth2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.readonly&response_type=code&client_id=client-id-2.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fwww.example.com%3A8843%2Fupdate%2Foauth2callback")
                            .expect(302, done);
                });
            });
        });
    });
});
