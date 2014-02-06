function listFiles() {
	"use strict";

	var LIMIT = 20;
	var lastSlashRegex = /\/$/;
	var emptynessMsg = window.FileManager.toolbox.emptynessMsg;

	function list(callback) {
		var requestArgs = {};

		requestArgs.containerName = CurrentPath().container();
		requestArgs.format = "json";
		requestArgs.limit = LIMIT;
		requestArgs.delimiter = "/";

		if(CurrentPath().isDirectory()) {
			requestArgs.prefix = CurrentPath().prefix();
		}

		requestArgs.success = function (FILES) {
			var scrollingContentEl = document.getElementById('List').firstElementChild;
			var files = FILES.slice();
			var html;

			scrollingContentEl.innerHTML = "";
			document.getElementById('NoContainers').classList.add('hidden');
			document.getElementById('NoFiles').classList.add('hidden');

			if (checkFirstFile(files)) {
				files.shift();
			}

			if (files.length === 0) {
				document.getElementById('NoFiles').classList.remove('hidden');
			} else {
				html = listHTML(files);
				scrollingContentEl.insertAdjacentHTML("beforeend", html);
				if(FILES.length === LIMIT){
					FileManager.toolbox.createLoadMoreButton(scrollingContentEl);
				}else{
					scrollingContentEl.insertAdjacentHTML("beforeend", createItem({name: "", size: "", modified: ""}).replace("item", "item no-hover no-active dummy"));
				}
				checkLoadMore();
			}
			document.getElementById('UpButton').removeAttribute("disabled");
			NavigationBar.setContent(CurrentPath().withoutAccount(), true);
			callback();

			function checkFirstFile(files) {
				var prefix = CurrentPath().prefix(),
					file, nameInFiles;
				if(files.length > 0 && prefix) {
					file = files[0];
					nameInFiles = file.hasOwnProperty("subdir") ? file.subdir : file.name;
					if(prefix == nameInFiles) {
						return true;
					}
				}
				return false;
			}
		};

		requestArgs.error = function error(status, statusText) {
			FileManager.errorMsgHandler.show({
				header: "Ajax error:",
				status: status,
				statusText: statusText
			});
			document.getElementById('UpButton').removeAttribute("disabled");
			NavigationBar.setContent(CurrentPath().name());
			callback();
		};
		requestArgs.notExist = notExist;
		SwiftV1.listFiles(requestArgs);
	}

	function loadMore() {
		var el = document.getElementsByClassName("load-more-button")[0],
			prefix,
			filesArgs = {},
			currPath = CurrentPath(),
			isContainer = currPath.isContainersList();

		if(!el){//TODO: change condition
			document.body.classList.remove('loading-content');
			return;
		}
		document.body.classList.add('loading-content');
		el.textContent = "Loading...";
		el.setAttribute("disabled", "disabled");
		filesArgs.error = loadMoreError;
		filesArgs.delimiter = "/";
		filesArgs.limit = LIMIT;
		filesArgs.format = "json";
		filesArgs.marker = el.previousElementSibling.dataset.path;
		filesArgs.success = function(items){
			var el = document.getElementsByClassName("load-more-button")[0];//TODO: check wether it is needed
			document.body.classList.remove('loading-content');
			if(isContainer){
				el.insertAdjacentHTML('beforebegin', FileManager.Containers.create(items));
			}else{
				el.insertAdjacentHTML("beforebegin", listHTML(items));
			}

			if(items.length < LIMIT){
				el.parentNode.removeChild(el);
				/*
				 if(!el){
				 console.log("asdfsadfdsafdsaffdfds");
				 document.getElementById('List').firstElementChild.insertAdjacentHTML("beforeend", listHTML(files));
				 }else{
				 el.insertAdjacentHTML("beforebegin", listHTML(files));
				 el.parentNode.removeChild(el);
				 }*/
			}else{
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
			filesArgs.notExist = notExist;
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

	function notExist(){
		var curPath = window.CurrentPath(),
			params = {
				onclose: function(){
					location.hash = curPath.root();
				}
			};

		//refreshItemList();
		if(curPath.isContainersList()){
			params.header = "There is no such container."
		}else{
			params.header = "There is no such folder."
		}
	}

	function listHTML(files){
		var html = "", i, file;
		for(i = 0; i < files.length; i++){
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

	function editFile(el){
		var args = {
				path: CurrentPath().withoutAccount(),
				success: handleResponse,
				error: function(status, statusText) {
					progressbar.cancel();
					document.getElementById('UpButton').removeAttribute('disabled');
					window.FileManager.errorMsgHandler.show({header: "Ajax error occured", status: status, statusText: statusText});
				},
				notExist: function() {
					window.FileManager.errorMsgHandler.show({header: "File was not found."});
					document.getElementById('UpButton').removeAttribute('disabled');
					progressbar.cancel();
				},
				progress: function (loaded) {
					if (loaded > 2097152) {
						document.getElementById('UpButton').removeAttribute('disabled');
						progressbar.cancel();
						emptynessMsg.show({
							wrapper: el,
							className: "large-file",
							text: "File is too large (2MB+)."
						});
					}
				}
			},
			progressbar,
			xhr;
		document.getElementById('UpButton').setAttribute('disabled', 'disabled');
		xhr = SwiftV1.getFile(args);
		progressbar = new window.FileManager.toolbox.ProgressBar({
			request: xhr,
			wrapper: el,
			isDownload: true,
			onEndCallback: function(){
				document.getElementById('UpButton').removeAttribute('disabled');
			}
		});
		//progressbar.setText("Fetching file...");

		function handleResponse(data, contentType){
			var fileName = CurrentPath().name();

			NavigationBar.setContent(fileName);

			window.FileManager.fileEditor.show(data, contentType, fileName);

			document.getElementById('UpButton').removeAttribute('disabled');
		}
	}

	function handleFileClick(el, callback){//TODO: remove extra request for file exist
		var args,
			currentPath = CurrentPath(),
			path = currentPath.withoutAccount();

		function fileExist(metadata, contentType, contentLength, lastModified){
			switch(window.FileManager.item.itemCommandName.pop()){
				case "open":
					window.FileManager.item.open(path);
					break;
				case "execute":
					window.FileManager.item.execute(path);
					break;
				default :
					if(window.FileManager.toolbox.isEditable(contentType)){
						editFile(el);
					}else{
						el.removeChildren();
						NavigationBar.setContent(CurrentPath().name());
						emptynessMsg.show({
							wrapper: el,
							className: "empty",
							text: "It's not a text file."
						});
					}
				//document.querySelector('.download-link').setAttribute('download', filename);
			}
			callback();
		}

		function fileNotExist(){
			document.getElementById('UpButton').removeAttribute('disabled');
			el.removeChildren();
			window.FileManager.errorMsgHandler.show({
				header: "File was not found.",
				onclose: function(){
					location.hash = window.CurrentPath().up();
				}
			});
			callback();
		}

		function ajaxError(status, statusText){
			document.getElementById('UpButton').removeAttribute('disabled');
			el.textContent = 'Error: ' + status + ' ' + statusText;
			callback();
		}

		args = {
			path: path,
			success: fileExist,
			notExist: fileNotExist,
			error: ajaxError
		};
		SwiftV1.checkFileExist(args);
	}

	function refreshItemList(){
		var parentEl, newEl, oldEl, template, el, loadingEl,
			commandName;

		commandName = window.FileManager.item.itemCommandName.pop();//added to prevent unnecessary request while change event fired on loaded file
		if(commandName === "none"){
			return;
		}else{
			window.FileManager.item.itemCommandName.set(commandName);
		}

		function animateItemListRefreshing(){
			oldEl.classList.add("old-scrolling-content");
			newEl.classList.remove("new-scrolling-content");
			document.getElementById('List').firstElementChild.scrollIntoView();
		}

		oldEl = document.getElementById('List').firstElementChild;
		parentEl = oldEl.parentNode;

		template = document.querySelector("#newScrollingContentTemplate").innerHTML;
		parentEl.insertAdjacentHTML("afterbegin", template);
		newEl = document.querySelector(".new-scrolling-content");

		el = newEl;
		NavigationBar.setContent(CurrentPath().withoutAccount(), true);

		if (CurrentPath().isContainersList()) {
			FileManager.Containers.list(animateItemListRefreshing);
		} else if (CurrentPath().isFilesList()) {
			list(animateItemListRefreshing);
		} else {
			handleFileClick(el, animateItemListRefreshing);
		}

		loadingEl = document.querySelector(".scrolling-content-loading");
		loadingEl && loadingEl.parentNode.removeChild(loadingEl);
	}

	function ontransition(e){
		var el = e.target ? e.target : e, newEl;
		if(el.classList.contains("old-scrolling-content")){
			el.parentNode.removeChild(el);
			newEl = document.getElementById('List').firstElementChild;
			newEl.classList.add("no-transition");
			newEl.classList.remove("no-transition");
			document.body.classList.remove("disabled");
		}
	}

	function checkLoadMore(){
		var el = document.getElementById('List');
		if(Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight)) < 4){
			window.FileManager.files.loadMore();
		}
	}

	document.addEventListener("transitionend", ontransition);
	document.addEventListener("webkitTransitionEnd", ontransition);
	window.addEventListener("hashchange", refreshItemList);
	document.addEventListener("DOMContentLoaded", function(){
		document.getElementById('List').onscroll = window.FileManager.toolbox.onscrollLoadMore;
	});

	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.files = {
		loadMore: loadMore,
		notExist: notExist,
		listHTML: listHTML,
		refreshItemList: refreshItemList,
		ontransition: ontransition
	};
}