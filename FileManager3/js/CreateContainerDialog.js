(function () {
	'use strict';

	var CreateContainerDialog = document.getElementById('CreateContainerDialog');
	var inputEl = CreateContainerDialog.getElementsByTagName('input')[0];

	CreateContainerDialog.onsubmit = function (e) {
		e.preventDefault();
		inputEl.setAttribute('disabled', 'disabled');

		if (inputEl.value.length == 0) {
			err('err-empty');
			return;
		} else if (inputEl.value.length > 255) {
			err('err-size-limit');
			return;
		}

		if (FileManager.ENABLE_SHARED_CONTAINERS) {
			if (inputEl.value.indexOf('/') != -1) {
				SharedContainersOnSwift.addSharedContainer({
					account: inputEl.value.split('/')[0],
					container: inputEl.value.split('/')[1],
					added: function () {
						window.FileManager.files.refreshItemList();
						CreateContainerDialog.classList.add('hidden');
					},
					error: errAjax
				});
				return;
			}
		}

		if (inputEl.value.indexOf('/') != -1) {
			err('err-invalid-character');
			return;
		}

		SwiftV1.createContainer({
			containerName: inputEl.value,
			created: function () {
				window.FileManager.files.refreshItemList();
				CreateContainerDialog.classList.add('hidden');
			},
			alreadyExisted: function () {
				err('err-already-exists');
			},
			error: errAjax
		});
	};

	function err(className) {
		var errEl = CreateContainerDialog.getElementsByClassName(className)[0];
		errEl.classList.remove('hidden');
		inputEl.removeAttribute('disabled');
		inputEl.onkeydown = function () {
			errEl.classList.add('hidden');
		};
	}

	function errAjax(status, statusText) {
		var errAjaxEl = CreateContainerDialog.getElementsByClassName('err-ajax');
		errAjaxEl.textContent = 'Ajax Error: ' + statusText + '(' + status + ').';
		inputEl.removeAttribute('disabled');
		inputEl.onkeydown = function () {
			errAjaxEl.classList.add('hidden');
		};
	}

	CreateContainerDialog.getElementsByClassName('btn-cancel')[0].onclick = function () {
		CreateContainerDialog.classList.add('hidden');
	} ;

	document.getElementsByClassName('show-create-container-dialog').forEach(function (el) {
		el.onclick = function () {
			CreateContainerDialog.getElementsByClassName('err').forEach(function (errEl) {
				errEl.classList.add('hidden');
			});
			inputEl.value = '';
			CreateContainerDialog.classList.remove('hidden');
			inputEl.removeAttribute('disabled');
			inputEl.focus();
		};
	});
})();
