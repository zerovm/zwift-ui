'use strict';

var FileManager = {};

FileManager.ENABLE_SHARED_CONTAINERS = false;
FileManager.ENABLE_ZEROVM = true;
FileManager.ENABLE_EMAILS = false;

FileManager.Authentication = {};
FileManager.Authentication.el = document.querySelector('#Authentication');
FileManager.Authentication.el.onsubmit = function (e) {
	e.preventDefault();

	var v1AuthUrl = this.querySelector('input.v1-auth-url').value;
	var tenant = this.querySelector('input.tenant').value;
	var xAuthUser = this.querySelector('input.x-auth-user').value;
	var xAuthKey = this.querySelector('input.x-auth-key').value;

	SwiftV1.retrieveTokens({
		v1AuthUrl: v1AuthUrl,
		tenant: tenant,
		xAuthUser: xAuthUser,
		xAuthKey: xAuthKey,
		error: XHR_ERROR,
		ok: XHR_OK
	});

	function XHR_OK() {
		FileManager.Authentication.el.setAttribute('hidden', 'hidden');
		if (!location.hash) {
			location.hash = SwiftV1.getAccount();
		} else {
			FileManager.changeContent();
		}
		FileManager.Layout.adjust();
		FileManager.Authentication.refresh();
	}

	function XHR_ERROR() {
		alert(arguments[0] + ' ' + arguments[1]);
	}
};
FileManager.Authentication.el.querySelector('button.login-with-google').addEventListener('click', function () {
	liteauth.login(liteauth.AUTH_TYPES.GOOGLE);
});
FileManager.Authentication.load = function () {
	FileManager.Authentication.el.querySelector('input.v1-auth-url').value =
		document.location.protocol + '//' + document.location.host + '/auth/v1.0';
	if (liteauth.getLoginInfo()) {
		FileManager.Authentication.el.querySelector('input.tenant').value = liteauth.getLoginInfo().split(':')[1];
		FileManager.Authentication.el.querySelector('input.x-auth-user').value = liteauth.getLoginInfo().split(':')[0];

		liteauth.getProfile({
			success: function (response) {
				FileManager.Authentication.el.querySelector('input.x-auth-key').value =
					JSON.parse(response)['auth'].split('plaintext:')[1];
			},
			error: function (status, statusText) {
				alert(status + ' ' + statusText);
			}
		});
	}
};
FileManager.Authentication.load();
FileManager.Authentication.refresh = function () {
	SwiftV1.Account.head({success:function(){},error:function(){}});
	setTimeout(FileManager.Authentication.refresh, 1000 * 60 * 20);
};

FileManager.SignOutButton = {};
FileManager.SignOutButton.el = document.querySelector('.sign-out-button');
FileManager.SignOutButton.el.addEventListener('click', function () {
	window.location.reload(true);
});

FileManager.UpButton = {};
FileManager.UpButton.el = document.querySelector('.up-button');
FileManager.UpButton.el.addEventListener('click', function () {
	FileManager.CurrentDirLabel.showLoading();
	location.hash = FileManager.CurrentPath().up();
});
FileManager.UpButton.enable = function () {
	FileManager.UpButton.el.removeAttribute('disabled');
};
FileManager.UpButton.disable = function () {
	FileManager.UpButton.el.setAttribute('disabled', 'disabled');
};

FileManager.CreateContainerButton = {};
FileManager.CreateContainerButton.el = document.querySelector('button.create-container');
FileManager.CreateContainerButton.el.addEventListener('click', function () {
	FileManager.CreateContainerForm.open();
});
FileManager.CreateContainerButton.show = function () {
	FileManager.CreateContainerButton.el.removeAttribute('hidden');
};
FileManager.CreateContainerButton.hide = function () {
	FileManager.CreateContainerButton.el.setAttribute('hidden', 'hidden');
};

FileManager.CreateContainerForm = {};
FileManager.CreateContainerForm.el = document.querySelector('form.create-container');
FileManager.CreateContainerForm.el.addEventListener('submit', function (e) {
	e.preventDefault();

	var inputEl = FileManager.CreateContainerForm.el.querySelector('input.container-name');

	if (inputEl.value.length == 0) {
		FileManager.CreateContainerForm.showRequiredInputError();
		return;
	}

	if (inputEl.value.length > 256) {
		FileManager.CreateContainerForm.showInputSizeLimitError();
		return;
	}

	if (inputEl.value.indexOf('/') != -1) {

		if (FileManager.ENABLE_SHARED_CONTAINERS) {
			SharedContainersOnSwift.addSharedContainer({
				account: inputEl.value.split('/')[0],
				container: inputEl.value.split('/')[1],
				added: function () {
					FileManager.changeContent();
					FileManager.CreateContainerForm.el.setAttribute('hidden', 'hidden');
					FileManager.Layout.adjust();
				},
				error: errAjax
			});
			return;
		}

		FileManager.CreateContainerForm.showInvalidCharacterError();
		return;
	}

	SwiftV1.createContainer({
		containerName: inputEl.value,
		created: function () {
			FileManager.changeContent();
			FileManager.CreateContainerForm.el.setAttribute('hidden', 'hidden');
			FileManager.Layout.adjust();
		},
		alreadyExists: function () {
			err('err-already-exists');
		},
		error: errAjax
	});

	function err(className) {
		var errEl = FileManager.CreateContainerForm.el.querySelector('.' + className);
		errEl.removeAttribute('hidden');
		inputEl.removeAttribute('disabled');
		FileManager.Layout.adjust();
		inputEl.focus();
	}

	function errAjax(status, statusText) {
		var errAjaxEl = FileManager.CreateContainerForm.el.querySelector('.err-ajax');
		errAjaxEl.textContent = 'Ajax Error: ' + statusText + '(' + status + ').';
		errAjaxEl.removeAttribute('hidden');
		inputEl.removeAttribute('disabled');
		FileManager.Layout.adjust();
		inputEl.focus();
	}
});
FileManager.CreateContainerForm.el.querySelector('button.cancel').addEventListener('click', function () {
	FileManager.CreateContainerForm.close();
});
FileManager.CreateContainerForm.el.querySelector('input.container-name').onkeydown = function () {
	FileManager.CreateContainerForm.clearErrors();
};
FileManager.CreateContainerForm.open = function () {
	FileManager.CreateContainerForm.clearErrors();
	var inputEl = FileManager.CreateContainerForm.el.querySelector('input.container-name');
	inputEl.value = '';
	FileManager.CreateContainerForm.el.removeAttribute('hidden');
	inputEl.focus();
	FileManager.Layout.adjust();
};
FileManager.CreateContainerForm.close = function () {
	FileManager.CreateContainerForm.el.setAttribute('hidden', 'hidden');
	FileManager.Layout.adjust();
};
FileManager.CreateContainerForm.showRequiredInputError = function () {
	FileManager.CreateContainerForm.el.querySelector('.err-empty').removeAttribute('hidden');
	FileManager.Layout.adjust();
	FileManager.CreateContainerForm.el.querySelector('input.container-name').focus();
};
FileManager.CreateContainerForm.showInputSizeLimitError = function () {
	FileManager.CreateContainerForm.el.querySelector('.err-size-limit').removeAttribute('hidden');
	FileManager.Layout.adjust();
	FileManager.CreateContainerForm.el.querySelector('input.container-name').focus();
};
FileManager.CreateContainerForm.showInvalidCharacterError = function () {
	FileManager.CreateContainerForm.el.querySelector('.err-invalid-character').removeAttribute('hidden');
	FileManager.Layout.adjust();
	FileManager.CreateContainerForm.el.querySelector('input.container-name').focus();
};
FileManager.CreateContainerForm.clearErrors = function () {
	var errElements = FileManager.CreateContainerForm.el.querySelectorAll('.err');
	for (var i = 0; i < errElements.length; i++) {
		errElements[i].setAttribute('hidden', 'hidden');
	}
	FileManager.Layout.adjust();
};

FileManager.CreateDirectoryButton = {};
FileManager.CreateDirectoryButton.el = document.querySelector('button.create-directory');
FileManager.CreateDirectoryButton.el.addEventListener('click', function (e) {
	FileManager.CreateFileForm.close();
	FileManager.CreateDirectoryForm.open();
});
FileManager.CreateDirectoryButton.show = function () {
	FileManager.CreateDirectoryButton.el.removeAttribute('hidden');
};
FileManager.CreateDirectoryButton.hide = function () {
	FileManager.CreateDirectoryButton.el.setAttribute('hidden', 'hidden');
};

