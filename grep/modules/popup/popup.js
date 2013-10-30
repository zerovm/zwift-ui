(function(){
	"use strict";

	var showClass = "shown";

	function Popup(text){
		var wrapper = document.createElement("div"),
			positioningWrapper = document.createElement("div"),
			popup = document.createElement("div"),
			outputTextEl = document.createElement("p"),
			closeButton = document.createElement("button"),
			options = {
				isModule: true,
				isDialog: false
			};

		function hide(){
			wrapper.classList.remove(showClass);
		}
		function setText(text){
			outputTextEl.innerHTML = text;
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
		setText(text);

		popup.appendChild(outputTextEl);
		popup.appendChild(closeButton);
		positioningWrapper.appendChild(popup);
		wrapper.appendChild(positioningWrapper);
		document.body.appendChild(wrapper);

		this.show = function(text){
			if(text){
				setText(text);
			}
			wrapper.classList.add(showClass);
		};
		this.hide = hide;
	}

	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.Popup = Popup;
})();