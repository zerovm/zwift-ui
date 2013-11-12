/**
 * User: Alexander
 * Date: 06.11.13
 * Time: 19:12
 */
(function(){
	"use strict";

	var mimeObj = {},
		extObj = {
			"txt": {"mime": "text/plain", "isEditable": "true"},
			"json": {"mime": "application/json", "isEditable": "true", "isExecutable": "true"},
			"html": {"mime": "text/html", "isEditable": "true"},
			"htm": {"mime": "text/html", "isEditable": "true"},
			"nexe": {"mime": "application/x-nexe"},
			"py": {"mime": "text/x-python", "isEditable": "true"},
			"pdf": {"mime": "application/pdf"},
			"doc": {"mime": "application/msword"},
			"ppt": {"mime": "application/vnd.ms-powerpoint"},
			"xls": {"mime": "application/vnd.ms-excel"},
			"docx": {"mime": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
			"pptx": {"mime": "application/vnd.openxmlformats-officedocument.presentationml.presentation"},
			"xml": {"mime": "application/xml", "isEditable": "true"},
			"zip": {"mime": "application/zip"},
			"mp3": {"mime": "audio/mpeg"},
			"mp4": {"mime": "audio/mp4"},
			"gif": {"mime": "image/gif"},
			"jpg": {"mime": "image/jpeg"},
			"png": {"mime": "image/png"},
			"css": {"mime": "text/css", "isEditable": "true"},
			"csv": {"mime": "text/csv", "isEditable": "true"},
			"tar": {"mime": "application/x-tar", isExecutable: "true"},
			"js": {"mime": "text/javascript", "isEditable": "true"},
			"lua": {"mime": "text/x-lua", "isEditable": "true"},
			"c": {"mime": "text/x-csrc", "isEditable": "true"},
			"h": {"mime": "text/x-chdr", "isEditable": "true"},
			"jar": {"mime": "application/java-archive"},
			"xul": {"mime": "application/vnd.mozilla.xul+xml", "isEditable": "true"},
			"psd": {"mime": "image/vnd.adobe.photoshop"},
			"avi": {"mime": "video/x-msvideo"}
		};

	function getMIME(e){
		var mime = extObj[e];
		return mime && mime["mime"];
	}

	function getExt(m){
		return mimeObj[m];
	}

	function isEditable(m){
		var ext = getExt(m);
		if(ext){
			return extObj[ext["ext"]].isEditable;
		}
		return null;
	}

	function isExecutable(m){
		var ext = getExt(m);
		if(ext){
			return extObj[ext["ext"]].isExecutable;
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

	Object.keys(extObj).forEach(function(ext){
		var obj = extObj[ext],
			mime = obj.mime;
		mimeObj[mime] = {};
		mimeObj[mime]["ext"] = ext;
		mimeObj[mime]["isEditable"] = obj.isEditable;
		mimeObj[mime]["isExecutable"] = obj.isExecutable;
	});

	if(!window.FileManager){
		window.FileManager = {};
	}
	FileManager.toolbox = {
		getExt: getExt,
		getMIMEType: getMIME,
		getParentByClassName: checkParentClassName,
		isEditable: isEditable,
		isExecutable: isExecutable
	};
})();