FileManager.CreateDirectoryForm = {};
FileManager.CreateDirectoryForm.el = document.querySelector('form.create-directory');
FileManager.CreateDirectoryForm.el.addEventListener('submit', function (e) {
	e.preventDefault();

	var inputEl = this.querySelector('input.directory-name');

	if (!inputEl.value) {
		this.querySelector('.err-empty').removeAttribute('hidden');
		FileManager.Layout.adjust();
		return;
	}

	if (inputEl.value.indexOf('/') !== -1) {
		this.querySelector('.err-invalid-character').removeAttribute('hidden');
		FileManager.Layout.adjust();
		return;
	}

	if (inputEl.value.length > 1024) {
		this.querySelector('.err-size-limit').removeAttribute('hidden');
		FileManager.Layout.adjust();
		return;
	}

	var dirName = inputEl.value + '/';
	var dirPath = FileManager.CurrentPath().add(dirName);
	var dirPathWithoutAccount = FileManager.Path(dirPath).withoutAccount();

	var requestArgs = {};

	requestArgs.path = dirPathWithoutAccount;

	if (FileManager.ENABLE_SHARED_CONTAINERS) {
		requestArgs.account = FileManager.CurrentPath().account();
	}

	requestArgs.success = function () {
		FileManager.CreateDirectoryForm.el.querySelector('.err-already-exists').removeAttribute('hidden');
		FileManager.Layout.adjust();
	};

	requestArgs.notExist = function () {

		SwiftV1.createDirectory({
			path: dirPathWithoutAccount,
			created: function () {
				FileManager.changeContent();
				FileManager.CreateDirectoryForm.close();
			},
			error: function (status, statusText) {
				var el = document.querySelector('.err-ajax');
				FileManager.AjaxError.show(el, status, statusText);
			}
		});

	};

	requestArgs.error = function (status, statusText) {
		var el = document.querySelector('.err-ajax');
		FileManager.AjaxError.show(el, status, statusText);
	};

	SwiftV1.checkDirectoryExist(requestArgs);
});
FileManager.CreateDirectoryForm.open = function () {
	FileManager.CreateDirectoryForm.el.removeAttribute('hidden');
	var inputEl = FileManager.CreateDirectoryForm.el.querySelector('input.directory-name');
	inputEl.value = '';
	inputEl.focus();
	FileManager.CreateDirectoryForm.clearErrors();
	FileManager.Layout.adjust();
};
FileManager.CreateDirectoryForm.close = function () {
	FileManager.CreateDirectoryForm.el.setAttribute('hidden', 'hidden');
	FileManager.Layout.adjust();
};
FileManager.CreateDirectoryForm.el.querySelector('button.cancel').addEventListener('click', function (e) {
	e.preventDefault();
	FileManager.CreateDirectoryForm.close();
});
FileManager.CreateDirectoryForm.clearErrors = function () {
	var err = FileManager.CreateDirectoryForm.el.querySelectorAll('.err');
	for (var i = 0; i < err.length; i++) {
		err[i].setAttribute('hidden', 'hidden');
	}
	FileManager.Layout.adjust();
};
FileManager.CreateDirectoryForm.el.querySelector('input.directory-name').addEventListener('keydown', function () {
	FileManager.CreateDirectoryForm.clearErrors();
});

FileManager.CreateFileButton = {};
FileManager.CreateFileButton.el = document.querySelector('button.create-file');
FileManager.CreateFileButton.show = function () {
	FileManager.CreateFileButton.el.removeAttribute('hidden');
};
FileManager.CreateFileButton.hide = function () {
	FileManager.CreateFileButton.el.setAttribute('hidden', 'hidden');
};
FileManager.CreateFileButton.el.addEventListener('click', function () {
	FileManager.CreateDirectoryForm.close();
	FileManager.CreateFileForm.open();
});

FileManager.CreateFileForm = {};
FileManager.CreateFileForm.el = document.querySelector('form.create-file');
FileManager.CreateFileForm.el.addEventListener('submit', function (e) {
	e.preventDefault();

	var nameEl = this.querySelector('input.file-name');
	var typeEl = this.querySelector('input.content-type');

	if (nameEl.value === '') {
		this.querySelector('.err-empty').removeAttribute('hidden');
		FileManager.Layout.adjust();
		return;
	}


	var filePath = FileManager.CurrentPath().add(nameEl.value);

	var requestArgs = {};
	requestArgs.path = FileManager.Path(filePath).withoutAccount();
	requestArgs.contentType = typeEl.value;
	requestArgs.data = '';

	if (FileManager.ENABLE_SHARED_CONTAINERS) {
		requestArgs.account = FileManager.CurrentPath().account();
	}

	requestArgs.created = function () {
		FileManager.CreateFileForm.close();
		FileManager.changeContent();
		FileManager.CreateFileForm.clearErrors();
	};

	requestArgs.error = function (status, statusText) {
		var el = FileManager.CreateFileForm.el.querySelector('.err-ajax');
		FileManager.AjaxError.show(el, status, statusText);
	};

	SwiftV1.createFile(requestArgs);
});
FileManager.CreateFileForm.open = function () {
	FileManager.CreateFileForm.el.removeAttribute('hidden');
	var nameEl = FileManager.CreateFileForm.el.querySelector('input.file-name');
	var typeEl = FileManager.CreateFileForm.el.querySelector('input.content-type');
	nameEl.value = '';
	typeEl.value = 'text/plain';
	nameEl.focus();
	FileManager.CreateFileForm.clearErrors();
	FileManager.Layout.adjust();
};
FileManager.CreateFileForm.close = function () {
	FileManager.CreateFileForm.el.setAttribute('hidden', 'hidden');
	FileManager.Layout.adjust();
};
FileManager.CreateFileForm.clearErrors = function () {
	var err = FileManager.CreateFileForm.el.querySelectorAll('.err');
	for (var i = 0; i < err.length; i++) {
		err[i].setAttribute('hidden', 'hidden');
	}
	FileManager.Layout.adjust();
};
FileManager.CreateFileForm.el.querySelector('button.cancel').addEventListener('click', function (e) {
	e.preventDefault();
	FileManager.CreateFileForm.close();
});

FileManager.ContainersList = {};
FileManager.ContainersList.LIMIT = 20;
FileManager.ContainersList.list = function () {
	var containersListEl = document.querySelector('.containers-list');

	var xhr = SwiftV1.listContainers({
		format: 'json',
		limit: FileManager.ContainersList.LIMIT,
		success: function (containers) {

			if (FileManager.ENABLE_SHARED_CONTAINERS) {
				var sharedContainers = SharedContainersOnSwift.getFromXhr(xhr);
				if (containers.length == 0 && sharedContainers.length == 0) {
					noContainers();
					return;
				}
				FileManager.Shared.listSharedContainers(sharedContainers, containersListEl);
			}

			list(containers);
		},
		error: function (status, statusText) {
			containersListEl.innerHTML = 'Error occurred: ' + status + ' ' + statusText;
		}
	});

	function list(containers) {

		FileManager.UpButton.disable();
		FileManager.CurrentDirLabel.root();

		if (containers.length == 0) {
			noContainers();
			return;
		}

		for (var i = 0; i < containers.length; i++) {
			var container = containers[i];
			var containerEl = FileManager.ContainersList.create(container);
			containersListEl.appendChild(containerEl);
		}

		if (containers.length == 20) {
			FileManager.LoadMoreButton.show();
		}

		if (document.documentElement.clientHeight - document.documentElement.scrollHeight <= 0) {
			FileManager.ContainersList.loadMore();
		}
	}

	function noContainers() {
		var html = document.querySelector('#noContainersTemplate').innerHTML;
		containersListEl.insertAdjacentHTML('beforeend', html);
	}

};
FileManager.ContainersList.loadMore = function () {
	FileManager.LoadMoreButton.loadingMessage();
	FileManager.LoadMoreButton.disable();

	var marker = document.querySelector('.item:last-child').getAttribute('title');

	SwiftV1.listContainers({
		marker: marker,
		format: 'json',
		limit: FileManager.ContainersList.LIMIT,
		success: function (containers) {

			if (containers.length == 0) {
				FileManager.LoadMoreButton.hide();
				return;
			}

			FileManager.LoadMoreButton.show();

			for (var i = 0; i < containers.length; i++) {
				var container = containers[i];
				var containerEl = FileManager.ContainersList.create(container);
				var containersListEl = document.querySelector('.containers-list');
				containersListEl.appendChild(containerEl);
			}

			FileManager.LoadMoreButton.loadMoreMessage();
			FileManager.LoadMoreButton.enable();

			if (document.documentElement.clientHeight - document.documentElement.scrollHeight <= 0) {
				FileManager.ContainersList.loadMore();
			}
		},
		error: error
	});

	function error(status, statusText) {
		var loadMoreEl = document.querySelector('.load-more-button');
		loadMoreEl.textContent = 'Error: ' + status + ' ' + statusText;
	}
};
FileManager.ContainersList.create = function (containerObj) {

	var name = FileManager.Utils.makeShortName(containerObj.name);
	var title = containerObj.name;
	var size = FileManager.Utils.bytesToSize(containerObj.bytes);
	var files = containerObj.count;

	var t = document.querySelector('.template-container').cloneNode(true);

	t.classList.remove('template');
	t.classList.remove('template-container');

	t.querySelector('.default-action').addEventListener('click', FileManager.DefaultAction.click);
	t.querySelector('.toggle-actions-menu').addEventListener('click', FileManager.ActionsMenu.click);
	t.querySelector('.name').textContent = name;
	t.setAttribute('title', title);
	t.querySelector('.size').textContent = size;
	t.querySelector('.files').textContent = files;

	return t;
};

