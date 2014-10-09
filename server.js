(function () {
  "use strict";

  var _ = require('underscore');

  var config = require('./keepass-node-config');
  config = _.extend({
                      databaseDir: __dirname + '/local/',
                      publicResourcesDir: __dirname + '/public/',

                      jwtSecret: 'TODO__shhhhhhared-secret',
                      jwtUserProperty: 'jwt'
                    }, config);

  var keepassLib = require('./lib');

  var express = require('express');
  var app = express();

  app.use(require("compression")());

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

  app.use(keepassLib.Backend(config));

  if (config.https && config.https.enabled) {
    var https = require('https');
    https.createServer(config.https.options, app).listen(config.port);
  }
  else {
    app.listen(config.port);
  }
  console.log('server is listening on port ' + config.port);
})();
