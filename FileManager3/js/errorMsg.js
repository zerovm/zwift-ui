/**
 * User: Alexander
 * Date: 13.11.13
 * Time: 10:38
 */
document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var errorsEl = document.getElementsByClassName("err-msg")[0].parentNode;

	function showError(params){//TODO: add ajax error
		var span = document.createElement("span");
		errorsEl.textContent = params.header;
		params.status && (span.textContent = params.status);
		errorsEl.appendChild(span);
		span = document.createElement("span");
		params.statusText && (span.textContent = params.statusText);
		errorsEl.appendChild(span);
		errorsEl.classList.remove(window.FileManager.elements.hiddenClass);
		params.callback && params.callback();
	}

	function hideError(){
		errorsEl.classList.add(window.FileManager.elements.hiddenClass);
	}
	hideError();
	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.errorMsgHandler = {
		hide: hideError,
		show: showError
	};
});