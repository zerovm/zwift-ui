var DeleteDialog = (function (SwiftV1, recursiveDeleteOnSwift, refreshItemList, Path) {
	'use strict';

	var dialogEl = document.getElementById('DeleteDialog');
	var path, _isFile;

	function show(fullPath, isFile) {
		path = new Path(fullPath);
		_isFile = isFile;
		dialogEl.getElementsByClassName('delete-name').forEach(function (el) {
			el.textContent = path.name();
		});
		dialogEl.getElementsByClassName('delete-error')[0].classList.add('hidden');
		dialogEl.getElementsByClassName('delete-progressbar')[0].classList.add('hidden');
		dialogEl.classList.remove('hidden');
	}

	function deleteFile(path) {
		SwiftV1.delete({
			path: path.withoutAccount(),
			deleted: function () {
				refreshItemList();
				dialogEl.classList.add('hidden');
			},
			error: XHR_ERROR
		});
	}

	function recursiveDelete(path) {
		var progressbar = dialogEl.getElementsByClassName('delete-progressbar')[0];
		recursiveDeleteOnSwift({
			path: path.withoutAccount(),
			deleted: function () {
				refreshItemList();
				dialogEl.classList.add('hidden');
			},
			progress: function (totalFiles, deletedFiles) {
				var percentComplete = deletedFiles / totalFiles * 100;
				progressbar.classList.remove('hidden');
			},
			error: function(statusText, statusCode){
				progressbar.classList.add('hidden');
				XHR_ERROR(statusText, statusCode);
			}
		});
	}

	function XHR_ERROR(statusText, statusCode) {
		var errorEl = dialogEl.getElementsByClassName('ajax-error')[0];
		errorEl.getElementsByClassName('status-text')[0] = statusText;
		errorEl.getElementsByClassName('status-code')[0] = statusCode;
		errorEl.classList.remove('hidden');
	}

	dialogEl.onsubmit = function () {
		if (_isFile) {
			deleteFile(path);
		} else {
			recursiveDelete(path);
		}
	};

	dialogEl.getElementsByClassName('delete-cancel')[0].onclick = function (e) {
		e.preventDefault();
		dialogEl.classList.add('hidden');
	};

	return {
		show: show
	};

})(SwiftV1, recursiveDeleteOnSwift, refreshItemList, Path);