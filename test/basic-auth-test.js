var request = require('supertest');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var should = chai.should();
var util = require('./test-util/util');

var config = {
    basicAuth: {
        "username": 'basic-user',
        "password": 'basic-pass'
    }
};
var BasicAuth = require('../lib').BasicAuth;

describe('basic-auth', function () {
    describe('unauthorized request', function () {
        it('should respond with status 401 and WWW-Authenticate Basic auth header', function (done) {

            var app = BasicAuth({});
            request(app)
                    .get('/')
                    .expect(401)
                    .end(function (err, res) {
                        res.header['www-authenticate'].should.equal('Basic realm=Authorization Required');
                        done();
                    });
        });
    });
    describe('wrong Authorization', function () {
        it('should respond with status 401 and WWW-Authenticate Basic auth header', function (done) {

            var base64Auth = new Buffer("basic-user:wrong-pass").toString('base64');

            var app = BasicAuth(config.basicAuth);
            app.use('/test', function (req, res) {
                res.status(200).send({msg: "passed"});
            });
            request(app)
                    .get('/test')
                    .set('Authorization', 'Basic ' + base64Auth)
                    .expect(401)
                    .end(function (err, res) {
                        res.header['www-authenticate'].should.equal('Basic realm=Authorization Required');
                        done();
                    });
        });
    });
    describe('Basic authorized request', function () {
        it('should pass and respond with status 200', function (done) {

            var base64Auth = new Buffer("basic-user:basic-pass").toString('base64');

            var app = BasicAuth(config.basicAuth);
            app.use('/test', function (req, res) {
                res.status(200).send({msg: "passed"});
            });
            request(app)
                    .get('/test')
                    .set('Authorization', 'Basic ' + base64Auth)
                    .expect(200, done);
        });
    });
    describe('Bearer authorized request', function () {
        it('should skip Basic auth checks', function (done) {

            var base64Auth = new Buffer("j.w.t").toString('base64');

            var app = BasicAuth(config.basicAuth);
            app.use('/test', function (req, res) {
                res.status(200).send({msg: "passed"});
            });
            request(app)
                    .get('/test')
                    .set('Authorization', 'Bearer ' + base64Auth)
                    .expect(200, done);
        });
    });
});
