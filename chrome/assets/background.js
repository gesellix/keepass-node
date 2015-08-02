chrome.app.runtime.onLaunched.addListener(function () {

    chrome.app.window.create('index.html', {
        'bounds': {
            'width': 1350,
            'height': 500
        }
    }, function (createdWindow) {
        createdWindow.maximize();
    });
});
