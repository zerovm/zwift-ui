/**
 * User: Alexander
 * Date: 13.11.13
 * Time: 12:19
 */
(function(){
	"use strict";
	var dialogFormArray = [];

	function closeOtherDialogs(){
		dialogFormArray.forEach(function(dialogForm){
			dialogForm.hide();
		})
	}

	function DialogForm(options){
		var dialogContainer = document.getElementById(options.wrapperId),
			input = dialogContainer.getElementsByTagName("input")[0],
			dialogContentWrapper = dialogContainer.getElementsByClassName("dialog-wrapper")[0],
			inputClass = "input-shown", dialogClass = "dialog-shown",
			inputInvalidClass = "invalid-input",
			form = dialogContainer.getElementsByTagName("form")[0],
			onconfirm, oncancel;

		function show(params){
			closeOtherDialogs();
			onconfirm = params.confirm;
			oncancel = params.decline;
			document.body.classList.add(window.FileManager.elements.disableToolbarClass);
			options.hashchangeHandler = params.hashchangeHandler;
			options.customizationClass = params.customizationClass;
			options.customizationClass && dialogContainer.classList.add(options.customizationClass);
			switch(params.type){
				case "input":
					input.placeholder = params.placeholder;
					params.inputValue && (input.value = params.inputValue);
					dialogContainer.classList.add(inputClass);
					dialogContainer.classList.remove(window.FileManager.elements.hiddenClass);
					input.focus();
					break;
				case "dialog":
					dialogContentWrapper.removeChildren();
					dialogContentWrapper.appendChild(params.dialogContent);
					dialogContainer.classList.add(dialogClass);
					dialogContainer.classList.remove(window.FileManager.elements.hiddenClass);
					params.onshow && params.onshow();
					break;
				case "simple-dialog":
					dialogContainer.classList.add(dialogClass);
					dialogContainer.classList.remove(window.FileManager.elements.hiddenClass);
					params.onshow && params.onshow();
					break;
				default: console.log("dialog form: unknown type");
			}
		}

		function error(){
			input.classList.add(inputInvalidClass);
		}

		function hide(){
			oncancel && oncancel();
			options.customizationClass && dialogContainer.classList.remove(options.customizationClass);
			document.body.classList.remove(window.FileManager.elements.disableToolbarClass);
			dialogContainer.classList.add(window.FileManager.elements.hiddenClass);
			dialogContainer.classList.remove(inputClass);
			dialogContainer.classList.remove(dialogClass);
			input.value = "";
			input.classList.remove(inputInvalidClass);
			window.FileManager.errorMsgHandler.hide();
		}

		this.hide = hide;
		this.show = show;
		this.error = error;
		this.el = dialogContainer;
		input.addEventListener("keydown", function(){
			input.classList.remove(inputInvalidClass);
			window.FileManager.errorMsgHandler.hide();
		});
		dialogContainer.querySelector("button[type=\"button\"]").addEventListener("click", hide);
		form.addEventListener("submit", function(e){
			e.stopPropagation();
			e.preventDefault();
			onconfirm && onconfirm(input);
			return false;
		});
		window.addEventListener("hashchange", function(e){
			if(options.hashchangeHandler){
				options.hashchangeHandler(e);
			}else{
				hide();
			}
		});

		dialogFormArray.push(this);
	}

	DialogForm.closeOtherDialogs = closeOtherDialogs;
	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.DialogForm = DialogForm;
	document.addEventListener("DOMContentLoaded", function(){
		window.FileManager.dialogForm = new DialogForm({
			wrapperId: "CreateDialog"
		});
	})
})();