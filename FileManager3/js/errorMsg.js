/**
 * User: Alexander
 * Date: 13.11.13
 * Time: 10:38
 */
(function(){
	"use strict";

	var hiddenClass = "hidden",
		errorsEl = document.getElementsByClassName("err-msg")[0];

	function showError(params){
		var span = document.createElement("span");
		errorsEl.textContent = params.header;
		params.status && (span.textContent = params.status);
		errorsEl.appendChild(span);
		span = document.createElement("span");
		params.statusText && (span.textContent = params.statusText);
		errorsEl.appendChild(span);
		errorsEl.classList.remove(hiddenClass);
		params.callback && params.callback();
	}

	function hideError(){
		errorsEl.classList.add(hiddenClass);
	}

	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.errorMsgHandler = {
		hide: hideError,
		show: showError
	};
})();