/**
 * Created by Alexander Tylnyj 10.12.13 14:56
 */
(function(){
	"use strict";

	var MAX_LENGTH = 40,
		el;

	function setContent(content, isArrowsSeparated) {
		var splittedContent, i, prevValue, joiner = "/";
		el.classList.add("hidden");
		el.removeChildren();
		if(content.length > MAX_LENGTH){
			splittedContent = content.split("/").filter(function(str){return str;});
			content = "";
			i = splittedContent.length - 1;
			do{
				prevValue = content;
				content = "/" + splittedContent[i] + content;
				i--;
			}while(content.length < MAX_LENGTH);
			content = prevValue;
			if(!content){
				content = splittedContent[splittedContent.length];
			}
		}
		if(!content){
			el.innerHTML = content;
			return;
		}
		if(isArrowsSeparated){
			joiner = "<img class='path-separator' src='img/go.png'/>";
		}
		content = content.split("/").map(function(pathPart){
			return pathPart ? "<a href='#' data-hash='" + pathPart + "'>" + pathPart + "</a>" : "";
		}).join(joiner);
		el.innerHTML = content;
		el.classList.remove("hidden");
	}

	function root() {
		if (FileManager.ENABLE_EMAILS) {
			Auth.getEmail(function (email) {
				setContent(email);
			});
			return;
		}
		var account = Auth.getAccount();
		setContent(account);
	}

	function showLoading() {
		setContent('Loading...');
	}

	document.addEventListener("DOMContentLoaded", function(){
		el = document.getElementsByClassName("current-dir-label")[0];
	});
	
	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.CurrentDirLabel = {
		root: root,
		setContent: setContent,
		showLoading: showLoading
	}
})();