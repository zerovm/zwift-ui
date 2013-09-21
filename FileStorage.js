function FileStorage() {
	'use strict';

	var xStorageUrl = getUrlParameter('xStorageUrl');
	var accountId = getUrlParameter('account');
	var userData = null;

	if (!accountId) {
		loginRedirect();
	}

	this.getAccountId = function () {
		return accountId;
	};
	this.getStorageUrl = function () {
		return xStorageUrl;
	};

	function loginRedirect() {
		window.location = 'old.html';
	}

	function head(args) {

		var xhr = new XMLHttpRequest();
		var account = args.hasOwnProperty('account') ? args.account : accountId;
		var path = args.hasOwnProperty('path') ? args.path : '';
		var url = xStorageUrl + account + '/' + path;

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
		var url = xStorageUrl + account + '/' + args.path;
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
		var url = xStorageUrl + accountId + '/' + args.path;
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
		var url = xStorageUrl + account + path;
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

	this.checkContainerExist = function (args) {
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

	this.checkDirectoryExist = function (args) {
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

	this.checkFileExist = function (args) {
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

	this.getFileContentType = function (args) {
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

	this.updateFileContentType = function (args) {
		var postArgs = clone(args);
		postArgs.headers = {
			'Content-Type': args.contentType
		};
		postArgs.error = function (message) {
			args.error('Content-Type is not updated. ' + message);
		};
		post(postArgs);
	};

	this.createContainer = function (args) {
		var putArgs = clone(args);
		putArgs.success = args.created;
		putArgs.path = args.containerName;
		putArgs.error = function (message) {
			args.error('Container is not created. ' + message);
		};
		put(putArgs);
	};

	this.createDirectory = function (args) {
		var putArgs = clone(args);
		putArgs.success = args.created;
		putArgs.contentType = 'application/directory';
		putArgs.error = function (message) {
			args.error('Directory is not created. ' + message);
		};
		put(putArgs);
	};

	this.createFile = function (args) {
		var putArgs = clone(args);
		putArgs.success = args.created;
		putArgs.error = function (message) {
			args.error('File is not created. ' + message);
		};
		put(putArgs);
	};

	this.updateMetadata = function (args) {

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

	this.getMetadata = function (args) {

		var headArgs = clone(args);
		headArgs.success = function (xhr) {
			var headers = xhr.getAllResponseHeaders();
			var containersOrFile = args.path.indexOf('/') != -1 ? 'object' : 'container';
			var metadata = headersToMetadata(headers, containersOrFile);
			args.success(metadata);
		};
		head(headArgs);
	};

	this.updateRights = function (args) {

		var postArgs = clone(args);
		postArgs.headers = {
			'X-Container-Read': args.readRights,
			'X-Container-Write': args.writeRights
		};
		post(postArgs);
	};

	this.getRights = function (args) {
		var headArgs = clone(args);
		headArgs.success = function (xhr) {
			var read = xhr.getResponseHeader('X-Container-Read');
			var write = xhr.getResponseHeader('X-Container-Write');
			args.success(read, write);
		};
		head(headArgs);
	};

	this.checkDirectoryHasFiles = function (args) {

		var getArgs = clone(args);
		getArgs.path = args.containerName;
		getArgs.success = function (xhr) {
			if (JSON.parse(xhr.responseText).length <= 1) {
				args.hasNotFiles();
				return;
			}

			args.hasFiles();
		};
		get(getArgs);
	};

	this.listContainers = function (args) {
		var getArgs = clone(args);
		getArgs.success = function (xhr) {
			var containers = JSON.parse(xhr.responseText);
			//var sharedContainers = getSharedContainers(xhr);
			args.success(containers/*, sharedContainers*/);

            if (userData == null) {
                //setUserData(xhr);
            }
		};
		get(getArgs);
	};

	this.listFiles = function (args) {
		var getArgs = clone(args);
		getArgs.path = args.containerName;
		getArgs.success = function (xhr) {
			var files = JSON.parse(xhr.responseText);
			args.success(files);
		};
		get(getArgs);
	};

	this.getContainerSize = function(args) {

		var headArgs = clone(args);
		headArgs.path = args.containerName;
		headArgs.success = function (xhr) {
			var bytes = xhr.getResponseHeader('X-Container-Bytes-Used');
			var count = xhr.getResponseHeader('X-Container-Object-Count');
			args.success(bytes, count);
		};
		head(headArgs);
	};

	this.containersAfterMarker = function (args) {

		var getArgs = clone(args);
		getArgs.success = function (xhr) {
			var containers = JSON.parse(xhr.responseText);
			args.success(containers);
		};
		get(getArgs);
	};

	this.filesAfterMarker = function (args) {

		var getArgs = clone(args);
		getArgs.path = args.containerName;
		getArgs.success = function (xhr) {
			var files = JSON.parse(xhr.responseText);
			args.success(files);
		};
		get(getArgs);
	};

	this.getFile = function (args) {

		var getArgs = clone(args);
		getArgs.file = true;
		getArgs.success = function (xhr) {
			args.success(xhr.responseText, xhr);
		};
		get(getArgs);
	};

	this._delete = function (args) {

		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + accountId + '/' + args.path;
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

	this.copy = function (args) {

		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + accountId + '/' + args.copyTo + args.copiedFile;
		var xCopyFromHeaderKey = 'X-Copy-From';


		if (args.hasOwnProperty('copyFromAccount')) {
			xCopyFromHeaderKey = 'X-Copy-From-Account';
			url = xStorageUrl + args['copyFromAccount'] + '/' + args.copyTo + args.copiedFile;
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

	this.execute = function (args) {
		var xhr = new XMLHttpRequest();
		var account = args.hasOwnProperty('account') ? args['account'] : accountId;
		xhr.open('POST', xStorageUrl + account, true);
		xhr.responseType = 'blob';

		xhr.setRequestHeader('X-Zerovm-Execute', '1.0');
		xhr.setRequestHeader('Content-Type', args.dataType);


		xhr.onload = function(e) {
			var blob = this.response;
			args.success(blob, e.target);
		};

		xhr.send(args.dataToSend);
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

	this.apps = new Apps(this);

	function Apps(fileStorage) {

		this.getAppLocations = function (args) {
			fileStorage.getFile({
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

		this.openApp = function (args) {
			window.location = xStorageUrl + accountId + '/.gui/' + args.appLocation + '/' + args.defaultPage + location.search;
		};

		this.getAppIconUrl = function (args) {
			return xStorageUrl + accountId + '/.gui/' + args.appLocation + '/' + args.appIcon;
		};

		this.createAppDir = function (args) {

			var createDirArgs = clone(args);
			createDirArgs.path = '.gui/'+ args.appAuthor +'/'+ args.appName +'/'+ args.appVersion + '/';
			fileStorage.createDirectory(createDirArgs);
		};

		this.addAppLocation = function (args) {
			this.getAppLocations({
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

		this.removeAppLocation = function (args) {
			this.getAppLocations({
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

		this.checkAppExist = function (args) {

			var xhr = new XMLHttpRequest();
			var url = xStorageUrl + accountId + '/.gui/' + args.appLocation;

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

		this.uploadAppFile = function (args) {
			var xhr = new XMLHttpRequest();
			var url = xStorageUrl + accountId + '/.gui/' + args.filePath;
			xhr.open('PUT', url);
			xhr.addEventListener('load', args.callback);
			xhr.send(args.fileData);
		};

		this.getManifest = function (args) {
			var xhr = new XMLHttpRequest();
			var manifestUrl = xStorageUrl + accountId + '/.gui/' + args.appPath + '/manifest.json';
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

		function removeFile(container, filePath, callback) {
			var xhr = new XMLHttpRequest();
			var url = xStorageUrl + accountId + '/' + container +'/'+ filePath;
			xhr.open('Delete', url);
			xhr.addEventListener('load', callback);
			xhr.send();
		}

		function removeDir(container, dirPath, callback) {


			var xhr = new XMLHttpRequest();
			var url = xStorageUrl + accountId + '/' + container + '?delimiter=/&format=json&prefix=' + dirPath;
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
						xhr2.open('Delete', xStorageUrl + accountId + '/'+container  + '/'+ dirPath);
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

		this.removeApp = function (appPath, callback) {
			removeDir('.gui', appPath + '/', callback);
			this.removeAppLocation({
				appLocation: appPath
			});
		};
	}

}