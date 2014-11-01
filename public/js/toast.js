(function () {
  "use strict";

  var toast = angular.module('toast', ['ngAnimate', 'ngMaterial']);

  toast.factory('toast', function ($mdToast) {

    var toastError = function (message) {
      $mdToast.show({
                      controller: function ($scope, $mdToast, message) {
                        $scope.message = message;
                        $scope.closeToast = function () {
                          $mdToast.hide();
                        };
                      },
                      templateUrl: 'templates/error-toast.html',
                      locals: {message: message},
                      hideDelay: false,
                      position: 'bottom'
                    });
    };

    var toastInfo = function (message) {
      $mdToast.show({
                      template: '<md-toast><span flex>' + message + '</span></md-toast>',
                      hideDelay: 3000,
                      position: 'bottom'
                    });
    };

    return {
      info: toastInfo,
      error: toastError
    };
  });
}());
