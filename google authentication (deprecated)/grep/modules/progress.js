(function(){
	"use strict";

	var progressClass = "progress-cursor"

	function start(){
		document.body.classList.add(progressClass);
	}
	function end(){
		document.body.classList.remove(progressClass);
	}

	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.progress = {
		start: start,
		end: end
	}
})();