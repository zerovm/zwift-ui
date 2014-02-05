if (!FileManager) {
	FileManager = {};
}

FileManager.elements = {
	mainProgressBar: document.getElementById("mainProgressBar"),
	disableToolbarClass: "disable-toolbar-right",
	disableAllClass: "freeze-all",
	bodyLoadingClass: "loading-content",
	bodyReportClass: "report-shown",
	reportWrapper: document.getElementById("report"),
	get itemsWrapperEl(){return document.getElementById('List').firstElementChild}
};