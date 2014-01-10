(function () {
	'use strict';

	var CreateFileDialog = document.getElementById('CreateFileDialog');
	var inputEl = CreateFileDialog.getElementsByTagName('input')[0];

	CreateFileDialog.onsubmit = function (e) {
		e.preventDefault();
		inputEl.setAttribute('disabled', 'disabled');

		if (inputEl.value.length == 0) {
			err('err-empty');
			return;
		} else if (inputEl.value.length > 1024) {
			err('err-size-limit');
			return;
		} else if (inputEl.value.indexOf('/') != -1) {
			err('err-invalid-character');
			return;
		}

		var path = FileManager.CurrentPath().withoutAccount() + inputEl.value;
		var requestArgs = {};
		requestArgs.path = path;

		if (FileManager.ENABLE_SHARED_CONTAINERS) {
			requestArgs.account = FileManager.CurrentPath().account();
		}

		requestArgs.success = function () {
			err('err-already-exists');
		};

		requestArgs.notExist = function () {
			SwiftV1.createFile({
				path: path,
				contentType: 'text/plain',
				created: function () {
					location.hash = location.hash + inputEl.value;
					CreateFileDialog.classList.add('hidden');
					document.getElementById('CreateFileButton').classList.remove('selected');
				},
				error: errAjax
			});
		};
		requestArgs.error = errAjax;
		SwiftV1.checkFileExist(requestArgs);
		window.FileManager.dialogForm.hide();
	};

	function err(className) {
		var errEl = CreateFileDialog.getElementsByClassName(className)[0];
		errEl.classList.remove('hidden');
		inputEl.removeAttribute('disabled');
		inputEl.onkeydown = function () {
			errEl.classList.add('hidden');
		};
	}

	function errAjax(status, statusText) {
		var errAjaxEl = CreateFileDialog.getElementsByClassName('err-ajax')[0];
		errAjaxEl.textContent = 'Ajax Error: ' + statusText + '(' + status + ').';
		errAjaxEl.classList.remove('hidden');
		inputEl.removeAttribute('disabled');
		inputEl.onkeydown = function () {
			errAjaxEl.classList.add('hidden');
		};
	}

	CreateFileDialog.getElementsByClassName('btn-cancel')[0].onclick = function () {
		CreateFileDialog.classList.add('hidden');
		document.getElementById('CreateFileButton').classList.remove('selected');
	};

	document.getElementById('CreateFileButton').onclick = function () {
		document.getElementsByClassName('toolbar-button').forEach(function (btn) {
			if (btn.id == 'CreateFileButton') {
				btn.classList.add('selected');
			} else {
				btn.classList.remove('selected');
			}
		});
		var dialogs = document.getElementsByClassName('dialog');
		for (var i = 0; i < dialogs.length; i++) {
			dialogs[i].classList.add('hidden');
		}
		CreateFileDialog.getElementsByClassName('err').forEach(function (errEl) {
			errEl.classList.add('hidden');
		});
		inputEl.value = '';
		CreateFileDialog.classList.remove('hidden');
		inputEl.removeAttribute('disabled');
		inputEl.focus();
	};
})();
