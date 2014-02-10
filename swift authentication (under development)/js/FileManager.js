'use strict';

if (!FileManager) {
	FileManager = {};
}

FileManager.ENABLE_ZEROVM = true;

FileManager.Containers = {};

FileManager.Containers.LIMIT = 20;

FileManager.Containers.list = function (callback) {
	var transitionDiv = document.getElementById('List').firstElementChild;

	var xhr = SwiftV1.listContainers({
		format: 'json',
		limit: FileManager.Containers.LIMIT,
		success: function (containers) {
			transitionDiv.innerHTML = '';

			list(containers);
		},
		error: function (status, statusText) {
			transitionDiv.innerHTML = 'Error occurred: ' + status + ' ' + statusText;
			callback();
		}
	});

	function list(containers) {
		NavigationBar.root();

		if (containers.length == 0) {
			document.getElementById('NoContainers').classList.remove('hidden');
			callback();
			return;
		}
		document.getElementById('NoContainers').classList.add('hidden');
		document.getElementById('NoFiles').classList.add('hidden');

		document.getElementById('UpButton').setAttribute('disabled', 'disabled');

		transitionDiv.insertAdjacentHTML('beforeend', FileManager.Containers.create(containers));

		callback();

		if (containers.length === FileManager.Containers.LIMIT) {
			FileManager.toolbox.createLoadMoreButton(transitionDiv);
		} else {
			transitionDiv.insertAdjacentHTML('beforeend', FileManager.Containers.create([{name:""}]).replace("item", "item no-hover no-active dummy"));
		}

		window.FileManager.toolbox.onscrollLoadMore(document.getElementById('List'));
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

function initPage() {
	location.hash = SwiftV1.account + "/";
	window.FileManager.files.refreshItemList();

	FileManager.reAuth();

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