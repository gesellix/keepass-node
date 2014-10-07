(function () {
  "use strict";

  var config = require('./keepass-node-config');
  var keepassLib = require('./lib');
  var keepass = keepassLib.Keepass(__dirname + '/local/');

  var express = require('express');
  var expressJwt = require('express-jwt');
  var jwt = require('jsonwebtoken');

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
    var googleDrive = keepassLib.GoogleDrive('/update', config.googleDrive);
    app.use('/update', googleDrive);
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
      res.status(500).send("error reading database list: " + reason);
    });
  });
  app.post('/databases/:filename', function (req, res) {
    var databaseName = req.params.filename;
    if (!keepass.exists(databaseName)) {
      res.status(404).send("database '" + databaseName + "' doesn't exist");
    }
    else {
      var password = req.body.password;
      keepass.getDatabaseRaw(databaseName, password).then(function (result) {
        res.json(result);
      }, function (reason) {
        res.status(500).send("problem occurred reading '" + databaseName + "': " + reason);
      });
    }
  });
  // TODO. obviously.
  var secret = 'shhhhhhared-secret';
  app.post('/databases/:filename/auth',
      function (req, res) {
        var databaseName = req.params.filename;
        if (!keepass.exists(databaseName)) {
          res.status(404).send("database '" + databaseName + "' doesn't exist");
        }
        else {
          var password = req.body.password;
          keepass.getDatabaseRaw(databaseName, password).then(function (result) {
            var token = jwt.sign({filename: databaseName, password: password}, secret);
            res.json({jwt: token});
          }, function (reason) {
            res.status(500).send("problem occurred reading '" + databaseName + "': " + reason);
          });
        }
      });
  app.post('/:filename/groups',
      expressJwt({secret: secret, userProperty: 'jwt'}),
      function (req, res) {
        if (req.jwt.filename != req.params.filename) {
          res.status(401).send("access denied");
          return;
        }
        var databaseName = req.params.filename;
        if (!keepass.exists(databaseName)) {
          res.status(404).send("database '" + databaseName + "' doesn't exist");
        }
        else {
          var password = req.jwt.password;
          keepass.getDatabaseGroups(databaseName, password).then(function (result) {
            res.json(result);
          }, function (reason) {
            res.status(500).send("problem occurred reading '" + databaseName + "': " + reason);
          });
        }
      });
  app.post('/:filename/:group', function (req, res) {
    var databaseName = req.params.filename;
    if (!keepass.exists(databaseName)) {
      res.status(404).send("database '" + databaseName + "' doesn't exist");
    }
    else {
      var password = req.body.password;
      var groupId = req.params.group;
      keepass.getGroupEntries(databaseName, password, groupId).then(function (result) {
        res.json(result);
      }, function (reason) {
        res.status(500).send("problem occurred reading '" + groupId + "' from '" + databaseName + "': " + reason);
      });
    }
  });

  if (config.https && config.https.enabled) {
    var https = require('https');
    https.createServer(config.https.options, app).listen(config.port);
  }
  else {
    app.listen(config.port);
  }
  console.log('server is listening on port ' + config.port);
})();
