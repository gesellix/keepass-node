"use strict";

var fs = require('fs');
var _ = require('underscore');
var q = require('q');
var googleapis = require('googleapis');
var OAuth2Client = googleapis.OAuth2Client;

var oauth2Tokens = {
};

function getAccessToken(oauth2Client, code, callback) {

  if (!_.isEmpty(oauth2Tokens)) {
    console.log('reusing tokens from memory');
    oauth2Client.setCredentials(oauth2Tokens);
    callback({});
    return;
  }

  var tokensFilename = __dirname + '/local/googleapis_tokens.json';
  if (fs.existsSync(tokensFilename)) {
    console.log('reusing tokens from file');
    oauth2Tokens = JSON.parse(fs.readFileSync(tokensFilename, 'utf8'));
    oauth2Client.setCredentials(oauth2Tokens);
    callback({});
    return;
  }

  if (code) {
    console.log('using code: "' + code + '"');
    // request access token
    oauth2Client.getToken(code, function (err, tokens) {
      oauth2Tokens = tokens;
      fs.writeFileSync(tokensFilename, JSON.stringify(oauth2Tokens), 'utf8');
      // set tokens to the client
      // TODO: tokens should be set by OAuth2 client.
      console.log(tokens);
      oauth2Client.setCredentials(oauth2Tokens);
      callback({});
    });
    return;
  }

  if (_.isEmpty(oauth2Tokens)) {
    // generate consent page url
    var url = oauth2Client.generateAuthUrl({
                                             access_type: 'offline', // will return a refresh token
                                             scope: 'https://www.googleapis.com/auth/drive'
                                           });

    console.log('Visit the url: ', url);
    callback({needsCode: true, codeUrl: url});
    return;
  }
}

function listFiles(client, authClient, callback) {
  console.log('list files...');
  client
      .drive.files.list()
      .withAuthClient(authClient)
      .execute(callback);
}

function downloadFile(authClient, item, callback) {
  console.log('get file from "' + item.downloadUrl + '"...');
  var options = {
    uri: item.downloadUrl,
    encoding: null
  };
  authClient.request(options, callback);
}

var updateKdbxFromDrive = function (req, res) {

  var googleapisClientSecretDescriptionFilename = __dirname + '/local/googleapis_client_secret.json';
  if (fs.existsSync(googleapisClientSecretDescriptionFilename)) {
    var installedClient = require(googleapisClientSecretDescriptionFilename).installed;
    var oauth2Client = new OAuth2Client(installedClient.client_id, installedClient.client_secret, installedClient.redirect_uris[0]);

    var handleAuthenticationResult = function (result) {
      if (result.needsCode) {
        res.writeHeader(200, {"Content-Type": "text/html"});
        res.write('<p>visit: <a href="' + result.codeUrl + '">' + result.codeUrl + '</a></p>');
        res.end();
        return;
      }
      else {
        console.log('authenticated');
      }

      googleapis
          .discover('drive', 'v2')
          .execute(function (err, client) {
                     if (err) {
                       console.log('An error occured', err);
                       return;
                     }

                     listFiles(client, oauth2Client, function (err, result) {
                       if (err) {
                         console.log('An error occured', err);
                         return;
                       }
                       console.log('files read from remote.');
                       var keepassFile = _.find(result.items, function (item) {
                         return item.title == "keepass2_.kdbx";
                       });
//                         console.log(keepassFile);

                       var targetFilename = __dirname + '/local/download.kdbx';
                       downloadFile(oauth2Client, keepassFile, function (error, body, response) {
                         console.log('got response with status code ' + response.statusCode);
                         fs.writeFileSync(targetFilename, body);

                         console.log('return to client');
                         res.writeHeader(200, {"Content-Type": "application/json"});
                         res.write(JSON.stringify(keepassFile));
                         res.end();
                       });
                     });
                   });
    };

    getAccessToken(oauth2Client, req.query.code, handleAuthenticationResult);
  }
};
module.exports = {updateKdbxFromDrive: updateKdbxFromDrive};
