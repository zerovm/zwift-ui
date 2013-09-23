var FileStorage = {};
var AppService = {};

(function () {
	'use strict';

	var X_STORAGE_URL_PREFIX = getUrlParameter('xStorageUrl');
	var SIGN_OUT_URL = 'index.html';
	var accountId = getUrlParameter('account');
	var userData = null;

	if (!accountId) {
		loginRedirect();
	}

	function loginRedirect() {
		var urlPrefix = 'index.html';
		var stateEncoded = encodeURIComponent(location.pathname);
		window.location = urlPrefix + stateEncoded;
	}

	FileStorage.signOut = function () {
		window.location = SIGN_OUT_URL;
	};

	FileStorage.getStorageUrl = function () {
		return X_STORAGE_URL_PREFIX;
	};

	function head(args) {

		var xhr = new XMLHttpRequest();
		var account = args.hasOwnProperty('account') ? args.account : accountId;
		var path = args.hasOwnProperty('path') ? args.path : '';
		var url = X_STORAGE_URL_PREFIX + account + '/' + path;

		xhr.open('HEAD', url);

		xhr.addEventListener('load', function (e) {
			var status = e.target.status;
			var statusText = e.target.statusText;

			if (status == 401) {
				loginRedirect();
			}
			if (status >= 200 && status <= 299) {
				args.success(e.target);
				return;
			}
			var errorMessage = 'Error: ' + statusText + ' (' + status + ').';
			args.error(errorMessage, status, statusText);
		});

		xhr.send();
	}

	function post(args) {

		var xhr = new XMLHttpRequest();
		var account = args.hasOwnProperty('account') ? args.account : accountId;
		var url = X_STORAGE_URL_PREFIX + account + '/' + args.path;
		xhr.open('POST', url);

		for (var key in args.headers) {
			xhr.setRequestHeader(key, args.headers[key]);
		}

		xhr.addEventListener('load', function (e) {
			var status = e.target.status;
			var statusText = e.target.statusText;

			if (status == 401) {
				loginRedirect();
			}
			if (status >= 200 && status <= 299) {
				args.updated();
				return;
			}
			var errorMessage = 'Error: ' + statusText + ' (' + status + ').';
			args.error(errorMessage);
		});

		xhr.send();
	}

	function put(args) {

		var xhr = new XMLHttpRequest();
		var url = X_STORAGE_URL_PREFIX + accountId + '/' + args.path;
		xhr.open('PUT', url);

		if (args.hasOwnProperty('contentType')) {
			xhr.setRequestHeader('Content-Type', args.contentType);
		}

		xhr.addEventListener('load', function (e) {
			var status = e.target.status;
			var statusText = e.target.statusText;

			if (status == 401) {
				loginRedirect();
			}
			if (status == 201 || status == 202) {
				args.created(true);
				return;
			}
			var errorMessage = 'Error: ' + statusText + ' (' + status + ').';
			args.error(errorMessage);
		});

		if (args.hasOwnProperty('data')) {
			xhr.send(args.data);
			return;
		}
		xhr.send();
	}

	function get(args) {

		var xhr = new XMLHttpRequest();
		var account = args.hasOwnProperty('account') ? args.account : accountId;
		var path = args.hasOwnProperty('path') ? '/' + args.path : '';
		var marker = args.hasOwnProperty('marker') ? '&marker=' + args.marker : '';
		var prefix = args.hasOwnProperty('prefix') ? '&prefix=' + encodeURIComponent(args.prefix) : '';
		var delimiter = args.hasOwnProperty('delimiter') ? '&delimiter=' + args.delimiter : '';
		var file = args.hasOwnProperty('file') && args.file;
		var url = X_STORAGE_URL_PREFIX + account + path;
		if (!file) {
			url += '?format=json&limit=20' + marker + prefix + delimiter;
		}
		xhr.open('GET', url);

		xhr.addEventListener('load', function (e) {
			var status = e.target.status;
			var statusText = e.target.statusText;

			if (status == 401) {
				loginRedirect();
			}
			if (status >= 200 && status <=299) {
				args.success(e.target);
				return;
			}

			var errorMessage = 'Error: ' + statusText + ' (' + status + ').';
			args.error(errorMessage, status, statusText);
		});

		xhr.send();
	}

	FileStorage.getEmail = function (args) {

		if (userData !== null && args.hasOwnProperty('cache')) {
			var email = userData['email'];
			args.cache(email);
			return;
		}

		head({
			success: function (xhr) {
				setUserData(xhr);
				var email = userData['email'];
				args.success(email);
				return;
			},
			error: args.error
		});
	};

	FileStorage.getAccountId = function () {
		return accountId;
	};

	FileStorage.checkContainerExist = function (args) {
		var headArgs = clone(args);
		headArgs.path = args.containerName;
		headArgs.success = args.exist;
		headArgs.error = function (message, status, statusText) {
			if (status == 404) {
				args.notExist();
				return;
			}
			args.error(message);
		};
		head(headArgs);
	};

	FileStorage.checkDirectoryExist = function (args) {
		var headArgs = clone(args);
		headArgs.success = args.exist;
		headArgs.error = function (message, status, statusText) {
			if (status == 404) {
				args.notExist();
				return;
			}
			args.error(message);
		};
		head(headArgs);
	};

	FileStorage.checkFileExist = function (args) {
		var headArgs = clone(args);
		headArgs.success = args.exist;
		headArgs.error = function (message, status, statusText) {
			if (status == 404) {
				args.notExist();
				return;
			}
			args.error(message);
		};
		head(headArgs);
	};

	FileStorage.getFileContentType = function (args) {
		var headArgs = clone(args);
		headArgs.success = function (xhr) {
			var contentType = xhr.getResponseHeader('Content-Type');
			args.success(contentType);
		};
		headArgs.error = function (message) {
			args.error('Cannot load Content-Type. ' + message);
		};
		head(headArgs);
	};

	FileStorage.updateFileContentType = function (args) {
		var postArgs = clone(args);
		postArgs.headers = {
			'Content-Type': args.contentType
		};
		postArgs.error = function (message) {
			args.error('Content-Type is not updated. ' + message);
		};
		post(postArgs);
	};

	FileStorage.createContainer = function (args) {
		var putArgs = clone(args);
		putArgs.success = args.created;
		putArgs.path = args.containerName;
		putArgs.error = function (message) {
			args.error('Container is not created. ' + message);
		};
		put(putArgs);
	};

	FileStorage.createDirectory = function (args) {
		var putArgs = clone(args);
		putArgs.success = args.created;
		putArgs.contentType = 'application/directory';
		putArgs.error = function (message) {
			args.error('Directory is not created. ' + message);
		};
		put(putArgs);
	};

	FileStorage.createFile = function (args) {
		var putArgs = clone(args);
		putArgs.error = function (message) {
			args.error('File is not created. ' + message);
		};
		put(putArgs);
	};

	FileStorage.updateMetadata = function (args) {

		var headers = {};
		var containersOrFile = args.path.indexOf('/') != -1 ? 'Object' : 'Container';

		var metadataToAddKeys = Object.keys(args.metadataToAdd);
		for (var i = 0; i < metadataToAddKeys.length; i++) {
			var key = metadataToAddKeys[i];
			var val = args.metadataToAdd[key];
			headers['X-'+containersOrFile+'-Meta-' + key] = val;
		}

		for (var i = 0; i < args.metadataToRemove.length; i++) {
			var key = args.metadataToRemove[i];
			headers['X-Remove-'+containersOrFile+'-Meta-' + key] = 'x';
		}

		var postArgs = clone(args);
		postArgs.headers = headers;
		post(postArgs);
	};

	FileStorage.getMetadata = function (args) {

		var headArgs = clone(args);
		headArgs.success = function (xhr) {
			var headers = xhr.getAllResponseHeaders();
			var containersOrFile = args.path.indexOf('/') != -1 ? 'object' : 'container';
			var metadata = headersToMetadata(headers, containersOrFile);
			args.success(metadata);
		};
		head(headArgs);
	};

	FileStorage.updateRights = function (args) {

		var postArgs = clone(args);
		postArgs.headers = {
			'X-Container-Read': args.readRights,
			'X-Container-Write': args.writeRights
		};
		post(postArgs);
	};

	FileStorage.getRights = function (args) {
		var headArgs = clone(args);
		headArgs.success = function (xhr) {
			var read = xhr.getResponseHeader('X-Container-Read');
			var write = xhr.getResponseHeader('X-Container-Write');
			args.success(read, write);
		};
		head(headArgs);
	};

	FileStorage.checkDirectoryHasFiles = function (args) {

		var getArgs = clone(args);
		getArgs.path = args.containerName;
		getArgs.success = function (xhr) {

			var max = args.prefix ? 1 : 0;

			if (JSON.parse(xhr.responseText).length <= max) {
				args.hasNotFiles();
				return;
			}

			args.hasFiles();
		};
		get(getArgs);
	};

	FileStorage.listContainers = function (args) {
		var getArgs = clone(args);
		getArgs.success = function (xhr) {
			var containers = JSON.parse(xhr.responseText);
			args.success(containers);
		};
		get(getArgs);
	};

	FileStorage.listFiles = function (args) {
		var getArgs = clone(args);
		getArgs.path = args.containerName;
		getArgs.success = function (xhr) {
			var files = JSON.parse(xhr.responseText);
			args.success(files);
		};
		get(getArgs);
	};

	FileStorage.getContainerSize = function(args) {

		var headArgs = clone(args);
		headArgs.path = args.containerName;
		headArgs.success = function (xhr) {
			var bytes = xhr.getResponseHeader('X-Container-Bytes-Used');
			var count = xhr.getResponseHeader('X-Container-Object-Count');
			args.success(bytes, count);
		};
		head(headArgs);
	};

	FileStorage.containersAfterMarker = function (args) {

		var getArgs = clone(args);
		getArgs.success = function (xhr) {
			var containers = JSON.parse(xhr.responseText);
			args.success(containers);
		};
		get(getArgs);
	};

	FileStorage.filesAfterMarker = function (args) {

		var getArgs = clone(args);
		getArgs.path = args.containerName;
		getArgs.success = function (xhr) {
			var files = JSON.parse(xhr.responseText);
			args.success(files);
		};
		get(getArgs);
	};

	FileStorage.getFile = function (args) {

		var getArgs = clone(args);
		getArgs.file = true;
		getArgs.success = function (xhr) {
			args.success(xhr.responseText, xhr);
		};
		get(getArgs);
	};

	FileStorage._delete = function (args) {

		var xhr = new XMLHttpRequest();
		var url = X_STORAGE_URL_PREFIX + accountId + '/' + args.path;
		xhr.open('DELETE', url);

		xhr.addEventListener('load', function (e) {
			var status = e.target.status;
			var statusText = e.target.statusText;

			if (status == 401) {
				loginRedirect();
			}
			if (status >= 200 && status <= 299) {
				args.deleted();
				return;
			}
			var errorMessage = 'Error: ' + statusText + ' (' + status + ').';
			args.error(errorMessage);
		});

		xhr.send();
	};

	FileStorage.copy = function (args) {

		var xhr = new XMLHttpRequest();
		var url = X_STORAGE_URL_PREFIX + accountId + '/' + args.copyTo + args.copiedFile;
		var xCopyFromHeaderKey = 'X-Copy-From';


		if (args.hasOwnProperty('copyFromAccount')) {
			xCopyFromHeaderKey = 'X-Copy-From-Account';
			url = X_STORAGE_URL_PREFIX + args['copyFromAccount'] + '/' + args.copyTo + args.copiedFile;
		}

		xhr.open('PUT', url);
		xhr.setRequestHeader(xCopyFromHeaderKey, args.copyFrom);

		xhr.addEventListener('load', function (e) {
			var status = e.target.status;
			var statusText = e.target.statusText;

			if (status == 401) {
				loginRedirect();
			}
			if (status == 201 || status == 202) {
				args.copied(true);
				return;
			}
			var errorMessage = 'File is not created.' +
				' Error: ' + statusText + ' (' + status + ').';
			args.error(errorMessage);
		});

		xhr.send();
	};

	FileStorage.execute = function (args) {

		var xhr = new XMLHttpRequest();
		var account = args.hasOwnProperty('account') ? args.account : accountId;
		var url = X_STORAGE_URL_PREFIX + account;

		xhr.open('POST', url, true);
		xhr.responseType = 'blob';
		xhr.setRequestHeader('X-Zerovm-Execute', '1.0');
		xhr.setRequestHeader('Content-Type', args.dataType);
		xhr.addEventListener('load', function (e) {
			// result
			var result = e.target.response;
			// report
			var headersString = e.target.getAllResponseHeaders();
			var headers = parseResponseHeaders(headersString);
			var report = makeReportObj(headers);

			args.success(result, report);
		});
		xhr.send(args.dataToSend);

		function makeReportObj(headers) {

			var report = {};
			report.execution = {};

			for (var key in headers) {

				if (key.toLowerCase() == 'x-nexe-cdr-line') {
					report.billing = billingReport(headers[key]);

				} else if (key.toLowerCase().startsWith('x-nexe')) {
					var executionReportKey = key.substr('x-nexe-'.length);
					report.execution[executionReportKey.toLowerCase()] = headers[key];
				}
			}

			return report;
		}

		function billingReport(xNexeCdrLine) {

			var report = {};

			report.totalServerTime = xNexeCdrLine.split(',')[0].trim();
			var nodesBillingInfo = xNexeCdrLine.split(',').splice(1);
			report.nodes = [];

			var j = 0;
			for (var i = 0; i < nodesBillingInfo.length; i++) {
				if (i % 2 == 0) {
					report.nodes[j] = {};
					report.nodes[j].nodeServerTime = nodesBillingInfo[i];
				} else {
					var nodeCdrResult = nodesBillingInfo[i].trim().split(' ');

					report.nodes[j].systemTime = nodeCdrResult[0];
					report.nodes[j].userTime = nodeCdrResult[1];
					report.nodes[j].memoryUsed = nodeCdrResult[2];

					report.nodes[j].SwapUsed = nodeCdrResult[3];
					report.nodes[j].readsFromDisk = nodeCdrResult[4];
					report.nodes[j].bytesReadFromDisk = nodeCdrResult[5];

					report.nodes[j].writesToDisk = nodeCdrResult[6];
					report.nodes[j].bytesWrittenToDisk = nodeCdrResult[7];
					report.nodes[j].readsFromNetwork = nodeCdrResult[8];

					report.nodes[j].bytesReadFromNetwork = nodeCdrResult[9];
					report.nodes[j].writesToNetwork = nodeCdrResult[10];
					report.nodes[j].bytesWrittenToNetwork = nodeCdrResult[11];
					j++;
				}
			}

			return report;
		}
	};

	FileStorage.open = function (args) {
		var url = X_STORAGE_URL_PREFIX + 'open/' + accountId + '/' + args.path;
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url);
		xhr.addEventListener('load', function (e) {
			console.log(e);
			console.log(e.target);
			console.log(e.target.responseText);
			console.log(this);
		});
		xhr.send();
	};

	FileStorage.uploadFile = function (args) {
		var xhr = new XMLHttpRequest();

		xhr.open('PUT', X_STORAGE_URL_PREFIX + accountId + '/' + args.path, true);

		xhr.addEventListener('load', function () {
			args.uploaded();
		});

		xhr.upload.onprogress = function (e) {
			if (e.lengthComputable) {
				var percentLoaded = Math.round((e.loaded / e.total) * 100);
				args.progress(percentLoaded);
			}
		};

		xhr.send(args.file);

		return xhr;
	};



	function setUserData(xhr) {
		var userDataBuilder = {};
		var headerPrefix = 'X-Account-Meta-Userdata';

		var i = 0;
		var headerKey = headerPrefix + i;
		var headerValue = xhr.getResponseHeader(headerKey);

		while (headerValue) {
			var obj = JSON.parse(headerValue);
			userDataBuilder = clone(obj);
			for (var key in obj) {
				userDataBuilder[key] = obj[key];
			}

			i++;
			headerKey = headerPrefix + i;
			headerValue = xhr.getResponseHeader(headerKey);
		}
		userData = userDataBuilder;
	}

	function getUrlParameter(name) {
		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(location.search);
		return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}

	function headersToMetadata(headersStr, containerOrFile) {
		var metadata = {};
		var headersObj = parseResponseHeaders(headersStr);
		var headersKeys = Object.keys(headersObj);

		for (var i = 0; i < headersKeys.length; i++) {
			var headerKey = headersKeys[i];
			var headerVal = headersObj[headerKey];

			var prefix = 'x-'+containerOrFile+'-meta-';
			var index = headerKey.toLowerCase().indexOf(prefix);
			if (index === 0) {
				var key = headerKey.substring(prefix.length);
				metadata[key] = headerVal;
			}
		}

		return metadata;
	}

	function parseResponseHeaders(headerStr) {
		var headers = {};
		if (!headerStr) {
			return headers;
		}
		var headerPairs = headerStr.split('\u000d\u000a');
		for (var i = 0; i < headerPairs.length; i++) {
			var headerPair = headerPairs[i];
			var index = headerPair.indexOf('\u003a\u0020');
			if (index > 0) {
				var key = headerPair.substring(0, index);
				var val = headerPair.substring(index + 2);
				headers[key] = val;
			}
		}
		return headers;
	}

	function clone(obj) {
		var copiedObj = {};

		for (var key in obj) {
			copiedObj[key] = obj[key];
		}

		return copiedObj;
	}

	function removeFile(container, filePath, callback) {
		var xhr = new XMLHttpRequest();
		var url = X_STORAGE_URL_PREFIX + accountId + '/' + container +'/'+ filePath;
		xhr.open('Delete', url);
		xhr.addEventListener('load', callback);
		xhr.send();
	}

	function removeDir(container, dirPath, callback) {

		var xhr = new XMLHttpRequest();
		var url = X_STORAGE_URL_PREFIX + accountId + '/' + container + '?delimiter=/&format=json';
		if (dirPath) {
			url += '&prefix=' + dirPath;
		}
		xhr.open('GET', url);

		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				loginRedirect();
			}
			if (e.target.status == 404) {
				return;
			}
			var appFiles = JSON.parse(e.target.responseText);
			var xhrDeleteArr = [];

			rm(0);
			function rm(i) {
				if (i == appFiles.length) {
					var i = xhrDeleteArr.length;
					var xhr2 = new XMLHttpRequest();
					xhr2.open('Delete', X_STORAGE_URL_PREFIX + accountId + '/'+container  + '/'+ dirPath);
					xhr2.addEventListener('load', callback);
					xhr2.send();
					return;
				}
				if (appFiles[i]['subdir']) {
					removeDir(container, appFiles[i]['subdir'], function () {
						rm(i + 1);
					});
				}
				if (appFiles[i]['name']) {
					removeFile(container, appFiles[i]['name'], function () {
						rm(i + 1);
					});
				}
			}
		});

		xhr.send();
	}

	FileStorage.recursiveDelete = removeDir;

	function parseResponseHeaders(headerStr) {
		var headers = {};
		if (!headerStr) {
			return headers;
		}
		var headerPairs = headerStr.split('\u000d\u000a');
		for (var i = 0; i < headerPairs.length; i++) {
			var headerPair = headerPairs[i];
			// Can't use split() here because it does the wrong thing
			// if the header value has the string ": " in it.
			var index = headerPair.indexOf('\u003a\u0020');
			if (index > 0) {
				var key = headerPair.substring(0, index);
				var val = headerPair.substring(index + 2);
				headers[key] = val;
			}
		}
		return headers;
	}

	FileStorage.Apps = {};

	FileStorage.Apps.getAppLocations = function (args) {
		FileStorage.getFile({
			path: '.gui/app-locations',
			success: function (fileData) {
				var appLocations = JSON.parse(fileData);
				args.success(appLocations);
			},
			error: function (message) {
				args.error(message);
			}
		});
	};

	FileStorage.Apps.openApp = function (args) {
		window.location = X_STORAGE_URL_PREFIX + accountId + '/.gui/' + args.appLocation + '/' + args.defaultPage + location.search;
	};

	FileStorage.Apps.getAppIconUrl = function (args) {
		return X_STORAGE_URL_PREFIX + accountId + '/.gui/' + args.appLocation + '/' + args.appIcon;
	};

	FileStorage.Apps.createAppDir = function (args) {

		var createDirArgs = clone(args);
		createDirArgs.path = '.gui/'+ args.appAuthor +'/'+ args.appName +'/'+ args.appVersion + '/';
		FileStorage.createDirectory(createDirArgs);
	};

	FileStorage.Apps.addAppLocation = function (args) {
		FileStorage.Apps.getAppLocations({
			success: function (appLocations) {
				if (appLocations.indexOf(args.appLocation) != -1) {
					return;
				}
				appLocations.push(args.appLocation);
				put({
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

	FileStorage.Apps.removeAppLocation = function (args) {
		FileStorage.Apps.getAppLocations({
			success: function (appLocations) {
				var index = appLocations.indexOf(args.appLocation);
				if (index != -1) {
					return;
				}
				appLocations.splice(index, 1);
				put({
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

	FileStorage.Apps.checkAppExist = function (args) {

		var xhr = new XMLHttpRequest();
		var url = X_STORAGE_URL_PREFIX + accountId + '/.gui/' + args.appLocation;

		xhr.open('HEAD', url);

		xhr.addEventListener('load', function (e) {
			var status = e.target.status;

			if (status == 401) {
				loginRedirect();
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

	FileStorage.Apps.uploadAppFile = function (args) {
		var xhr = new XMLHttpRequest();
		var url = X_STORAGE_URL_PREFIX + accountId + '/.gui/' + args.filePath;
                var ext = args.filePath.match(/\.[^\.]+$/);
		var ctype = "application/octet-stream";
		if (ext && ext.length > 0) {
			switch(ext[0]) {
				case ".css":
				ctype = "text/css";
				break;
				case ".html":
				case ".htm":
				ctype = "text/html";
				break;
				case ".js":
				ctype = "application/javascript";
				break;
			}
		}
		xhr.open('PUT', url);
		xhr.setRequestHeader("Content-Type", ctype);
		xhr.addEventListener('load', args.callback);
		xhr.send(args.fileData);
	};

	FileStorage.Apps.getManifest = function (args) {
		var xhr = new XMLHttpRequest();
		var manifestUrl = X_STORAGE_URL_PREFIX + accountId + '/.gui/' + args.appPath + '/manifest.json';
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

	FileStorage.Apps.removeApp = function (appPath, callback) {
		removeDir('.gui', appPath + '/', callback);
		FileStorage.Apps.removeAppLocation({
			appLocation: appPath
		});
	};

	AppService.getAccount = function () {
		return accountId;
	};

	AppService.getPath = function () {
		var currentPath = location.pathname;
		var pathWithoutV1 = currentPath.substr(currentPath.indexOf('/v1/') + '/v1/'.length);
		return pathWithoutV1.split('/').splice(0, 5).join('/') + '/';
	};

	AppService.createFileUrl = function (filePath) {
		var hrefPrefix = location.href.split('/v1/')[0] + '/v1/';
		return hrefPrefix + filePath;
	};
})();




