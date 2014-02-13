(function (SwiftV1) {
	"use strict";

	var LIMIT = 20;

	function XHR(callback) {
		var requestArgs = {};
		requestArgs.containerName = CurrentPath().container();
		requestArgs.format = "json";
		requestArgs.limit = LIMIT;
		requestArgs.delimiter = "/";
		if (CurrentPath().isDirectory()) {
			requestArgs.prefix = CurrentPath().prefix();
		}
		requestArgs.success = function (filesArr) {
			UI_OK(filesArr, callback);
		};
		requestArgs.error = function (status, statusText) {
			UI_ERROR(status, statusText, callback);
		};
		SwiftV1.listFiles(requestArgs);
	}

	function UI_OK(filesArr, callback) {
		// Clone filesArr parameter before modifying it:
		var files = filesArr.slice();
		removeFirstFileInSomeCases(files);
		// UI:
		reset_UI_before();
		if (files.length == 0) {
			noFiles();
		} else {
			fillList(files);
			checkLoadMore(filesArr);
		}
		reset_UI_after(callback);
	}

	function UI_ERROR(status, statusText, callback) {
		reset_UI_before();
		document.getElementById('AjaxErrorMessage').textContent = statusText;
		document.getElementById('AjaxStatusCode').textContent = status;
		document.getElementById('AjaxError').classList.remove('hidden');
		reset_UI_after(callback);
	}

	function fillList(files) {
		var html = createFilesListHTML(files);
		var transitionDiv = document.getElementById('List').firstElementChild;
		transitionDiv.innerHTML = ''; // LEON TODO: Check out why this row is needed.
		transitionDiv.insertAdjacentHTML("beforeend", html);
	}

	function checkLoadMore(filesArr) {
		var listEl = document.getElementById('List');
		var transitionDiv = document.getElementById('List').firstElementChild;

		if (filesArr.length === LIMIT) {
			FileManager.toolbox.createLoadMoreButton(transitionDiv);
		}

		if (Math.abs(listEl.scrollTop - (listEl.scrollHeight - listEl.clientHeight)) < 4) {
			loadMore();
		}
	}

	function reset_UI_before() {
		document.getElementById('NoContainers').classList.add('hidden');
		document.getElementById('NoFiles').classList.add('hidden');
	}

	function reset_UI_after(callback) {
		document.getElementById('UpButton').removeAttribute("disabled");
		NavigationBar.setContent(CurrentPath().withoutAccount(), true);
		callback();
	}

	function removeFirstFileInSomeCases(files) {
		if (checkFirstFile(files)) {
			files.shift();
		}

		function checkFirstFile(files) {
			var prefix = CurrentPath().prefix(),
				file, nameInFiles;
			if (files.length > 0 && prefix) {
				file = files[0];
				nameInFiles = file.hasOwnProperty("subdir") ? file.subdir : file.name;
				if (prefix == nameInFiles) {
					return true;
				}
			}
			return false;
		}
	}

	function noFiles() {
		document.getElementById('NoFiles').classList.remove('hidden');
	}

	function loadMore() {
		var el = document.getElementsByClassName("load-more-button")[0];
		var prefix;
		var currPath = CurrentPath();
		var isContainer = currPath.isContainersList();

		if (!el) {
			document.body.classList.remove('loading-content');
			return;
		}

		document.body.classList.add('loading-content');
		el.textContent = "Loading...";
		el.setAttribute("disabled", "disabled");

		var filesArgs = {};
		filesArgs.error = loadMoreError;
		filesArgs.delimiter = "/";
		filesArgs.limit = LIMIT;
		filesArgs.format = "json";
		filesArgs.marker = el.previousElementSibling.dataset.path;
		filesArgs.success = function(items){
			var el = document.getElementsByClassName("load-more-button")[0];
			document.body.classList.remove('loading-content');
			if (isContainer) {
				el.insertAdjacentHTML('beforebegin', FileManager.Containers.create(items));
			} else {
				el.insertAdjacentHTML("beforebegin", createFilesListHTML(items));
			}

			if (items.length < LIMIT) {
				el.parentNode.removeChild(el);
				/*
				 if(!el){
				 console.log("asdfsadfdsafdsaffdfds");
				 document.getElementById('List').firstElementChild.insertAdjacentHTML("beforeend", createFilesListHTML(files));
				 }else{
				 el.insertAdjacentHTML("beforebegin", createFilesListHTML(files));
				 el.parentNode.removeChild(el);
				 }*/
			} else {
				el.textContent = "Load more";
				el.removeAttribute("disabled");
			}
		};

		if(isContainer){
			SwiftV1.listContainers(filesArgs);
		}else{
			filesArgs.containerName = currPath.container();
			if(currPath.isDirectory()){
				prefix = currPath.prefix();
				filesArgs.marker = prefix + filesArgs.marker;
				filesArgs.prefix = prefix;
			}
			SwiftV1.listFiles(filesArgs);
		}
	}

	function loadMoreError(status, statusText){
		document.body.classList.remove('loading-content');
		window.FileManager.errorMsgHandler.show({
			header: "Error:",
			status: status,
			statusText: statusText
		});
	}

	function createFilesListHTML(files){
		var html = '', i, file;
		for (i = 0; i < files.length; i++) {
			file = files[i];
			html += createItem(file);
		}
		return html;
	}

	function createItem(file){
		var _name, contentType, name, size, modified, html, path,
			curPath = CurrentPath().withoutAccount();
		html = document.getElementById("fileTemplate").innerHTML;

		if(file.hasOwnProperty("subdir")){
			path = new Path(file.subdir).name();
			var lastSlashRegex = /\/$/;
			_name = file.subdir.replace(lastSlashRegex, "");
			html = html.replace("data-type=\"file\"", "data-type=\"directory\"");
		}else{
			path = new Path(file.name).name();
			_name = file.name;
		}

		_name = new Path(_name).name();
		contentType = (file.content_type && file.content_type !== "undefined" && file.content_type) || "file-type";
		name = window.FileManager.toolbox.makeShortName(_name);
		_name = FileManager.toolbox.escapeHTML(_name);
		size = FileManager.toolbox.shortenSize(file.bytes);
		modified = window.FileManager.toolbox.makeDatePretty(file.last_modified);
		return html.replace("{{file-type}}", contentType)
			.replace("{{name}}", "<span>" + FileManager.toolbox.escapeHTML(name) + "</span>")
			.replace("{{path}}", FileManager.toolbox.escapeHTML(path))
			.replace("{{title}}", _name)
			.replace("{{size}}", isNaN(file.bytes) ? "" : FileManager.toolbox.escapeHTML(size))
			.replace("{{modified}}", file.last_modified ? FileManager.toolbox.escapeHTML(modified) : "")
			.replace("data-full-path=\"\"", "data-full-path=\"" + curPath + _name + "\"");
	}

	function refreshItemList() {
		var parentEl, newEl, oldEl, template, el, loadingEl,
			commandName;

		commandName = window.FileManager.item.itemCommandName.pop();//added to prevent unnecessary request while change event fired on loaded file
		if(commandName === "none"){
			return;
		}else{
			window.FileManager.item.itemCommandName.set(commandName);
		}

		function animateItemListRefreshing(){
			oldEl.classList.add("old-transition-div");
			newEl.classList.remove("new-transition-div");
			document.getElementById('List').firstElementChild.scrollIntoView();
		}

		oldEl = document.getElementById('List').firstElementChild;
		parentEl = oldEl.parentNode;

		template = document.querySelector("#newTransitionDivTemplate").innerHTML;
		parentEl.insertAdjacentHTML("afterbegin", template);
		newEl = document.querySelector(".new-transition-div");

		el = newEl;
		NavigationBar.setContent(CurrentPath().withoutAccount(), true);

		if (CurrentPath().isContainersList()) {
			FileManager.Containers.list(animateItemListRefreshing);
		} else if (CurrentPath().isFilesList()) {
			list(animateItemListRefreshing);
		} else {
			handleFileClick(el, animateItemListRefreshing);
		}

		loadingEl = document.querySelector(".transition-div-loading");
		loadingEl && loadingEl.parentNode.removeChild(loadingEl);



		function list(callback) {
			XHR(callback);
		}
	}

	function ontransition(e) {
		var el = e.target ? e.target : e, newEl;
		if (el.classList.contains("old-transition-div")) {
			el.parentNode.removeChild(el);
			newEl = document.getElementById('List').firstElementChild;
			newEl.classList.add("no-transition");
			newEl.classList.remove("no-transition");
			document.body.classList.remove("disabled");
		}
	}

	document.addEventListener("transitionend", ontransition);
	document.addEventListener("webkitTransitionEnd", ontransition);
	window.addEventListener("hashchange", refreshItemList);

	if(!window.FileManager) {
		window.FileManager = {};
	}

	window.FileManager.files = {
		loadMore: loadMore,
		listHTML: createFilesListHTML,
		refreshItemList: refreshItemList,
		ontransition: ontransition
	};

})(SwiftV1);