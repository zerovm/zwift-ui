var ContainersList = (function (SwiftV1) {
	'use strict';

	var LIMIT = 20;

	function load(callback) {
		SwiftV1.listContainers({
			format: 'json',
			limit: LIMIT,
			success: function (containers) {
				UI_OK(containers, callback);
			},
			error: function (status, statusText) {
				UI_ERROR(status, statusText, callback);
			}
		});
	}

	function UI_OK(containers, callback) {
		reset_UI_before();
		if (containers.length == 0) {
			noContainers();
		} else {
			fillList(containers);
			checkLoadMore(containers);
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

	function reset_UI_before() {
		document.getElementById('NoContainers').classList.add('hidden');
		document.getElementById('NoFiles').classList.add('hidden');
		document.getElementById('List').firstElementChild.innerHTML = '';
	}

	function reset_UI_after(callback) {
		document.getElementById('UpButton').setAttribute('disabled', 'disabled');
		NavigationBar.root();
		callback();
	}

	function fillList(containers) {
		var transitionDiv = document.getElementById('List').firstElementChild;
		for (var i = 0; i < containers.length; i++) {
			transitionDiv.appendChild(createItem(containers[i]));
		}
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

	function loadMore() {
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
			fillList(containers);
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

	function loadMoreError(status, statusText) {
		document.body.classList.remove('loading-content');
		document.getElementById('AjaxErrorMessage').textContent = statusText;
		document.getElementById('AjaxStatusCode').textContent = status;
		document.getElementById('AjaxError').classList.remove('hidden');
		document.getElementById('LoadMoreContainers').textContent = 'Load More';
	}

	function createItem(container) {
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

	document.getElementById('LoadMoreContainers').onclick = loadMore;

	return {
		load: load,
		loadMore: loadMore
	};
})(SwiftV1);