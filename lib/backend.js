(function () {
  "use strict";

  var createBackend = function (config) {

    var publicResourcesDir = config.publicResourcesDir;

    var secret = config.jwtSecret;
    var expressJwtConfig = {secret: config.jwtSecret, userProperty: config.jwtUserProperty};

    var keepass = require('./keepass')(config.databaseDir);

    var expressJwt = require('express-jwt');
    var jwt = require('jsonwebtoken');

    var express = require('express');
    var app = express();
    app.use(require("body-parser").json());

    app.get('/', function (req, res) {
      res.sendFile('/index.html', {'root': publicResourcesDir});
    });
    app.get(/index.html/, function (req, res) {
      res.sendFile('/index.html', {'root': publicResourcesDir});
    });
    app.get(/(css|js|templates)\/(.+)/, function (req, res, next) {
      express.static(publicResourcesDir)(req, res, next)
    });

    app.get('/databases', function (req, res) {
      keepass.getDatabaseNames().then(function (result) {
        res.json(result);
      }, function (reason) {
        res.status(500).send("error reading database list: " + reason);
      });
    });

    app.post('/databases/:filename/auth',
             function (req, res) {
               var databaseName = req.params.filename;
               if (!keepass.exists(databaseName)) {
                 res.status(404).send("database '" + databaseName + "' doesn't exist");
               }
               else {
                 var password = req.body.password;
                 keepass.getDatabaseRaw(databaseName, password)
                     .then(function (result) {
                             var token = jwt.sign({filename: databaseName, password: password}, secret);
                             res.json({jwt: token});
                           }, function (reason) {
                             res.status(500).send("problem occurred reading '" + databaseName + "': " + reason);
                           });
               }
             });
    app.get('/:filename/groups',
            expressJwt(expressJwtConfig),
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
                keepass.getDatabaseGroups(databaseName, password)
                    .then(function (result) {
                            res.json(result);
                          }, function (reason) {
                            res.status(500).send("problem occurred reading '" + databaseName + "': " + reason);
                          });
              }
            });
    app.get('/:filename/:group',
            expressJwt(expressJwtConfig),
            function (req, res) {
              var databaseName = req.params.filename;
              if (!keepass.exists(databaseName)) {
                res.status(404).send("database '" + databaseName + "' doesn't exist");
              }
              else {
                var password = req.jwt.password;
                var groupId = req.params.group;
                keepass.getGroupEntries(databaseName, password, groupId)
                    .then(function (result) {
                            res.json(result);
                          }, function (reason) {
                            res.status(500).send("problem occurred reading '" + groupId + "' from '" + databaseName + "': " + reason);
                          });
              }
            });
    return app;
  };

  module.exports = function (config) {
    return createBackend(config);
  };

})();
