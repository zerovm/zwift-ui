(function (SwiftV1) {
	'use strict';

	var createDirectoryDialog = document.getElementById('CreateDirectoryDialog');
	var inputEl = createDirectoryDialog.getElementsByTagName('input')[0];

	createDirectoryDialog.onsubmit = function (e) {
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

		var dirName = inputEl.value + "/";
		var dirPath = CurrentPath().add(dirName);
		var dirPathWithoutAccount = new Path(dirPath).withoutAccount();
		var requestArgs = {};
		requestArgs.path = dirPathWithoutAccount;

		requestArgs.success = function(){
			err('err-already-exists');
		};

		requestArgs.notExist = function(){
			SwiftV1.createDirectory({
				path: dirPathWithoutAccount,
				created: function(){
					List.files();
					createDirectoryDialog.classList.add('hidden');
					document.getElementById('CreateDirectoryButton').classList.remove('selected');
				},
				error: errAjax
			});
		};
		requestArgs.error = errAjax;
		SwiftV1.checkDirectoryExist(requestArgs);
		window.FileManager.dialogForm.hide();
	};

	function err(className) {
		var errEl = createDirectoryDialog.getElementsByClassName(className)[0];
		errEl.classList.remove('hidden');
		inputEl.removeAttribute('disabled');
		inputEl.onkeydown = function () {
			errEl.classList.add('hidden');
		};
	}

	function errAjax(status, statusText) {
		var errAjaxEl = createDirectoryDialog.getElementsByClassName('err-ajax')[0];
		errAjaxEl.textContent = 'Ajax Error: ' + statusText + '(' + status + ').';
		errAjaxEl.classList.remove('hidden');
		inputEl.removeAttribute('disabled');
		inputEl.onkeydown = function () {
			errAjaxEl.classList.add('hidden');
		};
	}

	createDirectoryDialog.getElementsByClassName('btn-cancel')[0].onclick = function () {
		createDirectoryDialog.classList.add('hidden');
		document.getElementById('CreateDirectoryButton').classList.remove('selected');
	};

	document.getElementById('CreateDirectoryButton').onclick = function () {
		document.getElementsByClassName('toolbar-button').forEach(function (btn) {
			if (btn.id == 'CreateDirectoryButton') {
				btn.classList.add('selected');
			} else {
				btn.classList.remove('selected');
			}
		});
		var dialogs = document.getElementsByClassName('dialog');
		for (var i = 0; i < dialogs.length; i++) {
			dialogs[i].classList.add('hidden');
		}
		createDirectoryDialog.getElementsByClassName('err').forEach(function (errEl) {
			errEl.classList.add('hidden');
		});
		inputEl.value = '';
		createDirectoryDialog.classList.remove('hidden');
		inputEl.removeAttribute('disabled');
		inputEl.focus();
	};

})(SwiftV1);
