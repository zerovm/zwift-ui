(function(){
	"use strict"

	var preferenceValue = {
			suggest: true,
			indexing: true,
			shorttext: true
		},
		showPreferencesClass = "visible";

	function toggle(el){
		el.parentNode.classList.toggle(showPreferencesClass);
	}

	function setPreference(name, value){
		preferenceValue[name] = value;
	}

	function clickHandler(el){
		var role = el.getAttribute("role");
		switch(role){
			case "toggle":
				toggle(el);
				break;
			case "indexing":
			case "shorttext":
			case "suggest":
				setPreference(role, el.checked);
				break;
		}
	}

	function getPreference(name){
		return preferenceValue[name];
	}

	if(!window.searchApp){
		window.searchApp = {};
	}
	window.searchApp.preferences = {
		clickHandler: clickHandler,
		getPreference: getPreference
	};
})();