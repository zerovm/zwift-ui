'use strict';

/*
 Add String.contains for not supported browsers.
 */
if (!('contains' in String.prototype)) {
	String.prototype.contains = function (str, startIndex) {
		return -1 !== String.prototype.indexOf.call(this, str, startIndex);
	};
}

/*
 Add String.startsWith for not supported browsers.
 */
if (!String.prototype.startsWith) {
	Object.defineProperty(String.prototype, 'startsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			position = position || 0;
			return this.indexOf(searchString, position) === position;
		}
	});
}

/*
 Add String.endsWith for not supported browsers.
 */
if (!String.prototype.endsWith) {
	Object.defineProperty(String.prototype, 'endsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			position = position || this.length;
			position = position - searchString.length;
			return this.lastIndexOf(searchString) === position;
		}
	});
}

var FileManager = {};

FileManager.enableAll = function () {
	document.body.classList.remove('disabled');
};

FileManager.disableAll = function () {
	document.body.classList.add('disabled');
};


FileManager.Path = {};

FileManager.Path.get = function () {
	return location.hash.substr(1);
};

FileManager.Path.removeAccount = function (path) {
	return path.split('/').splice(1).join('/');
};

FileManager.Path.withoutAccount = function () {
	return FileManager.Path.removeAccount(FileManager.Path.get());
};


FileManager.BackButton = {};

FileManager.BackButton.clickCallback = function () {
	FileManager.disableAll();
	FileManager.CurrentDirLabel.showLoading();

	var currentPath = location.hash;
	var newPathComponents = currentPath.split('/');
	var newPath = '';

	if (currentPath.endsWith('/')) {
		newPathComponents.pop();
		newPathComponents.pop();
	} else {
		newPathComponents.pop();
	}

	if (newPathComponents.length == 1) {
		newPath = ZLitestackDotCom.getAccount();
		//newPath = ClusterAuth.getAccount();
	} else if (newPathComponents.length == 2) {
		newPath = newPathComponents.join('/');
	} else {
		newPath = newPathComponents.join('/') + '/';
	}

	location.hash = newPath;
};

FileManager.BackButton.enable = function () {
	document.querySelector('.back-button').removeAttribute('disabled');
};

FileManager.BackButton.disable = function () {
	document.querySelector('.back-button').setAttribute('disabled', 'disabled');
};


FileManager.CurrentDirLabel = {};

FileManager.CurrentDirLabel.update = function (name) {
	var name = name;
	var title = location.hash.substring(1);

	var el = document.querySelector('.current-dir-label');
	el.innerHTML = htmlEscape(name);
	el.setAttribute('title', htmlEscape(title));
};

FileManager.CurrentDirLabel.root = function () {
	//FileManager.CurrentDirLabel.update(makeShortName(ClusterAuth.getAccount()));

	ZLitestackDotCom.getEmail({
		success: function (email) {
			FileManager.CurrentDirLabel.update(makeShortName(email));
		},
		error: function (status, statusText) {
			FileManager.CurrentDirLabel.update(makeShortName(ZLitestackDotCom.getAccount()));
			console.log('HEAD account returned error: ' + status + ' ' + statusText);
		}
	});
};

FileManager.CurrentDirLabel.showLoading = function () {
	FileManager.CurrentDirLabel.update('Loading...');
};

FileManager.CurrentDirLabel.showError = function () {
	var el = document.querySelector('.current-dir-label');
	el.innerHTML = htmlEscape('Error (I) (R)');
	el.setAttribute('title', 'Error');
};


FileManager.EditButton = {};

FileManager.EditButton.clickCallback = function () {
	var path = location.hash;
	var isContainer = path.split('/').length == 1;
	var isFiles = path.endsWith('/') || path.split('/').length == 2;

	if (isContainer) {
		FileManager.ContainersMenu.show();
	} else if (isFiles) {
		FileManager.FilesMenu.show();
		FileManager.BackButton.disable();
	}

	document.querySelector('.edit-button').setAttribute('hidden', 'hidden');
	document.querySelector('.done-button').removeAttribute('hidden');
	document.body.classList.remove('view-mode');
	document.body.classList.add('edit-mode');
};

FileManager.DoneButton = {};

FileManager.DoneButton.clickCallback = function () {
	var path = location.hash;
	var isFiles = path.split('/').length > 1;

	FileManager.ContainersMenu.hide();
	FileManager.FilesMenu.hide();

	if (isFiles) {
		FileManager.BackButton.enable();
	}

	document.querySelector('.done-button').setAttribute('hidden', 'hidden');
	document.querySelector('.edit-button').removeAttribute('hidden');
	FileManager.Item.unselect();
	document.body.classList.remove('edit-mode');
	document.body.classList.add('view-mode');
};


