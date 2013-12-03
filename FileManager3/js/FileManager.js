'use strict';

Auth.useZLitestackDotCom();

var FileManager,
	authInit = new CustomEvent("authInit");
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


FileManager.AccountLabel = {};

FileManager.AccountLabel.init = function () {

};



FileManager.CurrentDirLabel = {};

FileManager.CurrentDirLabel.MAX_LENGTH = 40;

FileManager.CurrentDirLabel.setContent = function (content, isArrowsSeparated) {
	var el = document.querySelector('.current-dir-label'),
		splittedContent, i, prevValue, joiner = "/";
	el.classList.add("hidden");
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
	if(!content){
		el.innerHTML = content;
		return;
	}
	if(isArrowsSeparated){
		joiner = "<img class='path-separator' src='img/go.png'/>";
	}
	content = content.split("/").map(function(pathPart){
		return pathPart ? "<a href='#' data-hash='" + pathPart + "'>" + pathPart + "</a>" : "";
	}).join(joiner);
	el.innerHTML = content;
	el.classList.remove("hidden");
};

FileManager.CurrentDirLabel.root = function () {

	if (FileManager.ENABLE_EMAILS) {
		Auth.getEmail(function (email) {
			FileManager.CurrentDirLabel.setContent(email);
		});
		return;
	}

	var account = Auth.getAccount();
	FileManager.CurrentDirLabel.setContent(account);
};

FileManager.CurrentDirLabel.showLoading = function () {
	FileManager.CurrentDirLabel.setContent('Loading...');
};

FileManager.OpenButton = {};

