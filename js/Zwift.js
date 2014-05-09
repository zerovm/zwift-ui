var ZeroVmOnSwift = {};
var SharedContainersOnSwift = {};

(function () {

	ZeroVmOnSwift.open = function (args) {
		var accountId = args.hasOwnProperty('account') ? args.account : SwiftV1.getAccount();
		var zwiftUrlPrefix = SwiftV1.getStorageUrl().split('/').slice(0, -2).join('/') + '/';
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
		var accountId = args.hasOwnProperty('account') ? args.account : SwiftV1.getAccount();
		var url = SwiftV1.getStorageUrl() + SwiftV1.getAccount();
		xhr.open('POST', url, true);
		xhr.responseType = 'blob';
		xhr.setRequestHeader('X-Zerovm-Execute', '1.0');
		xhr.setRequestHeader('Content-Type', args.contentType);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				SwiftV1.unauthorized();
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


	SharedContainersOnSwift.addSharedContainer = function (args) {
		var xhr = new XMLHttpRequest();
		var sharedUrlPrefix = SwiftV1.getStorageUrl().split('/').slice(0, -2).join('/');
		var url = sharedUrlPrefix + '/load-share/' + args.account + '/' + args.container;
		xhr.open('GET', url);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				SwiftV1.unauthorized();
			} else if (e.target.status == 200) {
				args.added();
			} else if (e.target.status == 403 && args.hasOwnProperty('notAuthorized')) {
				args.notAuthorized();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SharedContainersOnSwift.removeSharedContainer = function (args) {
		var xhr = new XMLHttpRequest();
		var sharedUrlPrefix = SwiftV1.getStorageUrl().split('/').slice(0, -2).join('/');
		var url = sharedUrlPrefix + '/drop-share/' + args.account + '/' + args.container;
		xhr.open('GET', url);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				SwiftV1.unauthorized();
			} else if (e.target.status == 200) {
				args.removed();
			} else if (e.target.status == 403) {
				SwiftV1.unauthorized();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
	};

	SharedContainersOnSwift.getFromXhr = function (xhr) {
		var allContainers = {};

		var i = 0;
		var headerKey = 'X-Account-Meta-Shared' + i;
		var headerVal = xhr.getResponseHeader(headerKey);

		while (headerVal) {
			var obj = JSON.parse(headerVal);
			for (var attrname in obj) {
				allContainers[attrname] = obj[attrname];
			}

			i++;
			headerKey = 'X-Account-Meta-Shared' + i;
			headerVal = xhr.getResponseHeader(headerKey);
		}

		return allContainers;
	};

	SharedContainersOnSwift.getContainerSize = function (args) {
		var xhr = new XMLHttpRequest();
		var url = SwiftV1.getStorageUrl() + args.account + '/' + args.container;
		xhr.open('HEAD', url);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				SwiftV1.unauthorized();
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

	SharedContainersOnSwift.copy = function (args) {
		var xhr = new XMLHttpRequest();
		var accountId = args.hasOwnProperty('account') ? args.account : SwiftV1.getAccount();
		var url = SwiftV1.getStorageUrl() + accountId + '/' + args.path;
		xhr.open('PUT', url);
		if (SwiftV1.getAuthToken() !== null) {
			xhr.setRequestHeader('X-Auth-Token', SwiftV1.getAuthToken());
		}
		xhr.setRequestHeader('X-Copy-From-Account', args.copyFrom);
		xhr.addEventListener('load', function (e) {
			if (e.target.status == 401) {
				SwiftV1.unauthorized();
			} else if (e.target.status == 201) {
				args.copied();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		});
		xhr.send();
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
})();