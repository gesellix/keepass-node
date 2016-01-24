(function () {
    "use strict";

    var expressJwt = require('express-jwt');
    var jwt = require('jsonwebtoken');
    var _ = require('lodash');
    var fs = require('fs');

    var hogan = require("hogan.js");
    var templates = {};
    var compileTemplate = function (filepath) {
        var template = fs.readFileSync(filepath);
        return hogan.compile(template.toString('utf-8'), {delimiters: '<% %>'});
    };
    var compileTemplates = function (publicResourcesDir) {
        templates['/index.html'] = compileTemplate(publicResourcesDir + 'index.html.hbs');
    };
    var renderTemplate = function (name, data) {
        return templates[name].render(data);
    };

    var anonymousAuthorizedPaths = [
        '/',
        '/favicon.ico',
        /index.html?/,
        /(css|js|templates)\/(.+)/,
        '/databases',
        /\/databases\/[^\/]+\/auth/
    ];

    var createBackend = function (config) {

        var publicResourcesDir = config.publicResourcesDir;

        var secret = config.jwtSecret;
        var expressJwtConfig = {secret: config.jwtSecret, userProperty: config.jwtUserProperty};

        var keepass = require('./keepass')(config.databaseDir);
        var jwtCrypt = require('./jwt-crypt')({secret: config.cryptKey, userProperty: config.jwtUserProperty});

        var express = require('express');
        var app = express();
        app.use(require("body-parser").json());
        app.use(expressJwt(expressJwtConfig).unless({path: anonymousAuthorizedPaths}));
        app.use(jwtCrypt.decryptJwt());

        compileTemplates(publicResourcesDir);
        var renderedIndex = renderTemplate('/index.html', {contextPath: config.contextPath});

        app.get('/', function (req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(renderedIndex);
        });
        app.get(/index.html?/, function (req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(renderedIndex);
        });
        app.get(/(css|js|templates)\/(.+)/, function (req, res, next) {
            express.static(publicResourcesDir)(req, res, next);
        });

        app.get('/databases', function (req, res) {
            keepass.getDatabaseNames().then(function (result) {
                res.json(result);
            }, function (reason) {
                res.status(500).send({msg: "error reading database list: " + reason});
            });
        });

        app.post('/databases/:filename/auth', function (req, res) {
            var databaseName = req.params.filename;
            if (!keepass.exists(databaseName)) {
                res.status(404).send({msg: "database '" + databaseName + "' doesn't exist"});
            }
            else {
                var password = req.body.password;
                if (_.isEmpty(password)) {
                    res.status(401).send({msg: "please set a password"});
                }
                else {
                    keepass.getDatabaseRaw(databaseName, password)
                            .then(function () {
                                var payload = {filename: databaseName, password: password};
                                var encryptedPayload = jwtCrypt.encrypt(payload);
                                var token = jwt.sign({payload: encryptedPayload}, secret, {expiresIn: 5 * 60});
                                res.json({jwt: token});
                            }, function (reason) {
                                res.status(500).send({msg: "problem occurred reading '" + databaseName + "': " + reason});
                            });
                }
            }
        });

        //app.get('/databases/:filename/dump',
        //        function (req, res) {
        //          if (req.jwt.filename != req.params.filename) {
        //            res.status(401).send({msg: "access denied"});
        //            return;
        //          }
        //          var databaseName = req.params.filename;
        //          if (!keepass.exists(databaseName)) {
        //            res.status(404).send({msg: "database '" + databaseName + "' doesn't exist"});
        //          }
        //          else {
        //            var password = req.jwt.password;
        //            keepass.getDatabaseRaw(databaseName, password)
        //                .then(function (result) {
        //                        res.json(result);
        //                      }, function (reason) {
        //                        res.status(500).send({msg: "problem occurred reading '" + databaseName + "': " + reason});
        //                      });
        //          }
        //        });

        app.get('/:filename/groups',
                function (req, res) {
                    if (req.jwt.filename != req.params.filename) {
                        res.status(401).send({msg: "access denied"});
                        return;
                    }
                    var databaseName = req.params.filename;
                    if (!keepass.exists(databaseName)) {
                        res.status(404).send({msg: "database '" + databaseName + "' doesn't exist"});
                    }
                    else {
                        var password = req.jwt.password;
                        keepass.getDatabaseGroups(databaseName, password)
                                .then(function (result) {
                                    res.json(result);
                                }, function (reason) {
                                    res.status(500).send({msg: "problem occurred reading '" + databaseName + "': " + reason});
                                });
                    }
                });
        app.get('/:filename/:group',
                function (req, res) {
                    var databaseName = req.params.filename;
                    if (!keepass.exists(databaseName)) {
                        res.status(404).send({msg: "database '" + databaseName + "' doesn't exist"});
                    }
                    else {
                        var password = req.jwt.password;
                        var groupId = req.params.group;
                        keepass.getGroupEntries(databaseName, password, groupId)
                                .then(function (result) {
                                    res.json(result);
                                }, function (reason) {
                                    res.status(500).send({msg: "problem occurred reading '" + groupId + "' from '" + databaseName + "': " + reason});
                                });
                    }
                });
        app.put('/:filename/:parentGroup/group/:group',
                function (req, res) {
                    var databaseName = req.params.filename;
                    if (!keepass.exists(databaseName)) {
                        res.status(404).send({msg: "database '" + databaseName + "' doesn't exist"});
                    }
                    else {
                        var parentGroupId = req.params.parentGroup;
                        var groupId = req.params.group;
                        var group = req.body.group;
                        if (!group.UUID || group.UUID != groupId) {
                            res.status(409).send({msg: "needs a group.UUID"});
                        }
                        else {
                            var password = req.jwt.password;
                            keepass.saveGroup(databaseName, password, parentGroupId, group)
                                    .then(function (result) {
                                        res.json(result);
                                    }, function (reason) {
                                        res.status(500).send({msg: "problem occurred adding '" + group + "' to '" + databaseName + "." + parentGroupId + "': " + reason});
                                    });
                        }
                    }
                });
        app.put('/:filename/:group/entry/:entry',
                function (req, res) {
                    var databaseName = req.params.filename;
                    if (!keepass.exists(databaseName)) {
                        res.status(404).send({msg: "database '" + databaseName + "' doesn't exist"});
                    }
                    else {
                        var entryId = req.params.entry;
                        var entry = req.body.entry;
                        if (!entry.UUID || entry.UUID != entryId) {
                            res.status(409).send({msg: "needs an entry.UUID"});
                        }
                        else {
                            var password = req.jwt.password;
                            var groupId = req.params.group;
                            keepass.saveGroupEntry(databaseName, password, groupId, entry)
                                    .then(function (result) {
                                        res.json(result);
                                    }, function (reason) {
                                        res.status(500).send({msg: "problem occurred adding '" + entry + "' to '" + databaseName + "." + groupId + "': " + reason});
                                    });
                        }
                    }
                });
        return app;
    };

    module.exports = function (config) {
        return createBackend(config);
    };

})();
