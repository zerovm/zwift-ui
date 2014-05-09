/*
 * SwiftV1 API:
 * http://docs.openstack.org/api/openstack-object-storage/1.0/content/
 */
var SwiftV1 = {};
var ZeroVmOnSwift = {};
var recursiveDelete; // recursive delete, rename, move, etc.
var liteauth = {};

(function () {
	'use strict';


	var __continers = [];/*[{"count": 7, "bytes": 184, "name": "aaa"},
		{"count": 5, "bytes": 27, "name": "bbb"},
		{"count": 0, "bytes": 0, "name": "ccc"},
		{"count": 3, "bytes": 72520264, "name": "python"}];*/

	var __files = {};/*{
		'aaa': [{"hash": "023b1ecfa6968b02809421e7a1602f36", "last_modified": "2014-03-17T13:47:29.506000", "bytes": 27, "name": "aaa", "content_type": "text/plain"},
			{"subdir": "ddd/"},
			{"subdir": "ee/"},
			{"subdir": "ggg/"},
			{"hash": "d41d8cd98f00b204e9800998ecf8427e", "last_modified": "2014-03-17T13:47:42.092540", "bytes": 0, "name": "mklmldsa", "content_type": "text/plain"}],
		'bbb': [],
		'ccc': [],
		'python': []
	};*/

	var __metadata = {
		'aaa': {
			'aaa': 'bbb'
		},
		'bbb': {},
		'ccc': {},
		'python': {}
	};

	//var __contentType = {};

	var __fileContent = {

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
		args.ok();
		//args.error(e.target.status, e.target.statusText);
	};

	SwiftV1.setStorageUrl = function (url) {
		xStorageUrl = url;
	};

	SwiftV1.getStorageUrl = function () {
		return xStorageUrl;
	};

	SwiftV1.getAccount = function () {
		return account;
	};

	SwiftV1.Account = {};

	SwiftV1.Account.head = function (args) {
		args.success({
			'aaa': 'aaa'
		}, 0, 0);
		//args.error(e.target.status, e.target.statusText);
	};

	SwiftV1.Account.get = function (args) {
		args.success(__continers);
		//args.error(e.target.status, e.target.statusText);
	};

	SwiftV1.Account.post = function (args) {
		//args.updated();
		args.error(404, 'Not Found');
	};

	SwiftV1.Container = {};

	SwiftV1.Container.head = function (args) {
		var metadata = __metadata[args.containerName];
		var objectCount = 0;
		var bytesUsed = 0;
		args.success(metadata, objectCount, bytesUsed);
		//args.error(111, 'Test Ajax Error');
	};

	SwiftV1.Container.get = function (args) {
		args.success(__files[args.containerName] || []);
		//args.error(111, 'Test Ajax Error');
	};

	SwiftV1.Container.post = function (args) {
		__metadata[args.containerName] = args.metadata;
		args.updated();
		//args.error(111, 'Test Ajax Error');
	};

	SwiftV1.Container.put = function (args) {
		if (args.hasOwnProperty('metadata')) {
			__metadata[args.containerName] = args.metadata;
		}

		if (containerExists(args.containerName)) {
			args.alreadyExists();
		} else {
			__continers.push({"count": 0, "bytes": 0, "name": args.containerName});
			__files[args.containerName] = [];
			__metadata[args.containerName] = {};
			args.created();
		}

		//args.error(111, 'Test Ajax Error');

		function containerExists(containerName) {
			var exist = false;
			for (var i = 0; i < __continers.length; i++) {
				if (__continers[i]['name'] == containerName) {
					exist = true;
					break;
				}
			}
			return exist;
		}
	};

	SwiftV1.Container.delete = function (args) {
		deleteContainer(args.containerName);
		delete __files[args.containerName];
		delete __metadata[args.containerName];
		args.deleted();
		//args.error(111, 'Test Ajax Error');
		function deleteContainer(containerName) {
			var index;
			for (var i = 0; i < __continers.length; i++) {
				if (__continers[i].name == containerName) {
					index = i;
					break;
				}
			}
			if (index > -1) {
				__continers.splice(index, 1);
			}
		}
	};

	SwiftV1.File = {};

	SwiftV1.File.head = function (args) {
		var metadata = __metadata[args.path];
		var contentType = getContentType(args.path);
		var contentLength = 0;
		var lastModified = 'test';
		args.success(metadata, contentType, contentLength, lastModified);
		//args.error(111, 'Test Ajax Error');
	};

	SwiftV1.File.get = function (args) {
		args.success(__fileContent[args.path], __metadata[args.path]);
		//args.error(111, 'Test Ajax Error');
	};

	SwiftV1.File.post = function (args) {
		__metadata[args.path] = args.metadata;
		setContentType(args.path, args.contentType);
		args.updated();
		//args.error(111, 'Test Ajax Error');
	};

	SwiftV1.File.put = function (args) {
		__fileContent[args.path] = args.data;
		__metadata[args.path] = args.metadata || {};
		//__contentType[args.path] = args.contentType;

		var pathObj = FileManager.Path(args.path);
		var fileName = pathObj.name();
		var fileDir = __files[pathObj.up()];
		if (checkFileExist(fileDir, fileName)) {
		} else {
			fileDir.push({
				"hash": "d41d8cd98f00b204e9800998ecf8427e",
				"last_modified": "2014-03-17T13:47:42.092540",
				"bytes": 0,
				"name": fileName,
				"content_type": args.contentType
			});
		}
		args.created();
		//args.error(111, 'Test Ajax Error');

		function checkFileExist(filesDir, fileName) {
			var fileObj = null;
			for (var i = 0; i < filesDir.length; i++) {
				if (filesDir[i].name == fileName) {
					fileObj = filesDir[i];
					break;
				}
			}
			return fileObj;
		}
	};

	function setContentType(path, contentType) {
		var pathObj = new FileManager.Path(path);
		var fileName = pathObj.name();
		var filesDir = __files[pathObj.up()];
		for (var i = 0; i < filesDir.length; i++) {
			if (filesDir[i].name == fileName) {
				filesDir[i]['content_type'] = contentType;
				break;
			}
		}
	}

	function getContentType(path) {
		var pathObj = new FileManager.Path(path);
		var fileName = pathObj.name();
		var filesDir = __files[pathObj.up()];
		var contentType = '';
		for (var i = 0; i < filesDir.length; i++) {
			if (filesDir[i].name == fileName) {
				contentType = filesDir[i]['content_type'];
				break;
			}
		}
		return contentType;
	}



	SwiftV1.File.delete = function (args) {
		deleteFile(args.path);
		delete __metadata[args.path];
		delete __fileContent[args.path];
		args.deleted();
		//args.error(111, 'Test Ajax Error');

		function deleteFile(path) {
			var pathObj = FileManager.Path(args.path);
			var dirFiles = __files[pathObj.up()];
			var fileName = pathObj.name();
			var index;
			for (var i = 0; i < dirFiles.length; i++) {
				if (dirFiles[i].name == fileName) {
					index = i;
					break;
				}
			}
			if (index > -1) {
				dirFiles.splice(index, 1);
			}
		}
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
		args.success('Hello, World!');
		/*
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
		xhr.send(args.data);*/

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

	SwiftV1.delete = function (args) {
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

	recursiveDelete = function (args) {
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		SwiftV1.delete({
			account: accountId,
			path: args.path,
			deleted: function () {
				args.deleted();
			},
			error: function (status, statusText) {
				args.error(status, statusText);
			},
			notExist: function () {}
		});
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

	liteauth.getLoginInfo = function () {
		return 'id_example_123456:example@example.com';
	};

	liteauth.getProfile = function (args) {
		args.success('{"auth": "plaintext:blah blah blah"}');
	};
})();