FileManager.OpenButton.click = function () {

	var options = {
		path: FileManager.CurrentPath().withoutAccount(),
		callback: function (message) {
			console.log(message);
			//FileManager.ExecuteButton.hide();
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




FileManager.LoadMoreButton = {};

FileManager.LoadMoreButton.click = function () {
	if (FileManager.CurrentPath().isContainersList()) {
		window.FileManager.toolbox.onscrollLoadMore(window.FileManager.elements.scrollWrapper);
	} else {
		window.FileManager.files.loadMore();
	}
};

FileManager.File = {};

FileManager.File.getFileXhr = null;

FileManager.File.edit = function (el) {
	var args = {
		path: FileManager.CurrentPath().withoutAccount(),
		success: handleResponse,
		error: function (status, statusText) {
			el.innerHTML = '';
			el.textContent = 'Error occurred: ' + status + ' ' + statusText;
			window.FileManager.elements.upButton.removeAttribute('disabled');
		},
		notExist: function () {
			el.innerHTML = '';
			el.textContent = 'File Not Found.';
			window.FileManager.elements.upButton.removeAttribute('disabled');
		},
		progress: function (loaded) {
			el.innerHTML = loaded + ' bytes loaded... <button onclick="FileManager.File.getFileXhr.abort();">Cancel</button>';
			if (loaded > 2097152) {
				FileManager.File.getFileXhr.abort();
				el.innerHTML = 'File is too large (2MB+).';
				window.FileManager.elements.upButton.removeAttribute('disabled');
			}
		}
	};
	window.FileManager.elements.upButton.setAttribute('disabled', 'disabled');
	if (FileManager.ENABLE_SHARED_CONTAINERS) {
		args.account = FileManager.CurrentPath().account();
	}
	FileManager.File.getFileXhr = SwiftV1.getFile(args);

	function handleResponse(data, contentType) {
		var fileName = FileManager.CurrentPath().name();

		el.removeChildren();
		FileManager.CurrentDirLabel.setContent(fileName);

		window.FileManager.fileEditor.show(data, contentType, fileName);
		FileManager.File.showMenu();
		FileManager.File.showTxtButton();

		window.FileManager.elements.upButton.removeAttribute('disabled');
	}
};

FileManager.File.notTextFile = function (el) {
	el.innerHTML = '';
	var fileName = FileManager.CurrentPath().name();
	FileManager.CurrentDirLabel.setContent(fileName);
	el.innerHTML = document.querySelector('#notTextFileTemplate').innerHTML;
	FileManager.File.hideTxtButton();
	window.FileManager.elements.upButton.removeAttribute('disabled');
};

FileManager.File.showMenu = function () {
	document.querySelector('.menu-file').removeAttribute('hidden');
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

		window.FileManager.elements.upButton.setAttribute('disabled', 'disabled');
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

		window.FileManager.toolbox.onscrollLoadMore(window.FileManager.elements.scrollWrapper);
	}

	function noContainers() {
		var html = document.querySelector('#noContainersTemplate').innerHTML;
		scrollingContentEl.insertAdjacentHTML('beforeend', html);
	}

};

FileManager.Containers.loadMore = function () {

	document.body.classList.add(FileManager.elements.bodyLoadingClass);
	if (!document.querySelector('.load-more-button')) {//TODO: change condition
		document.body.classList.remove(FileManager.elements.bodyLoadingClass);
		return;
	}
	document.querySelector('.load-more-button').textContent = 'Loading...';
	document.querySelector('.load-more-button').setAttribute('disabled', 'disabled');

	var marker = document.querySelector('.item:nth-last-child(2)').dataset.path;

	SwiftV1.listContainers({
		marker: marker,
		format: 'json',
		limit: FileManager.Containers.LIMIT,
		success: function (containers) {
			document.body.classList.remove(FileManager.elements.bodyLoadingClass);
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

			window.FileManager.toolbox.onscrollLoadMore(window.FileManager.elements.scrollWrapper);
		},
		error: error
	});

	function error(status, statusText) {
		var loadingEl = document.querySelector('.load-more-button');
		document.body.classList.remove(FileManager.elements.bodyLoadingClass);
		loadingEl.textContent = 'Error: ' + status + ' ' + statusText;
	}
};

FileManager.Containers.create = function (containerObj) {

	var name = FileManager.toolbox.makeShortName(containerObj.name);
	var title = containerObj.name;
	var slashStr = "/";
	var path = title.indexOf(slashStr) === -1 ? title + slashStr : title;
	var size = FileManager.toolbox.shortenSize(containerObj.bytes);
	var files = containerObj.count;

	var html = document.querySelector('#containerTemplate').innerHTML;

	html = html.replace('{{name}}', FileManager.toolbox.escapeHTML(name));
	html = html.replace('{{path}}', FileManager.toolbox.escapeHTML(path));
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
		return path === Auth.getAccount() + "/";
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
		/*var newPathParts = path.split('/');

		if (newPathParts[newPathParts.length - 1] == '') {
			newPathParts.splice(0);
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

		return newPathParts.join('/') + '/';*/

		var resultPath = path.split('/').filter(function(s){return s;});
		resultPath.pop();
		return resultPath.length && resultPath.join("/") + "/";
	};
	this.add = function (name) {

		/*if (FileManager.ENABLE_SHARED_CONTAINERS && this.isContainersList() && name.indexOf('/') != -1) {
			return name;
		}*/
		return  path + name;
	};
	return this;
};

FileManager.CurrentPath = function () {
	return FileManager.Path(location.hash.substr(1));
};

document.addEventListener('click', function (e) {
	var el;

	if (document.body.classList.contains('disabled')) {
		return;
	}

	 if (el = FileManager.toolbox.getParentByClassName(e.target,'three-dot')) {
		FileManager.item.toggleMenu(el);
	} else if (el = FileManager.toolbox.getParentByClassName(e.target,'item')) {
		FileManager.item.click(el);
	} else if (FileManager.toolbox.getParentByClassName(e.target,'load-more-button')) {
		FileManager.LoadMoreButton.click();
	} else if (el = FileManager.toolbox.getParentByClassName(e.target,'add-shared-button')) {
		//SHARED-CONTAINERS
		FileManager.AddShared.click();
	} else if (el = FileManager.toolbox.getParentByClassName(e.target,'execute-close-button')) {
		FileManager.ExecuteReport.remove();
	} else if (el = FileManager.toolbox.getParentByClassName(e.target,'execute-full-button')) {
		FileManager.ExecuteReport.showFullReport(el);
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
});

document.addEventListener('keyup', function (e) {

	if (FileManager.ENABLE_SHARED_CONTAINERS) {
		if (e.target.classList.contains('read-rights-input') || e.target.classList.contains('write-rights-input')) {
			FileManager.Rights.keyup();
		}
	}
});

Auth.ready.push(function () {
	if (!location.hash) {
		location.hash = Auth.getAccount() + "/";
	} else {
		window.FileManager.files.refreshItemList();
	}

	document.body.dispatchEvent(authInit);
	FileManager.reAuth();

	window.FileManager.elements.upButton.addEventListener('click', function(){
			var upperLevel = FileManager.CurrentPath().up();
			if (!FileManager.Loading.visible && upperLevel){
				FileManager.Loading.hide();
				FileManager.CurrentDirLabel.showLoading();
				location.hash = upperLevel;
			}
		}
	);

	document.getElementById("WideButton").addEventListener("click", function(){
		document.body.classList.toggle("wide-content");
	});
});

document.addEventListener('DOMContentLoaded', function () {
	Auth.init();
	document.querySelector('.current-dir-label').addEventListener("click", function(e){
		var newPath;
		if(e.target.nodeName === "A"){
			e.preventDefault();
			e.stopPropagation();
			newPath = location.hash.match(new RegExp(".*" + e.target.dataset.hash + "\/"));
			if(newPath){
				location.hash = newPath[0];
			}
		}
	});
});

//SHARED-CONTAINERS
FileManager.Shared = {};
FileManager.Shared.isShared = function (path) {
	return path.split('/')[0] != Auth.getAccount();//TODO: check condition, looks weird
};
FileManager.Shared.listSharedContainers = function (sharedContainers, scrollingContentEl) {

	for (var k in sharedContainers) {
		add(k, sharedContainers[k]);
		update(k, sharedContainers[k]);
	}

	function add(sharedContainer, email) {

		var name = email + '/' + sharedContainer.split('/')[1];
		name = FileManager.toolbox.makeShortName(name);
		var html = document.querySelector('#sharedContainerTemplate').innerHTML;
		html = html.replace('{{name}}', FileManager.toolbox.escapeHTML(name));
		html = html.replace('{{path}}', FileManager.toolbox.escapeHTML(sharedContainer));
		html = html.replace('{{title}}', FileManager.toolbox.escapeHTML(sharedContainer));
		scrollingContentEl.insertAdjacentHTML('afterbegin', html);
	}

	function update(path) {
		SharedContainersOnSwift.getContainerSize({
			account: FileManager.Path(path).account(),
			container: FileManager.Path(path).container(),
			success: function (bytes, count) {
				var size = FileManager.toolbox.shortenSize(bytes);

				var selector = '.item[data-path="' + path + '"]';//owful
				var el = scrollingContentEl.querySelector(selector);

				el.querySelector('.size').textContent = size;
				el.querySelector('.files').textContent = count;
			},
			error: function (status, statusText) {
				var selector = '.item[data-path="' + path + '"]';
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
			window.FileManager.files.refreshItemList();
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
		containerName: FileManager.Path(FileManager.item.selectedPath).container(),
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