document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var content = document.getElementById("content"),
		scrollWrapper = document.getElementsByClassName("content-wrapper")[0],
		mainProgressBar = document.getElementById("mainProgressBar"),
		reportWrapper = document.getElementById("report"),
		upButton = document.getElementById("UpButton");

	if(!window.FileManager){
		window.FileManager = {}
	}
	window.FileManager.elements = {
		originalPath: "https://zvm.rackspace.com/v1/",//TODO: replace hardcode with smth
		scrollWrapper: scrollWrapper,
		itemsContainer: content,
		upButton: upButton,
		mainProgressBar: mainProgressBar,
		hiddenClass: "hidden",
		disableToolbarClass: "disable-toolbar-right",
		disableAllClass: "freeze-all",
		bodyLoadingClass: "loading-content",
		bodyReportClass: "report-shown",
		reportWrapper: reportWrapper,
		get itemsWrapperEl(){return content.firstElementChild}
	}
});