FileManager.FilesList = {};
FileManager.FilesList.LIMIT = 20;
FileManager.FilesList.list = function () {
	var requestArgs = {};

	requestArgs.containerName = FileManager.CurrentPath().container();
	requestArgs.format = 'json';
	requestArgs.limit = FileManager.FilesList.LIMIT;
	requestArgs.delimiter = '/';

	if (FileManager.CurrentPath().isDirectory()) {
		requestArgs.prefix = FileManager.CurrentPath().prefix();
	}

	if (FileManager.ENABLE_SHARED_CONTAINERS) {
		requestArgs.account = FileManager.CurrentPath().account();
	}

	requestArgs.success = function (FILES) {
		var filesListEl = document.querySelector('.files-list');
		//scrollingContentEl.innerHTML = '';

		var files = FILES.slice(0); // copy (clone) array

		if (checkFirstFile(files)) {
			files = files.splice(1);
		}

		if (files.length == 0) {
			var html = document.querySelector('#noFilesTemplate').innerHTML;
			filesListEl.insertAdjacentHTML('beforeend', html);
			FileManager.LoadMoreButton.hide();

		} else {

			FileManager.FilesList.listHtml(files, filesListEl);

			if (FILES.length == 20) {
				FileManager.LoadMoreButton.show();
			}

			if (document.documentElement.clientHeight - document.documentElement.scrollHeight <= 0) {
				FileManager.FilesList.loadMore();
			}

		}

		FileManager.UpButton.enable();
		FileManager.CurrentDirLabel.setContent(FileManager.CurrentPath().name());

		function checkFirstFile(files) {
			var prefix = FileManager.CurrentPath().prefix();
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

	requestArgs.error = function error(status, statusText) {
		var filesListEl = document.querySelector('.files-list');
		//filesListEl.innerHTML = '';
		var loadingEl = document.querySelector('.item-loading') || document.querySelector('.scrolling-content-loading');
		loadingEl.textContent = 'Error: ' + status + ' ' + statusText;
	};

	requestArgs.notExist = FileManager.FilesList.notExist;

	SwiftV1.listFiles(requestArgs);
};
FileManager.FilesList.loadMore = function () {

	FileManager.LoadMoreButton.loadingMessage();
	FileManager.LoadMoreButton.disable();

	var filesArgs = {};

	filesArgs.containerName = FileManager.CurrentPath().container();
	filesArgs.delimiter = '/';
	filesArgs.format = 'json';
	filesArgs.limit = FileManager.FilesList.LIMIT;

	var lastFile = document.querySelector('.item:last-child').getAttribute('title');

	if (FileManager.CurrentPath().isDirectory()) {
		var prefix = FileManager.CurrentPath().prefix();
		filesArgs.marker = prefix + lastFile;
		filesArgs.prefix = prefix;
	} else {
		filesArgs.marker = lastFile;
	}

	if (FileManager.ENABLE_SHARED_CONTAINERS) {
		filesArgs.account = FileManager.CurrentPath().account();
	}

	filesArgs.success = function (files) {

		if (files.length == 0) {
			FileManager.LoadMoreButton.hide();
			return;
		}

		//el.insertAdjacentHTML('beforebegin', );
		var filesListEl = document.querySelector('.files-list');
		FileManager.FilesList.listHtml(files, filesListEl);
		FileManager.LoadMoreButton.loadMoreMessage();
		FileManager.LoadMoreButton.enable();

		if (document.documentElement.clientHeight - document.documentElement.scrollHeight <= 0) {
			FileManager.FilesList.loadMore();
		}
	};

	filesArgs.error =  function (status, statusText) {
		var loadMoreEl = document.querySelector('.load-more-button');
		loadMoreEl.textContent = 'Error: ' + status + ' ' + statusText;
	};

	filesArgs.notExist = FileManager.FilesList.notExist;

	SwiftV1.listFiles(filesArgs);
};
FileManager.FilesList.notExist = function () {
	var filesListEl = document.querySelector('.files-list');
	//scrollingContentEl.innerHTML = '';
	if (FileManager.CurrentPath().isContainersList()) {
		filesListEl.innerHTML = 'Container not exist.';
	} else {
		filesListEl.innerHTML = 'Directory not exist.';
	}
};
FileManager.FilesList.listHtml = function (files, filesListEl) {

	for (var i = 0; i < files.length; i++) {
		var file = files[i];

		if (file.hasOwnProperty('subdir') || file.content_type == 'application/directory') {
			filesListEl.appendChild(createDirectory(file));
		} else {
			filesListEl.appendChild(createFile(file));
		}
	}

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

		var newEl = document.querySelector('.template-directory').cloneNode(true);
		newEl.classList.remove('template-directory');
		newEl.classList.remove('template');
		newEl.querySelector('.name').textContent = name;
		newEl.setAttribute('title', title);
		newEl.querySelector('.default-action').addEventListener('click', FileManager.DefaultAction.click);
		newEl.querySelector('.toggle-actions-menu').addEventListener('click', FileManager.ActionsMenu.click);

		return newEl;
	}

	function createFile(file) {
		var _name = FileManager.Path(file.name).name();
		var icon = typeToIcon(file.content_type);
		var name = makeShortFileName(_name);
		var title = _name;
		var size = FileManager.Utils.bytesToSize(file.bytes);
		var modified = makeDatePretty(file.last_modified);
		var newEl = document.querySelector('.template-file').cloneNode(true)
		newEl.classList.remove('template-file');
		newEl.classList.remove('template');
		newEl.querySelector('span.file-icon').classList.add(icon);
		newEl.querySelector('.name').textContent = name;
		newEl.setAttribute('title', title);
		newEl.querySelector('.size').textContent = size;
		newEl.querySelector('.modified').textContent = modified;
		newEl.querySelector('.default-action').addEventListener('click', FileManager.DefaultAction.click);
		newEl.querySelector('.toggle-actions-menu').addEventListener('click', FileManager.ActionsMenu.click);
		return newEl;
	}

	function typeToIcon(type) {

		type = type.split(';')[0];
		var icon;

		if (type.indexOf('audio') == 0) {
			icon = 'audio';

		} else if (type == 'application/pdf') {
			icon = 'pdf';

		} else if (type.indexOf('image') == 0) {
			icon = 'pic';

		} else if (type.indexOf('video') == 0) {
			icon = 'video';

		} else if (type == 'application/msword' || type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
			icon = 'doc';

		} else if (type == 'application/vnd.ms-excel' || type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
			icon = 'xsl';

		} else if (type == 'application/vnd.ms-powerpoint' || type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
			icon = 'ppt';

		} else if (type == 'text/html' || type.toLowerCase().indexOf('xml') != -1) {
			icon = 'xml';

		} else if (type == 'text/x-python') {
			icon = 'py';

		} else if (type == 'text/x-lua') {
			icon = 'lua';

		} else if (type == 'application/x-tar' || type == 'application/zip' || type == 'application/gzip' || type == 'application/x-rar' || type == 'application/x-rar-compressed') {
			icon = 'tar';

		} else if (type == 'text/plain') {
			icon = 'txt';

		} else if (type == 'text/csv') {
			icon = 'csv';

		} else if (type == 'application/json') {
			icon = 'json';

		} else if (type == 'application/x-nexe') {
			icon = 'nexe';

		} else if (type == 'text/x-csrc' || type == 'text/x-chdr') {
			icon = 'c';

		} else {
			icon = 'none';
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

			filename = filename.substr(0, len) + '[...]' + ext;
			return filename;
		}

		return n.substr(0, len) + '[...]';
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
};

FileManager.Item = {};
FileManager.Item.selectedEl = null;
FileManager.Item.selectedPath = null;
FileManager.Item.showLoading = function (itemEl) {
	var loadingEl = document.querySelector('.template-item-loading').cloneNode(true);
	loadingEl.classList.remove('template');
	loadingEl.classList.remove('template-item-loading');
	itemEl.classList.add('clicked');
	itemEl.appendChild(loadingEl);
};

FileManager.LoadMoreButton = {};
FileManager.LoadMoreButton.el = document.querySelector('.load-more-button');
FileManager.LoadMoreButton.el.addEventListener('click', function (e) {
	if (FileManager.CurrentPath().isContainersList()) {
		FileManager.ContainersList.loadMore();
	} else {
		FileManager.FilesList.loadMore();
	}
});
FileManager.LoadMoreButton.show = function () {
	FileManager.LoadMoreButton.el.removeAttribute('hidden');
};
FileManager.LoadMoreButton.hide = function () {
	FileManager.LoadMoreButton.el.setAttribute('hidden', 'hidden');
};
FileManager.LoadMoreButton.loadingMessage = function () {
	FileManager.LoadMoreButton.el.textContent = 'Loading...';
};
FileManager.LoadMoreButton.loadMoreMessage = function () {
	FileManager.LoadMoreButton.el.textContent = 'Load More';
};
FileManager.LoadMoreButton.disable = function () {
	FileManager.LoadMoreButton.el.setAttribute('disabled', 'disabled');
};
FileManager.LoadMoreButton.enable = function () {
	FileManager.LoadMoreButton.el.removeAttribute('disabled');
};

FileManager.DefaultAction = {};
FileManager.DefaultAction.click = function (e) {
	var itemEl = e.currentTarget.parentNode;
	var name = itemEl.getAttribute('title');
	FileManager.Item.selectedPath = FileManager.CurrentPath().add(name);

	FileManager.Item.showLoading(itemEl);
	location.hash = FileManager.Item.selectedPath;
};

FileManager.ActionsMenu = {};
FileManager.ActionsMenu.click = function (e) {
	var itemEl = e.currentTarget.parentNode;
	FileManager.Item.selectedEl = itemEl;
	var filename = itemEl.getAttribute('title');
	FileManager.Item.selectedPath = FileManager.CurrentPath().add(filename);
    var href = SwiftV1.getStorageUrl() + FileManager.Item.selectedPath;
	var isNext = itemEl.nextSibling && itemEl.nextSibling.classList.contains('actions-menu');

	FileManager.ActionsMenu.removeForms();
	var actionsMenu = document.querySelector('#content .actions-menu');

	if (actionsMenu) {
		actionsMenu.parentNode.removeChild(actionsMenu);
	}

	if (!isNext) {
		var newActionsMenu = document.querySelector('.template-actions-menu').cloneNode(true);
		newActionsMenu.classList.remove('template-actions-menu');
		newActionsMenu.classList.remove('template');
		newActionsMenu.querySelector('button.metadata-action').addEventListener('click',
			FileManager.ActionsMenu.metadataAction);
		newActionsMenu.querySelector('button.delete-action').addEventListener('click',
			FileManager.ActionsMenu.deleteAction);
		var contentTypeActionEl = newActionsMenu.querySelector('button.content-type-action');
		var rightsActionEl = newActionsMenu.querySelector('button.rights-action');
        var downloadActionEl = newActionsMenu.querySelector('a.download-action');
		contentTypeActionEl.setAttribute('hidden', 'hidden');
		rightsActionEl.setAttribute('hidden', 'hidden');
        downloadActionEl.setAttribute('hidden', 'hidden');
		if (FileManager.Item.selectedEl.classList.contains('file')) {
			contentTypeActionEl.removeAttribute('hidden');
			contentTypeActionEl.addEventListener('click', FileManager.ActionsMenu.contentTypeAction);
			downloadActionEl.setAttribute('href', href);
			downloadActionEl.setAttribute('download', filename);
            downloadActionEl.removeAttribute('hidden');
		} else if (FileManager.Item.selectedEl.classList.contains('container')) {
			rightsActionEl.removeAttribute('hidden');
			rightsActionEl.addEventListener('click', FileManager.ActionsMenu.rightsAction);
		}
		itemEl.parentNode.insertBefore(newActionsMenu, itemEl.nextSibling);
	}
};
FileManager.ActionsMenu.removeForms = function () {
	FileManager.ConfirmDeleteForm.removeEl();
	FileManager.MetadataForm.removeEl();
	FileManager.ContentTypeForm.removeEl();
	FileManager.RightsForm.removeEl();
};
FileManager.ActionsMenu.deleteAction = function () {
	FileManager.ActionsMenu.removeForms();
	var newEl = FileManager.ConfirmDeleteForm.createNewEl();
	FileManager.ActionsMenu.insertForm(newEl);
};
FileManager.ActionsMenu.metadataAction = function () {
	FileManager.ActionsMenu.removeForms();
	var newEl = FileManager.MetadataForm.createNewEl();
	FileManager.ActionsMenu.insertForm(newEl);
	FileManager.MetadataForm.load();
};
FileManager.ActionsMenu.contentTypeAction = function() {
	FileManager.ActionsMenu.removeForms();
	var newEl = FileManager.ContentTypeForm.createNewEl();
	FileManager.ActionsMenu.insertForm(newEl);
	FileManager.ContentTypeForm.load();
};
FileManager.ActionsMenu.rightsAction = function () {
	FileManager.ActionsMenu.removeForms();
	var newEl = FileManager.RightsForm.createNewEl();
	FileManager.ActionsMenu.insertForm(newEl);
	FileManager.RightsForm.load();
};
FileManager.ActionsMenu.insertForm = function (formEl) {
	var actionsMenu = document.querySelector('#content .actions-menu');
	actionsMenu.parentNode.insertBefore(formEl, actionsMenu.nextSibling);
};

FileManager.ConfirmDeleteForm = {};
FileManager.ConfirmDeleteForm.removeEl = function () {
	var confirmDeleteForm = document.querySelector('#content .confirm-delete-form');

	if (confirmDeleteForm) {
		confirmDeleteForm.parentNode.removeChild(confirmDeleteForm);
	}
};
FileManager.ConfirmDeleteForm.createNewEl = function () {
	var newConfirmDeleteForm = document.querySelector('.template-confirm-delete-form').cloneNode(true);
	newConfirmDeleteForm.classList.remove('template-confirm-delete-form');
	newConfirmDeleteForm.classList.remove('template');
	newConfirmDeleteForm.addEventListener('submit', FileManager.ConfirmDeleteForm.submit);
	newConfirmDeleteForm.querySelector('.cancel').addEventListener('click', FileManager.ConfirmDeleteForm.cancel);
	return newConfirmDeleteForm;
};
FileManager.ConfirmDeleteForm.submit = function (e) {
	e.preventDefault();
	var name = FileManager.Item.selectedEl.title;
	var itemPath = FileManager.CurrentPath().add(name);
	var formEl = e.target;

	if (FileManager.Path(itemPath).isFile()) {
		SwiftV1.delete({
			path: FileManager.Path(itemPath).withoutAccount(),
			deleted: function () {
				FileManager.changeContent();
			},
			error: function(status, statusText) {
				var el = document.querySelector('.delete-error-ajax');
				FileManager.AjaxError.show(el, status, statusText);
			},
			notExist: function () {
				FileManager.changeContent();
			}
		});
	} else {
		recursiveDelete({
			path: FileManager.Path(itemPath).withoutAccount(),
			deleted: function () {
				FileManager.changeContent();
			},
			progress: function (total, deleted, status) {
				formEl.querySelector('.delete-status').innerHTML += total + '/' + deleted + ': ' + status + '<br>';
			},
			error: function(status, statusText) {
				var el = document.querySelector('.delete-error-ajax');
				FileManager.AjaxError.show(el, status, statusText);
			},
			notExist: function () {
				FileManager.changeContent();
			}
		});
	}
};
FileManager.ConfirmDeleteForm.cancel = function (e) {
	e.preventDefault();
	FileManager.ConfirmDeleteForm.removeEl();
};

FileManager.MetadataForm = {};
FileManager.MetadataForm.initialMetadata = null;
FileManager.MetadataForm.initialContentType = null;
FileManager.MetadataForm.metadataPath = null;
FileManager.MetadataForm.removeEl = function () {
	var metadataForm = document.querySelector('#content .metadata-form');

	if (metadataForm) {
		metadataForm.parentNode.removeChild(metadataForm);
	}
};
FileManager.MetadataForm.createNewEl = function () {
	var newMetadataForm = document.querySelector('.template-metadata-form').cloneNode(true);
	newMetadataForm.classList.remove('template-metadata-form');
	newMetadataForm.classList.remove('template');
	newMetadataForm.addEventListener('submit', FileManager.MetadataForm.submit);
	newMetadataForm.querySelector('button.metadata-cancel').addEventListener('click', FileManager.MetadataForm.cancel);
	return newMetadataForm;
};
FileManager.MetadataForm.load = function () {

	var name = FileManager.Item.selectedEl.title;
	var path = FileManager.CurrentPath().add(name);
	var formEl = document.querySelector('#content .metadata-form');
	var listEl = formEl.querySelector('.metadata-list');

	FileManager.MetadataForm.metadataPath = new FileManager.Path(path);

	clear();
	//formEl.getElementsByClassName('metadata-loading')[0].removeAttribute('hidden');

	formEl.removeAttribute('hidden');

	if (FileManager.CurrentPath().isContainersList()) {
		loadContainerMetadata();
	} else {
		loadFileMetadata();
	}

	function fillMetadataList(metadata) {
		var k = Object.keys(metadata);
		for (var i = 0; i < k.length; i++) {
			addRow(k[i], metadata[k[i]]);
		}
	}

	function addRow(k, v) {
		var newRow = formEl.getElementsByClassName('template')[0].cloneNode(true);
		newRow.classList.remove('template');
		newRow.removeAttribute('hidden');
		if (arguments.length === 2) {
			newRow.getElementsByClassName('metadata-key')[0].value = k;
			newRow.getElementsByClassName('metadata-value')[0].value = v;
		}
		newRow.querySelector('.metadata-remove').addEventListener('click', function (e) {
			var metadataRowEl = e.currentTarget.parentNode;
			document.querySelector('.metadata-list').removeChild(metadataRowEl);
		});
		listEl.appendChild(newRow);
	}

	function clear() {
		listEl.innerHTML = '';
		listEl.removeAttribute('hidden');
		formEl.getElementsByClassName('metadata-loading-error')[0].setAttribute('hidden', 'hidden');
		formEl.getElementsByClassName('metadata-updating')[0].setAttribute('hidden', 'hidden');
		formEl.getElementsByClassName('metadata-updated')[0].setAttribute('hidden', 'hidden');
		formEl.getElementsByClassName('metadata-updating-error')[0].setAttribute('hidden', 'hidden');
	}

	function loadContainerMetadata() {
		XHR();

		function XHR() {
			SwiftV1.getContainerMetadata({
				containerName: FileManager.MetadataForm.metadataPath.container(),
				success: XHR_OK,
				error: XHR_ERROR
			});
		}
	}

	function loadFileMetadata() {
		XHR();

		function XHR() {
			SwiftV1.getFileMetadata({
				path: FileManager.MetadataForm.metadataPath.withoutAccount(),
				success: XHR_FILE_OK,
				error: XHR_ERROR
			});
		}

		function XHR_FILE_OK(metadata, contentType) {
			FileManager.MetadataForm.initialContentType = contentType;
			XHR_OK(metadata);
		}
	}

	function XHR_OK(metadata) {
		FileManager.MetadataForm.initialMetadata = metadata;
		fillMetadataList(metadata);
		addRow();
		formEl.getElementsByClassName('metadata-loading')[0].setAttribute('hidden', 'hidden');
	}

	function XHR_ERROR(status, statusText) {
		var errorEl = formEl.getElementsByClassName('metadata-loading-error')[0];
		errorEl.getElementsByClassName('ajax-error-status-text')[0].textContent = statusText;
		errorEl.getElementsByClassName('ajax-error-status-code')[0].textContent = status;
		errorEl.removeAttribute('hidden');
	}

	listEl.onkeyup = function (e) {
		removeEmptyInputs(e.target);
		insureLastRowIsEmpty();
		clearHighlight();
		highlightDuplicatedKeys();

		function insureLastRowIsEmpty() {
			var elements = listEl.getElementsByClassName('metadata-key');
			if (elements[elements.length - 1].value !== '') {
				addRow();
			}
		}

		function clearHighlight() {
			var elements = listEl.getElementsByClassName('metadata-key');

			for (var i = 0; i < elements.length; i++) {
				elements[i].classList.remove('error-input');
			}
		}

		function highlightDuplicatedKeys() {
			var elements = listEl.getElementsByClassName('metadata-key');

			for (var i = 0; i < elements.length; i++) {
				if (elements[i].value === '') {
					continue;
				}

				for (var j = 0; j < elements.length; j++) {
					if (elements[i] == elements[j]) {
						continue;
					}
					if (elements[i].value == elements[j].value) {
						elements[i].classList.add('error-input');
						elements[j].classList.add('error-input');
					}
				}
			}
		}

		function removeEmptyInputs(ignoreEl) {
			var elements = listEl.getElementsByClassName('metadata-key');

			if (elements.length === 1) {
				return;
			}

			for (var i = 0; i < elements.length; i++) {
				if (elements[i] == ignoreEl) {
					continue;
				}
				if (elements[i].value === '') {
					removeInputRow(elements[i]);
				}
			}
		}

		function removeInputRow(inputEl) {
			var rowEl = inputEl;
			while (!rowEl.classList.contains('metadata-row')) {
				rowEl = rowEl.parentNode;
			}
			listEl.removeChild(rowEl);
		}
	};
};
FileManager.MetadataForm.submit = function (e) {
	e.preventDefault();

	var formEl = document.querySelector('#content .metadata-form');
	var listEl = formEl.querySelector('.metadata-list');

	formEl.getElementsByClassName('metadata-updating')[0].removeAttribute('hidden');
	listEl.setAttribute('hidden', 'hidden');
	var metadata = metadataFromMetadataList();

	if (FileManager.CurrentPath().isContainersList()) {
		updateContainerMetadata(metadata);
	} else {
		updateFileMetadata(metadata);
	}

	function metadataFromMetadataList() {
		var rows = listEl.getElementsByClassName('metadata-row');
		var metadata = {}, k, v;
		for (var i = 0; i < rows.length - 1; i++) {
			k = rows[i].getElementsByClassName('metadata-key')[0].value;
			v = rows[i].getElementsByClassName('metadata-value')[0].value;
			metadata[k] = v;
		}
		return metadata;
	}

	function metadataToRemove(metadata) {
		var metadataToRemoveList = [];
		var metadataToAddKeys = Object.keys(metadata);
		var initialKeys = Object.keys(FileManager.MetadataForm.initialMetadata);
		for (var i = 0; i < initialKeys.length; i++) {
			var initialKey = initialKeys[i];
			if (metadataToAddKeys.indexOf(initialKey) == -1) {
				metadataToRemoveList.push(initialKey);
			}
		}
		return metadataToRemoveList;
	}

	function updateContainerMetadata(metadata) {
		XHR();

		function XHR() {
			SwiftV1.updateContainerMetadata({
				containerName: FileManager.MetadataForm.metadataPath.container(),
				metadata: metadata,
				removeMetadata: metadataToRemove(metadata),
				updated: XHR_OK,
				error: XHR_ERROR
			});
		}
	}

	function updateFileMetadata(metadata) {
		XHR();

		function XHR() {
			SwiftV1.updateFileMetadata({
				path: FileManager.MetadataForm.metadataPath.withoutAccount(),
				contentType: FileManager.MetadataForm.initialContentType,
				metadata: metadata,
				removeMetadata: metadataToRemove(metadata),
				updated: XHR_OK,
				error: XHR_ERROR
			});
		}
	}

	function XHR_OK() {
		formEl.getElementsByClassName('metadata-updated')[0].setAttribute('hidden', 'hidden');
		setTimeout(function () {
			formEl.setAttribute('hidden', 'hidden');
		}, 1000);
	}

	function XHR_ERROR(status, statusText) {
		var errorEl = formEl.getElementsByClassName('metadata-updating-error')[0];
		errorEl.getElementsByClassName('ajax-error-status-text')[0].textContent = statusText;
		errorEl.getElementsByClassName('ajax-error-status-code')[0].textContent = status;
		errorEl.removeAttribute('hidden');
	}
};
FileManager.MetadataForm.cancel = function (e) {
	e.preventDefault();
	FileManager.MetadataForm.removeEl();
};

FileManager.ContentTypeForm = {};
FileManager.ContentTypeForm.createNewEl = function () {
	var newContentTypeForm = document.querySelector('.template-content-type-form').cloneNode(true);
	newContentTypeForm.classList.remove('template-content-type-form');
	newContentTypeForm.classList.remove('template');
	newContentTypeForm.addEventListener('submit', FileManager.ContentTypeForm.submit);
	newContentTypeForm.querySelector('button.cancel').addEventListener('click', FileManager.ContentTypeForm.cancel);
	newContentTypeForm.querySelector('input.content-type').value = '';
	newContentTypeForm.querySelector('input.content-type').addEventListener('keydown',
		FileManager.ContentTypeForm.inputKeydown);
	return newContentTypeForm;
};
FileManager.ContentTypeForm.removeEl = function () {
	var contentTypeForm = document.querySelector('#content form.content-type');

	if (contentTypeForm) {
		contentTypeForm.parentNode.removeChild(contentTypeForm);
	}
};
FileManager.ContentTypeForm.load = function () {
	var contentTypeForm = document.querySelector('#content form.content-type');
	contentTypeForm.querySelector('.loading').removeAttribute('hidden');
	contentTypeForm.querySelector('.loading-error').setAttribute('hidden', 'hidden');
	var name = FileManager.Item.selectedEl.title;
	var path = FileManager.CurrentPath().add(name);
	SwiftV1.File.head({
		path: FileManager.Path(path).withoutAccount(),
		success: function (metadata, contentType, contentLength, lastModified) {
			contentTypeForm.querySelector('input.content-type').value = contentType;
			contentTypeForm.querySelector('.loading').setAttribute('hidden', 'hidden');
		},
		error: function (status, statusText) {
			contentTypeForm.querySelector('.loading-error .status').textContent = status;
			contentTypeForm.querySelector('.loading-error .status-text').textContent = statusText;
			contentTypeForm.querySelector('.loading-error').removeAttribute('hidden');
			contentTypeForm.querySelector('.loading').setAttribute('hidden', 'hidden');
		}
	});
};
FileManager.ContentTypeForm.submit = function (e) {
	var contentTypeForm = document.querySelector('#content form.content-type');
	contentTypeForm.querySelector('.updating').removeAttribute('hidden');
	var name = FileManager.Item.selectedEl.title;
	var path = FileManager.CurrentPath().add(name);
	var contentType = contentTypeForm.querySelector('input.content-type').value;
	e.preventDefault();
	SwiftV1.File.post({
		path: FileManager.Path(path).withoutAccount(),
		contentType: contentType,
		updated: function () {
			contentTypeForm.querySelector('.updating').setAttribute('hidden', 'hidden');
			FileManager.ContentTypeForm.removeEl();
			FileManager.changeContent();
		},
		error: function (status, statusText) {
			contentTypeForm.querySelector('.err-ajax').textContent = 'Error: ' + status + ' ' + statusText;
			contentTypeForm.querySelector('.err-ajax').removeAttribute('hidden');
			contentTypeForm.querySelector('.updating').setAttribute('hidden', 'hidden');
		}
	});
};
FileManager.ContentTypeForm.cancel = function (e) {
	e.preventDefault();
	FileManager.ContentTypeForm.removeEl();
};
FileManager.ContentTypeForm.inputKeydown = function () {
	var contentTypeForm = document.querySelector('#content form.content-type');
	contentTypeForm.querySelector('.err-ajax').setAttribute('hidden', 'hidden');
};

FileManager.RightsForm = {};
FileManager.RightsForm.createNewEl = function () {
	var newEl = document.querySelector('form.template-rights').cloneNode(true);
	newEl.classList.remove('template');
	newEl.classList.remove('template-rights');
	newEl.addEventListener('submit', FileManager.RightsForm.submit);
	newEl.querySelector('button.cancel').addEventListener('click', FileManager.RightsForm.cancel);
	newEl.querySelector('input.read-rights').addEventListener('keydown', FileManager.RightsForm.inputKeydown);
	newEl.querySelector('input.write-rights').addEventListener('keydown', FileManager.RightsForm.inputKeydown);
	return newEl;
};
FileManager.RightsForm.load = function () {
	var rightsFormEl = document.querySelector('#content form.rights');
	rightsFormEl.querySelector('.loading').removeAttribute('hidden');
	var containerName = FileManager.Item.selectedEl.title;
	SwiftV1.Container.getRights({
		containerName: containerName,
		success: function (rights) {
			rightsFormEl.querySelector('.loading').setAttribute('hidden', 'hidden');
			rightsFormEl.querySelector('input.read-rights').value = rights.read;
			rightsFormEl.querySelector('input.write-rights').value = rights.write;
		},
		error: function (status, statusText) {
			rightsFormEl.querySelector('.loading-error .status').textContent = status;
			rightsFormEl.querySelector('.loading-error .status-text').textContent = statusText;
			rightsFormEl.querySelector('.loading-error').removeAttribute('hidden');
			rightsFormEl.querySelector('.loading').setAttribute('hidden', 'hidden');
		}
	});
};
FileManager.RightsForm.submit = function (e) {
	e.preventDefault();
	var rightsFormEl = document.querySelector('#content form.rights');
	rightsFormEl.querySelector('.updating').removeAttribute('hidden');
	var containerName = FileManager.Item.selectedEl.title;
	var readRights = rightsFormEl.querySelector('input.read-rights').value;
	var writeRights = rightsFormEl.querySelector('input.write-rights').value;
	SwiftV1.Container.updateRights({
		containerName: containerName,
		readRights: readRights,
		writeRights: writeRights,
		updated: function () {
			FileManager.RightsForm.removeEl();
		},
		error: function (status, statusText) {
			rightsFormEl.querySelector('.updating').setAttribute('hidden', 'hidden');
			var el = rightsFormEl.querySelector('.err-ajax');
			el.textContent = 'Error: ' + status + ' ' + statusText;
			el.removeAttribute('hidden');
		}
	});
};
FileManager.RightsForm.cancel = function (e) {
	e.preventDefault();
	FileManager.RightsForm.removeEl();
};
FileManager.RightsForm.removeEl = function () {
	var formEl = document.querySelector('#content form.rights');

	if (formEl) {
		formEl.parentNode.removeChild(formEl);
	}
};
FileManager.RightsForm.inputKeydown = function () {
	var rightsFormEl = document.querySelector('#content form.rights');
	rightsFormEl.querySelector('.err-ajax').setAttribute('hidden', 'hidden');
};

FileManager.OpenButton = {};
FileManager.OpenButton.el = document.querySelector('button.open-button');
FileManager.OpenButton.el.addEventListener('click', function () {
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
});
FileManager.OpenButton.show = function () {
	FileManager.OpenButton.el.removeAttribute('hidden');
};
FileManager.OpenButton.hide = function () {
	FileManager.OpenButton.el.setAttribute('hidden', 'hidden');
};

FileManager.ExecuteButton = {};
FileManager.ExecuteButton.el = document.querySelector('button.execute-button');
FileManager.ExecuteButton.el.addEventListener('click', function () {
	if (FileManager.ENABLE_ZEROVM) {
		if (FileManager.File.contentType.indexOf('text/x-python') != -1) {
			FileManager.executePython(FileManager.CurrentPath().get());
		} else {
			FileManager.execute(FileManager.File.codeMirror.getValue(), FileManager.File.contentType);
		}
	}
});
FileManager.ExecuteButton.hide = function () {
	FileManager.ExecuteButton.el.setAttribute('hidden', 'hidden');
};
FileManager.ExecuteButton.show = function () {
	FileManager.ExecuteButton.el.removeAttribute('hidden');
};

FileManager.ExecutingLabel = {};
FileManager.ExecutingLabel.el = document.querySelector('label.executing');
FileManager.ExecutingLabel.show = function () {
	FileManager.ExecutingLabel.el.removeAttribute('hidden');
	FileManager.ExecutingLabel.timer.start();
	FileManager.ExecutingLabel.update();
};
FileManager.ExecutingLabel.hide = function () {
	FileManager.ExecutingLabel.el.setAttribute('hidden', 'hidden');
	FileManager.ExecutingLabel.timer.stop();
};
FileManager.ExecutingLabel.update = function () {
	if (FileManager.ExecutingLabel.timer.isStopped()) {
		return;
	}
	var content = 'Executing... ' + FileManager.ExecutingLabel.timer.getTimeString();
	FileManager.ExecutingLabel.el.textContent = content;
	FileManager.ExecutingLabel.timer.next();
	setTimeout(FileManager.ExecutingLabel.update, 1000);
};
FileManager.ExecutingLabel.Timer = function () {
	var secondsCounter = -1;

	this.start = function () {
		secondsCounter = 0;
	};

	this.stop = function () {
		secondsCounter = -1;
	};

	this.isStopped = function () {
		return secondsCounter ==  -1;
	};

	this.next = function () {
		secondsCounter++;
	};

	this.getTimeString = function () {
		var minutes = Math.floor(secondsCounter / 60);
		var seconds = secondsCounter % 60;
		var secondsStr = seconds < 10 ? '0' + String(seconds) : String(seconds);
		var minutesStr = minutes < 10 ? '0' + String(minutes) : String(minutes);
		return minutesStr + ':' + secondsStr;
	};
};
FileManager.ExecutingLabel.timer = new FileManager.ExecutingLabel.Timer();

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

		if (newPathParts[newPathParts.length - 1] == '') {
			newPathParts.splice(-2);
		} else {
			newPathParts.splice(-1);
		}

		if (newPathParts.length == 1) {

			if (FileManager.ENABLE_SHARED_CONTAINERS && FileManager.Shared.isShared(newPathParts[0])) {
				return SwiftV1.getAccount();
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

		/*if (location.hash === '' && this.isContainersList()) {
		 return '/' + name;
		 }*/

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





















































FileManager.enableAll = function () {
	document.body.classList.remove('disabled');
};

FileManager.disableAll = function () {
	document.body.classList.add('disabled');
};

FileManager.isAllDisabled = function () {
	return document.body.classList.contains('disabled');
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

	if (FileManager.ENABLE_EMAILS) {
		/*Auth.getEmail(function (email) {
			FileManager.CurrentDirLabel.setContent(email);
			FileManager.CurrentDirLabel.setTooltip(email);
		});*/
		return;
	}

	var account = SwiftV1.getAccount();
	FileManager.CurrentDirLabel.setContent(account);
	FileManager.CurrentDirLabel.setTooltip(account);
};

FileManager.CurrentDirLabel.showLoading = function () {
	FileManager.CurrentDirLabel.setContent('Loading...');
	FileManager.CurrentDirLabel.removeTooltip();
};


FileManager.execute = function (data, contentType) {

	FileManager.disableAll();
	FileManager.ExecuteButton.hide();
	FileManager.ExecutingLabel.show();
	FileManager.OpenButton.hide();
	FileManager.FilesMenu.hide();

	ZeroVmOnSwift.execute({
		data: data,
		contentType: contentType,
		success: function (result, report) {
			FileManager.ExecutingLabel.hide();
			showResult(result);
			if (report) {
				FileManager.ExecuteReport.create(report);
			} else {
				alert('JS Error: report object is undefined');
			}

			FileManager.enableAll();
		},
		error: function (status, statusText, result) {
			alert(status + ' ' + statusText + ' ' + result);
			console.log(status + ' ' + statusText + ' ' + result);
			FileManager.ExecutingLabel.hide();
			showResult(result);
			FileManager.enableAll();
		}
	});

	function showResult(result) {
		FileManager.File.hideMenu();
		var el = document.querySelector('.scrolling-content');

		var editorEl = document.querySelector('.file-editor');
        editorEl.innerHTML = '';
		FileManager.File.codeMirror = CodeMirror(editorEl, {
			value: result,
			mode: 'text/plain',
			lineNumbers: true
		});
        
		FileManager.Layout.adjust();

	}
};

FileManager.executePython = function (pythonFilePath) {
	var json = [{
		exec: {
			path: 'file://python:python',
			args: '/dev/input'
		},
		file_list: [
			{
				device: 'input',
				path: 'swift://' + pythonFilePath
			},
			{
				device: 'stdout',
				content_type: 'text/plain'
			},
			{
				device: 'stderr',
				path: 'swift://' + pythonFilePath + '.log',
				content_type: 'text/plain'
			},
			{
				device: 'python'
			}
		],
		name: 'python'
	}];
	console.log(json);
	console.log(JSON.stringify(json));
	FileManager.execute(JSON.stringify(json), 'application/json');
};


FileManager.ExecuteReport = {};

FileManager.ExecuteReport.report = null;

FileManager.ExecuteReport.create = function (report) {

	FileManager.ExecuteReport.report = report;

	var scrollingContentEl = document.querySelector('.scrolling-content');
	var reportTemplate = document.querySelector('#reportTemplate').innerHTML;
	scrollingContentEl.innerHTML += reportTemplate;


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
			document.querySelector('#bytes-read-from-disk-tr').insertAdjacentHTML('beforeend', td(FileManager.Utils.bytesToSize(report.billing.nodes[i]['bytesReadFromDisk']) || '-'));

			document.querySelector('#writes-to-disk-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['writesToDisk'] || '-'));
			document.querySelector('#bytes-written-to-disk-tr').insertAdjacentHTML('beforeend', td(FileManager.Utils.bytesToSize(report.billing.nodes[i]['bytesWrittenToDisk']) || '-'));
			document.querySelector('#reads-from-network-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['readsFromNetwork'] || '-'));

			document.querySelector('#bytes-read-from-network-tr').insertAdjacentHTML('beforeend', td(FileManager.Utils.bytesToSize(report.billing.nodes[i]['bytesReadFromNetwork']) || '-'));
			document.querySelector('#writes-to-network-tr').insertAdjacentHTML('beforeend', td(report.billing.nodes[i]['writesToNetwork'] || '-'));
			document.querySelector('#bytes-written-to-network-tr').insertAdjacentHTML('beforeend', td(FileManager.Utils.bytesToSize(report.billing.nodes[i]['bytesWrittenToNetwork']) || '-'));
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
    if (billingEl) {
        billingEl.parentNode.removeChild(billingEl);
    }
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


FileManager.FilesMenu = {};

FileManager.FilesMenu.show = function () {
	document.querySelector('.menu-files').removeAttribute('hidden');
	FileManager.Layout.adjust();
};

FileManager.FilesMenu.hide = function () {
	document.querySelector('.menu-files').setAttribute('hidden', 'hidden');
	FileManager.Layout.adjust();
};


FileManager.UploadFiles = {};

FileManager.UploadFiles.uploadRequests = [];

FileManager.UploadFiles.change = function (files) {
	var el = document.querySelector('.upload-files');
	el.value = null;

	for (var i = 0; i < files.length; i++) {
		FileManager.UploadFiles.uploadFile(files[i], files[i].name, files[i].type);
	}

	FileManager.Layout.adjust();
};

FileManager.UploadFiles.uploadFile = function (file, name, contentType) {

	createUploadEl(name);
	var index = FileManager.UploadFiles.uploadRequests.length;
	var path = FileManager.CurrentPath().add(name);
	FileManager.UploadFiles.uploadRequests[index] = SwiftV1.createFile({
		path: FileManager.Path(path).withoutAccount(),
		data: file,
		contentType: contentType,
		created: function () {
			var el = document.querySelector('#upload-' + index);
			el.parentNode.removeChild(el);
			FileManager.changeContent();
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
			var el = document.querySelector('#upload-' + index + ' .error');
			FileManager.AjaxError.show(el, status, statusText);
		}
	});

	function createUploadEl(name) {
		var index = FileManager.UploadFiles.uploadRequests.length;
		var template = document.querySelector('#uploadTemplate').innerHTML;
		template = template.replace('{{upload-label-name}}', name);
		template = template.replace('{{upload-id}}', 'upload-' + index);
		document.querySelector('.menu-files').insertAdjacentHTML('beforeend', template);
	}
};

FileManager.UploadFiles.cancelClick  = function (el) {
	var index = parseInt(el.parentNode.parentNode.parentNode.id.substr('upload-'.length));
	FileManager.UploadFiles.uploadRequests[index].abort();
	el.parentNode.parentNode.parentNode.parentNode.removeChild(el.parentNode.parentNode.parentNode);
	FileManager.Layout.adjust();
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

	FileManager.Layout.adjust();
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


FileManager.File = {};

FileManager.File.codeMirror = null;

FileManager.File.contentType = '';

FileManager.File.open = function () {
	var el = document.querySelector('.file-editor');
	el.innerHTML = '';

	function fileExist(metadata, contentType, contentLength, lastModified) {
		var Current = FileManager.CurrentPath();
		var href = SwiftV1.getStorageUrl() + Current.get();
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
		document.querySelector('.download-link').setAttribute('download', filename);

		function isExecutable(contentType) {
			contentType = contentType.split(';')[0];
			return contentType === 'application/json' ||
				contentType === 'application/x-tar' ||
				contentType === 'application/gtar' ||
				contentType === 'text/x-python';
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
		FileManager.UpButton.enable();
		el.textContent = "File not found.";
	}

	function ajaxError(status, statusText) {
		FileManager.UpButton.enable();
		el.textContent = 'Error: ' + status + ' ' + statusText;
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
			FileManager.UpButton.enable();
		},
		notExist: function () {
			el.innerHTML = '';
			el.textContent = 'File Not Found.';
			FileManager.UpButton.enable();
		},
		progress: function (loaded) {
			el.innerHTML = loaded + ' bytes loaded... <button autocomplete="off" onclick="FileManager.File.getFileXhr.abort();">Cancel</button>';
			if (loaded > 2097152) {
				FileManager.File.getFileXhr.abort();
				el.innerHTML = 'File is too large (2MB+).';
				FileManager.UpButton.enable();
			}
		}
	};
	if (FileManager.ENABLE_SHARED_CONTAINERS) {
		args.account = FileManager.CurrentPath().account();
	}
	FileManager.File.getFileXhr = SwiftV1.getFile(args);

	function handleResponse(data, contentType) {
		el.innerHTML = '';

		var fileName = FileManager.CurrentPath().name();
		var filePath = FileManager.CurrentPath().get();
		FileManager.CurrentDirLabel.setContent(fileName);
		FileManager.CurrentDirLabel.setTooltip(filePath);

		FileManager.File.contentType = contentType;
		FileManager.File.codeMirror = CodeMirror(el, {
			value: data,
			mode: contentType.split(';')[0],
			lineNumbers: true
		});

		FileManager.File.showTxtButton();
		FileManager.File.showMenu();
		FileManager.UpButton.disable();
		document.querySelector('.menu-file button.save').setAttribute('disabled', 'disabled');
		document.querySelector('.menu-file button.undo').setAttribute('disabled', 'disabled');
		document.querySelector('.menu-file button.redo').setAttribute('disabled', 'disabled');

		FileManager.File.codeMirror.on('change', function () {
			document.querySelector('.menu-file button.undo').removeAttribute('disabled');
			document.querySelector('.menu-file button.save').removeAttribute('disabled');
		});

		document.querySelector('.menu-file button.save-as').classList.remove('selected');
		document.querySelector('.save-as-dialog').setAttribute('hidden', 'hidden');

		FileManager.Layout.adjust();
		FileManager.UpButton.enable();
	}
};

FileManager.File.notTextFile = function (el) {
	el.innerHTML = '';
	var fileName = FileManager.CurrentPath().name();
	FileManager.CurrentDirLabel.setContent(fileName);
	el.innerHTML = document.querySelector('#notTextFileTemplate').innerHTML;
	FileManager.File.hideTxtButton();
	FileManager.File.showMenu();
	FileManager.Layout.adjust();
	FileManager.UpButton.enable();
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

	var requestArgs = {};

	requestArgs.path = FileManager.CurrentPath().withoutAccount();
	requestArgs.contentType = FileManager.File.contentType;
	requestArgs.data = FileManager.File.codeMirror.getValue();

	if (FileManager.ENABLE_SHARED_CONTAINERS) {
		requestArgs.account = FileManager.CurrentPath().account();
	}

	requestArgs.created = function () {
		FileManager.File.codeMirror.clearHistory();
	};

	requestArgs.error = function (status, statusText) {
		var el = document.querySelector('.editor-toolbar-error');
		FileManager.AjaxError.show(el, status, statusText);

		document.querySelector('.menu-file button.save').removeAttribute('disabled');
		if (FileManager.File.codeMirror.historySize().undo > 0) {
			document.querySelector('.menu-file button.undo').removeAttribute('disabled');
		}
		if (FileManager.File.codeMirror.historySize().redo > 0) {
			document.querySelector('.menu-file button.redo').removeAttribute('disabled');
		}
	};

	SwiftV1.createFile(requestArgs);
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
		document.querySelector('.save-as-input-path').value = FileManager.CurrentPath().get();
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
			location.hash = path;
		},
		error: function (status, statusText) {
			var el = document.querySelector('.save-as-error-ajax');
			FileManager.AjaxError.show(el, status, statusText);
		}
	};

	if (FileManager.ENABLE_SHARED_CONTAINERS) {
		args.account = FileManager.Path(path).account();
	}

	SwiftV1.createFile(args);
};

FileManager.SaveAs.clearErrors = function () {
	document.querySelector('.save-as-input-path').classList.remove('invalid-input');
};


FileManager.changeContent = function () {
	document.querySelector('span.upload-files').setAttribute('hidden', 'hidden');
	document.querySelector('span.upload-as').setAttribute('hidden', 'hidden');
	document.querySelector('span.upload-execute').setAttribute('hidden', 'hidden');
	FileManager.CreateContainerButton.hide();
	FileManager.CreateDirectoryButton.hide();
	FileManager.CreateFileButton.hide();
	FileManager.CreateContainerForm.close();
	FileManager.CreateDirectoryForm.close();
	FileManager.CreateFileForm.close();
	document.querySelector('.menu-file').setAttribute('hidden', 'hidden');
	FileManager.OpenButton.hide();
	FileManager.ExecuteButton.hide();
	var filesList = document.querySelector('.files-list');
	var containersList = document.querySelector('.containers-list');
	var fileEditor = document.querySelector('.file-editor');
	filesList.setAttribute('hidden', 'hidden');
	filesList.innerHTML = '';
	containersList.setAttribute('hidden', 'hidden');
	containersList.innerHTML = '';
	fileEditor.setAttribute('hidden', 'hidden');
	fileEditor.innerHTML = '';
	FileManager.LoadMoreButton.hide();
    FileManager.ExecuteReport.remove();

	if (FileManager.CurrentPath().isContainersList()) {
		FileManager.ContainersList.list();
		FileManager.CreateContainerButton.show();
		containersList.removeAttribute('hidden');

	} else if (FileManager.CurrentPath().isFilesList()) {
		FileManager.FilesList.list();
		FileManager.CreateDirectoryButton.show();
		FileManager.CreateFileButton.show();
		document.querySelector('span.upload-files').removeAttribute('hidden');
		document.querySelector('span.upload-as').removeAttribute('hidden');
		document.querySelector('span.upload-execute').removeAttribute('hidden');
		filesList.removeAttribute('hidden');
	} else {
		// load file
		document.querySelector('.menu-file').removeAttribute('hidden');
		FileManager.File.open();
		fileEditor.removeAttribute('hidden');
	}
	FileManager.Layout.adjust();
};

FileManager.Layout = {};

FileManager.Layout.adjust = function () {
	var paddingTop = getComputedStyle(document.querySelector('.fixed-top'), null).getPropertyValue("height");
	document.querySelector('#content').style.paddingTop = paddingTop;


	//if (FileManager.File.codeMirror) {
	//	var pageHeight = getComputedStyle(document.querySelector('.fixed-background'), null).getPropertyValue("height");
	//	FileManager.File.codeMirror.setSize('auto', parseInt(pageHeight, 10) - parseInt(paddingTop, 10) + 'px');
	//}
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

	return name.substr(0, len) + '[..]';
};

FileManager.Utils.bytesToSize = function (bytes, precision) {
	bytes = Number(bytes);
	if (typeof bytes != 'number') {
		return '-';
	}
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

FileManager.AjaxError = {};

FileManager.AjaxError.show = function (el, status, statusText) {
	el.querySelector('.status').textContent = status;
	el.querySelector('.status-text').textContent = statusText;
	el.removeAttribute('hidden');
	FileManager.Layout.adjust();
};


window.addEventListener('hashchange', function (e) {
	FileManager.changeContent();
});

window.addEventListener('scroll', function (e) {
	var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
	var position = window.scrollY;

	if (position == height) {
		if (FileManager.CurrentPath().isContainersList()) {
			FileManager.ContainersList.loadMore();
		} else {
			FileManager.FilesList.loadMore();
		}
	}
});

window.addEventListener('resize', function (e) {
	FileManager.Layout.adjust();
});

document.addEventListener('click', function (e) {
	var el;

	if (document.body.classList.contains('disabled')) {
		return;
	}

	if (el = is('add-shared-button')) {
		//SHARED-CONTAINERS
		FileManager.AddShared.click(el);
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
	} else if (el = is('cancel-upload-button')) {
		FileManager.UploadFiles.cancelClick(el);
	} else if (el = is('execute-close-button')) {
		FileManager.ExecuteReport.remove();
	} else if (el = is('execute-full-button')) {
		FileManager.ExecuteReport.showFullReport(el);
	} else if (el = is('upload-as-button')) {
		FileManager.UploadAs.click(el);
	} else if (el = is('wide-button')) {
		var centerEls = document.querySelectorAll('.center');
		for (var i = 0; i < centerEls.length; i++) {
			centerEls[i].style.maxWidth = '100%';
		}
		el.setAttribute('hidden', 'hidden');
		document.querySelector('.fixed-background').style.width = '100%';
		document.querySelector('.unwide-button').removeAttribute('hidden');
	} else if (el = is('unwide-button')) {
		var centerEls = document.querySelectorAll('.center');
		for (var i = 0; i < centerEls.length; i++) {
			centerEls[i].style.maxWidth = '800px';
		}
		el.setAttribute('hidden', 'hidden');
		document.querySelector('.fixed-background').style.width = '800px';
		document.querySelector('.wide-button').removeAttribute('hidden');
	}

	function is(className) {
		var node1 = e.target;
		var node2 = node1.parentNode;
		var node3 = node2.parentNode;

		if (node1.classList.contains(className) && !node1.hasAttribute('disabled')) {
			return node1;
		}

		if (!node2.classList) {
			return;
		}

		if (node2.classList.contains(className) && !node2.hasAttribute('disabled')) {
			return node2;
		}

		if (!node3.classList) {
			return;
		}

		if (node3.classList.contains(className) && !node3.hasAttribute('disabled')) {
			return node3;
		}
	}
}, true);

document.addEventListener('keydown', function (e) {

	if (FileManager.ENABLE_SHARED_CONTAINERS && e.target.classList.contains('add-shared-input-account')) {
		FileManager.AddShared.clearErrors(e.target);
	}

	if (FileManager.ENABLE_SHARED_CONTAINERS && e.target.classList.contains('add-shared-input-container')) {
		if (e.which == 13) {
			FileManager.AddShared.click();
			return;
		}
		FileManager.AddShared.clearErrors(e.target);
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

document.addEventListener('load', function () {
	FileManager.Layout.adjust();
	setTimeout(FileManager.Layout.adjust, 1000);
});

//SHARED-CONTAINERS
FileManager.Shared = {};
FileManager.Shared.isShared = function (path) {
	return path.split('/')[0] != SwiftV1.getAccount();
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
			FileManager.changeContent();
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
