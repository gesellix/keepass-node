(function () {
    'use strict';

    module.exports = {
        Backend: require('./backend'),
        BasicAuth: require('./basic-auth'),
        Keepass: require('./keepass'),
        GoogleDrive: require('./google-drive')
    };
}());
