var config = {
    "port": 8443
};

// optional: when running behind a context path (yay, container speak)
// this is the place where you can tell the frontend where it can
// find backend resources.
//config.contextPath = '/keepass/';

// optional: configure https support
//
//var fs = require('fs');
//config.https = {
//  "enabled": false,
//  "options": {
//    "key": fs.readFileSync(__dirname + '/certs/your_private_key.pem'),
//    "cert": fs.readFileSync(__dirname + '/certs/your_cert_chain.pem')
//  }
//};

// optional: configure basic authentification
//
//config.basicAuth = {
//  "enabled": false,
//  "username": 'username',
//  "password": 'password'
//};

// optional: configure synchronization with google drive
//
//config.googleDrive = {
//  "enabled": false,
//  "clientSecret": {
//    "client_id": "123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com",
//    "client_secret": "aBcDeFgHiJkL987456_01234",
//    "redirect_uris": ["https://www.example.com:8843/update/oauth2callback"]
//  },
//  "fileTitle": 'your_keepass_db_filename_in_google_drive.kdbx'
//};

module.exports = config;
