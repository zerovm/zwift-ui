(function(){
	"use strict";

	var showClass = "shown";

	function Popup(){
		var wrapper = document.createElement("div"),
			positioningWrapper = document.createElement("div"),
			popup = document.createElement("div"),
			outputTextEl = document.createElement("p"),
			closeButton = document.createElement("button");

		function hide(){
			wrapper.classList.remove(showClass);
		}

		wrapper.className = "popup-wrapper";
		["click", "mousedown", "mouseup", "keydown"].forEach(function(eventName){
			wrapper.addEventListener(eventName, function(e){
				e.stopPropagation();
			});
		});
		positioningWrapper.className = "popup-box-wrapper";
		popup.className = "popup";
		closeButton.className = "close-button";
		closeButton.innerHTML = "OK";
		closeButton.addEventListener("click", hide);

		popup.appendChild(outputTextEl);
		popup.appendChild(closeButton);
		positioningWrapper.appendChild(popup);
		wrapper.appendChild(positioningWrapper);
		document.body.appendChild(wrapper);

		this.setText = function(text){
			outputTextEl.innerHTML = text;
		};
		this.show = function(text){
			if(text){
				this.setText(text);
			}
			wrapper.classList.add(showClass);
		};
		this.hide = hide;
	}

	if(!window.searchApp){
		window.searchApp = {};
	}
	window.searchApp.Popup = Popup;
})();