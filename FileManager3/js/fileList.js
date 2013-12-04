(function(){
	"use strict";

	var LIMIT = 20,
		notTextFileMsgContent = document.createElement("label");

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
			var scrollingContentEl = document.querySelector(".new-scrolling-content"),
				files = FILES.slice(),
				html;
			scrollingContentEl.innerHTML = "";
			if(checkFirstFile(files)){
				files.shift();
			}
			if(files.length === 0){
				html = document.querySelector("#noFilesTemplate").innerHTML;
				scrollingContentEl.insertAdjacentHTML("beforeend", html);
			}else{
				html = listHTML(files);
				scrollingContentEl.insertAdjacentHTML("beforeend", html);
				if(FILES.length === LIMIT){
					FileManager.toolbox.createLoadMoreButton(scrollingContentEl);
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

			var loadingEl = document.getElementsByClassName("item-loading")[0] || document.getElementsByClassName("scrolling-content-loading")[0] || window.FileManager.elements.itemsWrapperEl;
			loadingEl.textContent = "Error: " + status + " " + statusText;

			var scrollingContentEl = document.getElementsByClassName(".new-scrolling-content")[0];
			scrollingContentEl.innerHTML = "Error: " + status + " " + statusText;
			window.FileManager.elements.upButton.removeAttribute("disabled");
			FileManager.CurrentDirLabel.setContent(FileManager.CurrentPath().name());
			callback();
		};

		requestArgs.notExist = notExist;

		SwiftV1.listFiles(requestArgs);
	}

	function loadMore(){
		var el = document.getElementsByClassName("load-more-button")[0],
			lastFile, prefix,
			filesArgs = {};

		if(!el){//TODO: change codition
			document.body.classList.remove(FileManager.elements.bodyLoadingClass);
			return;
		}
		document.body.classList.add(FileManager.elements.bodyLoadingClass);
		el.textContent = "Loading...";
		el.setAttribute("disabled", "disabled");
		filesArgs.containerName = FileManager.CurrentPath().container();
		filesArgs.delimiter = "/";
		filesArgs.format = "json";
		filesArgs.limit = LIMIT;

		lastFile = el.previousElementSibling.dataset.path;

		if(FileManager.CurrentPath().isDirectory()){
			prefix = FileManager.CurrentPath().prefix();
			filesArgs.marker = prefix + lastFile;
			filesArgs.prefix = prefix;
		}else{
			filesArgs.marker = lastFile;
		}

		if(FileManager.ENABLE_SHARED_CONTAINERS){
			filesArgs.account = FileManager.CurrentPath().account();
		}

		filesArgs.success = function(files){
			var el = document.querySelector(".load-more-button");//TODO: check wether it is needed
			document.body.classList.remove(FileManager.elements.bodyLoadingClass);
			if(files.length < LIMIT){
				if(!el){
					window.FileManager.elements.itemsWrapperEl.insertAdjacentHTML("beforeend", listHTML(files));
				}else{
					el.insertAdjacentHTML("beforebegin", listHTML(files));
					el.parentNode.removeChild(el);
				}
				return;
			}
			el.insertAdjacentHTML("beforebegin", listHTML(files));
			el.textContent = "Load more";
			el.removeAttribute("disabled");

		};

		filesArgs.error = function(status, statusText){
			document.body.classList.remove(FileManager.elements.bodyLoadingClass);
			var loadingEl = document.querySelector(".load-more-button");
			loadingEl.textContent = "Error: " + status + " " + statusText;
		};
		filesArgs.notExist = notExist;
		SwiftV1.listFiles(filesArgs);
	}

	function notExist(){
		var scrollingContentEl = document.getElementsByClassName("new-scrolling-content")[0];
		document.body.classList.add(FileManager.elements.bodyLoadingClass);
		try{
			scrollingContentEl.innerHTML = "";
			if(FileManager.CurrentPath().isContainersList()){
				scrollingContentEl.innerHTML = "Container not exist.";
			}else{
				scrollingContentEl.innerHTML = "Directory not exist.";
			}
		}catch(e){//TODO: solve scollingContentEl existance
			console.log(e);
		}
	}

	function listHTML(files){
		var html = "", i, file;
		for(i = 0; i < files.length; i++){
			file = files[i];
			if(file.hasOwnProperty("subdir") || file.content_type == "application/directory"){
				html += createDirectory(file);
			}else{
				html += createFile(file);
			}
		}
		return html;
	}

	function createFile(file){
		var _name, contentType, name, size, modified, html;
		_name = FileManager.Path(file.name).name();
		contentType = (file.content_type && file.content_type !== "undefined" && file.content_type) || "file-type";
		name = window.FileManager.toolbox.makeShortName(_name);
		size = FileManager.toolbox.shortenSize(file.bytes);
		modified = window.FileManager.toolbox.makeDatePretty(file.last_modified);
		html = document.getElementById("fileTemplate").innerHTML;
		return html.replace("{{file-type}}", contentType)
			.replace("{{name}}", "<span>" + FileManager.toolbox.escapeHTML(name) + "</span>")
			.replace("{{path}}", FileManager.toolbox.escapeHTML(_name))
			.replace("{{title}}", FileManager.toolbox.escapeHTML(_name))
			.replace("{{size}}", FileManager.toolbox.escapeHTML(size))
			.replace("{{modified}}", FileManager.toolbox.escapeHTML(modified));
	}

	function createDirectory(file){
		var _name, name, html;
		if(file.hasOwnProperty("subdir")){
			_name = file.subdir;
		}else{
			_name = file.name;
		}
		_name = FileManager.Path(_name).name();
		name = FileManager.toolbox.makeShortName(_name);
		html = document.getElementById("directoryTemplate").innerHTML;
		html = html.replace("{{name}}", FileManager.toolbox.escapeHTML(name));
		html = html.replace("{{path}}", FileManager.toolbox.escapeHTML(_name));
		html = html.replace("{{title}}", FileManager.toolbox.escapeHTML(_name));
		return html;
	}

	function editFile(el){
		var args = {
				path: FileManager.CurrentPath().withoutAccount(),
				success: handleResponse,
				error: function(status, statusText){
					progressbar.cancel();
					window.FileManager.elements.upButton.removeAttribute('disabled');
					window.FileManager.errorMsgHandler.show({header: "Ajax error occured", status:status, statusText: statusText});
				},
				notExist: function(){
					window.FileManager.errorMsgHandler.show({header: "File Not Found."});
					window.FileManager.elements.upButton.removeAttribute('disabled');
					progressbar.cancel();
				},
				progress: function(loaded){
					if(loaded > 2097152){
						//xhr.abort();
						el.innerHTML = 'File is too large (2MB+).';
						window.FileManager.elements.upButton.removeAttribute('disabled');
						progressbar.cancel();
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
			isDownload: true
		});
		progressbar.setText("Fetching file...");

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
			var Current = FileManager.CurrentPath(),
				href = Auth.getStorageUrl() + Current.get(),
				filename = Current.name(),
				downloadLink = document.querySelector('.download-link');
			switch(window.FileManager.item.itemCommandName.pop()){
				case "open":
					window.FileManager.item.open(path);
					break;
				case "execute":
					window.FileManager.item.execute(path);
					break;
				default :
					downloadLink.setAttribute('href', href);
					downloadLink.download = filename;
					if(window.FileManager.toolbox.isEditable(contentType)){
						editFile(el);
					}else{
						el.removeChildren();
						FileManager.CurrentDirLabel.setContent(FileManager.CurrentPath().name());
						el.appendChild(notTextFileMsgContent);
					}
				//document.querySelector('.download-link').setAttribute('download', filename);
			}
			callback();
		}

		function fileNotExist(){
			window.FileManager.elements.upButton.removeAttribute('disabled');
			el.textContent = "File not found.";
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

		commandName = window.FileManager.item.itemCommandName.pop();//added to prevent unnessacary request while change event fired on loaded file
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
		el.textContent = "Loading...";
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
			if(FileManager.CurrentPath().isContainersList()){
				FileManager.Containers.loadMore();
			}else{
				window.FileManager.files.loadMore();
			}
		}
	}

	notTextFileMsgContent.className = "empty-list";
	notTextFileMsgContent.textContent = "Not text file.";

	document.addEventListener("transitionend", ontransition);
	document.addEventListener("webkitTransitionEnd", ontransition);
	window.addEventListener('hashchange', refreshItemList);
	document.addEventListener("DOMContentLoaded", function(){
		window.FileManager.elements.scrollWrapper.addEventListener('scroll', window.FileManager.toolbox.onscrollLoadMore);
	});

	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.files = {
		list: list,
		loadMore: loadMore,
		notExist: notExist,
		listHTML: listHTML,
		refreshItemList: refreshItemList,
		ontransition: ontransition
	};
})();