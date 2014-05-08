(function () {
  "use strict";

  var fs = require('fs');
  var _ = require('underscore');
  var q = require('q');
  var googleapis = require('googleapis');

  var oauth2Client;

  var googleDriveMountPoint = '';
  var googleDriveConfig = {
    clientSecret: null,
    fileTitle: 'keepass2_.kdbx',
    targetFilename: __dirname + '/local/google-drive.kdbx',
    clientSecretFilename: __dirname + '/local/googleapis_client_secret.json',
    clientSecretType: 'web_localhost',
//    clientSecretType: 'installed',
    tokensFilename: __dirname + '/local/googleapis_tokens.json',
    oauth2Tokens: {
    }
  };

  var readAccessToken = function () {
    if (!_.isEmpty(googleDriveConfig.oauth2Tokens)) {
      console.log('reusing tokens from memory');
      return googleDriveConfig.oauth2Tokens;
    }

    if (fs.existsSync(googleDriveConfig.tokensFilename)) {
      console.log('reading tokens from file');
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

    console.log('get file from "' + item.downloadUrl + '"...');
    var options = {
      uri: item.downloadUrl,
      encoding: null
    };
    oauth2Client.request(options, function (error, body, response) {
      console.log('got response with status code ' + response.statusCode);
      if (response.statusCode == 200) {
        fs.writeFileSync(googleDriveConfig.targetFilename, body);
        deferred.resolve();
      }
      else {
        deferred.reject();
      }
    });

    return deferred.promise;
  };

  var discoverGoogleDriveClient = function () {
    var deferred = q.defer();

    googleapis
        .discover('drive', 'v2')
        .execute(function (err, client) {
                   if (err) {
                     console.log('An error occured', err);
                     deferred.reject(err);
                   }
                   else {
                     deferred.resolve(client);
                   }
                 });

    return deferred.promise;
  };

  var readKeepass2File = function (client, oauth2Client) {
    var deferred = q.defer();

    client
        .drive.files.list()
        .withAuthClient(oauth2Client)
        .execute(function (err, result) {
                   if (err) {
                     console.log('An error occured', err);
                     deferred.reject(err);
                   }
                   else {
                     console.log('files read from remote.');
//                     console.log(result.items);
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
    return discoverGoogleDriveClient().then(function (client) {
      readKeepass2File(client, oauth2Client).then(function (keepass2File) {
        console.log('download ' + JSON.stringify(keepass2File));
        downloadFile(oauth2Client, keepass2File);
      });
    });
  };

  var middleware = function (req, res, next) {
//    console.log('%s %s (%s)', req.method, req.url, googleDriveMountPoint + req.path);

    if (req.path == '/oauth2callback' && req.query.code) {
      console.log('request access token...');
      requestAccessToken(oauth2Client, req.query.code).then(function (result) {
        googleDriveConfig.oauth2Tokens = result;
        fs.writeFileSync(googleDriveConfig.tokensFilename, JSON.stringify(googleDriveConfig.oauth2Tokens), 'utf8');

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
        console.log('need to request access token...');
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
      console.log('cannot handle "' + req.path + '"');
      next();
    }
  };

  var initialize = function (mountPoint, config) {
    googleDriveMountPoint = mountPoint;
    googleDriveConfig = _.extend(googleDriveConfig, config);

    if (!googleDriveConfig.clientSecret) {
      if (fs.existsSync(googleDriveConfig.clientSecretFilename)) {
        var clientSecret = require(googleDriveConfig.clientSecretFilename)[googleDriveConfig.clientSecretType];
        googleDriveConfig.clientSecret = clientSecret;
        oauth2Client = new googleapis.OAuth2Client(clientSecret.client_id, clientSecret.client_secret, clientSecret.redirect_uris[0]);
      }
    }

    readAccessToken();
    console.log('initialized config: ' + JSON.stringify(googleDriveConfig, null, 2));
  };

  module.exports = function (mountPoint, config) {

    initialize(mountPoint, config);

    if (!googleDriveConfig.clientSecret || !oauth2Client) {
      console.log('google-drive middleware initialization failed!');
    }

    return middleware;
  };
})();
