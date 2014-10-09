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
  describe('POST /databases/example.kdbx/auth', function () {
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
