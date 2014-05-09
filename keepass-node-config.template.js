var fs = require('fs');

module.exports = {
  "port": 8443,
  "https": {
    "enabled": false,
    "options": {
      "key": fs.readFileSync(__dirname + '/certs/your_private_key.pem'),
      "cert": fs.readFileSync(__dirname + '/certs/your_cert_chain.pem')
    }
  },
  "basicAuth": {
    "enabled": false,
    "username": 'username',
    "password": 'password'
  },
  "googleDrive": {
    "enabled": false,
    "clientSecret": {
      "client_id": "123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com",
      "client_secret": "aBcDeFgHiJkL987456_01234",
      "redirect_uris": ["https://www.example.com:8843/update/oauth2callback"]
    },
    "fileTitle": 'your_keepass_db_filename_in_google_drive.kdbx'
  }
};