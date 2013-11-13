/**
 * User: Alexander
 * Date: 04.11.13
 * Time: 16:29
 */
document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var dialogContainer = document.getElementById("CreateDialog"),
		input = dialogContainer.getElementsByTagName("input")[0],
		buttons = document.getElementsByClassName("dialog-button"),
		form = dialogContainer.getElementsByTagName("form")[0],
		lastClickedButton = buttons[0],
		forbiddenChars = /\//,
		selectedClass = "selected",
		hiddenClass = "hidden",
		inputInvalidClass = "invalid-input",
		errorMsgMap = {
			ajax: "Error:",
			wrongName: "Name cannot contain a slash (/) character.",
			containerAlreadyExist: "Container is already exists.",
			dirAlreadyExist: "Directory is already exists.",
			nameTooLong: "Container name should be less then 256 characters.",
			emptyInput: "The name should be bit longer."
		};

	function ajaxError(status, statusText){
		window.FileManager.errorMsgHandler.show({
			header: errorMsgMap.emptyInput,
			status: status,
			statusText: statusText,
			callback: errorCallback
		});
	}

	function errorCallback(){
		input.classList.add(inputInvalidClass);
	}

	function cancel(){
		lastClickedButton.classList.remove(selectedClass);
		dialogContainer.classList.add(hiddenClass);
		input.value = "";
		input.classList.remove(inputInvalidClass);
		window.FileManager.errorMsgHandler.hide();
	}

	function confirm(e){
		e.stopPropagation();
		e.preventDefault();
		switch(e.target.dataset.action){
			case "file":
				onfile();
				break;
			case "directory":
				ondirectory();
				break;
			case "container":
				oncontainer();
				break;
			default:
				console.log("unkown action: " + e.target.dataset.action);
				break;
		}
		return false;
	}

	function showCreateButtonDialog(){
		if(this.classList.contains(selectedClass)){
			cancel();
		}else{
			lastClickedButton.classList.remove(selectedClass);
			lastClickedButton = this;
			form.dataset.action = this.dataset.action;
			input.placeholder = this.dataset.placeholder;
			dialogContainer.classList.remove(hiddenClass);
			this.classList.add(selectedClass);
			input.focus();
		}
	}

	form.addEventListener("submit", confirm);
	document.getElementById("CancelDialog").addEventListener("click", cancel);
	buttons.forEach(function(el){
		el.addEventListener("click", showCreateButtonDialog);
	});

	function oncontainer(){
		if(!input.value){
			window.FileManager.errorMsgHandler.show({
				header: errorMsgMap.emptyInput,
				callback: errorCallback
			});
			return;
		}

		if(input.length > 256){
			input.classList.add(inputInvalidClass);
			window.FileManager.errorMsgHandler.show({
				header: errorMsgMap.nameTooLong,
				callback: errorCallback
			});
			return;
		}

		if(input.value.match(forbiddenChars)){
			// TODO: shared containers here.
		}

		SwiftV1.createContainer({
			containerName: input.value,
			created: function(){
				FileManager.ContentChange.animate();
				cancel();
			},
			alreadyExisted: function(){
				window.FileManager.errorMsgHandler.show({
					header: errorMsgMap.containerAlreadyExist,
					callback: errorCallback
				});
			},
			error: ajaxError
		});
	}

	function onfile(){
		var path;
		if(!input.value){
			window.FileManager.errorMsgHandler.show({
				header: errorMsgMap.emptyInput,
				callback: errorCallback
			});
			return;
		}

		path = FileManager.CurrentPath().withoutAccount() + input.value;

		SwiftV1.createFile({
			path: path,
			contentType: 'text/plain',
			created: function(){
				console.log(FileManager.fileEditor.set());
				FileManager.fileEditor.show();
				cancel();
			},
			error: ajaxError
		});
	}

	function ondirectory(){
		var dirName, dirPath, dirPathWithoutAccount, requestArgs;
		if(!input.value){
			window.FileManager.errorMsgHandler.show({
				header: errorMsgMap.emptyInput,
				callback: errorCallback
			});
			return;
		}
		if(input.value.match(forbiddenChars)){
			window.FileManager.errorMsgHandler.show({
				header: errorMsgMap.wrongName,
				callback: errorCallback
			});
			return;
		}
		dirName = input.value + "/";
		dirPath = FileManager.CurrentPath().add(dirName);
		dirPathWithoutAccount = FileManager.Path(dirPath).withoutAccount();
		requestArgs = {};
		requestArgs.path = dirPathWithoutAccount;
		if(FileManager.ENABLE_SHARED_CONTAINERS){
			requestArgs.account = FileManager.CurrentPath().account();
		}
		requestArgs.success = function(){
			window.FileManager.errorMsgHandler.show({
				header: errorMsgMap.containerAlreadyExist,
				callback: errorCallback
			});
		};
		requestArgs.notExist = function(){
			SwiftV1.createDirectory({
				path: dirPathWithoutAccount,
				created: function(){
					FileManager.ContentChange.animate();
					cancel();
				},
				error: ajaxError
			});
		};
		requestArgs.error = ajaxError;
		SwiftV1.checkDirectoryExist(requestArgs);
	}
});