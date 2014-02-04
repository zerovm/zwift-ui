document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var mainProgressBar = document.getElementById("mainProgressBar"),
		reportWrapper = document.getElementById("report"),
		upButton = document.getElementById("UpButton");

	if(!window.FileManager){
		window.FileManager = {}
	}
	window.FileManager.elements = {
		originalPath: "https://zvm.rackspace.com/v1/",//TODO: replace hardcode with smth
		upButton: upButton,
		mainProgressBar: mainProgressBar,
		hiddenClass: "hidden",
		disableToolbarClass: "disable-toolbar-right",
		disableAllClass: "freeze-all",
		bodyLoadingClass: "loading-content",
		bodyReportClass: "report-shown",
		reportWrapper: reportWrapper,
		get itemsWrapperEl(){return document.getElementById('List').firstElementChild}
	}
});