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

FileManager.AccountLabel = {};

FileManager.AccountLabel.init = function () {

};


FileManager.Containers = {};

FileManager.Containers.LIMIT = 20;

FileManager.Containers.list = function (callback) {
	var scrollingContentEl = window.FileManager.elements.itemsWrapperEl;

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

		scrollingContentEl.insertAdjacentHTML('beforeend', FileManager.Containers.create(containers));

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

FileManager.Containers.create = function (containerObjs) {
	var resulthtml = "",
		slashStr = "/",
		dummy = document.querySelector('#containerTemplate').innerHTML,
		container, title, path;

	for (var i = 0; i < containerObjs.length; i++) {
		container = containerObjs[i];
		title = container.name;
		path = title.indexOf(slashStr) === -1 ? title + slashStr : title;
		resulthtml += dummy.replace('{{name}}', FileManager.toolbox.escapeHTML(FileManager.toolbox.makeShortName(container.name)))
			.replace('{{path}}', FileManager.toolbox.escapeHTML(path))
			.replace('{{title}}', FileManager.toolbox.escapeHTML(title))
			.replace('{{size}}', FileManager.toolbox.escapeHTML(FileManager.toolbox.shortenSize(container.bytes)))
			.replace('{{files}}', FileManager.toolbox.escapeHTML(container.count));
	}
	return resulthtml;
};



FileManager.AjaxError = {};//TODO: replace it with errrorMsg

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
		var resultPath = path.split('/').filter(function(s){return s;});
		resultPath.pop();
		return resultPath.length && resultPath.join("/") + "/";
	};
	this.add = function (name) {
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
		 window.FileManager.files.loadMore();
	 } else if (el = FileManager.toolbox.getParentByClassName(e.target,'add-shared-button')) {
		//SHARED-CONTAINERS
		FileManager.AddShared.click();
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

window.addEventListener('authReady', function () {
	if (!location.hash) {
		location.hash = Auth.getAccount() + "/";
	} else {
		window.FileManager.files.refreshItemList();
	}

	document.body.dispatchEvent(authInit);
	FileManager.reAuth();

	window.FileManager.elements.upButton.addEventListener('click', function(){
			var upperLevel = FileManager.CurrentPath().up();
			if (upperLevel){
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
});

//SHARED-CONTAINERS
FileManager.Shared = {};
FileManager.Shared.isShared = function (path) {
	return path.split('/')[0] != Auth.getAccount();//TODO: check condition, looks weird
};
FileManager.Shared.listSharedContainers = function(sharedContainers, scrollingContentEl){
	var html = document.querySelector('#sharedContainerTemplate').innerHTML,
		el;

	for(var k in sharedContainers){
		el = add(k, sharedContainers[k]);
		update(k, el);
	}

	function add(sharedContainer, email){
		var name = FileManager.toolbox.makeShortName(email + '/' + sharedContainer.split('/')[1]);
		scrollingContentEl.insertAdjacentHTML('afterbegin',
			html.replace('{{name}}', FileManager.toolbox.escapeHTML(name))
				.replace('{{path}}', FileManager.toolbox.escapeHTML(sharedContainer))
				.replace('{{title}}', FileManager.toolbox.escapeHTML(sharedContainer))
		);
		return scrollingContentEl.firstElementChild;
	}

	function update(path, el){
		var curPath = FileManager.Path(path);
		SharedContainersOnSwift.getContainerSize({
			account: curPath.account(),
			container: curPath.container(),
			success: function(bytes, count){
				el.querySelector('.size').textContent = FileManager.toolbox.shortenSize(bytes);
				el.querySelector('.files').textContent = count;
			},
			error: function(status, statusText){
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