var ContainersList = (function (SwiftV1) {
	'use strict';

	var LIMIT = 20;

	var load = function (callback) {
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
	};

	var create = function (containerObj) {
		var resulthtml = '',
			slashStr = '/',
			dummy = document.querySelector('#containerTemplate').innerHTML,
			tmp,
			container, title, path;

		for (var i = 0; i < containerObj.length; i++) {
			container = containerObj[i];
			title = container.name;
			path = title.indexOf(slashStr) === -1 ? title + slashStr : title;
			tmp = dummy.replace('{{name}}', FileManager.toolbox.escapeHTML(FileManager.toolbox.makeShortName(container.name)))
				.replace('{{path}}', FileManager.toolbox.escapeHTML(path))
				.replace('{{title}}', FileManager.toolbox.escapeHTML(title))
				.replace('{{size}}', isNaN(container.bytes) ? '' : FileManager.toolbox.shortenSize(container.bytes))
				.replace('{{files}}', isNaN(container.count) ? '' : container.count);
			if(container.count){
				resulthtml += tmp;
			}else{
				resulthtml += tmp.replace('item', 'item empty-container');
			}
		}
		return resulthtml;
	};

	function reset_UI_before() {
		document.getElementById('NoContainers').classList.add('hidden');
		document.getElementById('NoFiles').classList.add('hidden');
		document.getElementById('List').firstElementChild.innerHTML = '';
	}

	function reset_UI_after(callback) {
		document.getElementById('UpButton').setAttribute('disabled', 'disabled');
		NavigationBar.setContent(CurrentPath().withoutAccount(), true);
		callback();
	}

	function UI_ERROR(status, statusText, callback) {
		reset_UI_before();
		document.getElementById('AjaxErrorMessage').textContent = statusText;
		document.getElementById('AjaxStatusCode').textContent = status;
		document.getElementById('AjaxError').classList.remove('hidden');
		reset_UI_after(callback);
	}

	function UI_OK(containers, callback) {
		var transitionDiv = document.getElementById('List').firstElementChild;
		NavigationBar.root();

		if (containers.length == 0) {
			document.getElementById('NoContainers').classList.remove('hidden');
			callback();
			return;
		}
		document.getElementById('NoContainers').classList.add('hidden');
		document.getElementById('NoFiles').classList.add('hidden');

		document.getElementById('UpButton').setAttribute('disabled', 'disabled');

		transitionDiv.insertAdjacentHTML('beforeend', ContainersList.create(containers));

		callback();

		if (containers.length === FileManager.Containers.LIMIT) {
			FileManager.toolbox.createLoadMoreButton(transitionDiv);
		} else {
			transitionDiv.insertAdjacentHTML('beforeend', ContainersList.create([{name:''}]).replace('item', 'item no-hover no-active dummy'));
		}
	}

	return {
		load: load,
		create: create
	};
})(SwiftV1);