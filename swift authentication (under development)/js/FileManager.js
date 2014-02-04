'use strict';

if (!FileManager) {
	FileManager = {};
}

FileManager.ENABLE_ZEROVM = true;

FileManager.Containers = {};

FileManager.Containers.LIMIT = 20;

FileManager.Containers.list = function (callback) {
	var scrollingContentEl = window.FileManager.elements.itemsWrapperEl;

	var xhr = SwiftV1.listContainers({
		format: 'json',
		limit: FileManager.Containers.LIMIT,
		success: function (containers) {
			scrollingContentEl.innerHTML = '';

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
		} else {
			scrollingContentEl.insertAdjacentHTML('beforeend', FileManager.Containers.create([{name:""}]).replace("item", "item no-hover no-active dummy"));
		}

		window.FileManager.toolbox.onscrollLoadMore(document.getElementById('List'));
	}

	function noContainers() {
		//window.FileManager.errorMsgHandler.show({header: "There are no containers."});
		window.FileManager.toolbox.emptynessMsg.show({
			wrapper: FileManager.elements.itemsWrapperEl,
			className: "empty-container-list",
			text: "There are no containers.",
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
		return path === SwiftV1.account + "/";
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

function initPage() {
	location.hash = SwiftV1.account + "/";
	window.FileManager.files.refreshItemList();

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
}

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