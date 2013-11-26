document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var content = document.getElementById("content"),
		scrollWrapper = document.getElementsByClassName("content-wrapper")[0],
		mainProgressBar = document.getElementById("mainProgressBar"),
		upButton = document.getElementById("UpButton");

	if(!window.FileManager){
		window.FileManager = {}
	}
	window.FileManager.elements = {
		originalPath: "https://z.litestack.com/v1/",//TODO: replace hardcode with smth
		scrollWrapper: scrollWrapper,
		itemsContainer: content,
		upButton: upButton,
		mainProgressBar: mainProgressBar,
		hiddenClass: "hidden",
		disableToolbarClass: "disable-toolbar-right",
		get itemsWrapperEl(){return content.firstElementChild}
	}
});