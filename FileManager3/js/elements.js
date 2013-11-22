document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var content = document.getElementById("content"),
		scrollWrapper = document.getElementsByClassName("content-wrapper")[0],
		upButton = document.getElementById("UpButton");

	if(!window.FileManager){
		window.FileManager = {}
	}
	window.FileManager.elements = {
		originalPath: "https://z.litestack.com/v1/",
		scrollWrapper: scrollWrapper,
		itemsContainer: content,
		upButton: upButton,
		get itemsWrapperEl(){return content.firstElementChild}
	}
});