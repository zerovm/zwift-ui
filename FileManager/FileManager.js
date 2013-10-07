'use strict';

var FileManager = {};

// enabled features: (can be disabled by setting false)
FileManager.SHARED_CONTAINERS = true;
FileManager.ZEROVM = true;
FileManager.EMAILS = true;

FileManager.AUTH_TYPES = {Z_LITESTACK_DOT_COM: 0, CLUSTER_AUTH:1};
FileManager.USED_AUTH = FileManager.AUTH_TYPES.Z_LITESTACK_DOT_COM;

FileManager.Auth = {};

if (FileManager.USED_AUTH == FileManager.AUTH_TYPES.Z_LITESTACK_DOT_COM) {
	FileManager.Auth.init = ZLitestackDotCom.init;
	FileManager.Auth.getAccount = ZLitestackDotCom.getAccount;
	FileManager.Auth.getStorageUrl = ZLitestackDotCom.getStorageUrl;
	FileManager.Auth.signOut = ZLitestackDotCom.signOut;
	FileManager.Auth.getEmail = function (callback) {
		ZLitestackDotCom.getEmail({
			success: function (email) {
				callback(email);
			},
			error: function (status, statusText) {
				callback(ZLitestackDotCom.getAccount());
			}
		});
	};
}

if (FileManager.USED_AUTH == FileManager.AUTH_TYPES.CLUSTER_AUTH) {
	FileManager.Auth.init = ClusterAuth.init;
	FileManager.Auth.getAccount = ClusterAuth.getAccount;
	FileManager.Auth.getStorageUrl = ClusterAuth.getStorageUrl;
	FileManager.Auth.signOut = ZLitestackDotCom.signOut;
}

FileManager.enableAll = function () {
	document.body.classList.remove('disabled');
};

FileManager.disableAll = function () {
	document.body.classList.add('disabled');
};

FileManager.setViewMode = function () {
	document.body.classList.remove('edit-mode');
	document.body.classList.add('view-mode');
};

FileManager.setEditMode = function () {
	document.body.classList.remove('view-mode');
	document.body.classList.add('edit-mode');
};

FileManager.BackButton = {};

FileManager.BackButton.click = function () {
	FileManager.disableAll();
	FileManager.CurrentDirLabel.showLoading();
	location.hash = FileManager.Current().up();
};

FileManager.BackButton.enable = function () {
	document.querySelector('.back-button').removeAttribute('disabled');
};

FileManager.BackButton.disable = function () {
	document.querySelector('.back-button').setAttribute('disabled', 'disabled');
};

FileManager.CurrentDirLabel = {};

FileManager.CurrentDirLabel.MAX_LENGTH = 30;

FileManager.CurrentDirLabel.setContent = function (content) {
	var el = document.querySelector('.current-dir-label');
	if (content.length > FileManager.CurrentDirLabel.MAX_LENGTH) {
		el.textContent = content.substr(0, FileManager.CurrentDirLabel.MAX_LENGTH);
		el.innerHTML += '&raquo;';
	} else {
		el.textContent = content;
	}
};

FileManager.CurrentDirLabel.setTooltip = function (content) {
	document.querySelector('.current-dir-label').title = content;
};

FileManager.CurrentDirLabel.removeTooltip = function () {
	document.querySelector('.current-dir-label').removeAttribute('title');
};

FileManager.CurrentDirLabel.root = function () {

	if (FileManager.EMAILS) {
		FileManager.Auth.getEmail(function (email) {
			FileManager.CurrentDirLabel.setContent(email);
			FileManager.CurrentDirLabel.setTooltip(email);
		});
		return;
	}

	var account = FileManager.Auth.getAccount();
	FileManager.CurrentDirLabel.setContent(account);
	FileManager.CurrentDirLabel.setTooltip(account);
};

FileManager.CurrentDirLabel.showLoading = function () {
	FileManager.CurrentDirLabel.setContent('Loading...');
	FileManager.CurrentDirLabel.removeTooltip();
};

FileManager.EditButton = {};

FileManager.EditButton.click = function () {

	if (FileManager.Current().isContainersList()) {
		FileManager.ContainersMenu.show();
	} else if (FileManager.Current().isFilesList()) {
		FileManager.FilesMenu.show();
		FileManager.BackButton.disable();
	}

	FileManager.EditButton.hide();
	FileManager.DoneButton.show();
	FileManager.setEditMode();
};

FileManager.EditButton.hide = function () {
	document.querySelector('.edit-button').setAttribute('hidden', 'hidden');
};

FileManager.EditButton.show = function () {
	document.querySelector('.edit-button').removeAttribute('hidden');
};

FileManager.DoneButton = {};

FileManager.DoneButton.click = function () {

	FileManager.ContainersMenu.hide();
	FileManager.FilesMenu.hide();

	if (FileManager.Current().isFilesList()) {
		FileManager.BackButton.enable();
	}

	FileManager.DoneButton.hide();
	FileManager.EditButton.show();
	FileManager.Item.unselect();
	FileManager.setViewMode();
};

FileManager.DoneButton.hide = function () {
	document.querySelector('.done-button').setAttribute('hidden', 'hidden');
};

FileManager.DoneButton.show = function () {
	document.querySelector('.done-button').removeAttribute('hidden');
};

FileManager.SignOutButton = {};

FileManager.SignOutButton.click = function () {
	FileManager.Auth.signOut();
};

FileManager.ExecuteButton = {};

FileManager.ExecuteButton.click = function () {

	FileManager.disableAll();
	FileManager.ExecuteButton.hide();
	FileManager.ExecuteTimer.start();

	ZeroVmOnSwift.execute({
		data: FileManager.File.codeMirror.getValue(),
		contentType: 'application/json',
		success: function (result, report) {
			FileManager.ExecuteTimer.stop();
			FileManager.ExecuteTimer.hide();
			FileManager.ExecuteReport.create(report);
			showResult(result);
			FileManager.enableAll();
		},
		error: function (status, statusText, result) {
			FileManager.ExecuteTimer.stop();
			FileManager.ExecuteTimer.hide();
			showResult(result); // TODO: show error message with status.
			FileManager.enableAll();
		}
	});

	function showResult(result) {
		var el = document.querySelector('.scrolling-content');
		FileManager.File.hideMenu();
		FileManager.File.codeMirror = CodeMirror(el, {
			value: result,
			mode: 'text/plain',
			lineNumbers: false
		});
		FileManager.Layout.adjust();
	}
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
	FileManager.ExecuteButton.updateExecutingClock(minutes, seconds);
	setTimeout(FileManager.ExecuteTimer.next, 1000);
};

FileManager.ExecuteTimer.show = function () {
	document.querySelector('.execute-label').removeAttribute('hidden');
};

FileManager.ExecuteTimer.hide = function () {
	document.querySelector('.execute-label').setAttribute('hidden', 'hidden');
};

