(function(){

	"use strict"

	var searchResultEl;

	function search(params){
		console.log("started search")
		window.grepAppHelper.grep(params);
	}

	document.addEventListener("DOMContentLoaded", function(){
		searchResultEl = document.getElementsByClassName("search-results")[0];
	});

	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.search = search;
})();