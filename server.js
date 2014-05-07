(function () {
  "use strict";

  var express = require('express');
  var fs = require('fs');
  var _ = require('underscore');
  var keepassio = require('keepass.io');
  var q = require('q');
  var googleDrive = require('./google-drive');

  var PORT = process.env.PORT || 8888;
  var basicAuth = {
    username: 'username',
    password: 'password'
  };

  var app = express();
  app.use(require("compression")());
  app.use(require("body-parser")());
//  app.use(express.basicAuth(function (user, pass, callback) {
//    var isValid = (user === basicAuth.username && pass === basicAuth.password);
//    callback(null /* error */, isValid);
//  }));

  var readKdbx = function (filename, password) {
    var deferred = q.defer();
    var db = new keepassio();
    db.setCredentials({ password: password /*, keyfile: 'my.key'*/ });
    db.load(filename, function (error, data) {
      if (error) {
        deferred.reject(error);
      }
      else {
        deferred.resolve(data);
      }
    });
    return deferred.promise;
  };

  var endsWith = function (string, suffix) {
    return string && string.match(suffix + "$") == suffix
  };

  app.get('/', function (req, res) {
    res.sendfile(__dirname + '/public/index.html');
  });
  app.get(/index.html/, function (req, res) {
    res.sendfile(__dirname + '/public/index.html');
  });
  app.get(/(css|js|templates)\/(.+)/, function (req, res, next) {
    express.static(__dirname + "/public")(req, res, next)
  });

  app.get('/databases', function (req, res) {
    fs.readdir(__dirname + '/local/', function (err, filenames) {
      var databases = _.filter(filenames, function (filename) {
        return endsWith(filename, '.kdbx');
      });
      res.json({'databases': databases});
    });
  });
  app.post('/databases/:filename', function (req, res) {
    var filename = __dirname + '/local/' + req.params.filename;
    if (!fs.existsSync(filename)) {
      res.send("file '" + req.params.filename + "' doesn't exist", 404);
    }
    else {
      var reqBody = req.body;
      q.when(readKdbx(filename, reqBody.password))
          .then(function (result) {
                  res.json(result);
                }, function (reason) {
                  res.send("problem occurred reading '" + req.params.filename + "': " + reason, 500);
                });
    }
  });
  app.get('/drive', function (req, res) {
    googleDrive.updateKdbxFromDrive(req, res);
  });

  app.listen(PORT, function () {
    console.log('server is listening on port ' + PORT);
  });
})();
