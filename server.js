(function () {
  "use strict";

  var config = require('./keepass-node-config');
  var keepass = require('./lib').Keepass(__dirname + '/local/');

  var express = require('express');
  var https = require('https');

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
    keepass.getDatabaseNames().then(function (result) {
      res.json(result);
    }, function (reason) {
      res.send("error reading database list: " + reason, 500);
    });
  });
  app.post('/databases/:filename', function (req, res) {
    var databaseName = req.params.filename;
    if (!keepass.exists(databaseName)) {
      res.send("database '" + databaseName + "' doesn't exist", 404);
    }
    else {
      var password = req.body.password;
      keepass.getDatabase(databaseName, password).then(function (result) {
        res.json(result);
      }, function (reason) {
        res.send("problem occurred reading '" + databaseName + "': " + reason, 500);
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
