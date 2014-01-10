/**
 * User: Alexander
 * Date: 05.11.13
 * Time: 15:39
 */
document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var uploads,
		buttonsPointerClass = "progressbar-buttons",
		requests = [];

	function enableButtons(){
		document.body.classList.remove(window.FileManager.elements.disableAllClass);
		document.body.classList.remove(buttonsPointerClass);
	}

	function disableButtons(){
		document.body.classList.add(window.FileManager.elements.disableAllClass);
		document.body.classList.add(buttonsPointerClass);
	}

	function clearOnfinish(e){
		window.removeEventListener("hashchange", clearOnfinish);
		enableButtons();
		document.body.classList.remove(window.FileManager.elements.disableToolbarClass);
		if(!e){
			requests = [];
			return;
		}
		if(requests){
			requests.forEach(function(request){
				request.abort();
			});
			requests = [];
		}
	}

	uploads = new function(){
		var uploadingFiles = 0;

		function onloadCallback(){
			uploadingFiles--;
			if(uploadingFiles === 0){
				enableButtons();
				window.FileManager.files.refreshItemList();
				clearOnfinish();
			}
		}

		function uploadFile(file, callback, wrapper){
			var _type, _name, url, uploadRequest;
			_name = file.newName || file.name;
			_type = file.newType || file.type || window.FileManager.toolbox.getMIMEType(_name);

			url = window.FileManager.elements.originalPath + FileManager.CurrentPath().get() + _name;
			uploadRequest = new XMLHttpRequest();
			requests.push(uploadRequest);
			new window.FileManager.toolbox.ProgressBar({
				wrapper: wrapper ? wrapper : window.FileManager.elements.itemsWrapperEl,
				request: uploadRequest,
				onEndCallback: callback
			});
			uploadRequest.open('PUT', url, true);

			uploadRequest.setRequestHeader('Content-Type', _type);
			uploadRequest.send(file);
			return uploadRequest;
		}

		this.uploadFiles = function(e){
			uploadingFiles = e.target.files.length;
			disableButtons();
			requests = e.target.files.map(function(file){
				uploadFile(file, onloadCallback);
			});
			e.target.value = [];
		};
		this.uploadFile = uploadFile;
	};

	function createDialog(file, onconfirm, oncancel){
		var wrapper = document.createElement("div"),
			form = document.createElement("form"),
			textEl, inputElement, button,
			buttonWrapper = document.createElement("div"),
			inputWrapper = document.createElement("div");
		wrapper.className = "item upload-as no-hover no-active";
		buttonWrapper.className = "button-wrapper";
		inputWrapper.className = "input-wrapper";
		form.className = "input-group";

		textEl = document.createElement("span");
		textEl.textContent = "New name";
		inputWrapper.appendChild(textEl);
		inputElement = document.createElement("input");
		inputElement.className = "form-control";
		inputElement.type = "text";
		inputElement.placeholder = textEl.textContent;
		inputElement.value = file.name;
		inputWrapper.appendChild(inputElement);

		textEl = document.createElement("span");
		textEl.textContent = "New type";
		inputWrapper.appendChild(textEl);
		inputElement = document.createElement("input");
		inputElement.className = "form-control";
		inputElement.type = "text";
		inputElement.placeholder = textEl.textContent;
		file.type && (inputElement.value = file.type);
		inputWrapper.appendChild(inputElement);
		form.appendChild(inputWrapper);

		button = document.createElement("button");
		button.tabIndex = -1;
		button.className = "hot-buttons btn btn-primary";
		button.textContent = "OK";
		button.type = "submit";
		buttonWrapper.appendChild(button);
		button = document.createElement("button");
		button.tabIndex = -1;
		button.className = "hot-buttons btn btn-default";
		button.textContent = "Cancel";
		button.type = "button";
		button.addEventListener("click", oncancel);
		buttonWrapper.appendChild(button);
		form.appendChild(buttonWrapper);

		form.addEventListener("submit", function(e){
			var name = e.target[0].value,
				type = e.target[1].value;
			e.preventDefault();
			name && (file.newName = name);
			type && (file.newType = type);
			onconfirm(file, wrapper);
			return false;//just in case
		});

		wrapper.appendChild(form);
		return wrapper;
	}

	function uploadAs(e){//TODO: check hide button for single loaded file
		var filesCounter = e.target.files.length,
			wrapper = window.FileManager.elements.itemsWrapperEl,
			fragment = document.createDocumentFragment(),
			wasSmthUploded;

		e.target.files.forEach(function(file){
			fragment.appendChild(createDialog(file, onconfirm, oncancel));
		});
		e.target.value = null;
		wrapper.insertBefore(fragment, wrapper.firstElementChild);
		wrapper.getElementsByTagName("input")[0].focus();

		function onconfirm(file, wrapper){
			wrapper.removeChildren();
			uploads.uploadFile(file, onloadedCallback, wrapper);
			wasSmthUploded = true;
		}

		function oncancel(e){
			var el;
			onloadedCallback();
			el = window.FileManager.toolbox.getParentByClassName(e.target, "upload-as");
			el && el.parentNode.removeChild(el);
		}

		function onloadedCallback(item){
			filesCounter--;
			item && item.parentNode.removeChild(item);
			if(!filesCounter){
				enableButtons();
				if(wasSmthUploded){
					window.FileManager.files.refreshItemList();
				}
				clearOnfinish();
			}
		}

		disableButtons();
	}

	function onexec(e){
		var file = e.target.files[0],
			toolbox = window.FileManager.toolbox,
			type, computedType;
		if(toolbox.isExecutable(file.type)){
			type = file.type;
		}else{
			computedType = toolbox.getMIMEType(file.name);
			type = toolbox.isExecutable(computedType) ? computedType : null;
		}
		e.target.value = [];
		if(type){
			window.FileManager.item.itemCommandName.set("none");
			location.hash = FileManager.CurrentPath().add(file.name);
			FileManager.CurrentDirLabel.setContent(file.name);

			window.FileManager.fileExecutor.execute({
				data: file,
				contentType: type
			});
		}else{
			window.FileManager.errorMsgHandler.show({header: "Wrong file type"});
		}
	}

	function change(e){
		e.stopPropagation();
		e.preventDefault();
		switch(e.target.dataset.action){
			case "file":
				uploads.uploadFiles(e);
				document.body.classList.add(window.FileManager.elements.disableToolbarClass);
				window.addEventListener("hashchange", clearOnfinish);
				break;
			case "as":
				uploadAs(e);
				document.body.classList.add(window.FileManager.elements.disableToolbarClass);
				window.addEventListener("hashchange", clearOnfinish);
				break;
			case "exec":
				onexec(e);
				break;
			default:
				console.log("unkown action: " + e.target.dataset.action);
				break;
		}
	}

	document.getElementsByClassName("upload-input").forEach(function(input){
		input.addEventListener("change", change);
	});
});