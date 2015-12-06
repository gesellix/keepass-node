var fs = require('fs-extra');
var resourcesDir = __dirname + '/../resources/';

var createTmpDb = function (sourceFilename, targetFilename, done) {
    fs.copy(resourcesDir + sourceFilename, resourcesDir + targetFilename, function (err) {
        if (err) {
            done(err);
            return;
        }
        done();
    });
};
var removeTmpDb = function (filename, done) {
    fs.remove(resourcesDir + filename, function (err) {
        if (err) {
            done(err);
            return;
        }
        done();
    });
};

module.exports.resourcesDir = resourcesDir;

module.exports.createTmpDb = createTmpDb;

module.exports.removeTmpDb = removeTmpDb;
