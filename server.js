(function () {
  "use strict";

  var express = require('express');
  var fs = require('fs');

  var CryptoJS = require('crypto-js/core');
  require('crypto-js/sha256');
  var jDataView = require('jdataview');
  var kdbx = require('./jslib/kdbx');

  var PORT = process.env.PORT || 8888;
  var basicAuth = {
    username: 'username',
    password: 'password'
  };

  var readKdbx = function (filename, password) {
    var data = fs.readFileSync(filename);
    var dataView = jDataView(data, undefined, undefined, true);
    var entries = kdbx.readEntries(dataView, [CryptoJS.SHA256(password)]);
//    console.log(entries);
    return entries;
  };

  var app = express();
  app.use(express.compress());
  app.use(express.basicAuth(function (user, pass, callback) {
    var isValid = (user === basicAuth.username && pass === basicAuth.password);
    callback(null /* error */, isValid);
  }));

  app.get('/', function (req, res) {
    res.sendfile(__dirname + '/public/index.html');
  });
  app.get(/index.html/, function (req, res) {
    res.sendfile(__dirname + '/public/index.html');
  });
  app.get(/(css|js)\/(.+)/, function (req, res, next) {
    express.static(__dirname + "/public")(req, res, next)
  });
  app.get('/keepass/entries/:filename', function (req, res) {
    var entries = readKdbx(__dirname + '/local/' + req.params.filename, 'kdbxPassword');
    res.json(entries);
  });

  app.listen(PORT, function () {
    console.log('server is listening on localhost:' + PORT);
  });

//  var entries = readKdbx(__dirname + '/local/keepassdb.kdbx', 'kdbxPassword');
})();