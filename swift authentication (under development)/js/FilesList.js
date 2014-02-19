var FilesList = (function (SwiftV1, Path, CurrentPath) {
	'use strict';

	var LIMIT = 20;

	var load = function (callback) {
		var requestArgs = {};
		requestArgs.containerName = CurrentPath().container();
		requestArgs.format = 'json';
		requestArgs.limit = LIMIT;
		requestArgs.delimiter = '/';
		if (CurrentPath().isDirectory()) {
			requestArgs.prefix = CurrentPath().prefix();
		}
		requestArgs.success = function (filesArr) {
			UI_OK(filesArr, callback);
		};
		requestArgs.error = function (status, statusText) {
			UI_ERROR(status, statusText, callback);
		};
		SwiftV1.listFiles(requestArgs);
	};

	var loadMore = function () {
		var el = document.getElementById('LoadMoreFiles');

		if (!el) {
			document.body.classList.remove('loading-content');
			return;
		}

		document.body.classList.add('loading-content');
		el.textContent = 'Loading...';
		el.setAttribute('disabled', 'disabled');

		var xhrArgs = {};
		xhrArgs.containerName = CurrentPath().container();
		xhrArgs.delimiter = '/';
		xhrArgs.limit = LIMIT;
		xhrArgs.format = 'json';
		xhrArgs.marker = document.querySelector('.item:last-child').dataset.path;
		if (CurrentPath().isDirectory()) {
			xhrArgs.marker = CurrentPath().prefix() + xhrArgs.marker;
			xhrArgs.prefix = CurrentPath().prefix();
		}
		xhrArgs.success = function (filesArr) {
			var files = filesArr.slice();
			fillList(files);
			document.body.classList.remove('loading-content');

			// check load more:
			var el = document.getElementById('LoadMoreFiles');
			el.textContent = 'Load more';
			if (files.length < LIMIT) {
				el.classList.add('hidden');
			} else {
				//el.classList.remove('hidden');
				el.removeAttribute('disabled');
			}
		};
		xhrArgs.error = loadMoreError;
		SwiftV1.listFiles(xhrArgs);
	};

	function UI_OK(filesArr, callback) {
		// Clone filesArr parameter before modifying it:
		var files = filesArr.slice();
		removeFirstFileInSomeCases(files);
		// UI:
		reset_UI_before();
		if (files.length == 0) {
			noFiles();
		} else {
			document.getElementById('List').firstElementChild.innerHTML = '';
			fillList(files);
			checkLoadMore(filesArr);
		}
		reset_UI_after(callback);
	}

	function UI_ERROR(status, statusText, callback) {
		reset_UI_before();
		document.getElementById('AjaxErrorMessage').textContent = statusText;
		document.getElementById('AjaxStatusCode').textContent = status;
		document.getElementById('AjaxError').classList.remove('hidden');
		reset_UI_after(callback);
	}

	function fillList(files) {
		var transitionDiv = document.getElementById('List').firstElementChild;
		for (var i = 0; i < files.length; i++) {
			transitionDiv.appendChild(createItem(files[i]));
		}
	}

	function createItem(file) {
		var newItemEl = document.getElementById('List').getElementsByClassName('template-file')[0].cloneNode(true);
		newItemEl.classList.remove('template');
		newItemEl.classList.remove('template-file');

		newItemEl.setAttribute('title', _title());
		newItemEl.setAttribute('data-path', _dataPath());
		newItemEl.setAttribute('data-type', _dataType());
		newItemEl.setAttribute('data-full-path', _dataFullPath());
		newItemEl.setAttribute('data-content-type', _dataContentType());
		newItemEl.getElementsByClassName('name')[0].textContent = _name();
		newItemEl.getElementsByClassName('size')[0].textContent = _size();
		newItemEl.getElementsByClassName('modified')[0].textContent = _modified();

		return newItemEl;

		function _title() {
			var title;
			var lastSlashRegex = /\/$/;
			if (file.hasOwnProperty('subdir')) {
				title = file.subdir.replace(lastSlashRegex, '');
			} else {
				title = file.name;
			}
			title = new Path(title).name();
			return title;
		}

		function _dataPath() {
			var dataPath;
			if (file.hasOwnProperty('subdir')) {
				dataPath = new Path(file.subdir).name();
			} else {
				dataPath = new Path(file.name).name();
			}
			return dataPath;
		}

		function _dataFullPath() {
			var dataFullPath;
			dataFullPath = CurrentPath().withoutAccount() + _title(file);
			return dataFullPath;
		}

		function _dataType() {
			var dataType;
			if (file.hasOwnProperty('subdir')) {
				dataType = 'directory';
			} else {
				dataType = 'file';
			}
			return dataType;
		}

		function _dataContentType() {
			var dataContentType;
			if (file.content_type && file.content_type !== 'undefined') {
				dataContentType = file.content_type;
			} else {
				dataContentType = 'file-type';
			}
			return dataContentType;
		}

		function _name() {
			return makeShortName(_title(file));
		}

		function _size() {
			return isNaN(file.bytes) ? '' : makePrettyBytes(file.bytes);
		}

		function _modified() {
			return file.last_modified ? makePrettyDate(file.last_modified) : '';
		}
	}

	function checkLoadMore(filesArr) {
		var listEl = document.getElementById('List');

		if (filesArr.length === LIMIT) {
			//document.getElementById('LoadMoreFiles').classList.remove('hidden');

			if (Math.abs(listEl.scrollTop - (listEl.scrollHeight - listEl.clientHeight)) < 4) {
				FilesList.loadMore();
			}
		} else {
			document.getElementById('LoadMoreFiles').classList.add('hidden');
		}
	}

	function reset_UI_before() {
		document.getElementById('NoContainers').classList.add('hidden');
		document.getElementById('NoFiles').classList.add('hidden');
	}

	function reset_UI_after(callback) {
		document.getElementById('UpButton').removeAttribute('disabled');
		NavigationBar.setContent(CurrentPath().withoutAccount(), true);
		callback();
	}

	function removeFirstFileInSomeCases(files) {
		if (checkFirstFile(files)) {
			files.shift();
		}

		function checkFirstFile(files) {
			var prefix = CurrentPath().prefix(),
				file, nameInFiles;
			if (files.length > 0 && prefix) {
				file = files[0];
				nameInFiles = file.hasOwnProperty('subdir') ? file.subdir : file.name;
				if (prefix == nameInFiles) {
					return true;
				}
			}
			return false;
		}
	}

	function noFiles() {
		document.getElementById('NoFiles').classList.remove('hidden');
	}

	function loadMoreError(status, statusText) {
		document.body.classList.remove('loading-content');
		document.getElementById('AjaxErrorMessage').textContent = statusText;
		document.getElementById('AjaxStatusCode').textContent = status;
		document.getElementById('AjaxError').classList.remove('hidden');
		document.getElementById('LoadMoreFiles').textContent = 'Load More';
	}

	function makeShortName(name, len) {
		var ext, filename;
		len = len || 30;
		if(name.length <= len){
			return name;
		}
		if(name.indexOf(".") !== -1){
			ext = name.substring(name.lastIndexOf("."), name.length);
			filename = name.replace(ext, "");
			filename = filename.substr(0, len) + "&raquo;" + ext;
			return filename;
		}
		return name.substr(0, len) + "&raquo;";
	}

	function makePrettyDate(time) {
		var alternative = new Date(time),
			pretty,
			diff = (new Date().getTime() - alternative.getTime()) / 1000,
			day_diff = Math.floor(diff / 86400);
		pretty = day_diff == 0 && (
			diff < 60 && "just now" ||
				diff < 120 && "1 minute ago" ||
				diff < 3600 && Math.floor(diff / 60) + " minutes ago" ||
				diff < 7200 && "1 hour ago" ||
				diff < 86400 && Math.floor(diff / 3600) + " hours ago") ||
			day_diff == 1 && "Yesterday" ||
			day_diff < 7 && day_diff + " days ago" ||
			day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago";
		return pretty || alternative.toDateString();
	}

	function makePrettyBytes(bytes) {
		var gradeMap = ["B", "KB", "MB", "GB"]
		var counter = 1,
			grade = 1024,
			checksum = Math.pow(grade, counter),
			result;
		while(bytes > checksum){
			counter++;
			checksum = Math.pow(grade, counter);
		}
		result = (bytes / Math.pow(grade, counter - 1));
		result = result % 1 ? result.toFixed(2) : result;
		return result + gradeMap[counter - 1];
	}

	document.getElementById('LoadMoreFiles').onclick = loadMore;

	return {
		load: load,
		loadMore: loadMore
	};

})(SwiftV1, Path, CurrentPath);
