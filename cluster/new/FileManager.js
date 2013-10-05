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
		// FileStorage.getAccountId() used here to support returning from shared container
		newPath = FileStorage.getAccountId();
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
	FileManager.CurrentDirLabel.update(makeShortName(FileStorage.getAccountId()));
	/*
	FileStorage.getEmail({
		cache: function (email) {
			FileManager.CurrentDirLabel.update(makeShortName(email));
		},
		success: function (email) {
			FileManager.CurrentDirLabel.update(makeShortName(email));
		},
		error: function (message) {
			FileManager.CurrentDirLabel.update(makeShortName(FileStorage.getAccountId()));
			console.log(message);
		}
	});*/
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
	FileStorage.signOut();
};


FileManager.ExecuteButton = {};

FileManager.ExecuteButton.clickCallback = function () {

	document.querySelector('.open-button').setAttribute('hidden', 'hidden');
	document.querySelector('.execute-button').setAttribute('hidden', 'hidden');
	FileManager.ExecuteLabel.start();

	FileStorage.execute({
		dataToSend: FileManager.File.codeMirror.getValue(),
		dataType: 'application/json',
		success: function (result, report) {
			FileManager.ExecuteLabel.hide();
			FileManager.Report.create(report);
			showResult(result);
			FileManager.ExecuteLabel.executed();
		}
	});

	function showResult(blob) {
		var el = document.querySelector('.scrolling-content');
		var reader = new FileReader();

		reader.onloadend = function (e) {
			FileManager.File.hideMenu();
			FileManager.File.codeMirror = CodeMirror(el, {
				value: e.target.result,
				mode: 'text/plain',
				lineNumbers: false
			});
		}

		reader.readAsText(blob);
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
	FileManager.AddShared.clear();
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

	//disableAll();

	FileStorage.checkContainerExist({
		containerName: input,
		exist: function () {
			inputEl.classList.add('invalid-input');
			document.querySelector('.create-container-error-already-exist').removeAttribute('hidden');
			//enableAll();
		},
		notExist: function () {
			FileStorage.createContainer({
				containerName: input,
				created: function () {
					var currentPath = FileManager.Path.get();
					FileManager.ContentChange.withoutAnimation(currentPath);

					FileManager.CreateContainer.clear();

					//enableAll();
				},
				error: function () {

				}
			});
		},
		error: function () {

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


FileManager.AddShared = {};

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

	FileStorage.checkContainerExist({
		account: account,
		containerName: container,
		exist: function () {
			FileStorage.addSharedContainer({
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
				error: function () {

				}
			});
		},
		notExist: function () {
			sharedContainerEl.classList.add('invalid-input');
			document.querySelector('.add-shared-error').removeAttribute('hidden');

		},
		error: function () {
			sharedContainerEl.classList.add('invalid-input');
			document.querySelector('.add-shared-error').removeAttribute('hidden');

		}
	})
};

FileManager.AddShared.clear = function () {
	var inputAccountEl = document.querySelector('.add-shared-input-account');
	var inputContainerEl = document.querySelector('.add-shared-input-container');
	inputAccountEl.value = '';
	inputContainerEl.value = '';
	FileManager.AddShared.clearErrors(inputAccountEl, inputContainerEl);
};

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

	FileStorage.checkDirectoryExist({
		path: dirPath,
		exist: function () {
			inputEl.classList.add('invalid-input');
			document.querySelector('.create-directory-error-already-exist').removeAttribute('hidden');
		},
		notExist: function () {

			FileStorage.createDirectory({
				path: dirPath,
				created: function () {
					FileManager.ContentChange.withoutAnimation(FileManager.Path.get());
					FileManager.CreateDirectory.clear();
				},
				error: function () {

				}
			});

		},
		error: function () {

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

	FileStorage.createFile({
		path: FileManager.Path.removeAccount(path),
		contentType: typeEl.value,
		data: '',
		created: function () {
			FileManager.ContentChange.withoutAnimation(FileManager.Path.get());
			FileManager.CreateFile.clear();
		},
		error: function (message) {
			alert(message);
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
		uploadRequests[index] = FileStorage.uploadFile({
			path: path,
			file: file,
			uploaded: function () {
				var el = document.querySelector('#upload-' + index);
				el.parentNode.removeChild(el);
				FileManager.ContentChange.withoutAnimation(FileManager.Path.get());
				FileManager.Layout.adjust();
			},
			progress: function (percent) {
				document.querySelector('#upload-' + index + ' progress').value = percent;
				document.querySelector('#upload-' + index + ' .progresslabel').textContent = percent + '%';
			},
			error: function (message) {
				alert(message);
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

	var isSharedContainer = !currentPath.contains('/') && name.contains('/');

	if (isSharedContainer) {
		var account = name.split('/')[0];
		var container = name.split('/')[1];

		FileStorage.removeSharedContainer({
			account: account,
			container: container,
			removed: function () {
				FileManager.ContentChange.withoutAnimation(currentPath);
			},
			error: function (message) {
				el.parentNode.innerHTML = message;
			}
		});

		return;
	}

	var isContainerOrDirectory = !currentPath.contains('/') || name.endsWith('/');

	if (isContainerOrDirectory) {

		var containerName = newPath.split('/')[1];
		var prefix = newPath.split('/').splice(2).join('/');

		FileStorage.checkDirectoryHasFiles({
			containerName: containerName,
			prefix: prefix,
			hasFiles: function () {

				el.parentNode.innerHTML = 'Deleting... (Recursively)';

				FileStorage.recursiveDelete(containerName, prefix, function () {
					FileManager.ContentChange.withoutAnimation(currentPath);
				});

			},
			hasNotFiles: function () {

				FileStorage._delete({
					path: pathWithoutAccount,
					deleted: function () {
						FileManager.ContentChange.withoutAnimation(currentPath);
					},
					error: function (message) {
						el.parentNode.innerHTML = message;
					}
				});

			},
			error: function (message) {
				el.parentNode.innerHTML = message;
			}
		});

		return;
	}

	FileStorage._delete({
		path: pathWithoutAccount,
		deleted: function () {
			FileManager.ContentChange.withoutAnimation(currentPath);
		},
		error: function(message) {
			el.parentNode.innerHTML = message;
		}
	});
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

		var maybeSharedContainer = name.contains('/');
		var isDirectory = name.endsWith('/');

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
		document.querySelector('.metadata-table tbody').innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
		var path = FileManager.Item.selectedPath;

		FileStorage.getMetadata({
			account: path.split('/')[0],
			path: FileManager.Path.removeAccount(path),
			success: function (metadata) {
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
			},
			error: function (message) {
				document.querySelector('.metadata-table tbody').innerHTML = '<tr><td colspan="3">'+message+'</td></tr>';
			}
		});
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
			account: path.split('/')[0],
			path: FileManager.Path.removeAccount(path),
			metadataToAdd: metadataToAdd(),
			metadataToRemove: metadataToRemove(),
			updated: function () {
				FileManager.Metadata.show();
			},
			error: function (message) {
				document.querySelector('.metadata-table tbody').innerHTML = '<tr><td colspan="3">'+message+'</td></tr>';
			}
		};
		document.querySelector('.metadata-table tbody').innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
		document.querySelector('.metadata-table tfoot').setAttribute('hidden', 'hidden');

		FileStorage.updateMetadata(args);

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

	FileStorage.getFileContentType({
		path: FileManager.Path.removeAccount(path),
		success: function (contentType) {

			document.querySelector('.content-type-table .content-type-input').value = contentType;
			document.querySelector('.content-type-table .loading').setAttribute('hidden', 'hidden');
			document.querySelector('.content-type-table .input-group-table').removeAttribute('hidden');
		},
		error: function (message) {
			alert(message);
		}
	});
};

FileManager.ContentType.clickCallback = function () {
	document.querySelector('.content-type-table .loading').removeAttribute('hidden');
	document.querySelector('.content-type-table .input-group-table').setAttribute('hidden', 'hidden');
	var input = document.querySelector('.content-type-table .content-type-input').value;
	var path = FileManager.Item.selectedPath;

	FileStorage.updateFileContentType({
		path: FileManager.Path.removeAccount(path),
		contentType: input,
		updated: function () {
			FileManager.ContentChange.withoutAnimation(FileManager.Path.get());
		},
		error: function (message) {
			alert(message);
		}
	});
};


FileManager.File = {};

FileManager.File.codeMirror = null;

FileManager.File.contentType = '';

FileManager.File.open = function (path, el, callback) {

	FileStorage.checkFileExist({
		path: FileManager.Path.removeAccount(path),
		exist: function (xhr) {
			var contentType = xhr.getResponseHeader('Content-Type');
			var size = xhr.getResponseHeader('Content-Length');

			if (isEditable(contentType, size)) {
				FileManager.File.edit(path, el);
			} else {
				el.textContent = "Not text file.";
			}

			document.querySelector('.edit-button').setAttribute('hidden', 'hidden');
			document.querySelector('.done-button').setAttribute('hidden', 'hidden');

			document.querySelector('.open-button').removeAttribute('hidden');
			document.querySelector('.execute-button').removeAttribute('hidden');

			callback();
		},
		notExist: function () {
			FileManager.BackButton.enable();
			el.textContent = "File not found.";
			callback();
		},
		error: function (message) {
			el.textContent = message;
			callback();
			FileManager.BackButton.enable();
		}
	});


	function isEditable(contentType, size) {

		if (!contentType) {
			return false;
		}

		var editable = false;
		var megabyte = 1024 * 1024;
		var maxSize = 3*megabyte;

		contentType = contentType.split(';')[0];

		if ((size < maxSize) && (contentType == 'application/javascript'
			|| contentType == 'application/xml'
			|| contentType == 'application/x-httpd-php'
			|| contentType == 'application/json'
			|| contentType == 'application/php'
			|| contentType == 'application/x-php'
			|| contentType.startsWith('text'))) {

			editable = true;
		}
		return editable;
	}
};

FileManager.File.edit = function (path, el) {
	FileStorage.getFile({
		account: path.split('/')[0],
		path: FileManager.Path.removeAccount(path),
		success: function (data, xhr) {
			handleResponse(data, xhr);
		},
		error: function (message) {
			el.textContent = message;
			FileManager.BackButton.enable();
		}
	});

	function handleResponse(data, xhr) {

		var fileName = path.split('/').pop();
		FileManager.CurrentDirLabel.update(fileName);
		var contentType = xhr.getResponseHeader('Content-Type');


		FileManager.File.contentType = contentType;
		FileManager.File.codeMirror = CodeMirror(el, {
			value: data,
			mode: contentType,
			lineNumbers: true
		});

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

	FileStorage.createFile({
		path: FileManager.Path.get().split('/').splice(1).join('/'),
		contentType: FileManager.File.contentType,
		data: FileManager.File.codeMirror.getValue(),
		created: function () {
			FileManager.File.codeMirror.clearHistory();
		},
		error: function (message) {
			alert(message);
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

	FileStorage.createFile({
		path: FileManager.Path.removeAccount(path),
		contentType: typeEl.value,
		data: FileManager.File.codeMirror.getValue(),
		created: function () {
			FileManager.DoneButton.clickCallback();
			location.hash = path;
		},
		error: function (message) {
			alert(message);
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

		FileStorage.listContainers({
			success: list,
			error: function (m) { console.log(m); }
		});

		function list(containers, sharedContainers) {

			FileManager.BackButton.disable();
			FileManager.CurrentDirLabel.root();

			if (containers.length == 0 && sharedContainers.length == 0) {
				noContainers();
				callback();
				return;
			}

			listContainers(containers);
			//listShared(sharedContainers);
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

		function listShared(sharedContainers) {
			for (var i = 0; i < sharedContainers.length; i++) {
				addShared(sharedContainers[i]);
				updateShared(sharedContainers[i]);
			}
		}

		function addShared(sharedContainer) {
			var html = createShared(sharedContainer);
			scrollingContentEl.insertAdjacentHTML('afterbegin', html);
		}

		function updateShared(path) {

			var account = path.substring(0, path.indexOf('/'));
			var container = path.substring(path.indexOf('/') + 1);

			FileStorage.getContainerSize({
				account: account,
				containerName: container,
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

			function error(message) {
				var selector = '.item[title="' + path + '"]';
				var el = scrollingContentEl.querySelector(selector);
				el.querySelector('.size').textContent = message;
				console.log(message);
			}
		}

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

		FileStorage.containersAfterMarker({
			marker: marker,
			success: function (containers) {

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

		function error(message) {
			var loadingEl = document.querySelector('.load-more-button');
			loadingEl.textContent = message;
			console.log(message);
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
		requestArgs.account = pathComponents[0];
		requestArgs.containerName = pathComponents[1];
		requestArgs.delimiter = '/';

		if (pathComponents.length > 2) {
			requestArgs.prefix = pathComponents.slice(2).join('/');
		}

		FileStorage.listFiles(requestArgs);


		function error(message) {
			var loadingEl = document.querySelector('.item-loading') || document.querySelector('.scrolling-content-loading');
			loadingEl.textContent = message;
			console.log(message);
		}

		function list(_files) {

			var files = _files.slice(0); // copy (clone) array

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

				if (_files.length == 20) {
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
			success: function (files) {

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
			error: error
		};

		if (pathComponents.length > 2) {
			filesArgs.prefix = pathComponents.splice(2).join('/');
		}


		FileStorage.filesAfterMarker(filesArgs);

		function error(message) {
			var loadingEl = document.querySelector('.load-more-button');
			loadingEl.textContent = message;
			console.log(message);
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
			var loadingEl = document.querySelector('.scrolling-content-loading');
			loadingEl.parentNode.removeChild(loadingEl);
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
			var loadingEl = document.querySelector('.item-loading');
			loadingEl && loadingEl.parentNode.removeChild(loadingEl);

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
			var loadingEl = document.querySelector('.item-loading');
			loadingEl && loadingEl.parentNode.removeChild(loadingEl);


			oldEl.classList.add('right-scrolling-content');
			newEl.classList.remove('left-scrolling-content');
		});

	};

	function fillScrollingContent(path, el, callback) {
		if (path.indexOf('/') == -1) {
			FileManager.Containers.list(el, callback);
			//FileManager.DoneButton.clickCallback();
			FileManager.File.hideMenu();
			document.querySelector('.open-button').setAttribute('hidden', 'hidden');
			document.querySelector('.execute-button').setAttribute('hidden', 'hidden');
		} else if (path.split('/').length == 2 || path.lastIndexOf('/') == path.length - 1) {
		  	FileManager.Files.list(path, el, callback);
			//FileManager.DoneButton.clickCallback();
			FileManager.File.hideMenu();
			document.querySelector('.open-button').setAttribute('hidden', 'hidden');
			document.querySelector('.execute-button').setAttribute('hidden', 'hidden');
		} else {
			// load file
			FileManager.File.open(path, el, callback);
		}
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
	}

	if (el = is('edit-button')) {
		FileManager.EditButton.clickCallback(el);
	}

	if (el = is('done-button')) {
		FileManager.DoneButton.clickCallback(el);
	}
	if (el = is('execute-button')) {
		FileManager.ExecuteButton.clickCallback(el);
	}

	if (el = is('delete')) {
		FileManager.Item.deleteClickCallback(el);
		return;
	}

	if (el = is('item')) {
		FileManager.Item.clickCallback(el);
	}

	if (el = is('load-more-button')) {
		FileManager.LoadMoreButton.clickCallback(el);
	}

	if (el = is('create-container-button')) {
		FileManager.CreateContainer.clickCallback(el);
	}

	if (el = is('add-shared-button')) {
		FileManager.AddShared.clickCallback(el);
	}

	if (el = is('create-directory-button')) {
		FileManager.CreateDirectory.clickCallback(el);
	}

	if (el = is('create-file-button')) {
		FileManager.CreateFile.clickCallback(el);
	}

	if (el = is('delete-button')) {
		FileManager.ConfirmDelete.clickCallback(el);
	}

	if (el = is('metadata-save')) {
		FileManager.Metadata.save(el);
	}

	if (el = is('metadata-discard-changes')) {
		FileManager.Metadata.discardChanges(el);
	}

	if (el = is('remove-metadata')) {
		FileManager.Metadata.remove(el);
	}

	if (el = is('undo')) {
		FileManager.File.undo();
	}

	if (el = is('redo')) {
		FileManager.File.redo();
	}

	if (el = is('save')) {
		FileManager.File.save();
	}

	if (el = is('save-as')) {
		FileManager.File.saveAs(el);
	}

	if (el = is('save-as-button')) {
		FileManager.SaveAs.clickCallback(el);
	}

	if (el = is('content-type-button')) {
		FileManager.ContentType.clickCallback(el);
	}

	if (el = is('cancel-upload-button')) {
		FileManager.UploadFiles.cancelClickCallback(el);
	}

	if (el = is('execute-close-button')) {
		FileManager.Report.remove();
	}

	if (el = is('execute-full-button')) {
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

	if (e.target.classList.contains('add-shared-input-account')) {

		FileManager.AddShared.clearErrors(e.target);
	}

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
		// in order to support returning from shared container
		FileManager.ContentChange.animateFromLeftToRight(newPath);
	} else if (oldPath.indexOf('/') == -1) {
		// in order to support moving to shared container
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
	if (!location.hash) {
		location.hash = FileStorage.getAccountId();
	} else {
		FileManager.ContentChange.withoutAnimation(location.hash.substring(1));
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