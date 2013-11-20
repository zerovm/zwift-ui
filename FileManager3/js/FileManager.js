'use strict';

Auth.useZLitestackDotCom();

var FileManager;
if(!window.FileManager){
	FileManager = window.FileManager = {};
}else{
	FileManager = window.FileManager;
}

FileManager.ENABLE_SHARED_CONTAINERS = true;
FileManager.ENABLE_ZEROVM = true;
FileManager.ENABLE_EMAILS = true;


FileManager.Loading = {};

FileManager.Loading.visible = false;

FileManager.Loading.show = function () {
	FileManager.Loading.visible = true;
	document.body.classList.remove('disabled');
};

FileManager.Loading.hide = function () {
	FileManager.Loading.visible = false;
	document.body.classList.add('disabled');
};


FileManager.SignOutButton = {};

FileManager.SignOutButton.click = function () {
	Auth.signOut();
};


FileManager.AccountLabel = {};

FileManager.AccountLabel.init = function () {

	if (FileManager.ENABLE_EMAILS) {
		Auth.getEmail(function (email) {
			document.getElementById('AccountLabel').textContent = email;
		});
		return;
	}

	document.getElementById('AccountLabel').textContent = Auth.getAccount();

};


function upButtonClick() {
	var upperLevel = FileManager.CurrentPath().up();
	if (!FileManager.Loading.visible && upperLevel){
		FileManager.Loading.hide();
		FileManager.CurrentDirLabel.showLoading();
		location.hash = upperLevel;
	}
}


FileManager.CurrentDirLabel = {};

FileManager.CurrentDirLabel.MAX_LENGTH = 40;

document.addEventListener("DOMContentLoaded", function(){//TODO: extract into separated file!!!
	document.querySelector('.current-dir-label').addEventListener("click", function(e){
		if(e.target.nodeName === "A"){
			e.preventDefault();
			e.stopPropagation();
			location.hash = location.hash.match(new RegExp(".*" + e.target.dataset.hash + ".")).pop();
			return false;
		}
	});
});

FileManager.CurrentDirLabel.setContent = function (content, isArrowsSeparated) {
	var el = document.querySelector('.current-dir-label'),
		splittedContent, i, prevValue, joiner = "/",
		isCarringHiddenClass;//for browsers img rendering issue
	if(el.classList.contains("hidden")){
		isCarringHiddenClass = true;
	}else{
		el.classList.add("hidden");
	}
	el.removeChildren();
	if(content.length > FileManager.CurrentDirLabel.MAX_LENGTH){
		splittedContent = content.split("/").filter(function(str){return str;});
		content = "";
		i = splittedContent.length - 1;
		do{
			prevValue = content;
			content = "/" + splittedContent[i] + content;
			i--;
		}while(content.length < FileManager.CurrentDirLabel.MAX_LENGTH);
		content = prevValue;
		if(!content){
			content = splittedContent[splittedContent.length];
		}
	}
	if(isArrowsSeparated){
		joiner = "<img class='path-separator' src='img/go.png'/>";
	}
	content = content.split("/").map(function(pathPart){
		return pathPart ? "<a href='#' data-hash='" + pathPart + "'>" + pathPart + "</a>" : "";
	}).join(joiner);
	el.innerHTML = content;
	!isCarringHiddenClass && el.classList.remove("hidden");
};

FileManager.CurrentDirLabel.setTooltip = function (content) {
	document.querySelector('.current-dir-label').title = content;
};

FileManager.CurrentDirLabel.removeTooltip = function () {
	document.querySelector('.current-dir-label').removeAttribute('title');
};

FileManager.CurrentDirLabel.root = function () {

	if (FileManager.ENABLE_EMAILS) {
		Auth.getEmail(function (email) {
			FileManager.CurrentDirLabel.setContent(email);
			FileManager.CurrentDirLabel.setTooltip(email);
		});
		return;
	}

	var account = Auth.getAccount();
	FileManager.CurrentDirLabel.setContent(account);
	FileManager.CurrentDirLabel.setTooltip(account);
};

FileManager.CurrentDirLabel.showLoading = function () {
	FileManager.CurrentDirLabel.setContent('Loading...');
	FileManager.CurrentDirLabel.removeTooltip();
};


FileManager.WideButton = {};

FileManager.WideButton.click = function () {
	var centerEls = document.getElementsByClassName('center');
	for (var i = 0; i < centerEls.length; i++) {
		centerEls[i].style.maxWidth = '100%';
	}
	document.getElementsByClassName('fixed-background')[0].style.width = '100%';
	document.getElementById('WideButton').classList.add('hidden');
	document.getElementById('UnwideButton').classList.remove('hidden');
};

FileManager.UnwideButton = {};

FileManager.UnwideButton.click = function () {
	var centerEls = document.getElementsByClassName('center');
	for (var i = 0; i < centerEls.length; i++) {
		centerEls[i].style.maxWidth = '800px';
	}
	document.getElementsByClassName('fixed-background')[0].style.width = '800px';
	document.getElementById('UnwideButton').classList.add('hidden');
	document.getElementById('WideButton').classList.remove('hidden');
};


FileManager.OpenButton = {};

FileManager.OpenButton.click = function () {

	var options = {
		path: FileManager.CurrentPath().withoutAccount(),
		callback: function (message) {
			FileManager.ExecuteButton.hide();
		}
	};

	if (FileManager.ENABLE_SHARED_CONTAINERS) {
		options.account = FileManager.CurrentPath().account();
	}

	ZeroVmOnSwift.open(options);
};

FileManager.OpenButton.show = function () {
	document.querySelector('.open-button').removeAttribute('hidden');
};

FileManager.OpenButton.hide = function () {
	document.querySelector('.open-button').setAttribute('hidden', 'hidden');
};


