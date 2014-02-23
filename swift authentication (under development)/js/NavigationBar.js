document.getElementById('NavigationBar').addEventListener('click', function(e) {
	var newPath;
	if (e.target.nodeName === "A") {
		e.preventDefault();
		e.stopPropagation();
		newPath = location.hash.match(new RegExp(".*" + e.target.dataset.hash + "\/"));
		if (newPath) {
			location.hash = newPath[0];
		}
	}
});

var NavigationBar = {};

NavigationBar.setContent = function (content, isArrowsSeparated) {

	var MAX_LENGTH = 40;
	var el = document.getElementById('NavigationBar');
	var splittedContent, i, prevValue, joiner = "/";

	el.classList.add("hidden");
	el.removeChildren();

	if (content.length > MAX_LENGTH) {
		splittedContent = content.split("/").filter(function(str){return str;});
		content = "";
		i = splittedContent.length - 1;
		do {
			prevValue = content;
			content = "/" + splittedContent[i] + content;
			i--;
		} while (content.length < MAX_LENGTH);
		content = prevValue;
		if (!content) {
			content = splittedContent[splittedContent.length - 1];
		}
	}
	if (!content) {
		el.innerHTML = content;
		return;
	}
	if (isArrowsSeparated) {
		joiner = "<span class='path-separator'></span>";
	}
	content = content.split("/").map(function(pathPart){
		return pathPart ? "<a href='#' data-hash='" + pathPart + "'>" + pathPart + "</a>" : "";
	}).join(joiner);
	el.innerHTML = content;
	el.classList.remove("hidden");
};

NavigationBar.root = function () {
	NavigationBar.setContent(SwiftV1.account);
};

NavigationBar.showLoading = function () {
	NavigationBar.setContent('Loading...');
};