/**
 * User: Alexander
 * Date: 13.11.13
 * Time: 12:19
 */
document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var dialogContainer = document.getElementById("CreateDialog"),
		input = dialogContainer.getElementsByTagName("input")[0],
		hiddenClass = "hidden",
		inputInvalidClass = "invalid-input",
		form = dialogContainer.getElementsByTagName("form")[0],
		onconfirm, oncancel;

	function show(placeholder, onconfirmCallback, oncancelCallback){
		onconfirm = onconfirmCallback;
		oncancel = oncancelCallback;
		input.placeholder = placeholder;
		dialogContainer.classList.remove(hiddenClass);
		input.focus();
	}

	function error(){
		input.classList.add(inputInvalidClass);
	}

	document.getElementById("CancelDialog").addEventListener("click", function(){
		oncancel && oncancel();
		dialogContainer.classList.add(hiddenClass);
		input.value = "";
		input.classList.remove(inputInvalidClass);
		window.FileManager.errorMsgHandler.hide();
	});
	form.addEventListener("submit", function(e){
		e.stopPropagation();
		e.preventDefault();
		onconfirm && onconfirm(input);
		return false;
	});
	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.dialogForm = {
		show: show,
		onerror: error
	};
});