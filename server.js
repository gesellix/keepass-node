(function () {
    "use strict";

    var bunyan = require('bunyan');
    var log = bunyan.createLogger({name: 'keepass'});

    var optional = require('require-optional');
    var _ = require('lodash');

    var crypto = require('crypto');

    var generateKey = function () {
        return crypto.randomBytes(256).toString('hex');
    };

    var readConfig = function () {
        var port = process.env.PORT || 8443;

        var cryptKey = generateKey();
        var jwtSecret = generateKey();

        var config = optional('./keepass-node-config', {"port": port});
        config = _.extend({
            databaseDir: __dirname + '/local/',
            publicResourcesDir: __dirname + '/public/',

            cryptKey: cryptKey,
            jwtSecret: jwtSecret,
            jwtUserProperty: 'jwt'
        }, config);
        return config;
    };

    var config = readConfig();
    var keepassLib = require('./lib');

    var express = require('express');
    var app = express();

    app.use(require("compression")());

    if (config.basicAuth && config.basicAuth.enabled) {
        app.use(keepassLib.BasicAuth(config.basicAuth));
    }

    if (config.googleDrive && config.googleDrive.enabled) {
        // TODO verify whether this still works
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
    log.info('server is listening on port ' + config.port);
})();
