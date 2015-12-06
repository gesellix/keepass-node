var request = require('supertest');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var should = chai.should();
var fs = require('fs');
var util = require('./test-util/util');
var hogan = require("hogan.js");

var config = {
    databaseDir: __dirname + '/resources/',
    publicResourcesDir: __dirname + '/../public/',
    cryptKey: 'key',
    jwtSecret: 'secret',
    jwtUserProperty: 'jwt'
};
var app = require('../lib').Backend(config);

var renderTemplate = function (template) {
    return hogan.compile(template.toString('utf-8'), {delimiters: '<% %>'}).render({});
};

describe('backend', function () {
    describe('GET /', function () {
        it('should respond with index.html', function (done) {

            var index = renderTemplate(fs.readFileSync(__dirname + '/../public/index.html.hbs', 'utf8'));

            request(app)
                    .get('/')
                    .expect(index)
                    .expect(200, done);
        });
    });
    describe('GET /index.html', function () {
        it('should respond with index.html', function (done) {

            var index = renderTemplate(fs.readFileSync(__dirname + '/../public/index.html.hbs', 'utf8'));

            request(app)
                    .get('/index.html')
                    .expect(index)
                    .expect(200, done);
        });
    });
    describe('GET /index.htm', function () {
        it('should respond with index.html', function (done) {

            var index = renderTemplate(fs.readFileSync(__dirname + '/../public/index.html.hbs', 'utf8'));

            request(app)
                    .get('/index.htm')
                    .expect(index)
                    .expect(200, done);
        });
    });
    describe('GET /databases', function () {
        it('should respond with databases list', function (done) {

            request(app)
                    .get('/databases')
                    .set('Accept', 'application/json')
                    .expect({databases: ['example.kdbx']})
                    .expect(200, done);
        });
    });
    describe('POST /databases/:filename/auth', function () {
        describe('with missing password', function () {
            it('should respond with status 400', function (done) {

                request(app)
                        .post('/databases/example.kdbx/auth')
                        .set('Accept', 'application/json')
                        .expect(function (res) {
                            res.body.msg.should.equal("please set a password");
                        })
                        // would prefer to respond with status 4xx
                        .expect(401, done);
            });
        });
        describe('with invalid password', function () {
            it('should respond with status 500', function (done) {

                request(app)
                        .post('/databases/example.kdbx/auth')
                        .send({password: "invalid-password"})
                        .set('Accept', 'application/json')
                        .expect(function (res) {
                            res.body.msg.should.equal("problem occurred reading 'example.kdbx': KpioDatabaseError: Could not decrypt database. Either the credentials were invalid or the database is corrupt.");
                        })
                        // would prefer to respond with status 4xx
                        .expect(500, done);
            });
        });
        describe('with valid password', function () {
            it('should respond with jwt', function (done) {

                request(app)
                        .post('/databases/example.kdbx/auth')
                        .send({password: "password"})
                        .set('Accept', 'application/json')
                        .expect(function (res) {
                            return !/(\.|_|.)+/.test(res.body.jwt);
                        })
                        .expect(200, done);
            });
        });
    });
    describe('POST /databases/-unknown-/auth', function () {
        it('should respond with status 404', function (done) {

            request(app)
                    .post('/databases/unknown.kdbx/auth')
                    .send({password: "password"})
                    .set('Accept', 'application/json')
                    .expect(function (res) {
                        res.body.msg.should.equal("database 'unknown.kdbx' doesn't exist");
                    })
                    .expect(404, done);
        });
    });
    describe('GET /:filename/groups', function () {
        describe('without Authorization', function () {
            it('should respond with status 401 "Unauthorized"', function (done) {

                request(app)
                        .get('/example.kdbx/groups')
                        .set('Accept', 'application/json')
                        .expect(401, done);
            });
        });
        describe('with unauthorized filename', function () {
            it('should respond with status 401 "Unauthorized"', function (done) {

                request(app)
                        .post('/databases/example.kdbx/auth')
                        .send({password: "password"})
                        .set('Accept', 'application/json')
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            res.body.jwt.should.exist;
                            var currentJwt = res.body.jwt;
                            request(app)
                                    .get('/another-example.kdbx/groups')
                                    .set('Accept', 'application/json')
                                    .set('Authorization', 'Bearer ' + currentJwt)
                                    .expect(401, done);
                        });
            });
        });
        describe('with valid Authorization', function () {
            it('should respond with groups tree', function (done) {

                request(app)
                        .post('/databases/example.kdbx/auth')
                        .send({password: "password"})
                        .set('Accept', 'application/json')
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            res.body.jwt.should.exist;
                            var currentJwt = res.body.jwt;
                            request(app)
                                    .get('/example.kdbx/groups')
                                    .set('Accept', 'application/json')
                                    .set('Authorization', 'Bearer ' + currentJwt)
                                    .expect(function (res) {
                                        res.body.should.deep.have.property("[0].Name", 'example') &&
                                        res.body.should.deep.have.property("[0].UUID", 'n3rnRvvOF0SvPriiFXr+Tg==') &&
                                        res.body.should.deep.have.property("[0].Groups.length", 6);
                                    })
                                    .expect(200, done);
                        });
            });
        });
    });
    describe('GET /:filename/:group', function () {
        describe('without Authorization', function () {
            it('should respond with status 401 "Unauthorized"', function (done) {

                request(app)
                        .get('/example.kdbx/aGroup')
                        .set('Accept', 'application/json')
                        .expect(401, done);
            });
        });
        describe('with valid Authorization', function () {
            describe('and unknown database', function () {
                it('should respond with status 404', function (done) {

                    request(app)
                            .post('/databases/example.kdbx/auth')
                            .send({password: "password"})
                            .set('Accept', 'application/json')
                            .expect(200)
                            .end(function (err, res) {
                                should.not.exist(err);
                                res.body.jwt.should.exist;
                                var currentJwt = res.body.jwt;
                                request(app)
                                        .get('/unknown.kdbx/any-uuid')
                                        .set('Accept', 'application/json')
                                        .set('Authorization', 'Bearer ' + currentJwt)
                                        .expect(function (res) {
                                            res.body.msg.should.equal("database 'unknown.kdbx' doesn't exist");
                                        })
                                        .expect(404, done);
                            });

                });
            });
            it('should respond with group entries', function (done) {

                request(app)
                        .post('/databases/example.kdbx/auth')
                        .send({password: "password"})
                        .set('Accept', 'application/json')
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            res.body.jwt.should.exist;
                            var currentJwt = res.body.jwt;
                            request(app)
                                    .get('/example.kdbx/n3rnRvvOF0SvPriiFXr+Tg==')
                                    .set('Accept', 'application/json')
                                    .set('Authorization', 'Bearer ' + currentJwt)
                                    .expect(function (res) {
                                        res.body.should.have.property("length", 2) &&
                                        res.body.should.deep.have.property("[0].UUID", 'ZAw4YRw+pEic7TYfVOQ9vg==') &&
                                        res.body.should.deep.have.property("[1].UUID", '245S+MhtfUaOzVPUwv4KMQ==');
                                    })
                                    .expect(200, done);
                        });
            });
        });
    });

    describe('PUT /:filename/:parentGroup/group/:group', function () {
        describe('without Authorization', function () {
            it('should respond with status 401 "Unauthorized"', function (done) {

                request(app)
                        .put('/example.kdbx/aGroup/anEntryId')
                        .set('Accept', 'application/json')
                        .expect(401, done);
            });
        });
        describe('with valid Authorization', function () {
            before(function (done) {
                util.createTmpDb('example.kdbx', 'example-backend-test.kdbx', done);
            });
            after(function (done) {
                util.removeTmpDb('example-backend-test.kdbx', done);
            });
            describe('and unknown database', function () {
                it('should respond with status 404', function (done) {

                    request(app)
                            .post('/databases/example.kdbx/auth')
                            .send({password: "password"})
                            .set('Accept', 'application/json')
                            .expect(200)
                            .end(function (err, res) {
                                should.not.exist(err);
                                res.body.jwt.should.exist;
                                var currentJwt = res.body.jwt;
                                request(app)
                                        .put('/unknown.kdbx/any-parent-group-uuid/group/any-group-uuid')
                                        .set('Accept', 'application/json')
                                        .set('Authorization', 'Bearer ' + currentJwt)
                                        .expect(function (res) {
                                            res.body.msg.should.equal("database 'unknown.kdbx' doesn't exist");
                                        })
                                        .expect(404, done);
                            });

                });
            });
            it('should respond with new child group', function (done) {

                request(app)
                        .post('/databases/example-backend-test.kdbx/auth')
                        .send({password: "password"})
                        .set('Accept', 'application/json')
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            res.body.jwt.should.exist;
                            var currentJwt = res.body.jwt;
                            request(app)
                                    .put('/example-backend-test.kdbx/n3rnRvvOF0SvPriiFXr+Tg==/group/group-uuid')
                                    .send({group: {UUID: "group-uuid"}})
                                    .set('Accept', 'application/json')
                                    .set('Authorization', 'Bearer ' + currentJwt)
                                    .expect(function (res) {
                                        res.body.should.deep.have.property("UUID", "group-uuid");
                                    })
                                    .expect(200, done);
                        });
            });
        });
    });

    describe('PUT /:filename/:group/entry/:entry', function () {
        describe('without Authorization', function () {
            it('should respond with status 401 "Unauthorized"', function (done) {

                request(app)
                        .put('/example.kdbx/aGroup/anEntryId')
                        .set('Accept', 'application/json')
                        .expect(401, done);
            });
        });
        describe('with valid Authorization', function () {
            before(function (done) {
                util.createTmpDb('example.kdbx', 'example-backend-test.kdbx', done);
            });
            after(function (done) {
                util.removeTmpDb('example-backend-test.kdbx', done);
            });
            describe('and unknown database', function () {
                it('should respond with status 404', function (done) {

                    request(app)
                            .post('/databases/example.kdbx/auth')
                            .send({password: "password"})
                            .set('Accept', 'application/json')
                            .expect(200)
                            .end(function (err, res) {
                                should.not.exist(err);
                                res.body.jwt.should.exist;
                                var currentJwt = res.body.jwt;
                                request(app)
                                        .put('/unknown.kdbx/any-parent-group-uuid/entry/any-entry-uuid')
                                        .set('Accept', 'application/json')
                                        .set('Authorization', 'Bearer ' + currentJwt)
                                        .expect(function (res) {
                                            res.body.msg.should.equal("database 'unknown.kdbx' doesn't exist");
                                        })
                                        .expect(404, done);
                            });

                });
            });
            it('should respond with group entry', function (done) {

                request(app)
                        .post('/databases/example-backend-test.kdbx/auth')
                        .send({password: "password"})
                        .set('Accept', 'application/json')
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            res.body.jwt.should.exist;
                            var currentJwt = res.body.jwt;
                            request(app)
                                    .put('/example-backend-test.kdbx/n3rnRvvOF0SvPriiFXr+Tg==/entry/entry-uuid')
                                    .send({entry: {UUID: "entry-uuid"}})
                                    .set('Accept', 'application/json')
                                    .set('Authorization', 'Bearer ' + currentJwt)
                                    .expect(function (res) {
                                        res.body.should.deep.have.property("UUID", "entry-uuid");
                                    })
                                    .expect(200, done);
                        });
            });
        });
    });
});
