var FilesList = (function (SwiftV1, Path, CurrentPath) {
	"use strict";

	var LIMIT = 20;

	var load = function (callback) {
		var requestArgs = {};
		requestArgs.containerName = CurrentPath().container();
		requestArgs.format = "json";
		requestArgs.limit = LIMIT;
		requestArgs.delimiter = "/";
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
		var el = document.getElementsByClassName("load-more-button")[0];
		var prefix;
		var currPath = CurrentPath();
		var isContainer = currPath.isContainersList();

		if (!el) {
			document.body.classList.remove('loading-content');
			return;
		}

		document.body.classList.add('loading-content');
		el.textContent = "Loading...";
		el.setAttribute("disabled", "disabled");

		var filesArgs = {};
		filesArgs.error = loadMoreError;
		filesArgs.delimiter = "/";
		filesArgs.limit = LIMIT;
		filesArgs.format = "json";
		filesArgs.marker = el.previousElementSibling.dataset.path;
		filesArgs.success = function(items){
			var el = document.getElementsByClassName("load-more-button")[0];
			document.body.classList.remove('loading-content');
			if (isContainer) {
				el.insertAdjacentHTML('beforebegin', FileManager.Containers.create(items));
			} else {
				var transitionDiv = document.getElementById('List').firstElementChild;
				for (var i = 0; i < files.length; i++) {
					transitionDiv.appendChild(createItem(files[i]));
				}
			}

			if (items.length < LIMIT) {
				el.parentNode.removeChild(el);
			} else {
				el.textContent = "Load more";
				el.removeAttribute("disabled");
			}
		};

		if (isContainer) {
			SwiftV1.listContainers(filesArgs);
		} else {
			filesArgs.containerName = currPath.container();
			if(currPath.isDirectory()){
				prefix = currPath.prefix();
				filesArgs.marker = prefix + filesArgs.marker;
				filesArgs.prefix = prefix;
			}
			SwiftV1.listFiles(filesArgs);
		}
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
		transitionDiv.innerHTML = '';
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
			if (file.hasOwnProperty("subdir")) {
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
			return window.FileManager.toolbox.makeShortName(_title(file));
		}

		function _size() {
			return isNaN(file.bytes) ? '' : window.FileManager.toolbox.shortenSize(file.bytes);
		}

		function _modified() {
			return file.last_modified ? window.FileManager.toolbox.makeDatePretty(file.last_modified) : '';
		}
	}

	function checkLoadMore(filesArr) {
		var listEl = document.getElementById('List');
		var transitionDiv = document.getElementById('List').firstElementChild;

		if (filesArr.length === LIMIT) {
			FileManager.toolbox.createLoadMoreButton(transitionDiv);
		}

		if (Math.abs(listEl.scrollTop - (listEl.scrollHeight - listEl.clientHeight)) < 4) {
			FilesList.loadMore();
		}
	}

	function reset_UI_before() {
		document.getElementById('NoContainers').classList.add('hidden');
		document.getElementById('NoFiles').classList.add('hidden');
	}

	function reset_UI_after(callback) {
		document.getElementById('UpButton').removeAttribute("disabled");
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
				nameInFiles = file.hasOwnProperty("subdir") ? file.subdir : file.name;
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
	}

	return {
		load: load,
		loadMore: loadMore
	};
})(SwiftV1, Path, CurrentPath);
