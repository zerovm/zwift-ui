(function(){

	"use strict"

	var SEARCH_LIMIT = 1,
		DIRECTORY_TYPE = "application/directory",
		HIDDEN_ATTRIBUTE = "hidden",
		DELIMITER = "/",
		INDEX_CHUNK_SIZE = 20,
		searchResultEl,
		pathFiles,
		chunkCallsCounter;

//TODO: replace static json for indexer and rest (indexing.json, merge.json and so on)
	function search(value){
		console.log("started search")
		window.SearchApp.search(value, function(){console.log("search ends")});
	}

	document.addEventListener("DOMContentLoaded", function(){
		searchResultEl = document.getElementsByClassName("search-results")[0];
	});

	if(!window.searchApp){
		window.searchApp = {};
	}
	window.searchApp.search = search;
})();