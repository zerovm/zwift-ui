(function(){

	"use strict"

	var searchResultEl;

	function search(value){
		console.log("started search")
		window.grepApp.search(value, function(){console.log("search ends")});
	}

	document.addEventListener("DOMContentLoaded", function(){
		searchResultEl = document.getElementsByClassName("search-results")[0];
	});

	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.search = search;
})();