FileManager.execute = function (data, contentType) {

	FileManager.Loading.hide();
	FileManager.ExecuteButton.hide();
	FileManager.ExecuteTimer.start();
	FileManager.OpenButton.hide();
	FileManager.FilesMenu.hide();

	ZeroVmOnSwift.execute({
		data: data,
		contentType: contentType,
		success: function (result, report) {
			FileManager.ExecuteTimer.stop();
			FileManager.ExecuteTimer.hide();
			FileManager.ExecuteReport.create(report);
			showResult(result);
			FileManager.Loading.show();
		},
		error: function (status, statusText, result) {
			FileManager.ExecuteTimer.stop();
			FileManager.ExecuteTimer.hide();
			showResult(result);
			FileManager.Loading.show();
		}
	});

	function showResult(result) {
		var el = window.FileManager.elements.itemsWrapperEl;
		FileManager.File.hideMenu();
		FileManager.File.codeMirror = CodeMirror(el, {
			value: result,
			mode: 'text/plain',
			lineNumbers: false
		});
	}
};


FileManager.ExecuteButton = {};

FileManager.ExecuteButton.click = function () {
	FileManager.execute(FileManager.File.codeMirror.getValue(), 'application/json');
};

FileManager.ExecuteButton.hide = function () {
	document.querySelector('.execute-button').setAttribute('hidden', 'hidden');
};

FileManager.ExecuteButton.show = function () {
	document.querySelector('.execute-button').removeAttribute('hidden');
};


FileManager.ExecuteTimer = {};

FileManager.ExecuteTimer.secondsCounter = -1;

FileManager.ExecuteTimer.start = function () {
	FileManager.ExecuteTimer.secondsCounter = 0;
	FileManager.ExecuteTimer.next();
	FileManager.ExecuteTimer.show();
};

FileManager.ExecuteTimer.stop = function () {
	FileManager.ExecuteTimer.secondsCounter = -1;
};

FileManager.ExecuteTimer.next = function () {
	if (FileManager.ExecuteTimer.secondsCounter == -1) {
		return;
	}
	FileManager.ExecuteTimer.secondsCounter++;
	var minutes = Math.floor(FileManager.ExecuteTimer.secondsCounter / 60);
	var seconds = FileManager.ExecuteTimer.secondsCounter % 60;
	FileManager.ExecuteTimer.updateExecutingClock(minutes, seconds);
	setTimeout(FileManager.ExecuteTimer.next, 1000);
};

FileManager.ExecuteTimer.show = function () {
	document.querySelector('.execute-label').removeAttribute('hidden');
};

FileManager.ExecuteTimer.hide = function () {
	document.querySelector('.execute-label').setAttribute('hidden', 'hidden');
};

FileManager.ExecuteTimer.updateExecutingClock = function (minutes, seconds) {
	var secondsStr = seconds < 10 ? '0' + String(seconds) : String(seconds);
	var minutesStr = minutes < 10 ? '0' + String(minutes) : String(minutes);
	FileManager.ExecuteTimer.setContent('Executing... ' + minutesStr + ':' + secondsStr);
};

FileManager.ExecuteTimer.setContent = function (content) {
	document.querySelector('.execute-label').textContent = content;
};


FileManager.ExecuteReport = {};

FileManager.ExecuteReport.report = null;

