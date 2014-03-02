var List = (function (SwiftV1, UpButton, NavigationBar, CurrentPath) {
	'use strict';

	var LIMIT = 20;
	var listEl = document.getElementById('List');

	function containers() {
		SwiftV1.listContainers({
			format: 'json',
			limit: LIMIT,
			success: UI_OK,
			error: UI_ERROR
		});

		function UI_OK(containers) {
			clear();
			UpButton.disable();
			NavigationBar.root();

			if (containers.length == 0) {
				noContainers();
			} else {
				fill(containers, createContainerEl);
				checkLoadMore(containers);
			}
		}

		function UI_ERROR(status, statusText) {
			clear();
			UpButton.disable();
			NavigationBar.root();

			showAjaxError(status, statusText);
		}

		function noContainers() {
			document.getElementById('NoContainers').classList.remove('hidden');
		}

		function checkLoadMore(containers) {
			if (containers.length === LIMIT) {
				//document.getElementById('LoadMoreContainers').classList.remove('hidden');
			} else {
				document.getElementById('LoadMoreContainers').classList.add('hidden');
			}
		}
	}

	function files() {
		var requestArgs = {};
		requestArgs.containerName = CurrentPath().container();
		requestArgs.format = 'json';
		requestArgs.limit = LIMIT;
		requestArgs.delimiter = '/';
		if (CurrentPath().isDirectory()) {
			requestArgs.prefix = CurrentPath().prefix();
		}
		requestArgs.success = UI_OK;
		requestArgs.error = UI_ERROR;
		SwiftV1.listFiles(requestArgs);

		function UI_OK(filesArr) {
			// Clone filesArr parameter before modifying it:
			var files = filesArr.slice();
			removeFirstFileInSomeCases(files);

			// UI:
			clear();
			UpButton.enable();
			NavigationBar.setContent(CurrentPath().withoutAccount(), true);

			if (files.length == 0) {
				noFiles();
			} else {
				fill(files, createFileEl);
				checkLoadMore(filesArr);
			}
		}

		function UI_ERROR(status, statusText) {
			clear();
			UpButton.enable();
			NavigationBar.setContent(CurrentPath().withoutAccount(), true);

			showAjaxError(status, statusText);
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

		function checkLoadMore(filesArr) {
			var listEl = document.getElementById('List');

			if (filesArr.length === LIMIT) {
				//document.getElementById('LoadMoreFiles').classList.remove('hidden');

				if (Math.abs(listEl.scrollTop - (listEl.scrollHeight - listEl.clientHeight)) < 4) {
					moreFiles();
				}
			} else {
				document.getElementById('LoadMoreFiles').classList.add('hidden');
			}
		}
	}

	function moreContainers() {
		var el = document.getElementById('LoadMoreContainers');

		if (!el) {
			document.body.classList.remove('loading-content');
			return;
		}

		document.body.classList.add('loading-content');
		el.textContent = 'Loading...';
		el.setAttribute('disabled', 'disabled');

		var xhrArgs = {};
		xhrArgs.error = loadMoreError;
		xhrArgs.delimiter = '/';
		xhrArgs.limit = LIMIT;
		xhrArgs.format = 'json';
		xhrArgs.marker = document.querySelector('.item:last-child').dataset.path;
		xhrArgs.success = function (containers) {
			var el = document.getElementById('LoadMoreContainers');
			fill(containers, createContainerEl);
			document.body.classList.remove('loading-content');

			el.textContent = 'Load more';
			if (containers.length < LIMIT) {
				el.classList.add('hidden');
			} else {
				el.removeAttribute('disabled');
				//el.classList.remove('hidden');
			}
		};
		SwiftV1.listContainers(xhrArgs);
	}

	function moreFiles() {
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
			fill(files, createFileEl);
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
	}

	function clear() {
		document.getElementById('NoContainers').classList.add('hidden');
		document.getElementById('NoFiles').classList.add('hidden');
		listEl.getElementsByClassName('list-items')[0].innerHTML = '';
		listEl.getElementsByClassName('list-items')[0].classList.remove('empty-list');
	}

	function fill(data, createItem) {
		var listItems = listEl.getElementsByClassName('list-items')[0];
		for (var i = 0; i < data.length; i++) {
			listItems.appendChild(createItem(data[i]));
		}
	}

	function showAjaxError(status, statusText) {
		listEl.getElementsByClassName('ajax-error-message')[0].textContent = statusText;
		listEl.getElementsByClassName('ajax-status-code')[0].textContent = status;
		listEl.getElementsByClassName('ajax-error')[0].classList.remove('hidden');
	}

	function loadMoreError(status, statusText) {
		document.body.classList.remove('loading-content');
		document.getElementById('AjaxErrorMessage').textContent = statusText;
		document.getElementById('AjaxStatusCode').textContent = status;
		document.getElementById('AjaxError').classList.remove('hidden');
		document.getElementById('LoadMoreContainers').textContent = 'Load More';
	}

	function createContainerEl(container) {
		var newItemEl = document.getElementById('List').getElementsByClassName('template-container')[0].cloneNode(true);
		newItemEl.classList.remove('template');
		newItemEl.classList.remove('template-container');

		newItemEl.setAttribute('title', _title());
		newItemEl.setAttribute('data-path', _dataPath());
		newItemEl.getElementsByClassName('name')[0].textContent = _name();
		newItemEl.getElementsByClassName('size')[0].textContent = _size();
		newItemEl.getElementsByClassName('files')[0].textContent = _files();

		return newItemEl;

		function _title() {
			return container.name;
		}

		function _dataPath() {
			var dataPath;
			if (container.name.indexOf('/') === -1) {
				dataPath = container.name + '/';
			} else {
				dataPath = container.name;
			}
			return dataPath;
		}

		function _name() {
			return makeShortName(container.name);
		}

		function _size() {
			return isNaN(container.bytes) ? '' : makePrettyBytes(container.bytes);
		}

		function _files() {
			return isNaN(container.count) ? '' : container.count;
		}
	}

	function createFileEl(file) {
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

	function makeShortName(name, len) {
		if (!name) {
			return '';
		}

		len = len || 30;

		if (name.length <= len) {
			return name;
		}

		return name.substr(0, len) + '&raquo;';
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

	document.getElementById('LoadMoreContainers').onclick = moreContainers;
	document.getElementById('LoadMoreFiles').onclick = moreFiles;

	listEl.onscroll = function (e) {
		e = e.target ? e.target : e;
		if (Math.abs(e.scrollTop - (e.scrollHeight - e.clientHeight)) <= 1) {
			if (!document.body.classList.contains('loading-content')) {
				if (CurrentPath().isContainersList()) {
					moreContainers();
				} else {
					moreFiles();
				}
			}
		}
	};

	return {
		containers: containers,
		files: files,
		clear: clear
	};

})(SwiftV1, UpButton, NavigationBar, CurrentPath);