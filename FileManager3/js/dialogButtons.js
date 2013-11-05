/**
 * User: Alexander
 * Date: 04.11.13
 * Time: 16:29
 */
document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var dialogContainer = document.getElementById("CreateDialog"),
		input = dialogContainer.getElementsByTagName("input")[0],
		errorsEl = dialogContainer.getElementsByClassName("err-msg")[0],
		buttons = document.getElementsByClassName('dialog-button'),
		form = dialogContainer.getElementsByTagName("form")[0],
		lastClickedButton = buttons[0],
		forbiddenChars = /\//,
		selectedClass = "selected",
		hiddenClass = "hidden",
		inputInvalidClass = 'invalid-input',
		innerText = dialogContainer.innerText ? "innerText" : "textContent",
		errorMsgMap = {
			ajax: "Error:",
			wrongDirName: "Directory name cannot have a slash (/) character.",
			containerAlreadyExist: "Container is already exists.",
			dirAlreadyExist: "Directory is already exists.",
			nameTooLong: "Container name should be less then 256 characters.",
			emptyInput: "The name should be bit longer."
		};

	function ajaxError(status, statusText){
		var span = document.createElement("span");
		input.classList.add(inputInvalidClass);
		errorsEl[innerText] = errorMsgMap.ajax;
		span[innerText] = status;
		errorsEl.appendChild(span);
		span = document.createElement("span");
		span[innerText] = statusText;
		errorsEl.appendChild(span);
		errorsEl.classList.remove(hiddenClass);
	}

	function error(msg){
		input.classList.add(inputInvalidClass);
		errorsEl[innerText] = msg;
		errorsEl.classList.remove(hiddenClass);
	}

	function oncontainer(){}
	function onfile(){}

	function ondirectory(){
		if(!input.value){
			error(errorMsgMap.emptyInput);
			return;
		}

		if(input.value.match(forbiddenChars)){
			error(errorMsgMap.wrongDirName);
			return;
		}

		var dirName = input.value + '/';
		var dirPath = FileManager.CurrentPath().add(dirName);
		var dirPathWithoutAccount = FileManager.Path(dirPath).withoutAccount();

		var requestArgs = {};

		requestArgs.path = dirPathWithoutAccount;

		if(FileManager.ENABLE_SHARED_CONTAINERS){
			requestArgs.account = FileManager.CurrentPath().account();
		}

		requestArgs.success = function(){
			error(errorMsgMap.containerAlreadyExist);
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

	function cancel(){
		lastClickedButton.classList.remove(selectedClass);
		dialogContainer.classList.add(hiddenClass);
		input.value = "";
		input.classList.remove(inputInvalidClass);
		FileManager.Layout.adjust();
		hide(errorsEl);
	}

	function hide(el){
		el.classList.add(hiddenClass);
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
		}
		return false;
	}

	function showCreateButtonDialog(){
		if(this.classList.contains('selected')){
			cancel();
		}else{
			lastClickedButton = this;
			form.dataset.action = this.dataset.action;
			input.dataset.placeholder = this.dataset.placeholder;
			dialogContainer.classList.remove(hiddenClass);
			this.classList.add(selectedClass);
			FileManager.Layout.adjust();
			input.focus();
		}
	}
	form.addEventListener('submit', confirm);
	document.getElementById('CancelDialog').addEventListener('click', cancel);
	buttons.forEach(function(el){
		el.addEventListener('click', showCreateButtonDialog);
	});
});