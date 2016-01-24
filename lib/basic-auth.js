(function () {
    "use strict";

    var _ = require('lodash');
    var basicAuth = require('basic-auth');

    var createAuth = function (config) {
        return function (req, res, next) {
            function unauthorized(res) {
                res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
                return res.sendStatus(401);
            }

            var authorization = (req.req || req).headers.authorization;
            if (_.startsWith(authorization, 'Bearer')) {
                // the Bearer authorization is expected to be verified as JWT
                next();
            } else {
                var user = basicAuth(req);

                if (!user || !user.name || !user.pass) {
                    return unauthorized(res);
                }
                var isValid = user.name === config.basicAuth.username && user.pass === config.basicAuth.password;
                return isValid ? next() : unauthorized(res);
            }
        };
    };

    module.exports = function (config) {
        return createAuth(config);
    };
})();
