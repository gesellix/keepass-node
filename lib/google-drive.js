(function () {
    "use strict";

    var fs = require('fs');
    var _ = require('lodash');
    var q = require('q');
    var google = require('googleapis');

    var oauth2Client;

    var googleDriveMountPoint = '';
    var googleDriveConfig = {};

    var defaultGoogleDriveConfig = function () {
        return {
            clientSecret: null,
            fileTitle: 'your_keepass_db.kdbx',
            targetFilename: __dirname + '/local/google-drive.kdbx',
            clientSecretFilename: __dirname + '/local/googleapis_client_secret.json',
            clientSecretType: 'web',
//    clientSecretType: 'installed',
            tokensFilename: __dirname + '/local/googleapis_tokens.json',
            oauth2Tokens: {}
        };
    };

    var readAccessToken = function () {
        if (!_.isEmpty(googleDriveConfig.oauth2Tokens)) {
            return googleDriveConfig.oauth2Tokens;
        }

        if (fs.existsSync(googleDriveConfig.tokensFilename)) {
            googleDriveConfig.oauth2Tokens = JSON.parse(fs.readFileSync(googleDriveConfig.tokensFilename, 'utf8'));
            return googleDriveConfig.oauth2Tokens;
        }

        return null;
    };

    var requestAccessToken = function (oauth2Client, code) {
        var deferred = q.defer();

        oauth2Client.getToken(code, function (err, tokens) {
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(tokens);
            }
        });

        return deferred.promise;
    };

    var downloadFile = function (oauth2Client, item) {
        var deferred = q.defer();

        var options = {
            uri: item.downloadUrl,
            encoding: null
        };
        oauth2Client.request(options, function (error, body, response) {
            if (response.statusCode == 200) {
                fs.writeFileSync(googleDriveConfig.targetFilename, body);
                deferred.resolve();
            }
            else {
                console.log('got response with status code ' + response.statusCode);
                deferred.reject();
            }
        });

        return deferred.promise;
    };

    var readKeepass2File = function (oauth2Client) {
        var deferred = q.defer();

        var drive = google.drive({version: 'v2', auth: oauth2Client});
        drive.files.list(
                {},
                function (err, result) {
                    if (err) {
                        deferred.reject(err);
                    }
                    else {
                        var keepassFile = _.find(result.items, function (item) {
                            return item.title == googleDriveConfig.fileTitle;
                        });
                        deferred.resolve(keepassFile);
                    }
                });

        return deferred.promise;
    };

    var updateKdbxFromDrive = function () {
        oauth2Client.setCredentials(googleDriveConfig.oauth2Tokens);
        return readKeepass2File(oauth2Client).then(function (keepass2File) {
            downloadFile(oauth2Client, keepass2File);
        });
    };

    var middleware = function (req, res, next) {
        if (req.path == '/oauth2callback' && req.query.code) {
            console.log('requestAccessToken...');
            requestAccessToken(oauth2Client, req.query.code).then(function (result) {
                console.log('requestoken:' + JSON.stringify(googleDriveConfig.oauth2Tokens));
                console.log('save requestAccessToken to "' + googleDriveConfig.tokensFilename + '"...');
                googleDriveConfig.oauth2Tokens = result;
                fs.writeFileSync(googleDriveConfig.tokensFilename, JSON.stringify(googleDriveConfig.oauth2Tokens), 'utf8');

                console.log('redirect to ' + googleDriveMountPoint + '...');
                res.redirect(googleDriveMountPoint);
            }, function (reason) {
                console.log('could not request access token! reason: ' + JSON.stringify(reason));
                res.writeHeader(500, {"Content-Type": "text/html"});
                res.write('<p>could not request access token! reason: ' + JSON.stringify(reason) + '</p>');
                res.end();
            });
        }
        else if (req.path == '/') {
            if (!_.isEmpty(googleDriveConfig.oauth2Tokens)) {
                console.log('updateKdbxFromDrive...');
                updateKdbxFromDrive().then(function () {
                    res.redirect('/');
                }, function (reason) {
                    console.log('updateKdbxFromDrive() failed! reason: ' + JSON.stringify(reason));
                    res.writeHeader(500, {"Content-Type": "text/html"});
                    res.write('<p>updateKdbxFromDrive() failed! reason: ' + JSON.stringify(reason) + '</p>');
                    res.end();
                });
            }
            else {
                //console.log('generateAuthUrl...');
                var opts = {
                    access_type: 'offline', // will return a refresh token
                    // see https://developers.google.com/drive/web/scopes
//          scope: 'https://www.googleapis.com/auth/drive'
                    scope: 'https://www.googleapis.com/auth/drive.readonly'
                };
                var authUrl = oauth2Client.generateAuthUrl(opts);
                res.redirect(authUrl);
            }
        }
        else {
            next();
        }
    };

    var initialize = function (mountPoint, config) {
        googleDriveMountPoint = mountPoint;
        googleDriveConfig = _.extend(defaultGoogleDriveConfig(), config);

        if (!googleDriveConfig.clientSecret) {
            if (fs.existsSync(googleDriveConfig.clientSecretFilename)) {
                googleDriveConfig.clientSecret = require(googleDriveConfig.clientSecretFilename)[googleDriveConfig.clientSecretType];
            }
        }
        if (googleDriveConfig.clientSecret) {
            var OAuth2 = google.auth.OAuth2;
            oauth2Client = new OAuth2(
                    googleDriveConfig.clientSecret.client_id,
                    googleDriveConfig.clientSecret.client_secret,
                    googleDriveConfig.clientSecret.redirect_uris[0]);
        }

        readAccessToken();
    };

    module.exports = function (mountPoint, config) {

        initialize(mountPoint, config);

        if (!googleDriveConfig.clientSecret || !oauth2Client) {
            console.log('google-drive middleware initialization failed!');
        }

        return middleware;
    };
})();
