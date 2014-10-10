var express = require('express');
var request = require('supertest');
var _ = require('underscore');
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var should = chai.should();
var fs = require('fs');

var config = {
  databaseDir: __dirname + '/resources/',
  publicResourcesDir: __dirname + '/../public/',

  jwtSecret: 'secret',
  jwtUserProperty: 'jwt'
};
var app = require('../lib').Backend(config);

describe('backend', function () {
  describe('GET /', function () {
    it('should respond with index.html', function (done) {

      var index = fs.readFileSync(__dirname + '/../public/index.html', 'utf8');

      request(app)
          .get('/')
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
  describe('POST /databases/-unknown-/auth', function () {
    it('should respond with status 404 and empty body', function (done) {

      request(app)
          .post('/databases/unknown.kdbx/auth')
          .send({password: "password"})
          .set('Accept', 'application/json')
          .expect(function (res) {
            res.body.should.be.empty;
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
                    res.body.should.deep.have.property("[0].Name", 'example')
                    && res.body.should.deep.have.property("[0].UUID", 'n3rnRvvOF0SvPriiFXr+Tg==')
                    && res.body.should.deep.have.property("[0].Groups.length", 6);
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
                    res.body.should.have.property("length", 2)
                    && res.body.should.deep.have.property("[0].UUID", 'ZAw4YRw+pEic7TYfVOQ9vg==')
                    && res.body.should.deep.have.property("[1].UUID", '245S+MhtfUaOzVPUwv4KMQ==');
                  })
                  .expect(200, done);
            });
      });
    });
  });
});
