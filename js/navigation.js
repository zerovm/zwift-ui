var Path = function (path) {
	this.get = function () {
		return path;
	};
	this.account = function () {
		return path.split('/')[0];
	};
	this.container = function () {
		return path.split('/')[1];
	};
	this.withoutAccount = function () {
		return path.split('/').splice(1).join('/');
	};
	this.prefix = function () {
		return path.split('/').splice(2).join('/');
	};
	this.name = function () {
		var pathParts = path.split('/');
		if (this.isDirectory()) {
			return pathParts.splice(-2).join('/');
		}
		return pathParts[pathParts.length - 1];
	};
	this.isContainersList = function () {
		return path === SwiftV1.account + "/";
	};
	this.isFilesList = function () {
		return this.isContainer() || this.isDirectory();
	};
	this.isContainer = function () {
		return path.split('/').length == 2;
	};
	this.isDirectory = function () {
		return path.lastIndexOf('/') == path.length - 1
	};
	this.isFile = function () {
		return !this.isContainer() && !this.isDirectory();
	};
	this.up = function () {
		var resultPath = path.split('/').filter(function(s){return s;});
		resultPath.pop();
		return resultPath.length && resultPath.join("/") + "/";
	};
	this.add = function (name) {
		return path + name;
	};
};

var CurrentPath = function () {
	var path = new Path(location.hash.substr(1));
	path.root = function(){
		return path.account() + "/";
	};
	return path;
};

document.getElementById('UpButton').addEventListener('click', function() {
		var upperLevel = CurrentPath().up();
		if (upperLevel) {
			NavigationBar.showLoading();
			location.hash = upperLevel;
		}
	}
);

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