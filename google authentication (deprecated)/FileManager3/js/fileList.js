(function(){
	"use strict";

	var LIMIT = 20,
		lastSlashRegex = /\/$/,
		uploadInput,
		emptynessMsg = window.FileManager.toolbox.emptynessMsg;

	function list(callback){
		var requestArgs = {};

		requestArgs.containerName = FileManager.CurrentPath().container();
		requestArgs.format = "json";
		requestArgs.limit = LIMIT;
		requestArgs.delimiter = "/";
		if(FileManager.CurrentPath().isDirectory()){
			requestArgs.prefix = FileManager.CurrentPath().prefix();
		}
		if(FileManager.ENABLE_SHARED_CONTAINERS){
			requestArgs.account = FileManager.CurrentPath().account();
		}

		requestArgs.success = function(FILES){
			var scrollingContentEl = FileManager.elements.itemsWrapperEl,
				files = FILES.slice(),
				html;
			scrollingContentEl.innerHTML = "";
			if(checkFirstFile(files)){
				files.shift();
			}
			if(files.length === 0){
				emptynessMsg.show({
					wrapper: scrollingContentEl,
					className: "empty-folder",
					text: "The folder is empty",
					clickHandler: function(){
						if(!uploadInput){
							uploadInput = document.querySelector("#UploadFilesButton input");
						}
						uploadInput.click();
					}
				});
			}else{
				html = listHTML(files);
				scrollingContentEl.insertAdjacentHTML("beforeend", html);
				if(FILES.length === LIMIT){
					FileManager.toolbox.createLoadMoreButton(scrollingContentEl);
				}else{
					scrollingContentEl.insertAdjacentHTML("beforeend", createItem({name: "", size: "", modified: ""}).replace("item", "item no-hover no-active dummy"));
				}
				checkLoadMore();
			}
			window.FileManager.elements.upButton.removeAttribute("disabled");
			FileManager.CurrentDirLabel.setContent(FileManager.CurrentPath().withoutAccount(), true);
			callback();

			function checkFirstFile(files){
				var prefix = FileManager.CurrentPath().prefix(),
					file, nameInFiles;
				if(files.length > 0 && prefix){
					file = files[0];
					nameInFiles = file.hasOwnProperty("subdir") ? file.subdir : file.name;
					if(prefix == nameInFiles){
						return true;
					}
				}
				return false;
			}
		};

		requestArgs.error = function error(status, statusText){

			FileManager.errorMsgHandler.show({
				header: "Ajax error:",
				status: status,
				statusText: statusText
			});
			window.FileManager.elements.upButton.removeAttribute("disabled");
			FileManager.CurrentDirLabel.setContent(FileManager.CurrentPath().name());
			callback();
		};
		requestArgs.notExist = notExist;
		SwiftV1.listFiles(requestArgs);
	}

	function loadMore(){
		var el = document.getElementsByClassName("load-more-button")[0],
			prefix,
			filesArgs = {},
			currPath = FileManager.CurrentPath(),
			isContainer = currPath.isContainersList();

		if(!el){//TODO: change condition
			document.body.classList.remove(FileManager.elements.bodyLoadingClass);
			return;
		}
		document.body.classList.add(FileManager.elements.bodyLoadingClass);
		el.textContent = "Loading...";
		el.setAttribute("disabled", "disabled");
		filesArgs.error = loadMoreError;
		filesArgs.delimiter = "/";
		filesArgs.limit = LIMIT;
		filesArgs.format = "json";
		filesArgs.marker = el.previousElementSibling.dataset.path;
		filesArgs.success = function(items){
			var el = document.getElementsByClassName("load-more-button")[0];//TODO: check wether it is needed
			document.body.classList.remove(FileManager.elements.bodyLoadingClass);
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
				 window.FileManager.elements.itemsWrapperEl.insertAdjacentHTML("beforeend", listHTML(files));
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
			if(FileManager.ENABLE_SHARED_CONTAINERS){
				filesArgs.account = currPath.account();
			}
			filesArgs.notExist = notExist;
			SwiftV1.listFiles(filesArgs);
		}
	}

	function loadMoreError(status, statusText){
		document.body.classList.remove(FileManager.elements.bodyLoadingClass);
		window.FileManager.errorMsgHandler.show({
			header: "Error:",
			status: status,
			statusText: statusText
		});
	}

	function notExist(){
		var curPath = window.FileManager.CurrentPath(),
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
			curPath = FileManager.CurrentPath().withoutAccount();
		html = document.getElementById("fileTemplate").innerHTML;

		if(file.hasOwnProperty("subdir")){
			path = new FileManager.Path(file.subdir).name();
			_name = file.subdir.replace(lastSlashRegex, "");
			html = html.replace("data-type=\"file\"", "data-type=\"directory\"");
		}else{
			path = new FileManager.Path(file.name).name();
			_name = file.name;
		}

		_name = new FileManager.Path(_name).name();
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
				path: FileManager.CurrentPath().withoutAccount(),
				success: handleResponse,
				error: function(status, statusText){
					progressbar.cancel();
					window.FileManager.elements.upButton.removeAttribute('disabled');
					window.FileManager.errorMsgHandler.show({header: "Ajax error occured", status: status, statusText: statusText});
				},
				notExist: function(){
					window.FileManager.errorMsgHandler.show({header: "File was not found."});
					window.FileManager.elements.upButton.removeAttribute('disabled');
					progressbar.cancel();
				},
				progress: function(loaded){
					if(loaded > 2097152){
						window.FileManager.elements.upButton.removeAttribute('disabled');
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
		window.FileManager.elements.upButton.setAttribute('disabled', 'disabled');
		if(FileManager.ENABLE_SHARED_CONTAINERS){
			args.account = FileManager.CurrentPath().account();
		}
		xhr = SwiftV1.getFile(args);
		progressbar = new window.FileManager.toolbox.ProgressBar({
			request: xhr,
			wrapper: el,
			isDownload: true,
			onEndCallback: function(){
				window.FileManager.elements.upButton.removeAttribute('disabled');
			}
		});
		//progressbar.setText("Fetching file...");

		function handleResponse(data, contentType){
			var fileName = FileManager.CurrentPath().name();

			FileManager.CurrentDirLabel.setContent(fileName);

			window.FileManager.fileEditor.show(data, contentType, fileName);

			window.FileManager.elements.upButton.removeAttribute('disabled');
		}
	}

	function handleFileClick(el, callback){//TODO: remove extra request for file exist
		var args,
			currentPath = FileManager.CurrentPath(),
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
						FileManager.CurrentDirLabel.setContent(FileManager.CurrentPath().name());
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
			window.FileManager.elements.upButton.removeAttribute('disabled');
			el.removeChildren();
			window.FileManager.errorMsgHandler.show({
				header: "File was not found.",
				onclose: function(){
					location.hash = window.FileManager.CurrentPath().up();
				}
			});
			callback();
		}

		function ajaxError(status, statusText){
			window.FileManager.elements.upButton.removeAttribute('disabled');
			el.textContent = 'Error: ' + status + ' ' + statusText;
			callback();
		}

		args = {
			path: path,
			success: fileExist,
			notExist: fileNotExist,
			error: ajaxError
		};
		if(FileManager.ENABLE_SHARED_CONTAINERS){
			args.account = currentPath.account();
		}
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
			window.FileManager.elements.itemsWrapperEl.scrollIntoView();
		}

		oldEl = window.FileManager.elements.itemsWrapperEl;
		parentEl = oldEl.parentNode;

		template = document.querySelector("#newScrollingContentTemplate").innerHTML;
		parentEl.insertAdjacentHTML("afterbegin", template);
		newEl = document.querySelector(".new-scrolling-content");

		el = newEl;
		FileManager.CurrentDirLabel.setContent(FileManager.CurrentPath().withoutAccount(), true);
		if(FileManager.CurrentPath().isContainersList()){
			FileManager.Containers.list(animateItemListRefreshing);
		}else if(FileManager.CurrentPath().isFilesList()){
			list(animateItemListRefreshing);
		}else{
			handleFileClick(el, animateItemListRefreshing);
		}

		loadingEl = document.querySelector(".scrolling-content-loading");
		loadingEl && loadingEl.parentNode.removeChild(loadingEl);
	}

	function ontransition(e){//TODO: change the way of refreshing!
		var el = e.target ? e.target : e, newEl;
		if(el.classList.contains("old-scrolling-content")){
			el.parentNode.removeChild(el);
			newEl = window.FileManager.elements.itemsWrapperEl;
			newEl.classList.add("no-transition");
			newEl.classList.remove("no-transition");
			document.body.classList.remove("disabled");
		}
	}

	function checkLoadMore(){
		var el = window.FileManager.elements.itemsContainer;
		if(Math.abs(el.scrollTop - (el.scrollHeight - el.clientHeight)) < 4){
			window.FileManager.files.loadMore();
		}
	}

	document.addEventListener("transitionend", ontransition);
	document.addEventListener("webkitTransitionEnd", ontransition);
	window.addEventListener("hashchange", refreshItemList);
	document.addEventListener("DOMContentLoaded", function(){
		window.FileManager.elements.scrollWrapper.addEventListener("scroll", window.FileManager.toolbox.onscrollLoadMore);
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
})();