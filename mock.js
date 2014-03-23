/*
 * SwiftV1 API:
 * http://docs.openstack.org/api/openstack-object-storage/1.0/content/
 */
var SwiftV1 = {};
var ZeroVmOnSwift = {};
var SwiftAdvancedFunctionality = {}; // recursive delete, rename, move, etc.
var SwiftAuth = {};
var Auth = {};

(function () {
	'use strict';


	var containers = [{"count": 7, "bytes": 184, "name": "aaa"},
		{"count": 5, "bytes": 27, "name": "bbb"},
		{"count": 0, "bytes": 0, "name": "ccc"},
		{"count": 3, "bytes": 72520264, "name": "python"}];

	var files = {
		'aaa': [{"hash": "023b1ecfa6968b02809421e7a1602f36", "last_modified": "2014-03-17T13:47:29.506000", "bytes": 27, "name": "aaa", "content_type": "text/plain"},
			{"subdir": "ddd/"},
			{"subdir": "ee/"},
			{"subdir": "ggg/"},
			{"hash": "d41d8cd98f00b204e9800998ecf8427e", "last_modified": "2014-03-17T13:47:42.092540", "bytes": 0, "name": "mklmldsa", "content_type": "text/plain"}]
	};


	var xStorageUrl = null;
	var xAuthToken = null;
	var account = '';
	var unauthorized = function () {};

	var METADATA_PREFIX = {
		ACCOUNT: 'X-Account-Meta-',
		CONTAINER: 'X-Container-Meta-',
		OBJECT: 'X-Object-Meta-'
	};

	var METADATA_REMOVE_PREFIX = {
		ACCOUNT: 'X-Remove-Account-Meta-',
		CONTAINER: 'X-Remove-Container-Meta-',
		OBJECT: 'X-Remove-Object-Meta-'
	};

	SwiftV1.retrieveTokens = function (args) {
		xAuthToken = 'test-token';
		xStorageUrl = 'test-storage-url';
		account = 'test account';
		SwiftV1.xAuthToken = xAuthToken;
		args.ok();
		//args.error(e.target.status, e.target.statusText);
	};

	SwiftV1.setStorageUrl = function (url) {
		xStorageUrl = url;
	};

	SwiftV1.getStorageUrl = function () {
		return xStorageUrl;
	};

	SwiftV1.Account = {};

	SwiftV1.Account.head = function (args) {
		args.success({
			'aaa': 'aaa'
		}, 0, 0);
		//args.error(e.target.status, e.target.statusText);
	};

	SwiftV1.Account.get = function (args) {
		args.success(containers);
		//args.error(e.target.status, e.target.statusText);
	};

	SwiftV1.Account.post = function (args) {
		//args.updated();
		args.error(404, 'Not Found');
	};

	SwiftV1.Container = {};

	SwiftV1.Container.head = function (args) {
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + accountId + '/' + args.containerName;
		xhr.open('HEAD', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 404) {
				args.notExist();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				var headers = parseResponseHeaders(e.target.getAllResponseHeaders());
				var metadata = headersToMetadata(headers, METADATA_PREFIX.CONTAINER);
				var objectCount = e.target.getResponseHeader('X-Container-Object-Count');
				var bytesUsed = e.target.getResponseHeader('X-Container-Bytes-Used');
				args.success(metadata, objectCount, bytesUsed);
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
		return xhr;
	};

	SwiftV1.Container.get = function (args) {
		args.success(files[args.containerName] || []);
		args.error(e.target.status, e.target.statusText);
	};

	SwiftV1.Container.post = function (args) {
		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + account + '/' + args.containerName;
		xhr.open('POST', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}

		if (args.hasOwnProperty('metadata')) {
			setHeadersMetadata(xhr, args.metadata, METADATA_PREFIX.CONTAINER);
		}
		if (args.hasOwnProperty('removeMetadata')) {
			setHeadersRemoveMetadata(xhr, args.removeMetadata, METADATA_REMOVE_PREFIX.CONTAINER);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 404) {
				args.notExist();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				args.updated();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.Container.put = function (args) {
		/*
		if (args.hasOwnProperty('metadata')) {
			for (var metadataKey in args.metadata) {
				var header = 'X-Container-Meta-' + metadataKey;
				var value = args.metadata[metadataKey];
				xhr.setRequestHeader(header, value);
			}
		}*/
		if (containerExists(args.containerName)) {
			args.alreadyExisted();
		} else {
			containers.push({"count": 0, "bytes": 0, "name": args.containerName});
			args.created();
		}

		//args.error(111, 'Test Ajax Error');

		function containerExists(containerName) {
			var exist = false;
			for (var i = 0; i < containers.length; i++) {
				if (containers[i]['name'] == containerName) {
					exist = true;
					break;
				}
			}
			return exist;
		}
	};

	SwiftV1.Container.delete = function (args) {
		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + account + '/' + args.containerName;
		xhr.open('DELETE', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 404) {
				args.notExist();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				args.deleted();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.File = {};

	SwiftV1.File.head = function (args) {
		var xhr = new XMLHttpRequest();
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var url = xStorageUrl + accountId + '/' + args.path;
		xhr.open('HEAD', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 404) {
				args.notExist();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				var headers = parseResponseHeaders(e.target.getAllResponseHeaders());
				var metadata = headersToMetadata(headers, METADATA_PREFIX.OBJECT);
				var contentType = e.target.getResponseHeader('Content-Type');
				var contentLength = e.target.getResponseHeader('Content-Length');
				var lastModified = e.target.getResponseHeader('Last-Modified');
				args.success(metadata, contentType, contentLength, lastModified);
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.File.get = function (args) {
		var xhr = new XMLHttpRequest();
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var url = xStorageUrl + accountId + '/' + args.path;
		if (args.hasOwnProperty('ifMatch')) {
			xhr.setRequestHeader('If-Match', args.ifMatch);
		}
		if (args.hasOwnProperty('ifNoneMatch')) {
			xhr.setRequestHeader('If-None-Match', args.ifNoneMatch);
		}
		if (args.hasOwnProperty('ifModifiedSince')) {
			xhr.setRequestHeader('If-Modified-Since', args.ifModifiedSince);
		}
		if (args.hasOwnProperty('ifUnmodifiedSince')) {
			xhr.setRequestHeader('If-Unmodified-Since', args.ifUnmodifiedSince);
		}
		if (args.hasOwnProperty('range')) {
			xhr.setRequestHeader('Range', args.range);
		}
		xhr.open('GET', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 404) {
				args.notExist();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				args.success(e.target.responseText, e.target.getResponseHeader('Content-Type'));
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		if (args.hasOwnProperty('progress')) {
			xhr.addEventListener('progress', function (e) {
				args.progress(e.loaded);
			});
		}
		xhr.send();
		return xhr;
	};

	SwiftV1.File.post = function (args) {
		var xhr = new XMLHttpRequest();
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var url = xStorageUrl + accountId + '/' + args.path;
		xhr.open('POST', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		if (args.hasOwnProperty('metadata')) {
			setHeadersMetadata(xhr, args.metadata, METADATA_PREFIX.OBJECT);
		}
		if (args.hasOwnProperty('removeMetadata')) {
			setHeadersRemoveMetadata(xhr, args.removeMetadata, METADATA_REMOVE_PREFIX.OBJECT);
		}
		xhr.setRequestHeader('Content-Type', args.contentType);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 404) {
				args.notExist();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				args.updated();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.File.put = function (args) {
		var xhr = new XMLHttpRequest();
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var url = xStorageUrl + accountId + '/' + args.path;
		xhr.open('PUT', url, true);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		if (args.hasOwnProperty('metadata')) {
			setHeadersMetadata(xhr, args.metadata, METADATA_PREFIX.OBJECT);
		}
		if (args.hasOwnProperty('removeMetadata')) {
			setHeadersRemoveMetadata(xhr, args.removeMetadata, METADATA_REMOVE_PREFIX.OBJECT);
		}
		xhr.setRequestHeader('Content-Type', args.contentType);
		if (args.hasOwnProperty('progress')) {
			xhr.upload.addEventListener('progress', function (e) {
				if (e.lengthComputable) {
					var percentLoaded = Math.round((e.loaded / e.total) * 100);
					args.progress(percentLoaded, e.loaded, e.total);
				}
			});
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 201) {
				args.created();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send(args.data);

		return xhr;
	};

	SwiftV1.File.delete = function (args) {
		var xhr = new XMLHttpRequest();
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var url = xStorageUrl + accountId + '/' + args.path;
		xhr.open('DELETE', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 404) {
				args.notExist();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				args.deleted();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.File.copy = function (args) {
		var xhr = new XMLHttpRequest();
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var url = xStorageUrl + accountId + '/' + args.path;
		xhr.open('PUT', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.setRequestHeader('X-Copy-From', args.copyFrom);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 201) {
				args.copied();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.getAccountMetadata = SwiftV1.Account.head;
	SwiftV1.updateAccountMetadata = SwiftV1.Account.post;
	SwiftV1.listContainers = SwiftV1.Account.get;

	SwiftV1.getContainerMetadata = SwiftV1.Container.head;
	SwiftV1.checkContainerExist = SwiftV1.Container.head;
	SwiftV1.listFiles = SwiftV1.Container.get;
	SwiftV1.updateContainerMetadata = SwiftV1.Container.post;
	SwiftV1.createContainer = SwiftV1.Container.put;
	SwiftV1.deleteContainer = SwiftV1.Container.delete;

	SwiftV1.getFileMetadata = SwiftV1.File.head;
	SwiftV1.checkFileExist = SwiftV1.File.head;
	SwiftV1.checkDirectoryExist = SwiftV1.File.head;
	SwiftV1.getFile = SwiftV1.File.get;
	SwiftV1.updateFileMetadata = SwiftV1.File.post;
	SwiftV1.createFile = SwiftV1.File.put;
	SwiftV1.deleteFile = SwiftV1.File.delete;
	SwiftV1.copyFile = SwiftV1.File.copy;

	SwiftV1.createDirectory = function (args) {
		SwiftV1.File.put({
			path: args.path,
			data: '',
			contentType: 'application/directory',
			created: args.created,
			error: args.error
		});
	};

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

	ZeroVmOnSwift.open = function (args) {
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var zwiftUrlPrefix = xStorageUrl.split('/').slice(0, -2).join('/') + '/';
		var url = zwiftUrlPrefix + 'open/' + accountId + '/' + args.path;
		window.location = url;
		/*
		 var xhr = new XMLHttpRequest();
		 xhr.open('GET', url);
		 xhr.addEventListener('load', function (e) {
		 args.callback(e.target.responseText);
		 });
		 xhr.send();*/
	};

	ZeroVmOnSwift.execute = function (args) {
		var xhr = new XMLHttpRequest();
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var url = xStorageUrl + account;
		xhr.open('POST', url, true);
		xhr.responseType = 'blob';
		xhr.setRequestHeader('X-Zerovm-Execute', '1.0');
		xhr.setRequestHeader('Content-Type', args.contentType);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 200) {
				// result
				var result = e.target.response;
				// report
				var headersString = e.target.getAllResponseHeaders();
				var headers = parseResponseHeaders(headersString);
				var report = makeReportObj(headers);

				var reader = new FileReader();
				reader.addEventListener('load', function (e) {
					args.success(e.target.result, report);
				});
				reader.addEventListener('error', function (message) {
					args.error(-1, '', 'JavaScript error occurred while reading blob response: ' + message)
				});
				reader.readAsText(e.target.response);
			} else {
				var status = e.target.status;
				var statusText = e.target.statusText;
				var reader = new FileReader();
				reader.addEventListener('load', function (e) {
					args.error(status, statusText, e.target.result);
				});
				reader.addEventListener('error', function (message) {
					args.error(status, statusText, 'JavaScript error occurred while reading blob response: ' + message)
				});
				reader.readAsText(e.target.response);
			}
		});
		xhr.send(args.data);

		function makeReportObj(headers) {

			var report = {};
			report.execution = {};

			for (var key in headers) {

				if (key == 'X-Nexe-Cdr-Line') {
					report.billing = billingReport(headers[key]);

				} else if (key.indexOf('X-Nexe') == 0) {
					var executionReportKey = key.substr('X-Nexe-'.length);
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

					report.nodes[j].readsFromDisk = nodeCdrResult[2];
					report.nodes[j].bytesReadFromDisk = nodeCdrResult[3];

					report.nodes[j].writesToDisk = nodeCdrResult[4];
					report.nodes[j].bytesWrittenToDisk = nodeCdrResult[5];
					report.nodes[j].readsFromNetwork = nodeCdrResult[6];

					report.nodes[j].bytesReadFromNetwork = nodeCdrResult[7];
					report.nodes[j].writesToNetwork = nodeCdrResult[8];
					report.nodes[j].bytesWrittenToNetwork = nodeCdrResult[9];
					j++;
				}
			}

			return report;
		}
	};

	SwiftAdvancedFunctionality.delete = function (args) {
		if (args.path.split('/').length == 1) {
			SwiftV1.deleteContainer({
				containerName: args.path,
				deleted: args.deleted,
				error: args.error,
				notExist: args.notExist
			});
		} else {
			var accountId = args.hasOwnProperty('account') ? args.account : account;
			SwiftV1.deleteFile({
				account: accountId,
				path: args.path,
				deleted: args.deleted,
				error: args.error,
				notExist: args.notExist
			});
		}
	};

	SwiftAdvancedFunctionality.deleteAll = function (args) {
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var levels = [];
		var files;
		var deleteCount = 0;
		var newArgs = {};
		var pathArr = args.path.split('/');
		newArgs.format = 'json';
		newArgs.notExist = args.hasOwnProperty('notExist') ? args.notExist : args.deleted;
		newArgs.error = args.error;
		newArgs.success = success;
		newArgs.containerName = pathArr[0];
		if (pathArr.length > 1) {
			newArgs.prefix = pathArr.splice(1).join('/');
		}
		SwiftV1.listFiles(newArgs);

		function success(response) {
			files = response;
			for (var i = 0; i < files.length; i++) {
				var level = files[i].name.split('/').length;
				if (typeof levels[level] === "undefined") {
					levels[level] = [];
				}
				levels[level].push(newArgs.containerName + '/' + files[i].name);
			}

			deleteLevel(levels.length);
		}

		function deleteLevel(level) {
			if (level == 0) {
				SwiftAdvancedFunctionality.delete({
					account: accountId,
					path: args.path,
					deleted: function () {
						args.progress(files.length, deleteCount, 'deleted');
						args.deleted();
					},
					error: function (status, statusText) {
						args.progress(files.length, deleteCount, 'error occurred');
						args.error(status, statusText);
					},
					notExist: function () {
						args.progress(files.length, deleteCount, 'not existed');
						newArgs.notExist();
					}
				});
				return;
			}
			if (typeof levels[level] === "undefined") {
				deleteLevel(level -  1);
				return;
			}

			var levelAmountLast = levels[level].length;

			for (var  i = 0; i < levels[level].length; i++) {
				SwiftAdvancedFunctionality.delete({
					account: accountId,
					path: levels[level][i],
					deleted: function () {
						levelAmountLast--;
						args.progress(files.length, deleteCount, 'deleted');
						deleteCount++;
						if (levelAmountLast == 0) {
							deleteLevel(level -  1);
						}
					},
					error: function () {
						levelAmountLast--;
						args.progress(files.length, deleteCount, 'error occurred');
						deleteCount++;
						if (levelAmountLast == 0) {
							deleteLevel(level -  1);
						}
					},
					notExist: function () {
						levelAmountLast--;
						args.progress(files.length, deleteCount, 'not existed');
						deleteCount++;
						if (levelAmountLast == 0) {
							deleteLevel(level -  1);
						}
					}
				});
			}
		}
	};

	SwiftAdvancedFunctionality.checkPathHasFiles = function (args) {
		var newArgs = {};
		newArgs.containerName = args.containerName;
		if (args.hasOwnProperty('path') && args.path) {
			newArgs.path = args.path;
		}
		newArgs.limit = 2;
		newArgs.notExist = args.notExist;
		newArgs.format = 'json';
		newArgs.success = function (responseText) {

			var max = args.hasOwnProperty('path') && args.path ? 1 : 0;

			if (JSON.parse(responseText).length <= max) {
				args.hasNotFiles();
				return;
			}

			args.hasFiles();
		};
		newArgs.error = args.error;
		SwiftV1.listFiles(newArgs);
	};

	SwiftAdvancedFunctionality.move = function () {

	};

	SwiftAdvancedFunctionality.rename = SwiftAdvancedFunctionality.move;

	SwiftAuth.init = function(callback) {

		var authenticationEl = document.getElementById('Authentication');

		var auth_url = authenticationEl.getElementsByClassName('v1-auth-url')[0];
		if (auth_url.value === '') {
			auth_url.value = document.location.protocol + '//' +
				document.location.host + '/auth/v1.0';
		}

		authenticationEl.onsubmit = function (e) {
			e.preventDefault();

			var v1AuthUrl = authenticationEl.getElementsByClassName('v1-auth-url')[0].value;
			var tenant = authenticationEl.getElementsByClassName('tenant')[0].value;
			var xAuthUser = authenticationEl.getElementsByClassName('x-auth-user')[0].value;
			var xAuthKey = authenticationEl.getElementsByClassName('x-auth-key')[0].value;

			SwiftV1.retrieveTokens({
				v1AuthUrl: v1AuthUrl,
				tenant: tenant,
				xAuthUser: xAuthUser,
				xAuthKey: xAuthKey,
				error: XHR_ERROR,
				ok: XHR_OK
			});
		};


		if (liteauth.getLoginInfo()) {
			XHR_OK();

			/*
			 liteauth.getProfile(function (responses) {
			 var xAuthUser =
			 liteauth.getLoginInfo().split(':')[0];
			 var tenant =
			 liteauth.getLoginInfo().split(':').splice(1).join(':');
			 var xAuthKey =
			 JSON.parse(response)['auth'].split('plaintext:')[1];
			 var v1AuthUrl =
			 decodeURIComponent(getCookie('storage'));
			 SwiftV1.retrieveTokens({
			 v1AuthUrl: v1AuthUrl,
			 tenant: tenant,
			 xAuthUser: xAuthUser,
			 xAuthKey: xAuthKey,
			 error: XHR_ERROR,
			 ok: XHR_OK
			 });
			 });
			 */
		}

		authenticationEl.getElementsByClassName('login-with-google')[0].onclick = function () {
			liteauth.login(liteauth.AUTH_TYPES.GOOGLE);
		};

		function XHR_OK() {
			document.getElementById('Authentication').setAttribute('hidden', 'hidden');
			document.getElementsByClassName('sign-out-button')[0].onclick = function () {
				// TODO:
				window.location.reload(true);
			};

			//document.getElementById('AccountId').textContent = SwiftV1.account;

			callback();

			//location.hash = SwiftV1.account + "/";
		}

		function XHR_ERROR() {
			alert(arguments[0] + ' ' + arguments[1]);
		}

		function getCookie(cookieName) {
			var name = cookieName + '=';
			var ca = document.cookie.split(';');
			for (var i=0; i < ca.length; i++) {
				var c = ca[i].trim();
				if (c.indexOf(name) == 0) {
					return c.substring(name.length, c.length);
				}
			}
			return '';
		}
	};

	SwiftAuth.getAccount = function () {
		return account;
	};

	SwiftAuth.getStorageUrl = function () {
		return xStorageUrl;
	};

	SwiftAuth.signOut = function () {
	};

	Auth.useSwiftAuth = function () {
		Auth.init = SwiftAuth.init;
		Auth.getAccount = SwiftAuth.getAccount;
		Auth.getStorageUrl = SwiftAuth.getStorageUrl;
		Auth.signOut = SwiftAuth.signOut;
	};


	function headersToMetadata(headers, prefix) {
		var metadata = {};
		for (var header in headers) {
			if (header.indexOf(prefix) === 0) {
				metadata[header.substr(prefix.length)] = headers[header];
			}
		}
		return metadata;
	}
})();