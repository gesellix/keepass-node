(function () {
  'use strict';

  module.exports = {
    Backend: require('./backend'),
    Keepass: require('./keepass'),
    GoogleDrive: require('./google-drive')
  };
}());
