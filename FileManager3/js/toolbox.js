/**
 * User: Alexander
 * Date: 06.11.13
 * Time: 19:12
 */
(function(){
	"use strict";

	var extensions = ["txt", "json", "html", "htm", "nexe", "py", "pdf", "doc", "ppt", "xls", "docx", "pptx", "xml", "zip", "mp3", "mp4", "gif", "jpg", "png", "css", "csv", "tar", "js", "lua", "c", "h", "jar", "xul", "psd", "avi"],
		MIMETypes = ["text/plain", "application/json", "text/html", "text/html", "application/x-nexe", "text/x-python", "application/pdf", "application/msword", "application/vnd.ms-powerpoint", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/xml", "application/zip", "audio/mpeg", "audio/mp4", "image/gif", "image/jpeg", "image/png", "text/css", "text/csv", "application/x-tar", "text/javascript", "text/x-lua", "text/x-csrc", "text/x-chdr", "application/java-archive", "application/vnd.mozilla.xul+xml", "image/vnd.adobe.photoshop", "video/x-msvideo"];

	function getExt(e){
		var index = extensions.indexOf(e);
		if(index !== -1){
			return MIMETypes[index];
		}
		return null;
	}
	function getMIMEType(e){
		var index = MIMETypes.indexOf(e);
		if(index !== -1){
			return extensions[index];
		}
		return null;
	}
	function checkParentClassName(el, className){
		var topParentTag = "BODY";
		while(el.tagName !== topParentTag){
			if(el.classList.contains(className)){
				return el;
			}
			el = el.parentNode;
		}
		return null;
	}

	if(!window.FileManager){
		window.FileManager = {};
	}
	FileManager.toolbox = {
		getExt: getExt,
		getMIMEType: getMIMEType,
		getParentByClassName: checkParentClassName
	};
})();