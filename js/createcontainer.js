(function (SwiftV1, List) {
	'use strict';

	var createContainerDialog = document.getElementById('CreateContainerDialog');
	var inputEl = createContainerDialog.getElementsByTagName('input')[0];

	createContainerDialog.onsubmit = function (e) {
		e.preventDefault();
		inputEl.setAttribute('disabled', 'disabled');

		if (inputEl.value.length == 0) {
			err('err-empty');
			return;
		} else if (inputEl.value.length > 256) {
			err('err-size-limit');
			return;
		}

		if (inputEl.value.indexOf('/') != -1) {
			err('err-invalid-character');
			return;
		}

		SwiftV1.createContainer({
			containerName: inputEl.value,
			created: function () {
				List.containers();
				createContainerDialog.classList.add('hidden');
				document.getElementById('CreateContainerButton').classList.remove('selected');
			},
			alreadyExisted: function () {
				err('err-already-exists');
			},
			error: errAjax
		});
	};

	function err(className) {
		var errEl = createContainerDialog.getElementsByClassName(className)[0];
		errEl.classList.remove('hidden');
		inputEl.removeAttribute('disabled');
		inputEl.onkeydown = function () {
			errEl.classList.add('hidden');
		};
	}

	function errAjax(status, statusText) {
		var errAjaxEl = createContainerDialog.getElementsByClassName('err-ajax')[0];
		errAjaxEl.textContent = 'Ajax Error: ' + statusText + '(' + status + ').';
		errAjaxEl.classList.remove('hidden');
		inputEl.removeAttribute('disabled');
		inputEl.onkeydown = function () {
			errAjaxEl.classList.add('hidden');
		};
	}

	createContainerDialog.getElementsByClassName('btn-cancel')[0].onclick = function () {
		createContainerDialog.classList.add('hidden');
		document.getElementById('CreateContainerButton').classList.remove('selected');
	} ;

	document.getElementById('CreateContainerButton').onclick = function () {
		document.getElementsByClassName('toolbar-button').forEach(function (btn) {
			if (btn.id == 'CreateContainerButton') {
				btn.classList.add('selected');
			} else {
				btn.classList.remove('selected');
			}
		});
		var dialogs = document.getElementsByClassName('dialog');
		for (var i = 0; i < dialogs.length; i++) {
			dialogs[i].classList.add('hidden');
		}
		createContainerDialog.getElementsByClassName('err').forEach(function (errEl) {
			errEl.classList.add('hidden');
		});
		inputEl.value = '';
		createContainerDialog.classList.remove('hidden');
		inputEl.removeAttribute('disabled');
		inputEl.focus();
	};

})(SwiftV1, List);
