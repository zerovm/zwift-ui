/**
 * User: Alexander
 * Date: 04.11.13
 * Time: 16:29
 */
document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var buttons = document.getElementsByClassName("dialog-button"),
		lastClickedButton = buttons[0],
		forbiddenChars = /\//,
		selectedClass = "selected",
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
			callback: window.FileManager.dialogForm.onerror
		});
	}

	function cancel(){
		lastClickedButton.classList.remove(selectedClass);
	}

	function showCreateButtonDialog(){
		var callback, action;
		if(this.classList.contains(selectedClass)){
			cancel();
		}else{
			lastClickedButton.classList.remove(selectedClass);
			lastClickedButton = this;
			action = this.dataset.action;
			switch(action){
				case "file":
					callback = onfile;
					break;
				case "directory":
					callback = ondirectory;
					break;
				case "container":
					callback = oncontainer;
					break;
				default:
					console.log("unkown action: " + action);
					return;
					break;
			}
			window.FileManager.dialogForm.show(this.dataset.placeholder, callback, cancel);
			this.classList.add(selectedClass);
		}
	}

	window.addEventListener("hashchange", cancel);
	buttons.forEach(function(el){
		el.addEventListener("click", showCreateButtonDialog);
	});

	function oncontainer(input){
		if(!input.value){
			window.FileManager.errorMsgHandler.show({
				header: errorMsgMap.emptyInput,
				callback: window.FileManager.dialogForm.onerror
			});
			return;
		}

		if(input.length > 256){
			window.FileManager.errorMsgHandler.show({
				header: errorMsgMap.nameTooLong,
				callback: window.FileManager.dialogForm.onerror
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
					callback: window.FileManager.dialogForm.onerror
				});
			},
			error: ajaxError
		});
	}

	function onfile(input){
		var path, inputValue = input.value;
		if(!inputValue){
			window.FileManager.errorMsgHandler.show({
				header: errorMsgMap.emptyInput,
				callback: window.FileManager.dialogForm.onerror
			});
			return;
		}

		path = FileManager.CurrentPath().withoutAccount() + inputValue;

		SwiftV1.createFile({
			path: path,
			contentType: 'text/plain',
			created: function(){
				location.hash = location.hash + inputValue;
				cancel();
			},
			error: ajaxError
		});
	}

	function ondirectory(input){
		var dirName, dirPath, dirPathWithoutAccount, requestArgs;
		if(!input.value){
			window.FileManager.errorMsgHandler.show({
				header: errorMsgMap.emptyInput,
				callback: window.FileManager.dialogForm.onerror
			});
			return;
		}
		if(input.value.match(forbiddenChars)){
			window.FileManager.errorMsgHandler.show({
				header: errorMsgMap.wrongName,
				callback: window.FileManager.dialogForm.onerror
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
				callback: window.FileManager.dialogForm.onerror
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