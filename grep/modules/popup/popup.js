(function(){
	"use strict";

	var showClass = "shown",
		stringType = "string",
		popupWrapperClassName = "popup-wrapper";

	function removeChildren(el){
		while(el.firstChild){
			el.removeChild(el.firstChild);
		}
	}

	function Popup(params){
		var wrapper = document.createElement("div"),
			positioningWrapper = document.createElement("div"),
			popup = document.createElement("div"),
			outputEl,
			confirmButton = document.createElement("button"),
			buttonWrapper = document.createElement("div"),
			declineButton;

		function hide(){
			wrapper.classList.remove(showClass);
		}

		function setOutputContents(child){
			removeChildren(outputEl);
			typeof child === stringType ? outputEl.innerHTML = child : outputEl.appendChild(child);
		}

		if(!params){
			params = {};
		}
		outputEl = params.isNotTextContent ? document.createElement("div") : document.createElement("p");
		wrapper.className = params.wrapperClassName ? popupWrapperClassName + " " + params.wrapperClassName : popupWrapperClassName;

		["click", "mousedown", "mouseup", "keydown"].forEach(function(eventName){
			wrapper.addEventListener(eventName, function(e){
				e.stopPropagation();
			});
		});
		positioningWrapper.className = "popup-box-wrapper";
		popup.className = "popup";
		buttonWrapper.className = "button-wrapper";
		if(params && !params.isNoButtons){
			confirmButton.className = "close-button";
			confirmButton.innerHTML = "OK";
			confirmButton.addEventListener("click", function(){
				hide();
				params.confirm && params.confirm();
			});
			buttonWrapper.appendChild(confirmButton);
			if(params.isDialog){
				declineButton = document.createElement("button");
				declineButton.className = "close-button";
				declineButton.innerHTML = "Cancel";
				declineButton.addEventListener("click", function(){
					hide();
					params.decline && params.decline();
				});
				buttonWrapper.appendChild(declineButton);
			}
		}else{
			wrapper.classList.add("message-popup");
		}
		params.child && setOutputContents(params.child);

		popup.appendChild(outputEl);
		popup.appendChild(buttonWrapper);
		positioningWrapper.appendChild(popup);
		wrapper.appendChild(positioningWrapper);
		document.body.appendChild(wrapper);

		this.show = function(child){
			child && setOutputContents(child);
			wrapper.classList.add(showClass);
		};
		this.hide = hide;
		this.popupEl = popup;
	}

	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.Popup = Popup;
})();