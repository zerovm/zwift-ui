/**
 * User: Alexander
 * Date: 13.11.13
 * Time: 10:38
 */
document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var errorsEl = document.getElementsByClassName("err-msg")[0].parentNode,
		errorClass = "error-is-shown",
		closeButton,
		onclose;

	function showError(params){
		var span, strong, br;
		errorsEl.textContent = params.header;
		document.body.classList.add(errorClass);
		onclose = params.onclose;
		if(params.status){
			strong = document.createElement("strong");
			strong.textContent = "Status: ";
			errorsEl.appendChild(document.createElement("br"));
			errorsEl.appendChild(strong);
			span = document.createElement("span");
			span.textContent = params.status;
			errorsEl.appendChild(span);
		}
		if(params.statusText){
			strong = document.createElement("strong");
			strong.textContent = "Status text: ";
			errorsEl.appendChild(document.createElement("br"));
			errorsEl.appendChild(strong);
			span = document.createElement("span");
			span.textContent = params.statusText;
			errorsEl.appendChild(span);
		}
		errorsEl.appendChild(closeButton);
		errorsEl.classList.remove(window.FileManager.elements.hiddenClass);
		params.callback && params.callback();
	}

	function hideError(){
		closeButton.parentNode && closeButton.parentNode.removeChild(closeButton);
		errorsEl.classList.add(window.FileManager.elements.hiddenClass);
		document.body.classList.remove(errorClass);
	}

	closeButton = document.createElement("button");
	closeButton.textContent = "OK";
	closeButton.className = "btn btn-primary ok-dialog-button";
	closeButton.addEventListener("click", function(){
		hideError();
		onclose && onclose();
	});
	hideError();
	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.errorMsgHandler = {
		hide: hideError,
		show: showError
	};
});