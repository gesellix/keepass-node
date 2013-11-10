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
    return entries;
  };

  var endsWith = function (string, suffix) {
    return string && string.match(suffix + "$") == suffix
  };

  var app = express();
  app.use(express.compress());
  app.use(express.bodyParser());
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
  app.get(/(css|js|templates)\/(.+)/, function (req, res, next) {
    express.static(__dirname + "/public")(req, res, next)
  });

  app.get('/databases', function (req, res) {
    fs.readdir(__dirname + '/local/', function (err, filenames) {
      var databases = filenames.filter(function (filename) {
        return endsWith(filename, '.kdbx');
      });
      res.json({'databases': databases});
    });
  });
  app.post('/databases/:filename', function (req, res) {
    var filename = __dirname + '/local/' + req.params.filename;
    if (!fs.existsSync(filename)) {
      res.send("file '" + req.params.filename + "' doesn't exist", 404);
    }
    else {
      var reqBody = req.body;
      var entries = readKdbx(filename, reqBody.password);
      res.json({entries: entries});
    }
  });

  app.listen(PORT, function () {
    console.log('server is listening on port ' + PORT);
  });
})();