FileManager.ExecuteButton.updateExecutingClock = function (minutes, seconds) {
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

	var scrollingContentEl = document.querySelector('.scrolling-content');
	var reportTemplate = document.querySelector('#reportTemplate').innerHTML;
	scrollingContentEl.innerHTML = reportTemplate;

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
			document.querySelector('#node-number-tr').insertAdjacentHTML('beforeend', td(getOrdinal(i+1)));
			document.querySelector('#node-server-time-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['nodeServerTime']));

			document.querySelector('#system-time-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['systemTime']));
			document.querySelector('#user-time-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['userTime']));
			document.querySelector('#memory-used-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['memoryUsed']));

			document.querySelector('#swap-used-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['SwapUsed']));
			document.querySelector('#reads-from-disk-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['readsFromDisk']));
			document.querySelector('#bytes-read-from-disk-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['bytesReadFromDisk']));

			document.querySelector('#writes-to-disk-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['writesToDisk']));
			document.querySelector('#bytes-written-to-disk-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['bytesWrittenToDisk']));
			document.querySelector('#reads-from-network-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['readsFromNetwork']));

			document.querySelector('#bytes-read-from-network-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['bytesReadFromNetwork']));
			document.querySelector('#writes-to-network-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['writesToNetwork']));
			document.querySelector('#bytes-written-to-network-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['bytesWrittenToNetwork']));
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

		function getOrdinal(n) {
			var s=["th","st","nd","rd"],
				v=n%100;
			return n+(s[(v-20)%10]||s[v]||s[0]);
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
			html += '<tr class="execute-report-row"><td class="execute-report-part-name">' + key + '</td><td>' + executionReport[key] + '</td></tr>';
		}
	}

	document.querySelector('#execute-tbody').innerHTML += html;
};

FileManager.ContainersMenu = {};

FileManager.ContainersMenu.show = function () {

	if (FileManager.SHARED_CONTAINERS) {
		FileManager.AddShared.clear();
	}

	FileManager.CreateContainer.clear();
	document.querySelector('.menu-containers').removeAttribute('hidden');
	FileManager.Layout.adjust();
};

FileManager.ContainersMenu.hide = function () {
	document.querySelector('.menu-containers').setAttribute('hidden', 'hidden');
	FileManager.Layout.adjust();
};


FileManager.FilesMenu = {};

FileManager.FilesMenu.show = function () {
	document.querySelector('.menu-files').removeAttribute('hidden');
	FileManager.Layout.adjust();
};

FileManager.FilesMenu.hide = function () {
	document.querySelector('.menu-files').setAttribute('hidden', 'hidden');
	FileManager.Layout.adjust();
};


FileManager.Layout = {};

FileManager.Layout.adjust = function () {
	var paddingTop = getComputedStyle(document.querySelector('.fixed-top'), null).getPropertyValue("height");
	document.querySelector('#content').style.paddingTop = paddingTop;

	if (FileManager.File.codeMirror) {
		var pageHeight = getComputedStyle(document.querySelector('.fixed-background'), null).getPropertyValue("height");
		FileManager.File.codeMirror.setSize('auto', parseInt(pageHeight, 10) - parseInt(paddingTop, 10) + 'px');
	}
};


FileManager.CreateContainer = {};

FileManager.CreateContainer.click = function () {

	var inputEl = document.querySelector('.create-container-input');
	var input = inputEl.value;

	if (!input) {
		inputEl.classList.add('invalid-input');
		return;
	}

	if (input.length > 256) {
		inputEl.classList.add('invalid-input');
		document.querySelector('.create-container-error-max-length').removeAttribute('hidden');
		FileManager.Layout.adjust();
		return;
	}

	if (input.indexOf('/') != -1) {
		inputEl.classList.add('invalid-input');
		document.querySelector('.create-container-error-invalid-character').removeAttribute('hidden');
		FileManager.Layout.adjust();
		return;
	}

	SwiftV1.createContainer({
		containerName: input,
		created: function () {
			FileManager.ContentChange.withoutAnimation();
			FileManager.CreateContainer.clear();
		},
		alreadyExisted: function () {
			inputEl.classList.add('invalid-input');
			document.querySelector('.create-container-error-already-exist').removeAttribute('hidden');
		},
		error: function (status, statusText) {
			//TODO: error treatment.
			alert('Request for create container returned error: ' + status + ' ' + statusText);
			console.log('Request for create container returned error: ' + status + ' ' + statusText);
		}
	});
};

FileManager.CreateContainer.clear = function () {
	var inputEl = document.querySelector('.create-container-input');
	inputEl.value = '';
	FileManager.CreateContainer.clearErrors(inputEl);
};

FileManager.CreateContainer.clearErrors = function (inputEl) {
	inputEl.classList.remove('invalid-input');

	var errElArr = document.querySelectorAll('.create-container .err-msg');
	for (var i = 0; i < errElArr.length; i++) {
		errElArr[i].setAttribute('hidden', 'hidden');
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
			FileManager.ContentChange.withoutAnimation();
			FileManager.AddShared.clear();
		},
		notAuthorized: function () {
			sharedContainerEl.classList.add('invalid-input');
			document.querySelector('#shared-container-error').removeAttribute('hidden');
		},
		error: function (status, statusText) {
			//TODO: error treatment.
			alert('Request for create container returned error: ' + status + ' ' + statusText);
			console.log('Request for create container returned error: ' + status + ' ' + statusText);
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


FileManager.CreateDirectory = {};

FileManager.CreateDirectory.click = function () {

	var inputEl = document.querySelector('.create-directory-input');

	if (!inputEl.value) {
		inputEl.classList.add('invalid-input');
		return;
	}

	if (inputEl.value.indexOf('/') != -1) {
		inputEl.classList.add('invalid-input');
		document.querySelector('.create-directory-error-invalid-character').removeAttribute('hidden');
		return;
	}

	var dirName = inputEl.value + '/';
	var dirPath = FileManager.Current().add(dirName);
	var dirPathWithoutAccount = FileManager.Path(dirPath).withoutAccount();

	SwiftV1.checkDirectoryExist({
		path: dirPathWithoutAccount,
		success: function () {
			inputEl.classList.add('invalid-input');
			document.querySelector('.create-directory-error-already-exist').removeAttribute('hidden');
		},
		notExist: function () {

			SwiftV1.createDirectory({
				path: dirPathWithoutAccount,
				created: function () {
					FileManager.ContentChange.withoutAnimation();
					FileManager.CreateDirectory.clear();
				},
				error: function (status, statusText) {
					//TODO: error treatment.
				}
			});

		},
		error: function (status, statusText) {
			//TODO: error treatment.
		}
	});
};

FileManager.CreateDirectory.clear = function () {
	document.querySelector('.create-directory-input').value = '';
};

FileManager.CreateDirectory.clearErrors = function () {
	document.querySelector('.create-directory-input').classList.remove('invalid-input');

	var errElArr = document.querySelectorAll('.create-directory .err-msg');
	for (var i = 0; i < errElArr.length; i++) {
		errElArr[i].setAttribute('hidden', 'hidden');
	}
};


FileManager.CreateFile = {};

FileManager.CreateFile.click = function () {
	var nameEl = document.querySelector('.create-file-input-name');
	var typeEl = document.querySelector('.create-file-input-type');

	if (!nameEl.value) {
		nameEl.classList.add('invalid-input');
		return;
	}

	var filePath = FileManager.Current().add(nameEl.value);

	SwiftV1.createFile({
		path: FileManager.Path(filePath).withoutAccount(),
		contentType: typeEl.value,
		data: '',
		created: function () {
			FileManager.ContentChange.withoutAnimation();
			FileManager.CreateFile.clear();
		},
		error: function (status, statusText) {
			//TODO: error treatment.
			alert(status + ' ' + statusText);
		}
	});
};

FileManager.CreateFile.clear = function () {
	document.querySelector('.create-file-input-name').value = '';
	document.querySelector('.create-file-input-type').value = '';
	FileManager.CreateFile.clearErrors();
};

FileManager.CreateFile.clearErrors = function () {
	document.querySelector('.create-file-input-name').classList.remove('invalid-input');
	document.querySelector('.create-file-input-type').classList.remove('invalid-input');
};


FileManager.UploadFiles = {};

FileManager.UploadFiles.uploadRequests = [];

FileManager.UploadFiles.change = function (files) {
	var el = document.querySelector('.upload-files');
	el.innerHTML = el.innerHTML;

	for (var i = 0; i < files.length; i++) {
		var name = files[i].name;
		var path = FileManager.Current().add(files[i].name);
		createUploadEl(name);
		uploadFile(path, files[i]);
	}

	FileManager.Layout.adjust();

	function createUploadEl(name) {
		var index = FileManager.UploadFiles.uploadRequests.length;
		var template = document.querySelector('#uploadTemplate').innerHTML;
		template = template.replace('{{upload-label-name}}', name);
		template = template.replace('{{upload-id}}', 'upload-' + index);
		document.querySelector('.menu-files').insertAdjacentHTML('beforeend', template);
	}

	function uploadFile(path, file) {
		var index = FileManager.UploadFiles.uploadRequests.length;
		FileManager.UploadFiles.uploadRequests[index] = SwiftV1.createFile({
			path: path,
			data: file,
			contentType: file.type,
			created: function () {
				var el = document.querySelector('#upload-' + index);
				el.parentNode.removeChild(el);
				FileManager.ContentChange.withoutAnimation();
				FileManager.Layout.adjust();
			},
			progress: function (percent, loaded, total) {
				document.querySelector('#upload-' + index + ' progress').value = percent;
				var percentStr = '&nbsp;0%&nbsp;';
				if (percent < 10) {
					percentStr = '&nbsp;' + percent + '%&nbsp;';
				} else if (percent < 100) {
					percentStr = '&nbsp;' + percent + '%';
				} else {
					percentStr = percent + '%';
				}
				document.querySelector('#upload-' + index + ' .progresslabel').innerHTML = percentStr;
			},
			error: function (status, statusText) {
				// TODO: error treatment.
				alert('Error: ' + status + ' ' + statusText);
			}
		});
	}
};

FileManager.UploadFiles.cancelClick  = function (el) {
	var index = parseInt(el.parentNode.parentNode.parentNode.id.substr('upload-'.length));
	FileManager.UploadFiles.uploadRequests[index].abort();
	el.parentNode.parentNode.parentNode.parentNode.removeChild(el.parentNode.parentNode.parentNode);
	FileManager.Layout.adjust();
};



FileManager.UploadAs = {};

FileManager.UploadAs.change = function (files) {

	for (var i = 0; i < files.length; i++) {
		var template = document.querySelector('#uploadAsTemplate').innerHTML;
		template = template.replace('{{upload-input-name}}', files[i].name);
		template = template.replace('{{upload-input-type}}', files[i].type);
		document.querySelector('.menu-files').insertAdjacentHTML('beforeend', template);
	}

	FileManager.Layout.adjust();
};


FileManager.UploadAndExecute = {};

FileManager.UploadAndExecute.change = function (file) {

};


FileManager.ConfirmDelete = {};

FileManager.ConfirmDelete.click = function (el) {
	el.parentNode.innerHTML = 'Deleting...';

	var name = document.querySelector('delete-label').title;
	var itemPath = FileManager.Current().add(name);

	if (FileManager.SHARED_CONTAINERS && FileManager.Shared.isShared(itemPath)) {
		SharedContainersOnSwift.removeSharedContainer({
			account: FileManager.Path(name).account(),
			container: FileManager.Path(name).container(),
			removed: function () {
				FileManager.ContentChange.withoutAnimation();
			},
			error: function (status, statusText) {
				var errMsg = 'Error occurred: ' + status + ' ' + statusText;
				document.querySelector('.delete-label').textContent = errMsg;
			}
		});
		return;
	}

	if (FileManager.Path(itemPath).isFile()) {

		SwiftAdvancedFunctionality.delete({
			path: FileManager.Path(itemPath).withoutAccount(),
			deleted: function () {
				FileManager.ContentChange.withoutAnimation();
			},
			error: function(status, statusText) {
				var errMsg = 'Error occurred: ' + status + ' ' + statusText;
				document.querySelector('.delete-label').innerHTML = errMsg;
			},
			notExist: function () {
				FileManager.ContentChange.withoutAnimation();
			}
		});
		return;
	}

	SwiftAdvancedFunctionality.deleteAll({
		path: FileManager.Path(itemPath).withoutAccount(),
		deleted: function () {
			FileManager.ContentChange.withoutAnimation();
		},
		progress: function (totalFiles, deletedFiles, message) {
			var percentComplete = totalFiles / deletedFiles * 100;
			var progressMsg = 'Deleting... (' + deletedFiles + '/' + totalFiles + ') ' + percentComplete + '% complete.';
			document.querySelector('.delete-label').textContent = progressMsg;
		},
		error: function (status, statusText) {
			var errMsg = 'Error occurred: ' + status + ' ' + statusText;
			document.querySelector('.delete-label').textContent = errMsg;
		}
	});

};


FileManager.Item = {};

FileManager.Item.selectedPath = null;

FileManager.Item.click = function (itemEl) {

	var name = itemEl.getAttribute('title');
	FileManager.Item.selectedPath = FileManager.Current().add(name);

	if (document.body.classList.contains('view-mode')) {
		viewMode();
	}

	if (document.body.classList.contains('edit-mode')) {
		editMode();
	}

	function viewMode() {
		FileManager.disableAll();
		FileManager.Item.showLoading(itemEl);
		location.hash = FileManager.Item.selectedPath;
	}

	function editMode() {

		FileManager.Item.unselect();

		itemEl.classList.add('clicked');

		var itemMenuHtml = document.querySelector('#itemMenuTemplate').innerHTML;
		itemEl.insertAdjacentHTML('afterend', itemMenuHtml);

		FileManager.Metadata.show();

		if (FileManager.Current().isContainersList()) {
			// TODO: Rights
		} else {
			FileManager.ContentType.show();
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
	if (FileManager.Current().isContainersList()) {
		FileManager.Containers.loadMore();
	} else {
		FileManager.Files.loadMore();
	}
};


/* FileManager.Metadata */
(function () {
	'use strict';

	var initialMetadata;

	FileManager.Metadata = {};

	FileManager.Metadata.show = function () {
		var path = FileManager.Item.selectedPath;
		var html = '<tr><td colspan="3">Loading...</td></tr>';
		document.querySelector('.metadata-table tbody').innerHTML = html;

		if (FileManager.SHARED_CONTAINERS && FileManager.Shared.isShared(path)) {
			var html = '<tr><td colspan="3">Cannot show metadata for shared container.</td></tr>';
			document.querySelector('.metadata-table tbody').innerHTML = html;
			return;
		}

		if (FileManager.Path(path).isContainer()) {
			SwiftV1.getContainerMetadata({
				containerName: FileManager.Path(path).container(),
				success: success,
				error: error
			});
		} else {
			SwiftV1.getFileMetadata({
				path: FileManager.Path(path).withoutAccount(),
				success: function (metadata, contentType, contentLength, lastModified) {
					FileManager.Item.contentType = contentType;
					success(metadata);
				},
				error: error
			});
		}

		function success(metadata) {
			initialMetadata = metadata;
			document.querySelector('.metadata-table tbody').innerHTML = '';

			var keys = Object.keys(metadata);

			for (var i = 0; i < keys.length; i++) {
				var key = keys[i];
				var value = metadata[key];

				var html = document.querySelector('#metadataRowTemplate').innerHTML;

				html = html.replace('{{key}}', FileManager.Utils.htmlEscape(key));
				html = html.replace('{{value}}', FileManager.Utils.htmlEscape(value));

				document.querySelector('.metadata-table tbody').insertAdjacentHTML('beforeend', html);
			}

			FileManager.Metadata.addBlankRow();
		}

		function error(status, statusText) {
			var html = '<tr><td colspan="3">Error: ' + status + ' ' + statusText + '</td></tr>';
			document.querySelector('.metadata-table tbody').innerHTML = html;
		}
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
		FileManager.Metadata.show();
	};

	FileManager.Metadata.save = function () {
		var path = FileManager.Item.selectedPath;
		var args = {
			metadata: metadataToAdd(),
			removeMetadata: metadataToRemove(),
			contentType: FileManager.Item.contentType,
			updated: function () {
				FileManager.Metadata.show();
			},
			error: function (status, statusText) {
				var html = '<tr><td colspan="3">Error: ' + status + ' ' + statusText + '</td></tr>';
				document.querySelector('.metadata-table tbody').innerHTML = html;
			}
		};
		document.querySelector('.metadata-table tbody').innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
		document.querySelector('.metadata-table tfoot').setAttribute('hidden', 'hidden');

		if (FileManager.Current().isContainersList()) {
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
			var initialKeys = Object.keys(initialMetadata);
			for (var i = 0; i < initialKeys.length; i++) {
				var initialKey = initialKeys[i];
				if (metadataToAddKeys.indexOf(initialKey) == -1) {
					metadataToRemoveList.push(initialKey);
				}
			}
			return metadataToRemoveList;
		}
	};

})();


FileManager.ContentType = {};

FileManager.ContentType.show = function () {
	document.querySelector('.content-type-table').removeAttribute('hidden');
	var path = FileManager.Item.selectedPath;

	SwiftV1.File.head({
		path: FileManager.Path(path).withoutAccount(),
		success: function (metadata, contentType) {
			FileManager.Item.metadata = metadata;

			document.querySelector('.content-type-table .content-type-input').value = contentType;
			document.querySelector('.content-type-table .loading').setAttribute('hidden', 'hidden');
			document.querySelector('.content-type-table .input-group-table').removeAttribute('hidden');
		},
		error: function (status, statusText) {
			// TODO: error treatment.
			alert('Error' + status + ' ' + statusText);
		}
	});
};

FileManager.ContentType.click = function () {
	document.querySelector('.content-type-table .loading').removeAttribute('hidden');
	document.querySelector('.content-type-table .input-group-table').setAttribute('hidden', 'hidden');
	var input = document.querySelector('.content-type-table .content-type-input').value;
	var path = FileManager.Item.selectedPath;

	SwiftV1.File.post({
		path: FileManager.Path(path).withoutAccount(),
		contentType: input,
		metadata: FileManager.Item.metadata,
		updated: function () {
			FileManager.ContentChange.withoutAnimation();
		},
		error: function (status, statusText) {
			// TODO: error treatment.
			alert('Error' + status + ' ' + statusText);
		}
	});
};


FileManager.File = {};

FileManager.File.codeMirror = null;

FileManager.File.contentType = '';

FileManager.File.open = function (el, callback) {

	function fileExist(metadata, contentType, contentLength, lastModified) {
		var Current = FileManager.Current();
		var href = FileManager.Auth.getStorageUrl() + Current.path();
		var filename = Current.name();

		if (isTextFile(contentType)) {
			FileManager.File.edit(el);
		} else {
			FileManager.File.notTextFile(el);
		}

		FileManager.EditButton.hide();
		FileManager.DoneButton.hide();

		FileManager.ExecuteButton.show();
		document.querySelector('.download-link').setAttribute('href', href);
		document.querySelector('.download-link').setAttribute('download', filename);

		callback();

		function isTextFile(contentType) {

			if (!contentType) {
				return false;
			}

			contentType = contentType.split(';')[0];

			if (contentType == 'application/javascript'
				|| contentType == 'application/xml'
				|| contentType == 'application/x-httpd-php'
				|| contentType == 'application/json'
				|| contentType == 'application/php'
				|| contentType == 'application/x-php'
				|| contentType.indexOf('text') == 0) {

				return true;
			}
			return false;
		}
	}

	function fileNotExist() {
		FileManager.BackButton.enable();
		el.textContent = "File not found.";
		callback();
	}

	function ajaxError(status, statusText) {
		FileManager.BackButton.enable();
		el.textContent = 'Error: ' + status + ' ' + statusText;
		callback();
	}

	var args = {
		path: FileManager.Current().withoutAccount(),
		success: fileExist,
		notExist: fileNotExist,
		error: ajaxError
	};

	if (FileManager.SHARED_CONTAINERS) {
		args.account = FileManager.Current().account();
	}

	SwiftV1.checkFileExist(args);
};

FileManager.File.edit = function (el) {
	var args = {
		path: FileManager.Current().withoutAccount(),
		success: handleResponse,
		error: function (status, statusText) {
			el.innerHTML = '';
			el.textContent = 'Error occurred: ' + status + ' ' + statusText;
			FileManager.BackButton.enable();
		},
		notExist: function () {
			el.innerHTML = '';
			// TODO: error treatment.
			el.textContent = 'File Not Found.';
			alert('File not exist.');
			FileManager.BackButton.enable();
		},
		progress: function (loaded) {
			el.textContent = loaded + ' bytes loaded...';
		}
	};
	if (FileManager.SHARED_CONTAINERS) {
		args.account = FileManager.Current().account();
	}
	SwiftV1.getFile(args);

	function handleResponse(data, contentType) {
		el.innerHTML = '';

		var fileName = FileManager.Current().name();
		var filePath = FileManager.Current().path();
		FileManager.CurrentDirLabel.setContent(fileName);
		FileManager.CurrentDirLabel.setTooltip(filePath);

		FileManager.File.contentType = contentType;
		FileManager.File.codeMirror = CodeMirror(el, {
			value: data,
			mode: contentType,
			lineNumbers: true
		});

		FileManager.File.showTxtButton();
		FileManager.File.showMenu();
		FileManager.BackButton.disable();

		FileManager.File.codeMirror.on('change', function () {
			document.querySelector('.menu-file button.undo').removeAttribute('disabled');
			document.querySelector('.menu-file button.save').removeAttribute('disabled');
		});

		document.querySelector('.menu-file button.save-as').classList.remove('selected');
		document.querySelector('.save-as-dialog').setAttribute('hidden', 'hidden');

		FileManager.Layout.adjust();
		FileManager.BackButton.enable();
	}
};

FileManager.File.notTextFile = function (el) {
	el.innerHTML = '';
	var fileName = FileManager.Current().name();
	FileManager.CurrentDirLabel.setContent(fileName);
	el.innerHTML = document.querySelector('#notTextFileTemplate').innerHTML;
	FileManager.File.hideTxtButton();
	FileManager.File.showMenu();
	FileManager.Layout.adjust();
	FileManager.BackButton.enable();
};

FileManager.File.showMenu = function () {
	document.querySelector('.menu-file').removeAttribute('hidden');
	FileManager.Layout.adjust();
};

FileManager.File.hideMenu = function () {
	document.querySelector('.menu-file').setAttribute('hidden', 'hidden');
	FileManager.Layout.adjust();
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

FileManager.File.undo = function () {
	FileManager.File.codeMirror.undo();
	document.querySelector('.menu-file button.redo').removeAttribute('disabled');
	if (FileManager.File.codeMirror.historySize().undo == 0) {
		document.querySelector('.menu-file button.undo').setAttribute('disabled', 'disabled');
	}
};

FileManager.File.redo = function () {
	FileManager.File.codeMirror.redo();
	document.querySelector('.menu-file button.undo').removeAttribute('disabled');
	if (FileManager.File.codeMirror.historySize().redo == 0) {
		document.querySelector('.menu-file button.redo').setAttribute('disabled', 'disabled');
	}
};

FileManager.File.save = function () {
	document.querySelector('.menu-file button.save').setAttribute('disabled', 'disabled');
	document.querySelector('.menu-file button.undo').setAttribute('disabled', 'disabled');
	document.querySelector('.menu-file button.redo').setAttribute('disabled', 'disabled');

	SwiftV1.createFile({
		path: FileManager.Current().withoutAccount(),
		contentType: FileManager.File.contentType,
		data: FileManager.File.codeMirror.getValue(),
		created: function () {
			FileManager.File.codeMirror.clearHistory();
		},
		error: function (status, statusText) {
			// TODO: error treatment.
			alert('Error occurred: ' + status + ' ' + statusText);
			document.querySelector('.menu-file button.save').removeAttribute('disabled');
			if (FileManager.File.codeMirror.historySize().undo > 0) {
				document.querySelector('.menu-file button.undo').removeAttribute('disabled');
			}
			if (FileManager.File.codeMirror.historySize().redo > 0) {
				document.querySelector('.menu-file button.redo').removeAttribute('disabled');
			}
		}
	});
};

FileManager.File.saveAs = function (el) {
	if (el.classList.contains('selected')) {
		el.classList.remove('selected');
		document.querySelector('.save-as-dialog').setAttribute('hidden', 'hidden');
		FileManager.Layout.adjust();
	} else {
		el.classList.add('selected');
		document.querySelector('.save-as-dialog').removeAttribute('hidden');
		FileManager.Layout.adjust();
		document.querySelector('.save-as-input-path').value = FileManager.Current().path();
		document.querySelector('.save-as-input-type').value = FileManager.File.contentType;
	}
};


FileManager.SaveAs = {};

FileManager.SaveAs.click = function () {
	var pathEl = document.querySelector('.save-as-input-path');
	var typeEl = document.querySelector('.save-as-input-type');
	var path = pathEl.value;

	if (!path) {
		pathEl.classList.add('invalid-input');
		return;
	}

	var args = {
		path: FileManager.Path(path).withoutAccount(),
		contentType: typeEl.value,
		data: FileManager.File.codeMirror.getValue(),
		created: function () {
			FileManager.DoneButton.click();
			location.hash = path;
		},
		error: function (status, statusText) {
			// TODO: error treatment.
			alert('Error occurred: ' + status + ' ' + statusText);
		}
	};

	if (FileManager.SHARED_CONTAINERS) {
		args.account = FileManager.Path(path).account();
	}

	SwiftV1.createFile(args);
};

FileManager.SaveAs.clearErrors = function () {
	document.querySelector('.save-as-input-path').classList.remove('invalid-input');
};


/* FileManager.Containers */
(function () {
	'use strict';

	FileManager.Containers = {};

	FileManager.Containers.list = function (scrollingContentEl, callback) {

		var xhr = SwiftV1.listContainers({
			format: 'json',
			limit: 20,
			success: function (response) {
				scrollingContentEl.innerHTML = '';
				var containers = JSON.parse(response);

				if (FileManager.SHARED_CONTAINERS) {
					var sharedContainers = SharedContainersOnSwift.getFromXhr(xhr);
					if (containers.length == 0 && sharedContainers.length == 0) {
						noContainers();
						callback();
						return;
					}
					FileManager.Shared.listSharedContainers(sharedContainers, scrollingContentEl);
				}

				list(containers);
			},
			error: function (status, statusText) {
				scrollingContentEl.innerHTML = '';
				// TODO: error treatment.
				alert('Error occurred: ' + status + ' ' + statusText);
			}
		});

		function list(containers) {

			if (containers.length == 0) {
				noContainers();
				callback();
				return;
			}

			FileManager.BackButton.disable();
			FileManager.CurrentDirLabel.root();


			for (var i = 0; i < containers.length; i++) {
				var container = containers[i];
				var html = createContainer(container);
				scrollingContentEl.insertAdjacentHTML('beforeend', html);
			}

			callback();

			if (containers.length == 20) {
				FileManager.Utils.addLoadMoreButton(scrollingContentEl);
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
			limit: 20,
			success: function (response) {
				var containers = JSON.parse(response);

				if (containers.length == 0) {
					var loadMoreEl = document.querySelector('.load-more-button');
					loadMoreEl.parentNode.removeChild(loadMoreEl);
					return;
				}

				for (var i = 0; i < containers.length; i++) {
					var container = containers[i];
					var html = createContainer(container);
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

	function createContainer(containerObj) {

		var name = FileManager.Utils.makeShortName(containerObj.name);
		var title = containerObj.name;
		var size = FileManager.Utils.bytesToSize(containerObj.bytes);
		var files = containerObj.count;

		var html = document.querySelector('#containerTemplate').innerHTML;

		html = html.replace('{{name}}', FileManager.Utils.htmlEscape(name));
		html = html.replace('{{title}}', FileManager.Utils.htmlEscape(title));
		html = html.replace('{{size}}', FileManager.Utils.htmlEscape(size));
		html = html.replace('{{files}}', FileManager.Utils.htmlEscape(files));

		return html;
	}

})();


/* FileManager.Files */
(function () {
	'use strict';

	FileManager.Files = {};

	FileManager.Files.list = function (scrollingContentEl, callback) {
		var prefix = FileManager.Current().prefix();
		var requestArgs = {};

		requestArgs.success = list;
		requestArgs.error = error;
		requestArgs.notExist = notExist;
		requestArgs.containerName = FileManager.Current().container();
		requestArgs.delimiter = '/';
		requestArgs.limit = 20;
		requestArgs.format = 'json';

		if (FileManager.SHARED_CONTAINERS) {
			requestArgs.account = FileManager.Current().account();
		}

		if (prefix) {
			requestArgs.prefix = prefix;
		}

		SwiftV1.listFiles(requestArgs);


		function error(status, statusText) {
			scrollingContentEl.innerHTML = '';
			var loadingEl = document.querySelector('.item-loading') || document.querySelector('.scrolling-content-loading');
			loadingEl.textContent = 'Error: ' + status + ' ' + statusText;
		}

		function list(response) {
			scrollingContentEl.innerHTML = '';
			var FILES = JSON.parse(response);
			var files = FILES.slice(0); // copy (clone) array

			if (checkFirstFile(files)) {
				files = files.splice(1);
			}

			if (files.length == 0) {
				noFiles();

			} else {
				var file, html;

				for (var i = 0; i < files.length; i++) {
					file = files[i];

					if (file.hasOwnProperty('subdir') || file.content_type == 'application/directory') {
						html = createDirectory(file);
					} else {
						html = createFile(file);
					}
					scrollingContentEl.insertAdjacentHTML('beforeend', html);
				}

				if (FILES.length == 20) {
					FileManager.Utils.addLoadMoreButton(scrollingContentEl);
				}

				if (document.documentElement.scrollHeight - document.documentElement.clientHeight <= 0) {
					FileManager.Files.loadMore();
				}

			}
			FileManager.BackButton.enable();
			FileManager.CurrentDirLabel.setContent(FileManager.Current().name());
			callback();
		}

		function notExist() {
			scrollingContentEl.innerHTML = '';
			if (FileManager.Current().isContainersList()) {
				scrollingContentEl.innerHTML = 'Container not exist.';
			} else {
				scrollingContentEl.innerHTML = 'beforeend', 'Directory not exist.';
			}
		};

		function noFiles() {
			var html = document.querySelector('#noFilesTemplate').innerHTML;
			scrollingContentEl.insertAdjacentHTML('beforeend', html);
		}

		function checkFirstFile(files) {
			if (files.length > 0 && prefix) {
				var file = files[0];
				var nameInFiles = file.hasOwnProperty('subdir') ? file.subdir : file.name;

				if (prefix == nameInFiles) {
					return true;
				}
			}
			return false;
		}
	};

	FileManager.Files.loadMore = function () {

		if (document.querySelector('.load-more-button') == null) {
			return;
		}
		document.querySelector('.load-more-button').textContent = 'Loading...';
		document.querySelector('.load-more-button').setAttribute('disabled', 'disabled');

		var marker = document.querySelector('.item:nth-last-child(2)').getAttribute('title');
		var prefix = FileManager.Current().prefix();

		if (prefix) {
			marker = prefix + marker;
		}

		var filesArgs = {
			containerName: FileManager.Current().container(),
			delimiter: '/',
			marker: marker,
			format: 'json',
			limit: 20,
			success: function (response) {
				var files = JSON.parse(response);

				if (files.length == 0) {
					var loadMoreEl = document.querySelector('.load-more-button');
					loadMoreEl.parentNode.removeChild(loadMoreEl);
					return;
				}

				var file, html;

				for (var i = 0; i < files.length; i++) {
					file = files[i];

					if (file.hasOwnProperty('subdir') || file.content_type == 'application/directory') {
						html = createDirectory(file);
					} else {
						html = createFile(file);
					}
					document.querySelector('.load-more-button').insertAdjacentHTML('beforebegin', html);
				}

				document.querySelector('.load-more-button').textContent = 'Load more';
				document.querySelector('.load-more-button').removeAttribute('disabled');

				if (document.documentElement.scrollHeight - document.documentElement.clientHeight <= 0) {
					FileManager.Files.loadMore();
				}
			},
			error: error,
			notExist: function () {
				//TODO: container or directory not exist when listing files.
				alert('Container/Directory Not Exist.');
			}
		};

		if (FileManager.SHARED_CONTAINERS) {
			filesArgs.account = FileManager.Current().account();
		}

		if (prefix) {
			filesArgs.prefix = prefix;
		}

		SwiftV1.listFiles(filesArgs);

		function error(status, statusText) {
			var loadingEl = document.querySelector('.load-more-button');
			loadingEl.textContent = 'Error: ' + status + ' ' + statusText;
		}
	};

	function createDirectory(file) {
		var _name;

		if (file.hasOwnProperty('subdir')) {
			_name = file.subdir;
		} else {
			_name = file.name;
		}

		_name = FileManager.Path(_name).name();

		var name = FileManager.Utils.makeShortName(_name);
		var title = _name;

		var html = document.querySelector('#directoryTemplate').innerHTML;

		html = html.replace('{{name}}', FileManager.Utils.htmlEscape(name));
		html = html.replace('{{title}}', FileManager.Utils.htmlEscape(title));

		return html;
	}

	function createFile(file) {
		var _name = FileManager.Path(file.name).name();
		var icon = typeToIcon(file.content_type);
		var name = makeShortFileName(_name);
		var title = _name;
		var size = FileManager.Utils.bytesToSize(file.bytes);
		var modified = makeDatePretty(file.last_modified);

		var html = document.querySelector('#fileTemplate').innerHTML;

		html = html.replace('{{icon}}', FileManager.Utils.htmlEscape(icon));
		html = html.replace('{{name}}', FileManager.Utils.htmlEscape(name));
		html = html.replace('{{title}}', FileManager.Utils.htmlEscape(title));
		html = html.replace('{{size}}', FileManager.Utils.htmlEscape(size));
		html = html.replace('{{modified}}', FileManager.Utils.htmlEscape(modified));

		return html;
	}

	function typeToIcon(type) {

		type = type.split(';')[0];
		var icon;

		if (type.indexOf('audio') == 0) {
			icon = 'img/file32_music.png';

		} else if (type == 'application/pdf') {
			icon = 'img/file32_pdf.png';

		} else if (type.indexOf('image') == 0) {
			icon = 'img/file32_picture.png';

		} else if (type.indexOf('video') == 0) {
			icon = 'img/file32_video.png';

		} else if (type == 'application/msword' || type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
			icon = 'img/file32_doc.png';

		} else if (type == 'application/vnd.ms-excel' || type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
			icon = 'img/file32_xsl.png';

		} else if (type == 'application/vnd.ms-powerpoint' || type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
			icon = 'img/file32_ppt.png';

		} else if (type == 'text/html' || type.toLowerCase().indexOf('xml') != -1) {
			icon = 'img/file32_xml.png';

		} else if (type == 'text/x-python') {
			icon = 'img/file32_py.png';

		} else if (type == 'text/x-lua') {
			icon = 'img/file32_lua.png';

		} else if (type == 'application/x-tar' || type == 'application/zip' || type == 'application/gzip' || type == 'application/x-rar' || type == 'application/x-rar-compressed') {
			icon = 'img/file32_zip.png';

		} else if (type == 'text/plain') {
			icon = 'img/file32_txt.png';

		} else if (type == 'text/csv') {
			icon = 'img/file32_csv.png';

		} else if (type == 'application/json') {
			icon = 'img/file32_json.png';

		} else if (type == 'application/x-nexe') {
			icon = 'img/file32_nexe.png';

		} else if (type == 'text/x-csrc' || type == 'text/x-chdr') {
			icon = 'img/file32_c.png';

		} else {
			icon = 'img/file32.png';
		}

		return icon;
	}

	function makeShortFileName(n, len) {
		len = len || 30;

		if (n.length <= len) {
			return n;
		}

		if (n.indexOf('.') != -1) {
			var ext = n.substring(n.lastIndexOf("."), n.length);
			var filename = n.replace(ext, '');

			filename = filename.substr(0, len) + '&raquo;' + ext;
			return filename;
		}

		return n.substr(0, len) + '&raquo;';
	}

	function makeDatePretty(time) {
		var alternative = (new Date(time)).toDateString();

		var diff = ((new Date()).getTime() - (new Date(time)).getTime()) / 1000,
			day_diff = Math.floor(diff / 86400);

		if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
			return alternative;

		var pretty = day_diff == 0 && (
			diff < 60 && "just now" ||
				diff < 120 && "1 minute ago" ||
				diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
				diff < 7200 && "1 hour ago" ||
				diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
			day_diff == 1 && "Yesterday" ||
			day_diff < 7 && day_diff + " days ago" ||
			day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";

		return pretty || alternative;
	}

})();

/* FileManager.ContentChange */
(function () {
	'use strict';

	var inProcess = false;
	var isTryingAgain = false;

	FileManager.ContentChange = {};

	FileManager.ContentChange.withoutAnimation = function () {

		if (inProcess) {
			if (!isTryingAgain) {
				setTimeout(function() {
					FileManager.ContentChange.withoutAnimation();
				}, 800);
				isTryingAgain = true;
			}
			return;
		}

		inProcess = true;
		var loadingTemplate = document.querySelector('#scrollingContentLoadingTemplate').innerHTML;

		var el = document.querySelector('.scrolling-content');
		el.innerHTML = loadingTemplate;

		fillScrollingContent(el, function () {
			inProcess = false;
			isTryingAgain = false;
			FileManager.Layout.adjust();
		});
		FileManager.Layout.adjust();

	};

	FileManager.ContentChange.animateFromRightToLeft = function () {
		var parentEl, newEl, oldEl, template;

		oldEl = document.querySelector('.scrolling-content');
		parentEl = oldEl.parentNode;

		template = document.querySelector('#rightScrollingContentTemplate').innerHTML;
		parentEl.insertAdjacentHTML('afterbegin', template);
		newEl = document.querySelector('.right-scrolling-content');

		newEl.style.paddingTop = window.scrollY + 'px';

		fillScrollingContent(newEl, function () {
			oldEl.classList.add('left-scrolling-content');
			newEl.classList.remove('right-scrolling-content');
		});

	};

	FileManager.ContentChange.animateFromLeftToRight = function () {

		var parentEl, newEl, oldEl, template;

		oldEl = document.querySelector('.scrolling-content');
		parentEl = oldEl.parentNode;

		template = document.querySelector('#leftScrollingContentTemplate').innerHTML;
		parentEl.insertAdjacentHTML('afterbegin', template);
		newEl = document.querySelector('.left-scrolling-content');
		newEl.style.paddingTop = window.scrollY + 'px';

		fillScrollingContent(newEl, function () {
			oldEl.classList.add('right-scrolling-content');
			newEl.classList.remove('left-scrolling-content');
		});

	};

	function fillScrollingContent(el, callback) {
		el.textContent = 'Loading...';
		if (FileManager.Current().isContainersList()) {
			FileManager.Containers.list(el, callback);

			var editButtonEl = document.querySelector('.edit-button');
			var doneButtonEl = document.querySelector('.done-button');
			if (editButtonEl.hasAttribute('hidden') && doneButtonEl.hasAttribute('hidden')) {
				FileManager.DoneButton.click();
			}

			FileManager.File.hideMenu();
			FileManager.ExecuteButton.hide();
		} else if (FileManager.Current().isFilesList()) {
		  	FileManager.Files.list(el, callback);

			var editButtonEl = document.querySelector('.edit-button');
			var doneButtonEl = document.querySelector('.done-button');
			if (editButtonEl.hasAttribute('hidden') && doneButtonEl.hasAttribute('hidden')) {
				FileManager.DoneButton.click();
			}

			FileManager.File.hideMenu();
			FileManager.ExecuteButton.hide();
		} else {
			// load file
			FileManager.File.open(el, callback);
		}
		FileManager.Layout.adjust();

		var loadingEl = document.querySelector('.scrolling-content-loading');
		loadingEl && loadingEl.parentNode.removeChild(loadingEl);
	}

	FileManager.ContentChange.transition = function (e) {
		if (e.propertyName == 'padding-top') {
			return;
		}

		var el = e.target;

		if (el.classList.contains('left-scrolling-content')) {
			el.parentNode.removeChild(el);

			var newEl = document.querySelector('.scrolling-content');
			newEl.classList.add('no-transition');
			newEl.style.paddingTop = '';
			window.scrollTo(0,0);
			newEl.classList.remove('no-transition');

			document.body.classList.remove('disabled');
		}

		if (el.classList.contains('right-scrolling-content')) {
			el.parentNode.removeChild(el);
			window.scrollTo(0,0);

			var newEl = document.querySelector('.scrolling-content');
			newEl.classList.add('no-transition');
			newEl.style.paddingTop = '';
			window.scrollTo(0,0);
			newEl.classList.remove('no-transition');

			document.body.classList.remove('disabled');
		}

	};

	document.addEventListener('transitionend', FileManager.ContentChange.transition);
	document.addEventListener('webkitTransitionEnd', FileManager.ContentChange.transition);

})();



FileManager.Path = function (path) {
	this.path = function () {
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

		if (newPathParts[newPathParts.length - 1] == '') {
			newPathParts.splice(-2);
		} else {
			newPathParts.splice(-1);
		}

		if (newPathParts.length == 1) {

			if (FileManager.SHARED_CONTAINERS && FileManager.Shared.isShared(newPathParts[0])) {
				return FileManager.Auth.getAccount();
			}

			return newPathParts[0];
		}

		if (newPathParts.length == 2) {
			return newPathParts.join('/');
		}

		return newPathParts.join('/') + '/';
	};
	this.add = function (name) {

		if (FileManager.SHARED_CONTAINERS && this.isContainersList() && name.indexOf('/') != -1) {
			return name;
		}

		if (path.lastIndexOf('/') == path.length - 1) {
			return path + name;
		}
		return  path + '/' + name;
	};
	return this;
};

FileManager.Current = function () {
	return FileManager.Path(location.hash.substr(1));
};


// TODO: Internet Explorer (including version 10) is not supporting e.oldURL and e.newURL
window.addEventListener('hashchange', function (e) {
	var newPath = e.newURL.split('#')[1];

	if (e.oldURL.indexOf('#') == -1) {
		FileManager.ContentChange.withoutAnimation();
		return;
	}

	var oldPath = e.oldURL.split('#')[1];

	if (newPath.indexOf('/') == -1) {
		// in order to support returning from shared container //SHARED-CONTAINERS
		FileManager.ContentChange.animateFromLeftToRight();
	} else if (oldPath.indexOf('/') == -1) {
		// in order to support moving to shared container //SHARED-CONTAINERS
		FileManager.ContentChange.animateFromRightToLeft();
	} else if(newPath.indexOf(oldPath) === 0) {
		FileManager.ContentChange.animateFromRightToLeft();
	} else if (oldPath.indexOf(newPath) === 0) {
		FileManager.ContentChange.animateFromLeftToRight();
	} else {
		FileManager.ContentChange.withoutAnimation();
	}

});

window.addEventListener('scroll', function (e) {
	var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
	var position = window.scrollY;

	if (position == height) {
		if (FileManager.Current().isContainersList()) {
			FileManager.Containers.loadMore();
		} else {
			FileManager.Files.loadMore();
		}
	}
});

window.addEventListener('resize', function (e) {
	FileManager.Layout.adjust();
});

document.addEventListener('click', function (e) {
	var el;

	if (el = is('sign-out-button')) {
		FileManager.SignOutButton.click(el);
	}

	if (document.body.classList.contains('disabled')) {
		return;
	}

	if (el = is('back-button')) {
		FileManager.BackButton.click(el);
	} else if (el = is('edit-button')) {
		FileManager.EditButton.click(el);
	} else if (el = is('done-button')) {
		FileManager.DoneButton.click(el);
	} else if (el = is('execute-button')) {
		if (FileManager.ZEROVM) {
			FileManager.ExecuteButton.click(el);
		}
	} else if (el = is('delete')) {
		FileManager.Item.deleteclick(el);
		return;
	} else if (el = is('item')) {
		FileManager.Item.click(el);
	} else if (el = is('load-more-button')) {
		FileManager.LoadMoreButton.click(el);
	} else if (el = is('create-container-button')) {
		FileManager.CreateContainer.click(el);
	} else if (el = is('add-shared-button')) {
		//SHARED-CONTAINERS
		FileManager.AddShared.click(el);
	} else if (el = is('create-directory-button')) {
		FileManager.CreateDirectory.click(el);
	} else if (el = is('create-file-button')) {
		FileManager.CreateFile.click(el);
	} else if (el = is('delete-button')) {
		FileManager.ConfirmDelete.click(el);
	} else if (el = is('metadata-save')) {
		FileManager.Metadata.save(el);
	} else if (el = is('metadata-discard-changes')) {
		FileManager.Metadata.discardChanges(el);
	} else if (el = is('remove-metadata')) {
		FileManager.Metadata.remove(el);
	} else if (el = is('undo')) {
		FileManager.File.undo();
	} else if (el = is('redo')) {
		FileManager.File.redo();
	} else if (el = is('save')) {
		FileManager.File.save();
	} else if (el = is('save-as')) {
		FileManager.File.saveAs(el);
	} else if (el = is('save-as-button')) {
		FileManager.SaveAs.click(el);
	} else if (el = is('content-type-button')) {
		FileManager.ContentType.click(el);
	} else if (el = is('cancel-upload-button')) {
		FileManager.UploadFiles.cancelClick(el);
	} else if (el = is('execute-close-button')) {
		FileManager.ExecuteReport.remove();
	} else if (el = is('execute-full-button')) {
		FileManager.ExecuteReport.showFullReport(el);
	}

	function is(className) {
		var node1 = e.target;
		var node2 = node1.parentNode;
		var node3 = node2.parentNode;

		if (node1.classList.contains(className) && !node1.hasAttribute('disabled')) {
			return node1;
		}

		if (node2.classList.contains(className) && !node2.hasAttribute('disabled')) {
			return node2;
		}

		if (node3.classList.contains(className) && !node3.hasAttribute('disabled')) {
			return node3;
		}
	}
});

document.addEventListener('keydown', function (e) {

	if (e.target.classList.contains('create-container-input')) {

		if (e.which == 13) {
			FileManager.CreateContainer.click();
			return;
		}

		FileManager.CreateContainer.clearErrors(e.target);
	}

	if (FileManager.SHARED_CONTAINERS && e.target.classList.contains('add-shared-input-account')) {
		FileManager.AddShared.clearErrors(e.target);
	}

	if (FileManager.SHARED_CONTAINERS && e.target.classList.contains('add-shared-input-container')) {
		if (e.which == 13) {
			FileManager.AddShared.click();
			return;
		}
		FileManager.AddShared.clearErrors(e.target);
	}

	if (e.target.classList.contains('create-directory-input')) {

		if (e.which == 13) {
			FileManager.CreateDirectory.click();
			return;
		}

		FileManager.CreateDirectory.clearErrors(e.target);
	}

	if (e.target.classList.contains('create-file-input-name')) {

		if (e.which == 13) {
			document.querySelector('.create-file-input-type').focus();
		}

		FileManager.CreateFile.clearErrors(e.target);
	}

	if (e.target.classList.contains('create-file-input-type')) {

		if (e.which == 13) {
			FileManager.CreateFile.click();
			return;
		}

		FileManager.CreateFile.clearErrors(e.target);
	}

	if (e.target.classList.contains('save-as-input-path')) {

		if (e.which == 13) {
			document.querySelector('.save-as-input-type').focus();
		}

		FileManager.SaveAs.clearErrors(e.target);
	}

	if (e.target.classList.contains('save-as-input-type')) {

		if (e.which == 13) {
			FileManager.SaveAs.click();
			return;
		}

		FileManager.SaveAs.clearErrors(e.target);
	}

	if (e.target.classList.contains('content-type-input')) {

		if (e.which == 13) {
			FileManager.ContentType.click();
			return;
		}
	}

});

document.addEventListener('keyup', function (e) {

	if (e.target.classList.contains('metadata-key') || e.target.classList.contains('metadata-value')) {
		FileManager.Metadata.keyup(e.target);
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
		return;
	}
});

document.addEventListener('DOMContentLoaded', function () {
	FileManager.Auth.init(function () {
		if (!location.hash) {
			location.hash = FileManager.Auth.getAccount();
		} else {
			FileManager.ContentChange.withoutAnimation();
		}
		FileManager.Layout.adjust();
	});
});


FileManager.Shared = {};
FileManager.Shared.isShared = function (path) {
	return path.split('/')[0] != FileManager.Auth.getAccount();
};
FileManager.Shared.listSharedContainers = function (sharedContainers, scrollingContentEl) {

	for (var i = 0; i < sharedContainers.length; i++) {
		add(sharedContainers[i]);
		update(sharedContainers[i]);
	}

	function add(sharedContainer) {
		var name = FileManager.Utils.makeShortName(sharedContainer);
		var title = sharedContainer;
		var html = document.querySelector('#sharedContainerTemplate').innerHTML;
		html = html.replace('{{name}}', FileManager.Utils.htmlEscape(name));
		html = html.replace('{{title}}', FileManager.Utils.htmlEscape(title));
		scrollingContentEl.insertAdjacentHTML('afterbegin', html);
	}

	function update(path) {
		SharedContainersOnSwift.getContainerSize({
			account: FileManager.Path(path).account(),
			container: FileManager.Path(path).container(),
			success: function (bytes, count) {
				var size = FileManager.Utils.bytesToSize(bytes);
				var files = count;

				var selector = '.item[title="' + path + '"]';
				var el = scrollingContentEl.querySelector(selector);

				el.querySelector('.size').textContent = size;
				el.querySelector('.files').textContent = files;
			},
			error: function (status, statusText) {
				var selector = '.item[title="' + path + '"]';
				var el = scrollingContentEl.querySelector(selector);
				el.querySelector('.size').textContent = 'Error: ' + status + ' ' + statusText;
			}
		});
	}
};
FileManager.Utils = {};
FileManager.Utils.htmlEscape = function (str) {
	return String(str)
		.replace('&raquo;', '///')
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace('///', '&raquo;');
};

FileManager.Utils.makeShortName = function (name, len) {
	if (!name) {
		return '';
	}

	len = len || 30;

	if (name.length <= len) {
		return name;
	}

	return name.substr(0, len) + '&raquo;';
};

FileManager.Utils.bytesToSize = function (bytes, precision) {
	var kilobyte = 1024;
	var megabyte = kilobyte * 1024;
	var gigabyte = megabyte * 1024;
	var terabyte = gigabyte * 1024;

	if ((bytes >= 0) && (bytes < kilobyte)) {
		return bytes + ' B';

	} else if ((bytes >= kilobyte) && (bytes < megabyte)) {
		return (bytes / kilobyte).toFixed(precision) + ' KB';

	} else if ((bytes >= megabyte) && (bytes < gigabyte)) {
		return (bytes / megabyte).toFixed(precision) + ' MB';

	} else if ((bytes >= gigabyte) && (bytes < terabyte)) {
		return (bytes / gigabyte).toFixed(precision) + ' GB';

	} else if (bytes >= terabyte) {
		return (bytes / terabyte).toFixed(precision) + ' TB';

	} else {
		return bytes + ' B';
	}
};

FileManager.Utils.addLoadMoreButton = function (scrollingContentEl) {
	var html = document.querySelector('#loadMoreButtonTemplate').innerHTML;
	scrollingContentEl.insertAdjacentHTML('beforeend', html);
};