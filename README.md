#KeePass-Node

[Node.js](http://nodejs.org/) with [AngularJS](http://angularjs.org/) implementation of a [KeePass2](http://www.keepass.info/) editor.

[![Build Status](https://travis-ci.org/gesellix/keepass-node.svg?branch=master)](https://travis-ci.org/gesellix/keepass-node)
[![Coverage Status](https://coveralls.io/repos/gesellix/keepass-node/badge.png?branch=master)](https://coveralls.io/r/gesellix/keepass-node?branch=master)

## What?
You should probably know about [KeePass](http://www.keepass.info/) as a tool to manage your passwords or
other secrets in an encrypted file. Since the default tool to edit and view your passwords is based on .NET
you might not be able to use your keys everytime you need them due to missing libraries
or a wrong platform (Mono needs to be installed on Linux systems).

KeePass-Node is based on the idea of [BrowsePass](http://bitbucket.org/namn/browsepass), which helps you
to open a file from your current filesystem or from a URL by using only browser based libraries.

While it's a great step forward to use a browser based KeePass reader, I don't want to ~~save my keepass file
in any cloud~~ (I guess I changed my mind - see below for [Google Drive sync](https://github.com/gesellix/keepass-node#download-from-google-drive))
or keep it with me on a USB stick all the time.
I expect to mostly have internet access, so what about saving my keepass file on my private server
and access it by a tool like BrowserPass?
For the typical usage of only reading from my keepass file, that would be enough.

To make BrowserPass more convenient, I didn't want to always upload a keepass file. I just wanted to enter
a password to see my entries, so I searched for an improved solution. Long story short: I didn't find any,
so I build it myself. KeePass-Node was born.

## Installation
First, you need Node.js running on your server of choice and navigate to a suitable folder. Then:
````
~$ git clone https://github.com/gesellix/keepass-node.git
~$ cd keepass-node
````
You'll find a config template `keepass-node-config.template.js` which shows you how to configure port (default 8443),
https (optional),  basic authentication (optional) and Google Drive sync (optional). Optional features are disabled by default.

To give KeePass-Node a minimal config you need to create a file `keepass-node-config.js` in the project's root
folder and paste at least something like this:
````
module.exports = {
  "port": 8443
};
````

After changing its content to fit your needs, you can finish the installation and start the KeePass-Node server:
````
~/keepass-node$ npm install
~/keepass-node$ npm start
````
NPM should download a small part of the internet for you and start the KeePass-Node server on the configured port.
You may now enter the URL into your browser like follows,
just replace "localhost" with your hostname: [http://localhost:8443/](http://localhost:8443/).

KeePass-Node comes with an `example.kdbx` which should be the already selected database. You have
to enter the keepass file password now, the default is `password`. After a click on `load`, you should
see the familiar tree structure of keepass groups.

## How to provide your personal KeePass2 file

### Local copy
Then you need to provide your keepass file. KeePass-Node expects any keepass files in the subfolder `./local/`.
You should find the mentioned `example.kdbx` there. You can copy your keepass file to that folder
or create a symbolic link (Windows users may ignore that hint). Hit `CTRL-C` if KeePass-Node is still running
or use another shell.
````
~/keepass-node$ cd local
~/keepass-node/local$ ln -s ~/path/to/my/keepass.kdbx keepass.kdbx
````
Now start the server again (if not still running):
````
~/keepass-node/local$ cd ..
~/keepass-node$ npm start
````
Refresh your browser window and you should see your keepass.kdbx in the database dropdown list.

### Download from Google Drive

In case you also keep your keepass.kdbx file on Google Drive, you can make KeePass-Node update the local copy by
downloading it from Google Drive. I didn't want to publicly share my keepass file, so I configured a web application
client for Google Drive at the [Google Developers Console](https://console.developers.google.com/). If this is
completely new for you, you can find a very short introduction at the
Google Drive SDK [Quickstart](https://developers.google.com/drive/web/quickstart/quickstart-nodejs). Essentially, you'll
need to go through the [setup of a project and application](https://console.developers.google.com/flows/enableapi?apiid=drive)
in the Developers Console.

After your application setup, KeePass-Node need the following properties:
````
"client_id": "123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com",
"client_secret": "aBcDeFgHiJkL987456_01234",
"redirect_uris": ["https://www.example.com:8843/update/oauth2callback"]
````
Please make sure that the first element in `redirect_uris` has a path equalling `/update/oauth2callback`, due to the current implementation.
The properties need to be pasted into the config file `keepass-node-config.js` under `googleDrive.clientSecret`.
Please also provide a `googleDrive.fileTitle` and change the property `googleDrive.enabled` to `true`.

After restarting KeePass-Node, you can enter the following uri in your browser: `https://www.example.com:8843/update`.
It should redirect you to a Google page asking you for permission to make KeePass-Node use your Google Drive in readonly mode.
When you accept the permission, you'll be redirected back to KeePass-Node, and it will download the file named like you have configured as
`fileTitle` and save it at `.../local/google-drive.kdbx`.

A browser refresh later, and you can choose the updated `google-drive.kdbx` from the KeePass-Node database dropdown.

## Next
There already are some ideas on improving this little tool:
* your ideas are welcome!
* [keepass write support](https://github.com/gesellix/keepass-node/issues/2) (probably don't reinvent the wheel, when the keepass.io author is [already working on it](https://github.com/NeoXiD/keepass.io/issues/8))
* add keyfile support
* use the same concept of [keepasshttp](https://github.com/pfn/keepasshttp) to support browser plugins like [passifox](https://github.com/pfn/passifox/)

## Technical details
As mentioned above I wanted to use the BrowserPass concept to read `.kdbx` files. Well, I tried to use its code and converted it to a little
node module. That wasn't much fun and the result wasn't beautiful (you may find it in the [commit history](https://github.com/gesellix/keepass-node/tree/2a4f6c5c344db6b2b105688098e9c653748461dc)),
so I searched for an existing node module and found a working one named [keepass.io](https://github.com/NeoXiD/keepass.io).

The frontend uses [AngularJS](http://angularjs.org/) as application framework, [Angular Treeview](https://github.com/eu81273/angular.treeview)
for the keepass user navigation, [ZeroClipboard](https://github.com/zeroclipboard/zeroclipboard) for convenient "copy password" feature
known from [GitHub](https://github.com/) and the omnipresent [Twitter Bootstrap](http://getbootstrap.com/).

## Contributing and Contact
[Issues](https://github.com/gesellix/keepass-node/issues) and [pull requests](https://github.com/gesellix/keepass-node/pulls) can be submitted via GitHub.
You may contact me via Twitter: [@gesellix](https://twitter.com/gesellix).

## License
See [Apache 2 License](LICENSE).