FileManager.SignOutButton = {};

FileManager.SignOutButton.clickCallback = function () {
	ZLitestackDotCom.signOut();
	//ClusterAuth.signOut();
};


FileManager.ExecuteButton = {};

FileManager.ExecuteButton.clickCallback = function () {

	//document.querySelector('.open-button').setAttribute('hidden', 'hidden');
	document.querySelector('.execute-button').setAttribute('hidden', 'hidden');
	FileManager.ExecuteLabel.start();

	ZeroVmOnSwift.execute({
		data: FileManager.File.codeMirror.getValue(),
		contentType: 'application/json',
		success: function (result, report) {
			FileManager.ExecuteLabel.hide();
			FileManager.Report.create(report);
			showResult(result);
			//FileManager.ExecuteLabel.executed();
		},
		error: function (status, statusText, result) {
			// TODO: show error message with status.
			showResult(result);
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
	}
};

FileManager.ExecuteLabel = {};


FileManager.ExecuteLabel.start = function () {
	var el = document.querySelector('.execute-label');
	el.textContent = 'Executing... 00:00';

	var count = 0;

	setTimeout(timer, 1000);

	function timer() {
		count++;
		var seconds = count % 60 < 10 ? '0' + String(count % 60) : String(count % 60);
		var minutes = Math.floor(count / 60) < 10 ? '0' + String(Math.floor(count / 60)) : String(Math.floor(count / 60));
		el.textContent = 'Executing... ' + minutes + ':' + seconds;
		setTimeout(timer, 1000);
	}
	el.removeAttribute('hidden');
};

FileManager.ExecuteLabel.hide = function () {
	var el = document.querySelector('.execute-label');
	el.setAttribute('hidden', 'hidden');
};


FileManager.Report = {};

FileManager.Report.report;

FileManager.Report.create = function (report) {

	FileManager.Report.report = report;

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

FileManager.Report.remove = function () {
	var billingEl = document.querySelector('#report');
	billingEl.parentNode.removeChild(billingEl);
};

FileManager.Report.full = function (el) {

	var executionReport = FileManager.Report.report.execution;

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
	FileManager.CreateContainer.clear();
	FileManager.AddShared.clear(); //SHARED-CONTAINERS
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

FileManager.CreateContainer.clickCallback = function () {

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

	if (input.contains('/')) {
		inputEl.classList.add('invalid-input');
		document.querySelector('.create-container-error-invalid-character').removeAttribute('hidden');
		layout.fix();
		return;
	}

	SwiftV1.createContainer({
		containerName: input,
		created: function () {
			var currentPath = FileManager.Path.get();
			FileManager.ContentChange.withoutAnimation(currentPath);
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
FileManager.AddShared.clickCallback = function () {

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
			FileManager.ContentChange.withoutAnimation(location.hash.substr(0));
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

FileManager.CreateDirectory.clickCallback = function () {

	var inputEl = document.querySelector('.create-directory-input');

	if (!inputEl.value) {
		inputEl.classList.add('invalid-input');
		return;
	}

	if (inputEl.value.contains('/')) {
		inputEl.classList.add('invalid-input');
		document.querySelector('.create-directory-error-invalid-character').removeAttribute('hidden');
		return;
	}

	var path = FileManager.Path.withoutAccount();
	var dirName = inputEl.value + '/';
	var dirPath = path.endsWith('/') ? path + dirName : path + '/' + dirName;

	SwiftV1.checkDirectoryExist({
		path: dirPath,
		success: function () {
			inputEl.classList.add('invalid-input');
			document.querySelector('.create-directory-error-already-exist').removeAttribute('hidden');
		},
		notExist: function () {

			SwiftV1.createDirectory({
				path: dirPath,
				created: function () {
					FileManager.ContentChange.withoutAnimation(FileManager.Path.get());
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

FileManager.CreateFile.clickCallback = function () {
	var currentPath = FileManager.Path.get();
	var nameEl = document.querySelector('.create-file-input-name');
	var typeEl = document.querySelector('.create-file-input-type');

	if (!nameEl.value) {
		nameEl.classList.add('invalid-input');
		return;
	}

	var path = currentPath.endsWith('/') ? currentPath + nameEl.value : currentPath + '/' + nameEl.value;

	SwiftV1.createFile({
		path: FileManager.Path.removeAccount(path),
		contentType: typeEl.value,
		data: '',
		created: function () {
			FileManager.ContentChange.withoutAnimation(FileManager.Path.get());
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


(function () {
	var uploadRequests = [];

	FileManager.UploadFiles = {};

	FileManager.UploadFiles.changeCallback = function (files) {
		var el = document.querySelector('.upload-files');
		el.innerHTML = el.innerHTML;
		var currentPath = FileManager.Path.withoutAccount();

		for (var i = 0; i < files.length; i++) {

			var name = files[i].name;
			var path;

			createUploadEl(name);

			if (currentPath.endsWith('/')) {
				path = currentPath + files[i].name;
			}  else {
				path = currentPath + '/' + files[i].name;
			}

			uploadFile(path, files[i]);
		}

		FileManager.Layout.adjust();
	};

	function createUploadEl(name) {
		var index = uploadRequests.length;
		var template = document.querySelector('#uploadTemplate').innerHTML;
		template = template.replace('{{upload-label-name}}', name);
		template = template.replace('{{upload-id}}', 'upload-' + index);
		document.querySelector('.menu-files').insertAdjacentHTML('beforeend', template);
	}

	function uploadFile(path, file) {
		var index = uploadRequests.length;
		uploadRequests[index] = SwiftV1.createFile({
			path: path,
			data: file,
			contentType: file.type,
			created: function () {
				var el = document.querySelector('#upload-' + index);
				el.parentNode.removeChild(el);
				FileManager.ContentChange.withoutAnimation(FileManager.Path.get());
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

	FileManager.UploadFiles.cancelClickCallback  = function (el) {
		var index = parseInt(el.parentNode.parentNode.parentNode.id.substr('upload-'.length));
		uploadRequests[index].abort();
		el.parentNode.parentNode.parentNode.parentNode.removeChild(el.parentNode.parentNode.parentNode);
		FileManager.Layout.adjust();
	};

})();



FileManager.UploadAs = {};

FileManager.UploadAs.changeCallback = function (files) {

	for (var i = 0; i < files.length; i++) {
		var template = document.querySelector('#uploadAsTemplate').innerHTML;
		template = template.replace('{{upload-input-name}}', files[i].name);
		template = template.replace('{{upload-input-type}}', files[i].type);
		document.querySelector('.menu-files').insertAdjacentHTML('beforeend', template);
	}

	FileManager.Layout.adjust();
};


FileManager.UploadExecute = {};

FileManager.UploadExecute.changeCallback = function (file) {

};


FileManager.ConfirmDelete = {};

FileManager.ConfirmDelete.clickCallback = function (el) {
	var itemEl = el.parentNode.parentNode.previousElementSibling;
	var name = itemEl.title;
	var currentPath = FileManager.Path.get();
	var newPath = currentPath.endsWith('/') ? currentPath + name : currentPath + '/' + name;
	var pathWithoutAccount = FileManager.Path.removeAccount(newPath);

	var isSharedContainer = !currentPath.contains('/') && name.contains('/');//SHARED-CONTAINERS

	//SHARED-CONTAINERS
	if (isSharedContainer) {
		var account = name.split('/')[0];
		var container = name.split('/')[1];

		SharedContainersOnSwift.removeSharedContainer({
			account: account,
			container: container,
			removed: function () {
				FileManager.ContentChange.withoutAnimation(currentPath);
			},
			error: function (status, statusText) {
				var errMsg = 'Error occurred: ' + status + ' ' + statusText;
				document.querySelector('.delete-label').innerHTML = errMsg;
			}
		});

		return;
	}

	var isContainerOrDirectory = !currentPath.contains('/') || name.endsWith('/');

	if (isContainerOrDirectory) {

		var containerName = newPath.split('/')[1];
		var path = newPath.split('/').splice(2).join('/');

		if (!path.endsWith('/')) {
			path += '/';
		}


		el.parentNode.innerHTML = 'Deleting...';

		if (path) {
			if (path.indexOf('/') == 0) {
				path = containerName + path;
			} else {
				path = containerName + '/' + path;
			}
		} else {
			path = containerName;
		}

		SwiftAdvancedFunctionality.deleteAll({
			path: path,
			deleted: function () {
				FileManager.ContentChange.withoutAnimation(currentPath);
			},
			progress: function (totalFiles, deletedFiles, message) {
				var percentComplete = totalFiles / deletedFiles * 100;
				var html = 'Deleting... (' + deletedFiles + '/' + totalFiles + ') ' + percentComplete + '% complete.';
				document.querySelector('.delete-label').innerHTML = html;
			},
			error: function (status, statusText) {
				var errMsg = 'Error occurred: ' + status + ' ' + statusText;
				document.querySelector('.delete-label').innerHTML = errMsg;
			}
		});
	} else {

		SwiftAdvancedFunctionality.delete({
			path: pathWithoutAccount,
			deleted: function () {
				FileManager.ContentChange.withoutAnimation(currentPath);
			},
			error: function(status, statusText) {
				var errMsg = 'Error occurred: ' + status + ' ' + statusText;
				document.querySelector('.delete-label').innerHTML = errMsg;
			},
			notExist: function () {
				FileManager.ContentChange.withoutAnimation(currentPath);
			}
		});
	}
};


FileManager.Item = {};

FileManager.Item.selectedPath = null;

FileManager.Item.clickCallback = function (itemEl) {

	var name = itemEl.getAttribute('title');
	var currentPath = FileManager.Path.get();

	if (currentPath.endsWith('/')) {
		FileManager.Item.selectedPath = currentPath + name;
	} else {
		FileManager.Item.selectedPath = currentPath + '/' + name;
	}

	if (document.body.classList.contains('view-mode')) {
		viewMode();
	}

	if (document.body.classList.contains('edit-mode')) {
		editMode();
	}

	function viewMode() {

		FileManager.disableAll();
		FileManager.Item.showLoading(itemEl);

		var maybeSharedContainer = name.contains('/'); //SHARED-CONTAINERS
		var isDirectory = name.endsWith('/');

		//SHARED-CONTAINERS
		if (maybeSharedContainer && !isDirectory) {
			location.hash = name;
			return;
		}

		if (location.hash.endsWith('/')) {
			location.hash += name;
			return;
		}

		location.hash += '/' + name;
	}

	function editMode() {

		FileManager.Item.unselect();

		itemEl.classList.add('clicked');

		var itemMenuHtml = document.querySelector('#itemMenuTemplate').innerHTML;
		itemEl.insertAdjacentHTML('afterend', itemMenuHtml);

		var isContainer = location.hash.split('/').length == 1;

		FileManager.Metadata.show();

		if (isContainer) {

		} else {
			FileManager.ContentType.show();
		}
	}
};

FileManager.Item.deleteClickCallback = function (el) {

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

FileManager.LoadMoreButton.clickCallback = function () {
	if (!location.hash.contains('/')) {
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
		var isContainersList = location.hash.split('/').length === 1;
		var html = '<tr><td colspan="3">Loading...</td></tr>';
		document.querySelector('.metadata-table tbody').innerHTML = html;


		//SHARED-CONTAINERS
		var isSharedContainer = isContainersList && path.split('/').count > 2;
		if (isSharedContainer) {
			var html = '<tr><td colspan="3">Cannot show metadata for shared container.</td></tr>';
			document.querySelector('.metadata-table tbody').innerHTML = html;
			return;
		}

		if (isContainersList) {
			SwiftV1.getContainerMetadata({
				containerName: FileManager.Path.removeAccount(path),
				success: success,
				error: error
			});
		} else {
			SwiftV1.getFileMetadata({
				path: FileManager.Path.removeAccount(path),
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

				html = html.replace('{{key}}', htmlEscape(key));
				html = html.replace('{{value}}', htmlEscape(value));

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
		var isContainersList = location.hash.split('/').length === 1;
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

		if (isContainersList) {
			args.containerName = FileManager.Path.removeAccount(path);
			SwiftV1.updateContainerMetadata(args);
		} else {
			args.path = FileManager.Path.removeAccount(path);
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
		path: FileManager.Path.removeAccount(path),
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

FileManager.ContentType.clickCallback = function () {
	document.querySelector('.content-type-table .loading').removeAttribute('hidden');
	document.querySelector('.content-type-table .input-group-table').setAttribute('hidden', 'hidden');
	var input = document.querySelector('.content-type-table .content-type-input').value;
	var path = FileManager.Item.selectedPath;

	SwiftV1.File.post({
		path: FileManager.Path.removeAccount(path),
		contentType: input,
		metadata: FileManager.Item.metadata,
		updated: function () {
			FileManager.ContentChange.withoutAnimation(FileManager.Path.get());
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

FileManager.File.open = function (path, el, callback) {

	SwiftV1.checkFileExist({
		path: FileManager.Path.removeAccount(path),
		success: function (metadata, contentType, contentLength, lastModified) {

			if (!isTextFile(contentType)) {
				el.innerHTML = document.querySelector('#notTextFileTemplate').innerHTML;
				FileManager.File.hideTxtButton();
				FileManager.File.showMenu();

				var fileName = path.split('/').pop();
				FileManager.CurrentDirLabel.update(fileName);
				FileManager.Layout.adjust();
				FileManager.BackButton.enable();
			} else {
				FileManager.File.edit(path, el);
			}

			document.querySelector('.edit-button').setAttribute('hidden', 'hidden');
			document.querySelector('.done-button').setAttribute('hidden', 'hidden');

			//document.querySelector('.open-button').removeAttribute('hidden');
			document.querySelector('.execute-button').removeAttribute('hidden');
			document.querySelector('.download-link').setAttribute('href', ZLitestackDotCom.getStorageUrl() + path);
			//document.querySelector('.download-link').setAttribute('href', ClusterAuth.getStorageUrl() + path);
			document.querySelector('.download-link').setAttribute('download', path.substr(path.lastIndexOf('/')));

			callback();
		},
		notExist: function () {
			FileManager.BackButton.enable();
			el.textContent = "File not found.";
			callback();
		},
		error: function (status, statusText) {
			el.textContent = 'Error: ' + status + ' ' + statusText;
			callback();
			FileManager.BackButton.enable();
		}
	});

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
			|| contentType.startsWith('text')) {

			return true;
		}
		return false;
	}

	function isLargeFile(fileSize) {
		var maxSize = 3;
		if (Number(fileSize) > maxSize) {
			return true;
		}
		return false;
	}
};

FileManager.File.edit = function (path, el) {
	SwiftV1.getFile({
		path: FileManager.Path.removeAccount(path),
		//range: 'bytes=0-' + String(1024 * 1024),
		success: handleResponse,
		error: function (status, statusText) {
			el.textContent = 'Error occurred: ' + status + ' ' + statusText;
			FileManager.BackButton.enable();
		},
		notExist: function () {
			// TODO: error treatment.
			el.textContent = 'File Not Found.';
			alert('File not exist.');
			FileManager.BackButton.enable();
		}
	});

	function handleResponse(data, contentType) {

		var fileName = path.split('/').pop();
		FileManager.CurrentDirLabel.update(fileName);


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
		path: FileManager.Path.get().split('/').splice(1).join('/'),
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
		document.querySelector('.save-as-input-path').value = FileManager.Path.get();
		document.querySelector('.save-as-input-type').value = FileManager.File.contentType;
	}
};


FileManager.SaveAs = {};

FileManager.SaveAs.clickCallback = function () {
	var pathEl = document.querySelector('.save-as-input-path');
	var typeEl = document.querySelector('.save-as-input-type');
	var path = pathEl.value;

	if (!path) {
		pathEl.classList.add('invalid-input');
		return;
	}

	SwiftV1.createFile({
		path: FileManager.Path.removeAccount(path),
		contentType: typeEl.value,
		data: FileManager.File.codeMirror.getValue(),
		created: function () {
			FileManager.DoneButton.clickCallback();
			location.hash = path;
		},
		error: function (status, statusText) {
			// TODO: error treatment.
			alert('Error occurred: ' + status + ' ' + statusText);
		}
	});
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
				var containers = JSON.parse(response);
				var sharedContainers = SharedContainersOnSwift.getFromXhr(xhr); //SHARED-CONTAINERS
				list(containers, sharedContainers); //SHARED-CONTAINERS
			},
			error: function (status, statusText) {
				// TODO: error treatment.
				alert('Error occurred: ' + status + ' ' + statusText);
			}
		});

		function list(containers, sharedContainers) { //SHARED-CONTAINERS

			if (containers.length == 0 && sharedContainers.length == 0) { //SHARED-CONTAINERS
				noContainers();
				callback();
				return;
			}

			FileManager.BackButton.disable();
			FileManager.CurrentDirLabel.root();


			listContainers(containers);
			listShared(sharedContainers); //SHARED-CONTAINERS
			callback();

			if (containers.length == 20) {
				addLoadMoreButton(scrollingContentEl);
			}

			if (document.documentElement.scrollHeight - document.documentElement.clientHeight <= 0) {
				FileManager.Containers.loadMore();
			}
		}

		function listContainers(containers) {
			for (var i = 0; i < containers.length; i++) {
				var container = containers[i];
				var html = createContainer(container);
				scrollingContentEl.insertAdjacentHTML('beforeend', html);
			}
		}

		//SHARED-CONTAINERS
		function listShared(sharedContainers) {
			for (var i = 0; i < sharedContainers.length; i++) {
				addShared(sharedContainers[i]);
				updateShared(sharedContainers[i]);
			}
		}

		//SHARED-CONTAINERS
		function addShared(sharedContainer) {
			var html = createShared(sharedContainer);
			scrollingContentEl.insertAdjacentHTML('afterbegin', html);
		}

		//SHARED-CONTAINERS
		function updateShared(path) {

			var account = path.substring(0, path.indexOf('/'));
			var container = path.substring(path.indexOf('/') + 1);

			SharedContainersOnSwift.getContainerSize({
				account: account,
				container: container,
				success: update,
				error: error
			});

			function update(bytes, count) {
				var size = bytesToSize(bytes);
				var files = count;

				var selector = '.item[title="' + path + '"]';
				var el = scrollingContentEl.querySelector(selector);

				el.querySelector('.size').textContent = size;
				el.querySelector('.files').textContent = files;
			}

			function error(status, statusText) {
				var selector = '.item[title="' + path + '"]';
				var el = scrollingContentEl.querySelector(selector);
				el.querySelector('.size').textContent = 'Error: ' + status + ' ' + statusText;
			}
		}

		//SHARED-CONTAINERS
		function createShared(sharedContainer) {

			var name = makeShortName(sharedContainer);
			var title = sharedContainer;

			var html = document.querySelector('#sharedContainerTemplate').innerHTML;

			html = html.replace('{{name}}', htmlEscape(name));
			html = html.replace('{{title}}', htmlEscape(title));

			return html;
		}

		function noContainers() {
			var html = document.querySelector('#noContainersTemplate').innerHTML;
			scrollingContentEl.insertAdjacentHTML('beforeend', html);
		}

	};

	FileManager.Containers.loadMore = function () {

		//FileManager.Error.setLastAction(FileManager.Containers.loadMore, arguments);

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

		var name = makeShortName(containerObj.name);
		var title = containerObj.name;
		var size = bytesToSize(containerObj.bytes);
		var files = containerObj.count;

		var html = document.querySelector('#containerTemplate').innerHTML;

		html = html.replace('{{name}}', htmlEscape(name));
		html = html.replace('{{title}}', htmlEscape(title));
		html = html.replace('{{size}}', htmlEscape(size));
		html = html.replace('{{files}}', htmlEscape(files));

		return html;
	}

})();


/* FileManager.Files */
(function () {
	'use strict';

	FileManager.Files = {};

	FileManager.Files.list = function (path, scrollingContentEl, callback) {

		var pathComponents = path.split('/');

		var requestArgs = {};
		requestArgs.success = list;
		requestArgs.error = error;
		requestArgs.notExist = notExist;
		//requestArgs.account = pathComponents[0]; //SHARED-CONTAINERS
		requestArgs.containerName = pathComponents[1];
		requestArgs.delimiter = '/';
		requestArgs.limit = 20;
		requestArgs.format = 'json';
		requestArgs.account = pathComponents[0];

		if (pathComponents.length > 2) {
			requestArgs.prefix = pathComponents.slice(2).join('/');
		}

		SwiftV1.listFiles(requestArgs);


		function error(status, statusText) {
			var loadingEl = document.querySelector('.item-loading') || document.querySelector('.scrolling-content-loading');
			loadingEl.textContent = 'Error: ' + status + ' ' + statusText;
		}

		function list(response) {

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
					addLoadMoreButton(scrollingContentEl);
				}

				if (document.documentElement.scrollHeight - document.documentElement.clientHeight <= 0) {
					FileManager.Files.loadMore();
				}

			}
			FileManager.BackButton.enable();
			var current = makeShortName(pathToName(decodeURIComponent(path)));
			FileManager.CurrentDirLabel.update(current);

			callback();

		}

		function notExist() {
			if (location.hash.split('/').length == 2) {
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
			if (files.length > 0 && pathComponents.length > 2) {
				var file = files[0];

				var nameInPath = pathComponents.splice(2).join('/');
				var nameInFiles = file.hasOwnProperty('subdir') ? file.subdir : file.name;

				if (nameInPath == nameInFiles) {
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

		var pathComponents = location.hash.substring(1).split('/');
		var account = pathComponents[0];
		var container = pathComponents[1];

		var marker = document.querySelector('.item:nth-last-child(2)').getAttribute('title');

		if (pathComponents.length > 2) {
			var markerPrefix = pathComponents.slice(2).join('/');
			marker = markerPrefix + marker;
		}

		var filesArgs = {
			account: account,
			containerName: container,
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

		if (pathComponents.length > 2) {
			filesArgs.prefix = pathComponents.splice(2).join('/');
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

		_name = pathToName(_name);

		var name = makeShortName(_name);
		var title = _name;

		var html = document.querySelector('#directoryTemplate').innerHTML;

		html = html.replace('{{name}}', htmlEscape(name));
		html = html.replace('{{title}}', htmlEscape(title));

		return html;
	}

	function createFile(file) {
		var _name = pathToName(file.name);
		var icon = typeToIcon(file.content_type);
		var name = makeShortFileName(_name);
		var title = _name;
		var size = bytesToSize(file.bytes);
		var modified = makeDatePretty(file.last_modified);

		var html = document.querySelector('#fileTemplate').innerHTML;

		html = html.replace('{{icon}}', htmlEscape(icon));
		html = html.replace('{{name}}', htmlEscape(name));
		html = html.replace('{{title}}', htmlEscape(title));
		html = html.replace('{{size}}', htmlEscape(size));
		html = html.replace('{{modified}}', htmlEscape(modified));

		return html;
	}

	function pathToName(path) {
		var parts = path.trim().split('/');
		var last = parts[parts.length - 1];
		if (last) {
			return last;
		}
		return parts[parts.length - 2] + '/';
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

	FileManager.ContentChange.withoutAnimation = function (path) {

		if (inProcess) {
			if (!isTryingAgain) {
				setTimeout(function() {
					FileManager.ContentChange.withoutAnimation(path);
				}, 800);
				isTryingAgain = true;
			}
			return;
		}

		inProcess = true;
		var loadingTemplate = document.querySelector('#scrollingContentLoadingTemplate').innerHTML;

		var el = document.querySelector('.scrolling-content');
		el.innerHTML = loadingTemplate;

		fillScrollingContent(path, el, function () {
			inProcess = false;
			isTryingAgain = false;
		});

	};

	FileManager.ContentChange.animateFromRightToLeft = function (path) {
		var parentEl, newEl, oldEl, template;

		oldEl = document.querySelector('.scrolling-content');
		parentEl = oldEl.parentNode;

		template = document.querySelector('#rightScrollingContentTemplate').innerHTML;
		parentEl.insertAdjacentHTML('afterbegin', template);
		newEl = document.querySelector('.right-scrolling-content');

		newEl.style.paddingTop = window.scrollY + 'px';

		fillScrollingContent(path, newEl, function () {
			oldEl.classList.add('left-scrolling-content');
			newEl.classList.remove('right-scrolling-content');
		});

	};

	FileManager.ContentChange.animateFromLeftToRight = function (path) {

		var parentEl, newEl, oldEl, template;

		oldEl = document.querySelector('.scrolling-content');
		parentEl = oldEl.parentNode;

		template = document.querySelector('#leftScrollingContentTemplate').innerHTML;
		parentEl.insertAdjacentHTML('afterbegin', template);
		newEl = document.querySelector('.left-scrolling-content');
		newEl.style.paddingTop = window.scrollY + 'px';

		fillScrollingContent(path, newEl, function () {
			oldEl.classList.add('right-scrolling-content');
			newEl.classList.remove('left-scrolling-content');
		});

	};

	function fillScrollingContent(path, el, callback) {
		if (path.indexOf('/') == -1) {
			FileManager.Containers.list(el, callback);

			var editButtonEl = document.querySelector('.edit-button');
			var doneButtonEl = document.querySelector('.done-button');
			if (editButtonEl.hasAttribute('hidden') && doneButtonEl.hasAttribute('hidden')) {
				FileManager.DoneButton.clickCallback();
			}

			FileManager.File.hideMenu();
			//document.querySelector('.open-button').setAttribute('hidden', 'hidden');
			document.querySelector('.execute-button').setAttribute('hidden', 'hidden');
		} else if (path.split('/').length == 2 || path.lastIndexOf('/') == path.length - 1) {
		  	FileManager.Files.list(path, el, callback);

			var editButtonEl = document.querySelector('.edit-button');
			var doneButtonEl = document.querySelector('.done-button');
			if (editButtonEl.hasAttribute('hidden') && doneButtonEl.hasAttribute('hidden')) {
				FileManager.DoneButton.clickCallback();
			}

			FileManager.File.hideMenu();
			//document.querySelector('.open-button').setAttribute('hidden', 'hidden');
			document.querySelector('.execute-button').setAttribute('hidden', 'hidden');
		} else {
			// load file
			FileManager.File.open(path, el, callback);
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

})();


document.addEventListener('click', function (e) {
	var el;

	if (el = is('sign-out-button')) {
		FileManager.SignOutButton.clickCallback(el);
	}

	if (document.body.classList.contains('disabled')) {
		return;
	}

	if (el = is('back-button')) {
		FileManager.BackButton.clickCallback(el);
	} else if (el = is('edit-button')) {
		FileManager.EditButton.clickCallback(el);
	} else if (el = is('done-button')) {
		FileManager.DoneButton.clickCallback(el);
	} else if (el = is('execute-button')) {
		FileManager.ExecuteButton.clickCallback(el);
	} else if (el = is('delete')) {
		FileManager.Item.deleteClickCallback(el);
		return;
	} else if (el = is('item')) {
		FileManager.Item.clickCallback(el);
	} else if (el = is('load-more-button')) {
		FileManager.LoadMoreButton.clickCallback(el);
	} else if (el = is('create-container-button')) {
		FileManager.CreateContainer.clickCallback(el);
	} else if (el = is('add-shared-button')) {
		//SHARED-CONTAINERS
		FileManager.AddShared.clickCallback(el);
	} else if (el = is('create-directory-button')) {
		FileManager.CreateDirectory.clickCallback(el);
	} else if (el = is('create-file-button')) {
		FileManager.CreateFile.clickCallback(el);
	} else if (el = is('delete-button')) {
		FileManager.ConfirmDelete.clickCallback(el);
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
		FileManager.SaveAs.clickCallback(el);
	} else if (el = is('content-type-button')) {
		FileManager.ContentType.clickCallback(el);
	} else if (el = is('cancel-upload-button')) {
		FileManager.UploadFiles.cancelClickCallback(el);
	} else if (el = is('execute-close-button')) {
		FileManager.Report.remove();
	} else if (el = is('execute-full-button')) {
		FileManager.Report.full(el);
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
			FileManager.CreateContainer.clickCallback();
			return;
		}

		FileManager.CreateContainer.clearErrors(e.target);
	}

	//SHARED-CONTAINERS
	if (e.target.classList.contains('add-shared-input-account')) {
		FileManager.AddShared.clearErrors(e.target);
	}

	//SHARED-CONTAINERS
	if (e.target.classList.contains('add-shared-input-container')) {
		if (e.which == 13) {
			FileManager.AddShared.clickCallback();
			return;
		}
		FileManager.AddShared.clearErrors(e.target);
	}

	if (e.target.classList.contains('create-directory-input')) {

		if (e.which == 13) {
			FileManager.CreateDirectory.clickCallback();
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
			FileManager.CreateFile.clickCallback();
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
			FileManager.SaveAs.clickCallback();
			return;
		}

		FileManager.SaveAs.clearErrors(e.target);
	}

	if (e.target.classList.contains('content-type-input')) {

		if (e.which == 13) {
			FileManager.ContentType.clickCallback();
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
		FileManager.UploadFiles.changeCallback(e.target.files);
		return;
	}

	if (e.target.parentNode.classList.contains('upload-as')) {
		FileManager.UploadAs.changeCallback(e.target.files);
		return;
	}

	if (e.target.parentNode.classList.contains('upload-execute')) {
		FileManager.UploadExecute.changeCallback(e.target.files[0]);
		return;
	}
});

window.addEventListener('hashchange', function (e) {
	var newPath = e.newURL.split('#')[1];

	if (e.oldURL.indexOf('#') == -1) {
		FileManager.ContentChange.withoutAnimation(newPath);
		return;
	}

	var oldPath = e.oldURL.split('#')[1];

	if (newPath.indexOf('/') == -1) {
		// in order to support returning from shared container //SHARED-CONTAINERS
		FileManager.ContentChange.animateFromLeftToRight(newPath);
	} else if (oldPath.indexOf('/') == -1) {
		// in order to support moving to shared container //SHARED-CONTAINERS
		FileManager.ContentChange.animateFromRightToLeft(newPath);
	} else if(newPath.indexOf(oldPath) === 0) {
		FileManager.ContentChange.animateFromRightToLeft(newPath);
	} else if (oldPath.indexOf(newPath) === 0) {
		FileManager.ContentChange.animateFromLeftToRight(newPath);
	} else {
		FileManager.ContentChange.withoutAnimation(newPath);
	}

});

document.addEventListener('transitionend', FileManager.ContentChange.transition);
document.addEventListener('webkitTransitionEnd', FileManager.ContentChange.transition);

document.addEventListener('DOMContentLoaded', function () {

	ZLitestackDotCom.init(callback);
	//ClusterAuth.init(callback);

	function callback() {
		if (!location.hash) {
			location.hash = ZLitestackDotCom.getAccount();
			//location.hash = ClusterAuth.getAccount();
		} else {
			FileManager.ContentChange.withoutAnimation(location.hash.substring(1));
		}
	}
});

window.addEventListener('scroll', function (e) {
	var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
	var position = window.scrollY;

	if (position == height) {
		if (location.hash.indexOf('/') == -1) {
			FileManager.Containers.loadMore();
		} else {
			FileManager.Files.loadMore();
		}
	}
});

window.addEventListener('resize', function (e) {
	FileManager.Layout.adjust();
});

function htmlEscape(str) {
	return String(str)
		.replace('&raquo;', '///')
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace('///', '&raquo;');
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

function bytesToSize(bytes, precision) {
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
}

function addLoadMoreButton(scrollingContentEl) {
	var html = document.querySelector('#loadMoreButtonTemplate').innerHTML;
	scrollingContentEl.insertAdjacentHTML('beforeend', html);
}