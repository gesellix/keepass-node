(function () {
  "use strict";

  var express = require('express');
  var https = require('https');
  var fs = require('fs');
  var _ = require('underscore');
  var keepassio = require('keepass.io');
  var q = require('q');

  var config = require('./keepass-node-config');

  var readKdbx = function (filename, password) {
    var deferred = q.defer();
    var db = new keepassio.Database();
    db.addCredential(new keepassio.Credentials.Password(password));
//    db.addCredential(new keepassio.Credentials.Keyfile('my.key');
    db.loadFile(filename, function (error, api) {
      if (error) {
        deferred.reject(error);
      }
      else {
        deferred.resolve(api);
      }
    });
    return deferred.promise;
  };

  var endsWith = function (string, suffix) {
    return string && string.match(suffix + "$") == suffix
  };

  var app = express();

  app.use(require("compression")());
  app.use(require("body-parser").json());

  if (config.basicAuth && config.basicAuth.enabled) {
    app.use(express.basicAuth(function (user, pass, callback) {
      var isValid = (user === basicAuth.username && pass === basicAuth.password);
      callback(null /* error */, isValid);
    }));
  }

  if (config.googleDrive && config.googleDrive.enabled) {
    app.use('/update', require('./google-drive')('/update', config.googleDrive));
  }

  app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
  });
  app.get(/index.html/, function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
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
                        res.json(result.getRaw().KeePassFile);
                }, function (reason) {
                  res.send("problem occurred reading '" + req.params.filename + "': " + reason, 500);
                });
    }
  });

  if (config.https && config.https.enabled) {
    https.createServer(config.https.options, app).listen(config.port);
  }
  else {
    app.listen(config.port);
  }
  console.log('server is listening on port ' + config.port);
})();
