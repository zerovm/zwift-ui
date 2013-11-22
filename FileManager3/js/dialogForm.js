/**
 * User: Alexander
 * Date: 13.11.13
 * Time: 12:19
 */
document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var dialogContainer = document.getElementById("CreateDialog"),
		input = dialogContainer.getElementsByTagName("input")[0],
		dialogContentWrapper = dialogContainer.getElementsByClassName("dialog-wrapper")[0],
		hiddenClass = "hidden", inputClass = "input-shown", dialogClass = "dialog-shown",
		inputInvalidClass = "invalid-input",
		form = dialogContainer.getElementsByTagName("form")[0],
		onconfirm, oncancel;

	function show(params){
		onconfirm = params.confirm;
		oncancel = params.decline;
		switch(params.type){
			case "input":
				input.placeholder = params.placeholder;
				dialogContainer.classList.add(inputClass);
				dialogContainer.classList.remove(hiddenClass);
				input.focus();
				break;
			case "dialog":
				dialogContentWrapper.removeChildren();
				dialogContentWrapper.appendChild(params.dialogContent);
				dialogContainer.classList.add(dialogClass);
				dialogContainer.classList.remove(hiddenClass);
				break;
			default: console.log("dialog form: unknown type");
		}
	}

	function error(){
		input.classList.add(inputInvalidClass);
	}

	function hide(){
		dialogContainer.classList.add(hiddenClass);
		dialogContainer.classList.remove(inputClass);
		dialogContainer.classList.remove(dialogClass);
		input.value = "";
		input.classList.remove(inputInvalidClass);
		window.FileManager.errorMsgHandler.hide();
	}

	document.getElementById("CancelDialog").addEventListener("click", function(){
		oncancel && oncancel();
		hide();
	});
	form.addEventListener("submit", function(e){
		e.stopPropagation();
		e.preventDefault();
		onconfirm && onconfirm(input);
		hide();
		return false;
	});
	window.addEventListener("hashchange", hide);
	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.dialogForm = {
		show: show,
		hide: hide,
		onerror: error
	};
});