'use strict';

Auth.useClusterAuth();

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
					FileManager.CurrentDirLabel.root();
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
		FileManager.CurrentDirLabel.root();
		if (containers.length == 0) {
			noContainers();
			callback();
			return;
		}

		window.FileManager.elements.upButton.setAttribute('disabled', 'disabled');

		scrollingContentEl.insertAdjacentHTML('beforeend', FileManager.Containers.create(containers));

		callback();

		if (containers.length === FileManager.Containers.LIMIT) {
			FileManager.toolbox.createLoadMoreButton(scrollingContentEl);
		}else{
			scrollingContentEl.insertAdjacentHTML('beforeend', FileManager.Containers.create([{name:""}]).replace("item", "item no-hover no-active dummy"));
		}

		window.FileManager.toolbox.onscrollLoadMore(window.FileManager.elements.scrollWrapper);
	}

	function noContainers() {
		//window.FileManager.errorMsgHandler.show({header: "There are no containers."});
		window.FileManager.toolbox.emptynessMsg.show({
			wrapper: FileManager.elements.itemsWrapperEl,
			className: "empty-container-list",
			text: "There are no containers. Wanna create some?",
			clickHandler: function(){
				document.getElementById("CreateContainerButton").click();
			}
		});
	}
};

FileManager.Containers.create = function (containerObjs) {
	var resulthtml = "",
		slashStr = "/",
		dummy = document.querySelector('#containerTemplate').innerHTML,
		tmp,
		container, title, path;

	for (var i = 0; i < containerObjs.length; i++) {
		container = containerObjs[i];
		title = container.name;
		path = title.indexOf(slashStr) === -1 ? title + slashStr : title;
		tmp = dummy.replace('{{name}}', FileManager.toolbox.escapeHTML(FileManager.toolbox.makeShortName(container.name)))
			.replace('{{path}}', FileManager.toolbox.escapeHTML(path))
			.replace('{{title}}', FileManager.toolbox.escapeHTML(title))
			.replace('{{size}}', isNaN(container.bytes) ? "" : FileManager.toolbox.shortenSize(container.bytes))
			.replace('{{files}}', isNaN(container.count) ? "" : container.count);
		if(container.count){
			resulthtml += tmp;
		}else{
			resulthtml += tmp.replace("item", "item empty-container");
		}
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
		return path + name;
	};
};

FileManager.CurrentPath = function () {
	var path = new FileManager.Path(location.hash.substr(1));
	path.root = function(){
		return path.account() + "/";
	};
	return path;
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
		var curPath = new FileManager.Path(path);
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
};/*
document.ontouchmove = function(event){
	event.preventDefault();
};*/