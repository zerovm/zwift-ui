/*requires popup.js for alert popups*/
(function(){
	"use strict";

	var showPreferencesClass = "visible", togglerAttribute = "toggler", popupTextAttribute = "popupText";

	function toggle(el){
		el.parentNode.classList.toggle(showPreferencesClass);
	}

	function Preferences(options){
		var preferencesValues = {},
			popup = new window.grepApp.Popup();

		Object.keys(options).forEach(function(property){
			preferencesValues[property] = options[property].el;
		});

		this.clickHandler = function(el){
			var role = el.getAttribute("role");
			if(role === togglerAttribute){
				toggle(el);
			}else if(!el.checked && el.dataset[popupTextAttribute]){
				popup.show(el.dataset[popupTextAttribute]);
			}
		};

		this.getPreference = function(name){
			return preferencesValues[name].checked;
		};
	}

	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.Preferences = Preferences;
})();