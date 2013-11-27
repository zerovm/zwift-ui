(function(){
	"use strict";

	var LIMIT = 20;

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

		if(!el){
			return;
		}

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
			var loadingEl = document.querySelector(".load-more-button");
			loadingEl.textContent = "Error: " + status + " " + statusText;
		};

		filesArgs.notExist = notExist;

		SwiftV1.listFiles(filesArgs);
	}

	function notExist(){
		var scrollingContentEl = document.getElementsByClassName("new-scrolling-content")[0];
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
		return html.replace("{{file-type}}", FileManager.toolbox.escapeHTML(contentType))
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

	function addFileListContent(){
		var parentEl, newEl, oldEl, template, el, loadingEl;

		function callback(){
			oldEl.classList.add("old-scrolling-content");
			newEl.classList.remove("new-scrolling-content");
			window.FileManager.elements.itemsWrapperEl.scrollIntoView();
		}

		oldEl = window.FileManager.elements.itemsWrapperEl;
		parentEl = oldEl.parentNode;

		template = document.querySelector("#newScrollingContentTemplate").innerHTML;
		parentEl.insertAdjacentHTML("afterbegin", template);
		newEl = document.querySelector(".new-scrolling-content");
		newEl.style.paddingTop = window.scrollY + "px";

		el = newEl;
		el.textContent = "Loading...";
		if(FileManager.CurrentPath().isContainersList()){
			FileManager.Containers.list(callback);

			FileManager.ExecuteButton.hide();
			FileManager.OpenButton.hide();
		}else if(FileManager.CurrentPath().isFilesList()){
			list(callback);

			FileManager.ExecuteButton.hide();
			FileManager.OpenButton.hide();
		}else{
			FileManager.File.open(el, callback);
		}

		loadingEl = document.querySelector(".scrolling-content-loading");
		loadingEl && loadingEl.parentNode.removeChild(loadingEl);

	}

	function ontransition(e){
		var el = e.target, newEl;
		if(el.classList.contains("old-scrolling-content")){
			el.parentNode.removeChild(el);
			newEl = window.FileManager.elements.itemsWrapperEl;
			newEl.classList.add("no-transition");
			newEl.style.paddingTop = "";
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

	document.addEventListener("transitionend", ontransition);
	document.addEventListener("webkitTransitionEnd", ontransition);

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
		addFileListContent: addFileListContent,
		ontransition: ontransition
	};
})();