FileManager.ExecuteReport.create = function (report) {

	FileManager.ExecuteReport.report = report;

	var scrollingContentEl = window.FileManager.elements.itemsWrapperEl;
	scrollingContentEl.innerHTML = document.querySelector('#reportTemplate').innerHTML;

	executionReport();
	billingReport();

	function executionReport() {
		if (report.execution.status) {
			document.querySelector('#execute-status-val').textContent = report.execution.status;
			document.querySelector('#execute-status-tr').removeAttribute('hidden');
		}

		if (report.execution.error) {
			document.querySelector('#execute-error-val').textContent = report.execution.error;
			document.querySelector('#execute-error-tr').removeAttribute('hidden');
		}
	}

	function billingReport() {

		document.querySelector('#total-time-tr').insertAdjacentHTML('beforeend', td(report.billing.totalServerTime));

		var nodesLength = report.billing.nodes.length;
		for (var i = 0; i < nodesLength; i++) {
			document.querySelector('#node-number-tr').insertAdjacentHTML('beforeend', td(i+1));
			document.querySelector('#node-server-time-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['nodeServerTime'] || '-'));

			document.querySelector('#system-time-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['systemTime'] || '-'));
			document.querySelector('#user-time-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['userTime'] || '-'));


			document.querySelector('#reads-from-disk-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['readsFromDisk'] || '-'));
			document.querySelector('#bytes-read-from-disk-tr').insertAdjacentHTML('beforeend', td(FileManager.toolbox.shortenSize(report.billing.nodes[i]['bytesReadFromDisk']) || '-'));

			document.querySelector('#writes-to-disk-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['writesToDisk'] || '-'));
			document.querySelector('#bytes-written-to-disk-tr').insertAdjacentHTML('beforeend', td(FileManager.toolbox.shortenSize(report.billing.nodes[i]['bytesWrittenToDisk']) || '-'));
			document.querySelector('#reads-from-network-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['readsFromNetwork'] || '-'));

			document.querySelector('#bytes-read-from-network-tr').insertAdjacentHTML('beforeend', td(FileManager.toolbox.shortenSize(report.billing.nodes[i]['bytesReadFromNetwork']) || '-'));
			document.querySelector('#writes-to-network-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['writesToNetwork'] || '-'));
			document.querySelector('#bytes-written-to-network-tr').insertAdjacentHTML('beforeend', td(FileManager.toolbox.shortenSize(report.billing.nodes[i]['bytesWrittenToNetwork']) || '-'));
		}
		document.querySelector('#billing-report-title').setAttribute('colspan', String(1+nodesLength));
		if (nodesLength > 3) {
			document.querySelector('#billing-tbody').style.fontSize = 'x-small';
		} else {
			document.querySelector('#billing-tbody').style.fontSize = 'medium';
		}

		function td(txt) {
			return '<td class="auto-created-report-td">' + txt + '</td>';
		}
	}
};

FileManager.ExecuteReport.remove = function () {
	var billingEl = document.querySelector('#report');
	billingEl.parentNode.removeChild(billingEl);
};

FileManager.ExecuteReport.showFullReport = function (el) {

	var executionReport = FileManager.ExecuteReport.report.execution;

	el.setAttribute('hidden', 'hidden');

	var html = '';
	for (var key in executionReport) {
		if (key != 'status' && key != 'error') {
			html += '<tr class="execute-report-row"><td class="execute-report-part-name">' + key + '</td></tr><tr><td>' + executionReport[key] + '</td></tr>';
		}
	}

	document.querySelector('#execute-tbody').innerHTML += html;
};



FileManager.UploadAs = {};

FileManager.UploadAs.files = [];

FileManager.UploadAs.change = function (files) {

	for (var i = 0; i < files.length; i++) {
		FileManager.UploadAs.files.push(files[i]);
		var index = FileManager.UploadAs.files.length - 1;
		var template = document.querySelector('#uploadAsTemplate').innerHTML;
		var find = '{{index}}', re = new RegExp(find, 'g');
		template = template.replace(re, String(index));
		if (files[i].hasOwnProperty('override_name')) {}
		template = template.replace('{{upload-input-name}}', files[i].name);
		template = template.replace('{{upload-input-type}}', files[i].type);
		document.querySelector('.menu-files').insertAdjacentHTML('beforeend', template);
	}

};

FileManager.UploadAs.click = function (el) {
	var indexStr = el.getAttribute('data-index');
	var index = Number(indexStr);
	var uploadAsEl = document.querySelector('#upload-as-' + indexStr);
	var name = uploadAsEl.querySelector('.upload-as-input-name').value;
	var contentType = uploadAsEl.querySelector('.upload-as-input-type').value;
	uploadAsEl.parentNode.removeChild(uploadAsEl);
	FileManager.UploadFiles.uploadFile(FileManager.UploadAs.files[index], name, contentType);
	FileManager.UploadAs.files[index] = null;
};


FileManager.UploadAndExecute = {};

FileManager.UploadAndExecute.change = function (file) {
	FileManager.execute(file, file.type);
};


FileManager.ConfirmDelete = {};

FileManager.ConfirmDelete.click = function (el) {
	document.querySelector('.delete-deleting-label').removeAttribute('hidden');

	var itemEl = el.parentNode.previousElementSibling;
	var name = itemEl.title;
	var itemPath = FileManager.CurrentPath().add(name);

	if (FileManager.ENABLE_SHARED_CONTAINERS
			&& FileManager.Shared.isShared(itemPath)
			&& FileManager.Path(itemPath).isContainer()) {

		SharedContainersOnSwift.removeSharedContainer({
			account: FileManager.Path(name).account(),
			container: FileManager.Path(name).container(),
			removed: function () {
				window.FileManager.files.addFileListContent();
			},
			error: function (status, statusText) {
				var el = document.querySelector('.delete-error-ajax');
				FileManager.AjaxError.show(el, status, statusText);
			}
		});
		return;
	}

	if (FileManager.Path(itemPath).isFile()) {

		SwiftAdvancedFunctionality.delete({
			path: FileManager.Path(itemPath).withoutAccount(),
			deleted: function () {
				window.FileManager.files.addFileListContent();
			},
			error: function(status, statusText) {
				var el = document.querySelector('.delete-error-ajax');
				FileManager.AjaxError.show(el, status, statusText);
			},
			notExist: function () {
				window.FileManager.files.addFileListContent();
			}
		});
		return;
	}

	SwiftAdvancedFunctionality.deleteAll({
		path: FileManager.Path(itemPath).withoutAccount(),
		account: FileManager.CurrentPath().account(),
		deleted: function () {
			window.FileManager.files.addFileListContent();
		},
		progress: function (totalFiles, deletedFiles, message) {
			var percentComplete = totalFiles / deletedFiles * 100;
			var progressMsg = 'Deleting... (' + deletedFiles + '/' + totalFiles + ') ' + percentComplete + '% complete.';
			document.querySelector('.delete-label').textContent = progressMsg;
		},
		error: function (status, statusText) {
			var el = document.querySelector('.delete-error-ajax');
			FileManager.AjaxError.show(el, status, statusText);
		}
	});

};


FileManager.Item = {};

FileManager.Item.selectedPath = null;

FileManager.Item.click = function (itemEl) {

	var name = itemEl.getAttribute('title');//TODO: change to data-attribute
	if(!name){
		return;
	}
	FileManager.Item.selectedPath = FileManager.CurrentPath().add(name);

	FileManager.Loading.hide();
	FileManager.Item.showLoading(itemEl);
	location.hash = FileManager.Item.selectedPath;

	function editMode() {
		var args, itemMenuHtml, path;
		FileManager.Item.unselect();

		itemEl.classList.add('clicked');

		itemMenuHtml = document.querySelector('#itemMenuTemplate').innerHTML;
		itemEl.insertAdjacentHTML('afterend', itemMenuHtml);

		FileManager.Metadata.showLoading();

		path = FileManager.Item.selectedPath;

		if (FileManager.Path(path).isContainer()) {

			var xhr;
			args = {
				containerName: FileManager.Path(path).container(),
				success: function (metadata, objectCount, bytesUsed) {
					FileManager.Item.metadata = metadata;
					FileManager.Metadata.load(metadata);

					if (FileManager.ENABLE_SHARED_CONTAINERS && !FileManager.Shared.isShared(path)) {
						var rights = SharedContainersOnSwift.getRights(xhr);
						FileManager.Rights.load(rights);
					}
				},
				error: function (status, statusText) {
					FileManager.Metadata.showError(status, statusText);

					if (FileManager.ENABLE_SHARED_CONTAINERS && !FileManager.Shared.isShared(path)) {
						FileManager.Rights.showError(status, statusText);
					}
				},
				notExist: function () {
					FileManager.Metadata.showError(404, 'Not Found');
				}
			};

			if (FileManager.ENABLE_SHARED_CONTAINERS) {
				args.account = FileManager.Path(FileManager.Item.selectedPath).account();

				if (FileManager.Shared.isShared(path)) {
					FileManager.Rights.sharedContainers();
				} else {
					FileManager.Rights.showLoading();
				}
			}

			xhr = SwiftV1.Container.head(args);
		} else {
			FileManager.ContentType.showLoading();
			FileManager.Copy.show();

			args = {
				path: FileManager.Path(path).withoutAccount(),
				success: function (metadata, contentType, contentLength, lastModified) {
					FileManager.Item.metadata = metadata;
					FileManager.Item.contentType = contentType;
					FileManager.ContentType.load(contentType);
					FileManager.Metadata.load(metadata);
				},
				error: function (status, statusText) {
					FileManager.ContentType.showError(status, statusText);
					FileManager.Metadata.showError(status, statusText);
				},
				notExist: function () {
					FileManager.ContentType.showError(404, 'Not Found');
					FileManager.Metadata.showError(404, 'Not Found');
				}
			};

			if (FileManager.ENABLE_SHARED_CONTAINERS) {
				args.account = FileManager.Path(FileManager.Item.selectedPath).account();
			}
			SwiftV1.File.head(args);
		}
	}
};

FileManager.Item.deleteclick = function (el) {

	FileManager.Item.unselect();

	var itemConfirmDelete = document.querySelector('#itemConfirmDeleteTemplate').innerHTML;

	var itemEl = el.parentNode.parentNode;
	itemEl.classList.add('clicked');
	itemEl.insertAdjacentHTML('afterend', itemConfirmDelete);
};

FileManager.Item.unselect = function () {

	var menuItem = document.querySelector('.item-menu');
	var confirmDeleteItem = document.querySelector('.item-confirm-delete');

	if (menuItem) {
		menuItem.parentNode.removeChild(menuItem);
		document.querySelector('.clicked').classList.remove('clicked');
	}

	if (confirmDeleteItem) {
		confirmDeleteItem.parentNode.removeChild(confirmDeleteItem);
		document.querySelector('.clicked').classList.remove('clicked');
	}

};

FileManager.Item.showLoading = function (itemEl) {
	var loadingHtml = document.querySelector('#itemLoadingTemplate').innerHTML;
	itemEl.classList.add('clicked');
	itemEl.insertAdjacentHTML('afterbegin', loadingHtml);
};


FileManager.LoadMoreButton = {};

FileManager.LoadMoreButton.click = function () {
	if (FileManager.CurrentPath().isContainersList()) {
		FileManager.Containers.loadMore();
	} else {
		window.FileManager.files.loadMore();
	}
};


FileManager.Metadata = {};

FileManager.Metadata.initialMetadata = null;

FileManager.Metadata.showLoading = function () {
	document.querySelector('.metadata-loading').removeAttribute('hidden');
};

FileManager.Metadata.hideLoading = function () {
	document.querySelector('.metadata-loading').setAttribute('hidden', 'hidden');
};

FileManager.Metadata.load = function (metadata) {
	FileManager.Metadata.initialMetadata = metadata;
	document.querySelector('.metadata-table tbody').innerHTML = '';
	FileManager.Metadata.hideLoading();

	var keys = Object.keys(metadata);

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var value = metadata[key];

		var html = document.querySelector('#metadataRowTemplate').innerHTML;

		html = html.replace('{{key}}', FileManager.toolbox.escapeHTML(key));
		html = html.replace('{{value}}', FileManager.toolbox.escapeHTML(value));

		document.querySelector('.metadata-table tbody').insertAdjacentHTML('beforeend', html);
	}

	FileManager.Metadata.addBlankRow();
};

FileManager.Metadata.showError = function (status, statusText) {
	FileManager.Metadata.hideLoading();
	var el = document.querySelector('.metadata-error-ajax');
	FileManager.AjaxError.show(el, status, statusText);
};

FileManager.Metadata.remove = function (removeEl) {
	removeEl.parentNode.parentNode.removeChild(removeEl.parentNode);
	document.querySelector('.metadata-table tfoot').removeAttribute('hidden');
};

FileManager.Metadata.keyup = function (inputEl) {
	document.querySelector('.metadata-table tfoot').removeAttribute('hidden');

	var thisRow = inputEl.parentNode.parentNode;

	if (!thisRow.querySelector('.metadata-key').value && !thisRow.querySelector('.metadata-value').value) {
		thisRow.parentNode.removeChild(thisRow);
	}

	var lastRowEl = document.querySelector('.metadata-table tbody tr:last-child');

	if (lastRowEl.querySelector('.metadata-key:last-child').value ||
		lastRowEl.querySelector('.metadata-value:last-child').value) {

		lastRowEl.querySelector('.remove-metadata:last-child').textContent = 'X';
		FileManager.Metadata.addBlankRow();
	}
};

FileManager.Metadata.addBlankRow = function () {

	var html = document.querySelector('#metadataRowTemplate').innerHTML;

	html = html.replace('>X<', '>+<');
	html = html.replace('{{key}}', '');
	html = html.replace('{{value}}', '');

	document.querySelector('.metadata-table tbody').insertAdjacentHTML('beforeend', html);
};

FileManager.Metadata.discardChanges = function () {
	document.querySelector('.metadata-table tfoot').setAttribute('hidden', 'hidden');
	document.querySelector('.clicked').click();
};

FileManager.Metadata.save = function () {
	var path = FileManager.Item.selectedPath;
	var args = {
		metadata: metadataToAdd(),
		removeMetadata: metadataToRemove(),
		contentType: FileManager.Item.contentType,
		updated: function () {
			document.querySelector('.clicked').click();
		},
		error: function (status, statusText) {
			document.querySelector('.metadata-table tbody').innerHTML = '<tr><td colspan="3">Error: ' + status + ' ' + statusText + '</td></tr>';
		}
	};
	document.querySelector('.metadata-table tbody').innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
	document.querySelector('.metadata-table tfoot').setAttribute('hidden', 'hidden');

	if (FileManager.CurrentPath().isContainersList()) {
		args.containerName = FileManager.Path(path).withoutAccount();
		SwiftV1.updateContainerMetadata(args);
	} else {
		args.path = FileManager.Path(path).withoutAccount();
		SwiftV1.updateFileMetadata(args);
	}

	function metadataToAdd() {
		var metadata = {};
		var metadataRows = document.querySelectorAll('.metadata-table tbody tr');
		for (var i = 0; i < metadataRows.length - 1; i++) {
			var key = metadataRows[i].querySelector('.metadata-key').value;
			var value = metadataRows[i].querySelector('.metadata-value').value;
			if (key) {
				metadata[key] = value;
			}
		}
		return metadata;
	}

	function metadataToRemove() {
		var metadataToRemoveList = [];
		var metadataToAddList = metadataToAdd();
		var metadataToAddKeys = Object.keys(metadataToAddList);
		var initialKeys = Object.keys(FileManager.Metadata.initialMetadata);
		for (var i = 0; i < initialKeys.length; i++) {
			var initialKey = initialKeys[i];
			if (metadataToAddKeys.indexOf(initialKey) == -1) {
				metadataToRemoveList.push(initialKey);
			}
		}
		return metadataToRemoveList;
	}
};


FileManager.ContentType = {};

FileManager.ContentType.showLoading = function () {
	document.querySelector('.content-type-table').removeAttribute('hidden');
};

FileManager.ContentType.showError = function (status, statusText) {
	var el = document.querySelector('.content-type-error-ajax');
	FileManager.AjaxError.show(el, status, statusText);
};

FileManager.ContentType.load = function (contentType) {

	document.querySelector('.content-type-table .content-type-input').value = contentType;
	document.querySelector('.content-type-table .loading').setAttribute('hidden', 'hidden');
	document.querySelector('.content-type-table .input-group-table').removeAttribute('hidden');
};

FileManager.ContentType.click = function () {
	document.querySelector('.content-type-table .loading').removeAttribute('hidden');
	document.querySelector('.content-type-table .input-group-table').setAttribute('hidden', 'hidden');
	var input = document.querySelector('.content-type-table .content-type-input').value;
	var path = FileManager.Item.selectedPath;

	SwiftV1.File.post({
		account: FileManager.CurrentPath().account(),
		path: FileManager.Path(path).withoutAccount(),
		contentType: input,
		metadata: FileManager.Item.metadata,
		updated: function () {
			window.FileManager.files.addFileListContent();
		},
		error: function (status, statusText) {
			FileManager.ContentType.showError(status, statusText);
		}
	});
};


FileManager.Copy = {};

FileManager.Copy.show = function () {
	document.querySelector('.copy-input').value = FileManager.Item.selectedPath;
	document.querySelector('.copy-table').removeAttribute('hidden');
};

FileManager.Copy.click = function () {
	document.querySelector('.copy-table tbody').setAttribute('hidden', 'hidden');
	document.querySelector('.copy-loading').removeAttribute('hidden');
	var copyTo = document.querySelector('.copy-input').value;

	if (FileManager.ENABLE_SHARED_CONTAINERS && FileManager.Shared.isShared(FileManager.Item.selectedPath)) {
		SharedContainersOnSwift.copy({
			account: FileManager.Path(copyTo).account(),
			path: FileManager.Path(copyTo).withoutAccount(),
			copyFrom: FileManager.Path(FileManager.Item.selectedPath).get(),
			copied: copied,
			error: error
		});
		return;
	}

	SwiftV1.copyFile({
		path: FileManager.Path(copyTo).withoutAccount(),
		copyFrom: FileManager.Path(FileManager.Item.selectedPath).withoutAccount(),
		copied: copied,
		error: error
	});

	function copied() {
		document.querySelector('.copy-ok').removeAttribute('hidden');
		document.querySelector('.copy-loading').setAttribute('hidden', 'hidden');
		document.querySelector('.copy-table tbody').removeAttribute('hidden');
	}

	function error(status, statusText) {
		document.querySelector('.copy-loading').setAttribute('hidden', 'hidden');
		document.querySelector('.copy-table tbody').removeAttribute('hidden');
		var el = document.querySelector('.content-type-error-ajax');
		FileManager.AjaxError.show(el, status, statusText);
	}
};


FileManager.File = {};

FileManager.File.contentType = '';

FileManager.File.open = function (el, callback) {

	function fileExist(metadata, contentType, contentLength, lastModified) {
		var Current = FileManager.CurrentPath();
		var href = Auth.getStorageUrl() + Current.get();
		var filename = Current.name();

		if (isTextFile(contentType)) {
			FileManager.File.edit(el);
		} else {
			FileManager.File.notTextFile(el);
		}

		FileManager.OpenButton.show();

		if (isExecutable(contentType)) {
			FileManager.ExecuteButton.show();
		}

		document.querySelector('.download-link').setAttribute('href', href);
		//document.querySelector('.download-link').setAttribute('download', filename);

		callback();

		function isExecutable(contentType) {
			return contentType === 'application/json' || contentType === 'application/x-tar' || contentType === 'application/gtar';
		}

		function isTextFile(contentType) {

			if (!contentType) {
				return false;
			}

			contentType = contentType.split(';')[0];

			return (contentType == 'application/javascript'
				|| contentType == 'application/xml'
				|| contentType == 'application/x-httpd-php'
				|| contentType == 'application/json'
				|| contentType == 'application/php'
				|| contentType == 'application/x-php'
				|| contentType.indexOf('text') == 0);
		}
	}

	function fileNotExist() {
		document.getElementById('UpButton').removeAttribute('disabled');
		el.textContent = "File not found.";
		callback();
	}

	function ajaxError(status, statusText) {
		document.getElementById('UpButton').removeAttribute('disabled');
		el.textContent = 'Error: ' + status + ' ' + statusText;
		callback();
	}

	var args = {
		path: FileManager.CurrentPath().withoutAccount(),
		success: fileExist,
		notExist: fileNotExist,
		error: ajaxError
	};

	if (FileManager.ENABLE_SHARED_CONTAINERS) {
		args.account = FileManager.CurrentPath().account();
	}

	SwiftV1.checkFileExist(args);
};

FileManager.File.getFileXhr = null;

FileManager.File.edit = function (el) {
	var args = {
		path: FileManager.CurrentPath().withoutAccount(),
		success: handleResponse,
		error: function (status, statusText) {
			el.innerHTML = '';
			el.textContent = 'Error occurred: ' + status + ' ' + statusText;
			document.getElementById('UpButton').removeAttribute('disabled');
		},
		notExist: function () {
			el.innerHTML = '';
			el.textContent = 'File Not Found.';
			document.getElementById('UpButton').removeAttribute('disabled');
		},
		progress: function (loaded) {
			el.innerHTML = loaded + ' bytes loaded... <button onclick="FileManager.File.getFileXhr.abort();">Cancel</button>';
			if (loaded > 2097152) {
				FileManager.File.getFileXhr.abort();
				el.innerHTML = 'File is too large (2MB+).';
				document.getElementById('UpButton').removeAttribute('disabled');
			}
		}
	};
	document.getElementById('UpButton').setAttribute('disabled', 'disabled');
	if (FileManager.ENABLE_SHARED_CONTAINERS) {
		args.account = FileManager.CurrentPath().account();
	}
	FileManager.File.getFileXhr = SwiftV1.getFile(args);

	function handleResponse(data, contentType) {
		var fileName = FileManager.CurrentPath().name(),
			filePath = FileManager.CurrentPath().get();

		el.removeChildren();
		FileManager.CurrentDirLabel.setContent(fileName);
		FileManager.CurrentDirLabel.setTooltip(filePath);

		FileManager.File.contentType = contentType;
		window.FileManager.fileEditor.show(data, contentType, fileName);
		FileManager.File.showMenu();
		FileManager.File.showTxtButton();

		document.getElementById('UpButton').removeAttribute('disabled');
	}
};

FileManager.File.notTextFile = function (el) {
	el.innerHTML = '';
	var fileName = FileManager.CurrentPath().name();
	FileManager.CurrentDirLabel.setContent(fileName);
	el.innerHTML = document.querySelector('#notTextFileTemplate').innerHTML;
	FileManager.File.hideTxtButton();
	document.getElementById('UpButton').removeAttribute('disabled');
};

FileManager.File.showMenu = function () {
	document.querySelector('.menu-file').removeAttribute('hidden');
};

FileManager.File.hideMenu = function () {
	document.querySelector('.menu-file').setAttribute('hidden', 'hidden');
};

FileManager.File.showTxtButton = function () {
	var txtBtnArr = document.querySelectorAll('.txt-btn');
	for (var i = 0; i < txtBtnArr.length; i++) {
		txtBtnArr[i].removeAttribute('hidden');
	}
};

FileManager.File.hideTxtButton = function () {
	var txtBtnArr = document.querySelectorAll('.txt-btn');
	for (var i = 0; i < txtBtnArr.length; i++) {
		txtBtnArr[i].setAttribute('hidden', 'hidden');
	}
};

FileManager.Containers = {};

FileManager.Containers.LIMIT = 20;

FileManager.Containers.list = function (callback) {
	var scrollingContentEl = document.querySelector('.new-scrolling-content');

	var xhr = SwiftV1.listContainers({
		format: 'json',
		limit: FileManager.Containers.LIMIT,
		success: function (containers) {
			scrollingContentEl.innerHTML = '';

			if (FileManager.ENABLE_SHARED_CONTAINERS) {
				var sharedContainers = SharedContainersOnSwift.getFromXhr(xhr);
				if (containers.length == 0 && Object.keys(sharedContainers).length == 0) {
					noContainers();
					callback();
					return;
				}
				FileManager.Shared.listSharedContainers(sharedContainers, scrollingContentEl);
			}

			list(containers);
		},
		error: function (status, statusText) {
			scrollingContentEl.innerHTML = 'Error occurred: ' + status + ' ' + statusText;
			callback();
		}
	});

	function list(containers) {

		if (containers.length == 0) {
			noContainers();
			callback();
			return;
		}

		document.getElementById('UpButton').setAttribute('disabled', 'disabled');
		FileManager.CurrentDirLabel.root();


		for (var i = 0; i < containers.length; i++) {
			var container = containers[i];
			var html = FileManager.Containers.create(container);
			scrollingContentEl.insertAdjacentHTML('beforeend', html);
		}

		callback();

		if (containers.length == FileManager.Containers.LIMIT) {
			FileManager.toolbox.createLoadMoreButton(scrollingContentEl);
		}

		if (document.documentElement.scrollHeight - document.documentElement.clientHeight <= 0) {
			FileManager.Containers.loadMore();
		}
	}

	function noContainers() {
		var html = document.querySelector('#noContainersTemplate').innerHTML;
		scrollingContentEl.insertAdjacentHTML('beforeend', html);
	}

};

FileManager.Containers.loadMore = function () {

	if (document.querySelector('.load-more-button') == null) {
		return;
	}
	document.querySelector('.load-more-button').textContent = 'Loading...';
	document.querySelector('.load-more-button').setAttribute('disabled', 'disabled');

	var marker = document.querySelector('.item:nth-last-child(2)').getAttribute('title');

	SwiftV1.listContainers({
		marker: marker,
		format: 'json',
		limit: FileManager.Containers.LIMIT,
		success: function (containers) {

			if (containers.length == 0) {
				var loadMoreEl = document.querySelector('.load-more-button');
				loadMoreEl.parentNode.removeChild(loadMoreEl);
				return;
			}

			for (var i = 0; i < containers.length; i++) {
				var container = containers[i];
				var html = FileManager.Containers.create(container);
				document.querySelector('.load-more-button').insertAdjacentHTML('beforebegin', html);
			}

			document.querySelector('.load-more-button').textContent = 'Load more';
			document.querySelector('.load-more-button').removeAttribute('disabled');

			if (document.documentElement.scrollHeight - document.documentElement.clientHeight <= 0) {
				FileManager.Containers.loadMore();
			}
		},
		error: error
	});

	function error(status, statusText) {
		var loadingEl = document.querySelector('.load-more-button');
		loadingEl.textContent = 'Error: ' + status + ' ' + statusText;
	}
};

FileManager.Containers.create = function (containerObj) {

	var name = FileManager.toolbox.makeShortName(containerObj.name);
	var title = containerObj.name;
	var size = FileManager.toolbox.shortenSize(containerObj.bytes);
	var files = containerObj.count;

	var html = document.querySelector('#containerTemplate').innerHTML;

	html = html.replace('{{name}}', FileManager.toolbox.escapeHTML(name));
	html = html.replace('{{title}}', FileManager.toolbox.escapeHTML(title));
	html = html.replace('{{size}}', FileManager.toolbox.escapeHTML(size));
	html = html.replace('{{files}}', FileManager.toolbox.escapeHTML(files));

	return html;
};



FileManager.AjaxError = {};

FileManager.AjaxError.show = function (el, status, statusText) {
	el.querySelector('.status').textContent = status;
	el.querySelector('.status-text').textContent = statusText;
	el.removeAttribute('hidden');
};

FileManager.Path = function (path) {
	this.get = function () {
		return path;
	};
	this.account = function () {
		return path.split('/')[0];
	};
	this.container = function () {
		return path.split('/')[1];
	};
	this.withoutAccount = function () {
		return path.split('/').splice(1).join('/');
	};
	this.prefix = function () {
		return path.split('/').splice(2).join('/');
	};
	this.name = function () {
		var pathParts = path.split('/');
		if (this.isDirectory()) {
			return pathParts.splice(-2).join('/');
		}
		return pathParts[pathParts.length - 1];
	};
	this.isContainersList = function () {
		return path.indexOf('/') == -1;
	};
	this.isFilesList = function () {
		return this.isContainer() || this.isDirectory();
	};
	this.isContainer = function () {
		return path.split('/').length == 2;
	};
	this.isDirectory = function () {
		return path.lastIndexOf('/') == path.length - 1
	};
	this.isFile = function () {
		return !this.isContainer() && !this.isDirectory();
	};
	this.up = function () {
		var newPathParts = path.split('/');

		if(path === newPathParts[0]){return null;}

		if (newPathParts[newPathParts.length - 1] == '') {
			newPathParts.splice(-2);
		} else {
			newPathParts.splice(-1);
		}

		if (newPathParts.length == 1) {

			if (FileManager.ENABLE_SHARED_CONTAINERS && FileManager.Shared.isShared(newPathParts[0])) {
				return Auth.getAccount();
			}

			return newPathParts[0];
		}

		if (newPathParts.length == 2) {
			return newPathParts.join('/');
		}

		return newPathParts.join('/') + '/';
	};
	this.add = function (name) {

		if (FileManager.ENABLE_SHARED_CONTAINERS && this.isContainersList() && name.indexOf('/') != -1) {
			return name;
		}

		if (path.lastIndexOf('/') == path.length - 1) {
			return path + name;
		}
		return  path + '/' + name;
	};
	return this;
};

FileManager.CurrentPath = function () {
	return FileManager.Path(location.hash.substr(1));
};


window.addEventListener('hashchange', function () {
	window.FileManager.files.addFileListContent();
});

document.addEventListener('click', function (e) {
	var el;

	if (document.body.classList.contains('disabled')) {
		return;
	}

	if (FileManager.toolbox.getParentByClassName(e.target,'execute-button')) {
		if (FileManager.ENABLE_ZEROVM) {
			FileManager.ExecuteButton.click();
		}
	} else if (el = FileManager.toolbox.getParentByClassName(e.target,'delete')) {
		FileManager.Item.deleteclick(el);
	} else if (el = FileManager.toolbox.getParentByClassName(e.target,'item')) {
		FileManager.Item.click(el);
	} else if (FileManager.toolbox.getParentByClassName(e.target,'load-more-button')) {
		FileManager.LoadMoreButton.click();
	} else if (el = FileManager.toolbox.getParentByClassName(e.target,'add-shared-button')) {
		//SHARED-CONTAINERS
		FileManager.AddShared.click();
	} else if (el = FileManager.toolbox.getParentByClassName(e.target,'delete-button')) {
		FileManager.ConfirmDelete.click(el);
	} else if (FileManager.toolbox.getParentByClassName(e.target,'metadata-save')) {
		FileManager.Metadata.save();
	} else if (FileManager.toolbox.getParentByClassName(e.target,'metadata-discard-changes')) {
		FileManager.Metadata.discardChanges();
	} else if (el = FileManager.toolbox.getParentByClassName(e.target,'remove-metadata')) {
		FileManager.Metadata.remove(el);
	} else if (FileManager.toolbox.getParentByClassName(e.target,'content-type-button')) {
		FileManager.ContentType.click();
	} else if (el = FileManager.toolbox.getParentByClassName(e.target,'cancel-upload-button')) {
		FileManager.UploadFiles.cancelClick(el);
	} else if (el = FileManager.toolbox.getParentByClassName(e.target,'execute-close-button')) {
		FileManager.ExecuteReport.remove();
	} else if (el = FileManager.toolbox.getParentByClassName(e.target,'execute-full-button')) {
		FileManager.ExecuteReport.showFullReport(el);
	} else if (FileManager.toolbox.getParentByClassName(e.target,'copy-button')) {
		FileManager.Copy.click();
	} else if (el = FileManager.toolbox.getParentByClassName(e.target,'upload-as-button')) {
		FileManager.UploadAs.click(el);
	} else if (FileManager.toolbox.getParentByClassName(e.target,'open-button')) {
		FileManager.OpenButton.click();
	}

	else if (FileManager.ENABLE_SHARED_CONTAINERS) {
		if (FileManager.toolbox.getParentByClassName(e.target,'rights-save')) {
			FileManager.Rights.save();
		} else if (FileManager.toolbox.getParentByClassName(e.target,'rights-discard-changes')) {
			FileManager.Rights.discardChanges();
		}
	}
}, true);

document.addEventListener('keyup', function (e) {

	if (e.target.classList.contains('metadata-key') || e.target.classList.contains('metadata-value')) {
		FileManager.Metadata.keyup(e.target);
	}

	if (FileManager.ENABLE_SHARED_CONTAINERS) {
		if (e.target.classList.contains('read-rights-input') || e.target.classList.contains('write-rights-input')) {
			FileManager.Rights.keyup();
		}
	}
});

document.addEventListener('change', function (e) {
	if (e.target.parentNode.classList.contains('upload-files')) {
		FileManager.UploadFiles.change(e.target.files);
		return;
	}

	if (e.target.parentNode.classList.contains('upload-as')) {
		FileManager.UploadAs.change(e.target.files);
		return;
	}

	if (e.target.parentNode.classList.contains('upload-execute')) {
		FileManager.UploadAndExecute.change(e.target.files[0]);
	}
});

document.addEventListener('DOMContentLoaded', function () {
	Auth.init(function () {

		if (!location.hash) {
			location.hash = Auth.getAccount();
		} else {
			window.FileManager.files.addFileListContent();
		}

		FileManager.AccountLabel.init();
		FileManager.reAuth();

		document.getElementById('SignOutButton').addEventListener('click', FileManager.SignOutButton.click);
		document.getElementById('UpButton').addEventListener('click', upButtonClick);

		document.getElementById('WideButton').addEventListener('click', FileManager.WideButton.click);
		document.getElementById('UnwideButton').addEventListener('click', FileManager.UnwideButton.click);
	});
});

//SHARED-CONTAINERS
FileManager.Shared = {};
FileManager.Shared.isShared = function (path) {
	return path.split('/')[0] != Auth.getAccount();
};
FileManager.Shared.listSharedContainers = function (sharedContainers, scrollingContentEl) {

	for (var k in sharedContainers) {
		add(k, sharedContainers[k]);
		update(k, sharedContainers[k]);
	}

	function add(sharedContainer, email) {

		var name = email + '/' + sharedContainer.split('/')[1];
		name = FileManager.toolbox.makeShortName(name);
		var title = sharedContainer;
		var html = document.querySelector('#sharedContainerTemplate').innerHTML;
		html = html.replace('{{name}}', FileManager.toolbox.escapeHTML(name));
		html = html.replace('{{title}}', FileManager.toolbox.escapeHTML(title));
		scrollingContentEl.insertAdjacentHTML('afterbegin', html);
	}

	function update(path) {
		SharedContainersOnSwift.getContainerSize({
			account: FileManager.Path(path).account(),
			container: FileManager.Path(path).container(),
			success: function (bytes, count) {
				var size = FileManager.toolbox.shortenSize(bytes);

				var selector = '.item[title="' + path + '"]';
				var el = scrollingContentEl.querySelector(selector);

				el.querySelector('.size').textContent = size;
				el.querySelector('.files').textContent = count;
			},
			error: function (status, statusText) {
				var selector = '.item[title="' + path + '"]';
				var el = scrollingContentEl.querySelector(selector);
				el.querySelector('.size').textContent = 'Error: ' + status + ' ' + statusText;
			}
		});
	}
};

//SHARED-CONTAINERS
FileManager.AddShared = {};

//SHARED-CONTAINERS
FileManager.AddShared.click = function () {

	var sharedAccountEl = document.querySelector('.add-shared-input-account');
	var sharedContainerEl = document.querySelector('.add-shared-input-container');
	if (!sharedAccountEl.value) {
		sharedAccountEl.classList.add('invalid-input');
		return;
	}
	if (!sharedContainerEl.value) {
		sharedContainerEl.classList.add('invalid-input');
		return;
	}

	var account = sharedAccountEl.value;
	var container =  sharedContainerEl.value;

	SharedContainersOnSwift.addSharedContainer({
		account: account,
		container: container,
		added: function () {
			window.FileManager.files.addFileListContent();
			FileManager.AddShared.clear();
		},
		notAuthorized: function () {
			sharedContainerEl.classList.add('invalid-input');
			document.querySelector('#shared-container-error').removeAttribute('hidden');
		},
		error: function (status, statusText) {
			var el = document.querySelector('.add-shared-error-ajax');
			FileManager.AjaxError.show(el, status, statusText);
		}
	});
};

//SHARED-CONTAINERS
FileManager.AddShared.clear = function () {
	var inputAccountEl = document.querySelector('.add-shared-input-account');
	var inputContainerEl = document.querySelector('.add-shared-input-container');
	inputAccountEl.value = '';
	inputContainerEl.value = '';
	FileManager.AddShared.clearErrors(inputAccountEl, inputContainerEl);
};

//SHARED-CONTAINERS
FileManager.AddShared.clearErrors = function (inputEl1, inputEl2) {
	inputEl1.classList.remove('invalid-input');
	if (inputEl2) {
		inputEl2.classList.remove('invalid-input');
	}

	var errElArr = document.querySelectorAll('.add-shared .err-msg');
	for (var i = 0; i < errElArr.length; i++) {
		errElArr[i].setAttribute('hidden', 'hidden');
	}
};

FileManager.Rights = {};

FileManager.Rights.showLoading = function () {
	document.querySelector('.rights-table').removeAttribute('hidden');
};

FileManager.Rights.showError = function (status, statusText) {
	var el = document.querySelector('.rights-error-ajax');
	FileManager.AjaxError.show(el, status, statusText);
};

FileManager.Rights.load = function (rights) {
	document.querySelector('.read-rights-input').value = rights.read;
	document.querySelector('.write-rights-input').value = rights.write;
	document.querySelector('.rights-table .loading').setAttribute('hidden', 'hidden');
	document.querySelector('.rights-table tbody').removeAttribute('hidden');
};

FileManager.Rights.sharedContainers = function () {
	document.querySelector('.rights-table tbody').innerHTML = '<tr><td colspan="3">Cannot show metadata for shared container.</td></tr>';
	document.querySelector('.rights-table .loading').setAttribute('hidden', 'hidden');
	document.querySelector('.rights-table tbody').removeAttribute('hidden');
};

FileManager.Rights.hide = function () {
	document.querySelector('.rights-table').setAttribute('hidden', 'hidden');
};

FileManager.Rights.keyup = function () {
	document.querySelector('.rights-table tfoot').removeAttribute('hidden');
};

FileManager.Rights.save = function () {
	SharedContainersOnSwift.updateRights({
		containerName: FileManager.Path(FileManager.Item.selectedPath).container(),
		readRights: document.querySelector('.read-rights-input').value,
		writeRights: document.querySelector('.write-rights-input').value,
		updated: function () {
			document.querySelector('.clicked').click();
		},
		error: function (status, statusText) {
			FileManager.Rights.showError(status, statusText);
		}
	});
};

FileManager.Rights.discardChanges = function () {
	document.querySelector('.clicked').click();
};

FileManager.reAuth = function () {
	SwiftV1.Account.head({success:function(){},error:function(){}});
	setTimeout(FileManager.reAuth, 1000 * 60 * 20);
};

window.onload = function () {
	messageForIE();

	function messageForIE() {
		if (navigator.userAgent.indexOf('MSIE') != -1) {
			document.body.innerHTML = '<h1 style="margin:5% auto; text-align: center;font-family: arial; color: #8b0000;">Internet Explorer is not supported. Please open in other browser.</h1>';
		}
	}
};