var AES = require('crypto-js/aes');
var UTF8 = require('crypto-js/enc-utf8');

module.exports = function (options) {
    if (!options || !options.secret) {
        throw new Error('secret should be set');
    }
    var jwtUserProperty = options.userProperty || 'user';

    return {
        decryptJwt: function () {
            return function (req, res, next) {
                if (req[jwtUserProperty]) {
                    var decrypted = AES.decrypt(req[jwtUserProperty].payload, options.secret);
                    req[jwtUserProperty] = JSON.parse(decrypted.toString(UTF8));
                }
                next();
            };
        },

        encrypt: function (payload) {
            return AES.encrypt(JSON.stringify(payload), options.secret).toString();
        }
    };
};
