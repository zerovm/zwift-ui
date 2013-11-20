document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var content = document.getElementById("content"),
		scrollWrapper = document.getElementsByClassName("content-wrapper")[0];

	if(!window.FileManager){
		window.FileManager = {}
	}
	window.FileManager.elements = {
		scrollWrapper: scrollWrapper,
		itemsContainer: content,
		get itemsWrapperEl(){return content.firstElementChild}
	}
});