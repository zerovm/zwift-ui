/*
* SwiftV1 API:
* http://docs.openstack.org/api/openstack-object-storage/1.0/content/
*/
var SwiftV1 = {};
var ZeroVmOnSwift = {};
var SharedContainersOnSwift = {};
var SwiftAdvancedFunctionality = {}; // recursive delete, rename, move, etc.
var ZeroAppsOnSwift = {};
var ZLitestackDotCom = {};
var ClusterAuth = {};

(function () {
	'use strict';

	var xStorageUrl = null;
	var xAuthToken = null;
	var account = null;
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

	function headersToMetadata(headers, prefix) {
		var metadata = {};
		for (var header in headers) {
			if (header.indexOf(prefix) === 0) {
				metadata[header.substr(prefix.length)] = headers[header];
			}
		}
		return metadata;
	}

	function setHeadersMetadata(xhr, metadata, prefix) {
		for (var metadataKey in metadata) {
			xhr.setRequestHeader(prefix + metadataKey, metadata[metadataKey]);
		}
	}

	function setHeadersRemoveMetadata(xhr, removeMetadataArr, prefixRemove) {
		for (var i = 0; i < removeMetadataArr.length; i++) {
			xhr.setRequestHeader(prefixRemove + removeMetadataArr[i], 'x');
		}
	}

	SwiftV1.setAuthData = function (args) {
		if (args.xStorageUrl.lastIndexOf('/') == args.xStorageUrl.length - 1) {
			xStorageUrl = args.xStorageUrl;
		} else {
			xStorageUrl = args.xStorageUrl + '/';
		}
		account = args.account;
		unauthorized = args.unauthorized;
		if (args.hasOwnProperty('xAuthToken')) {
			xAuthToken = args.xAuthToken;
		}
	};

	SwiftV1.Account = {};

	SwiftV1.Account.head = function (args) {
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		var url = xStorageUrl + accountId;
		var xhr = new XMLHttpRequest();
		xhr.open('HEAD', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				var headers = parseResponseHeaders(e.target.getAllResponseHeaders());
				var metadata = headersToMetadata(headers, METADATA_PREFIX.ACCOUNT);
				var containersCount = e.target.getResponseHeader('X-Account-Container-Count');
				var bytesUsed = e.target.getResponseHeader('X-Account-Bytes-Used');
				args.success(metadata, containersCount, bytesUsed);
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.Account.get = function (args) {
		var xhr = new XMLHttpRequest();
		var queryUrlObj = {};
		if (args.hasOwnProperty('limit')) {
			queryUrlObj.limit = args.limit;
		}
		if (args.hasOwnProperty('marker')) {
			queryUrlObj.marker = args.marker;
		}
		if (args.hasOwnProperty('end_marker')) {
			queryUrlObj.end_marker = args.end_marker;
		}
		if (args.hasOwnProperty('format')) {
			queryUrlObj.format = args.format;
		}
		var queryUrlArr = [];
		for (var p in queryUrlObj) {
			queryUrlArr.push(encodeURIComponent(p) + '=' + encodeURIComponent(queryUrlObj[p]));
		}
		var url;
		if (queryUrlArr.length) {
			var queryUrl = '?' + queryUrlArr.join('&');
			url = xStorageUrl + account + queryUrl;
		} else {
			url = xStorageUrl + account;
		}
		xhr.open('GET', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				args.success(e.target.responseText);
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();

		return xhr;
	};

	SwiftV1.Account.post = function (args) {
		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + account;
		xhr.open('POST', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		if (args.hasOwnProperty('metadata')) {
			setHeadersMetadata(xhr, args.metadata, METADATA_PREFIX.ACCOUNT);
		}
		if (args.hasOwnProperty('removeMetadata')) {
			setHeadersRemoveMetadata(xhr, args.removeMetadata, METADATA_REMOVE_PREFIX.ACCOUNT);
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				args.updated();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SwiftV1.Container = {};

	SwiftV1.Container.head = function (args) {
		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + account + '/' + args.containerName;
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
	};

	SwiftV1.Container.get = function (args) {
		var xhr = new XMLHttpRequest();
		var queryUrlObj = {};
		if (args.hasOwnProperty('limit')) {
			queryUrlObj.limit = args.limit;
		}
		if (args.hasOwnProperty('marker')) {
			queryUrlObj.marker = args.marker;
		}
		if (args.hasOwnProperty('end_marker')) {
			queryUrlObj.end_marker = args.end_marker;
		}
		if (args.hasOwnProperty('format')) {
			queryUrlObj.format = args.format;
		}
		if (args.hasOwnProperty('prefix')) {
			queryUrlObj.prefix = args.prefix;
		}
		if (args.hasOwnProperty('delimiter')) {
			queryUrlObj.delimiter = args.delimiter;
		}
		if (args.hasOwnProperty('path')) {
			queryUrlObj.path = args.path;
		}
		var queryUrlArr = [];
		for (var p in queryUrlObj) {
			queryUrlArr.push(encodeURIComponent(p) + '=' + encodeURIComponent(queryUrlObj[p]));
		}
		var url;
		var accountId = args.hasOwnProperty('account') ? args.account : account;
		if (queryUrlArr.length) {
			var queryUrl = '?' + queryUrlArr.join('&');
			url = xStorageUrl + accountId + '/' + args.containerName + queryUrl;
		} else {
			url = xStorageUrl + accountId + '/' + args.containerName;
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
				args.success(e.target.responseText);
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
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
		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + account + '/' + args.containerName;
		xhr.open('PUT', url);
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		if (xAuthToken !== null) {
			xhr.setRequestHeader('X-Auth-Token', xAuthToken);
		}
		if (args.hasOwnProperty('metadata')) {
			for (var metadataKey in args.metadata) {
				var header = 'X-Container-Meta-' + metadataKey;
				var value = args.metadata[metadataKey];
				xhr.setRequestHeader(header, value);
			}
		}
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 201) {
				args.created();
			} else if (e.target.status == 202) {
				args.alreadyExisted();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
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
		var url = xStorageUrl + account + '/' + args.path;
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
		var url = xStorageUrl + 'open/' + account + '/' + args.path;
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

	SharedContainersOnSwift.updateRights = function (args) {
		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + account + '/' + args.path;
		xhr.open('POST', url);
		xhr.setRequestHeader('X-Container-Read', args.readRights);
		xhr.setRequestHeader('X-Container-Write', args.writeRights);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				args.updated();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SharedContainersOnSwift.getRights = function (args) {
		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + account + '/' + args.path;
		xhr.open('HEAD', url);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				var readRights = xhr.getResponseHeader('X-Container-Read');
				var writeRights = xhr.getResponseHeader('X-Container-Write');
				args.success(readRights, writeRights);
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SharedContainersOnSwift.addSharedContainer = function (args) {
		var xhr = new XMLHttpRequest();
		var tempStorageUrlArr = xStorageUrl.split('/');
		tempStorageUrlArr.pop();
		tempStorageUrlArr.pop();
		var url = tempStorageUrlArr.join('/') + args.account + '/' + args.container;
		xhr.open('GET', url);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 200) {
				args.added();
			} else if (e.target.status == 403) {
				args.notAuthorized();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SharedContainersOnSwift.removeSharedContainer = function (args) {
		var xhr = new XMLHttpRequest();
		var tempStorageUrlArr = xStorageUrl.split('/');
		tempStorageUrlArr.pop();
		tempStorageUrlArr.pop();
		var url = tempStorageUrlArr.join('/') + '/drop-share/' + args.account + '/' + args.container;
		xhr.open('GET', url);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status == 200) {
				args.removed();
			} else if (e.target.status == 403) {
				unauthorized();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SharedContainersOnSwift.getFromXhr = function (xhr) {
		var allContainers = [];

		var i = 0;
		var headerKey = 'X-Account-Meta-Shared' + i;
		var headerVal = xhr.getResponseHeader(headerKey);

		while (headerVal) {
			var obj = JSON.parse(headerVal);
			var c = Object.keys(obj);
			allContainers = allContainers.concat(c);

			i++;
			headerKey = 'X-Account-Meta-Shared' + i;
			headerVal = xhr.getResponseHeader(headerKey);
		}

		return allContainers;
	};

	SharedContainersOnSwift.getContainerSize = function (args) {
		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + args.account + '/' + args.container;
		xhr.open('HEAD', url);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				var bytes = xhr.getResponseHeader('X-Container-Bytes-Used');
				var count = xhr.getResponseHeader('X-Container-Object-Count');
				args.success(bytes, count);
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
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
			SwiftV1.deleteFile({
				path: args.path,
				deleted: args.deleted,
				error: args.error,
				notExist: args.notExist
			});
		}
	};

	SwiftAdvancedFunctionality.deleteAll = function (args) {
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

		function success(responseText) {
			files = JSON.parse(responseText);
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

	ZLitestackDotCom.init = function (callback) {
		var accountId = getUrlParameter('account');

		if (!accountId) {
			loginRedirect();
			return;
		}

		if (accountId == 'logout') {
			document.body.innerHTML = 'Logging out...';
			window.location = 'logoutZLitestackDotCom.html';
			return false;
		}

		function loginRedirect() {
			var urlPrefix = 'https://z.litestack.com/login/google/?state=';
			var stateEncoded = encodeURIComponent(location.pathname);
			window.location = urlPrefix + stateEncoded;
		}
		SwiftV1.setAuthData({
			account: accountId,
			xStorageUrl: 'https://z.litestack.com/v1',
			unauthorized: function () {
				var urlPrefix = 'https://z.litestack.com/login/google/?state=';
				var stateEncoded = encodeURIComponent(location.pathname);
				window.location = urlPrefix + stateEncoded;
			}
		});

		if (arguments.length) {
			callback();
		}

		function getUrlParameter(name) {
			name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
			var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
				results = regex.exec(location.search);
			return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
		}
	};

	ZLitestackDotCom.getAccount = function () {
		return account;
	};

	ZLitestackDotCom.getStorageUrl = function () {
		return xStorageUrl;
	};

	ZLitestackDotCom.userData = null;

	ZLitestackDotCom.getEmail = function (args) {

		if (ZLitestackDotCom.userData !== null) {
			var email = ZLitestackDotCom.userData['email'];
			args.success(email);
			return;
		}

		var xhr = new XMLHttpRequest();
		var url = xStorageUrl + account;
		xhr.open('HEAD', url);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				unauthorized();
			} else if (e.target.status >= 200 && e.target.status <= 299) {
				setUserData(e.target);
				var email = ZLitestackDotCom.userData['email'];
				args.success(email);
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();

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
			ZLitestackDotCom.userData = userDataBuilder;
		}

		function clone(obj) {
			var copiedObj = {};

			for (var key in obj) {
				copiedObj[key] = obj[key];
			}

			return copiedObj;
		}
	};

	ZLitestackDotCom.signOut = function () {
		window.location = 'https://z.litestack.com/login/google/?state=/js&code=logout';
	};

	ClusterAuth.init = function(callback) {
		var html = '<div style="position: fixed; width: 100%; height: 100%;left: 0;right: 0;top: 0;bottom: 0;">'
			+ '<div class="cluster-url">'
			+ '<label>Storage URL:</label>'
			+ '<br>'
			+ '<input autocomplete="off" class="x-storage-url">'
			+ '<br>'
			+ '<label>Account:</label>'
			+ '<br>'
			+ '<input autocomplete="off" class="account">'
			+ '<br>'
			+ '<button class="login">Login</button>'
			+ '</div></div>';
		document.body.insertAdjacentHTML('beforeend', html);

		document.querySelector('.cluster-auth .login').addEventListener('click', function (e) {
			document.querySelector('.cluster-auth').parentNode.setAttribute('hidden', 'hidden');
			SwiftV1.setAuthData({
				account: document.querySelector('.cluster-auth .account'),
				xStorageUrl: document.querySelector('.cluster-auth .storage-url'),
				unauthorized: function () {
					ClusterAuth.signOut();
				}
			});

			callback();
		});
	};

	ClusterAuth.getAccount = function () {
		return account;
	};

	ClusterAuth.getStorageUrl = function () {
		return xStorageUrl;
	};

	ClusterAuth.signOut = function () {
		document.querySelector('.cluster-auth .account').value = '';
		document.querySelector('.cluster-auth .storage-url').value = '';
		document.querySelector('.cluster-auth').parentNode.removeAttribute('hidden');
	};

})();