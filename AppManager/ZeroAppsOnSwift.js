var ZeroAppsOnSwift = {};

ZeroAppsOnSwift.createAppLocations = function () {

};

ZeroAppsOnSwift.getAppLocations = function (args) {
	SwiftV1.getFile({
		path: '.gui/app-locations',
		success: function (fileData) {
			var appLocations = JSON.parse(fileData);
			args.success(appLocations);
		},
		notExist: function () {
			ZeroAppsOnSwift.createAppLocations();
		},
		error: function (message) {
			args.error(message);
		}
	});
};

ZeroAppsOnSwift.openApp = function (args) {
	window.location = xStorageUrl + account + '/.gui/' + args.appLocation + '/' + args.defaultPage + location.search;
};

ZeroAppsOnSwift.getAppIconUrl = function (args) {
	return xStorageUrl + account + '/.gui/' + args.appLocation + '/' + args.appIcon;
};

ZeroAppsOnSwift.createAppDir = function (args) {
	var path = '.gui/'+ args.appAuthor +'/'+ args.appName +'/'+ args.appVersion + '/';
	SwiftV1.createDirectory({
		path: path,
		created: args.created,
		error: args.error
	});
};

ZeroAppsOnSwift.addAppLocation = function (args) {
	ZeroAppsOnSwift.getAppLocations({
		success: function (appLocations) {
			if (appLocations.indexOf(args.appLocation) != -1) {
				return;
			}
			appLocations.push(args.appLocation);
			SwiftV1.createFile({
				path: '.gui/app-locations',
				contentType: 'application/json',
				data: JSON.stringify(appLocations),
				created: function () {

				},
				error: function () {

				}
			});
		},
		error: function (message) {
			console.log(message);
		}
	});
};

ZeroAppsOnSwift.removeAppLocation = function (args) {
	ZeroAppsOnSwift.getAppLocations({
		success: function (appLocations) {
			var index = appLocations.indexOf(args.appLocation);
			if (index == -1) {
				return;
			}
			appLocations.splice(index, 1);
			SwiftV1.createFile({
				path: '.gui/app-locations',
				contentType: 'application/json',
				data: JSON.stringify(appLocations),
				created: function () {

				},
				error: function () {

				}
			});
		},
		error: function (message) {
			console.log(message);
		}
	});
};

ZeroAppsOnSwift.checkAppExist = function (args) {

	var xhr = new XMLHttpRequest();
	var url = xStorageUrl + account + '/.gui/' + args.appLocation;

	xhr.open('HEAD', url);

	xhr.addEventListener('load', function (e) {
		var status = e.target.status;

		if (status == 401) {
			unauthorized();
		}
		if (status == 404) {
			args.notExist();
			return;
		}
		if (status >= 200 && status <= 299) {
			args.exist();
		}
		args.error();
	});

	xhr.send();
};

ZeroAppsOnSwift.uploadAppFile = function (args) {
	var xhr = new XMLHttpRequest();
	var url = xStorageUrl + account + '/.gui/' + args.filePath;
	xhr.open('PUT', url);
	xhr.setRequestHeader('Content-Type', args.contentType);
	xhr.addEventListener('load', args.callback);
	xhr.send(args.fileData);
};

ZeroAppsOnSwift.getManifest = function (args) {
	var xhr = new XMLHttpRequest();
	var manifestUrl = xStorageUrl + account + '/.gui/' + args.appPath + '/manifest.json';
	xhr.open('GET', manifestUrl);
	xhr.addEventListener('load', function (e) {
		if (e.target.status == 404) {
			args.callback(null);
			return;
		}
		var manifest = JSON.parse(e.currentTarget.response);
		args.callback(manifest);
	});
	xhr.send();
};

ZeroAppsOnSwift.removeApp = function (appPath, callback, progress) {
	ZeroAppsOnSwift.removeAppLocation({
		appLocation: appPath
	});
	SwiftAdvancedFunctionality.deleteAll({
		path: '.gui/' + appPath + '/',
		success: callback,
		error: function () {
			//TODO: error treatment.
		},
		progress: progress,
		notExist: callback
	});
};