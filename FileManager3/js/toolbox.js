/**
 * User: Alexander
 * Date: 06.11.13
 * Time: 19:12
 */
(function(){
	"use strict";

	var mimeObj = {},
		extRegex = /\.(\w*)$/,
		extObj = {
			"txt": {"mime": "text/plain", "isEditable": "txt"},
			"json": {"mime": "application/json", "isEditable": "json", "isExecutable": "true"},
			"html": {"mime": "text/html", "isEditable": "html"},
			"htm": {"mime": "text/html", "isEditable": "html"},
			"nexe": {"mime": "application/x-nexe"},
			"py": {"mime": "text/x-python", "isEditable": "python"},
			"pdf": {"mime": "application/pdf"},
			"doc": {"mime": "application/msword"},
			"ppt": {"mime": "application/vnd.ms-powerpoint"},
			"xls": {"mime": "application/vnd.ms-excel"},
			"docx": {"mime": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
			"pptx": {"mime": "application/vnd.openxmlformats-officedocument.presentationml.presentation"},
			"xml": {"mime": "application/xml", "isEditable": "xml"},
			"zip": {"mime": "application/zip"},
			"mp3": {"mime": "audio/mpeg"},
			"mp4": {"mime": "audio/mp4"},
			"gif": {"mime": "image/gif"},
			"jpg": {"mime": "image/jpeg"},
			"png": {"mime": "image/png"},
			"css": {"mime": "text/css", "isEditable": "css"},
			"csv": {"mime": "text/csv", "isEditable": "txt"},
			"tar": {"mime": "application/x-tar", isExecutable: "true"},
			"js": {"mime": "text/javascript", "isEditable": "javascript"},
			"lua": {"mime": "text/x-lua", "isEditable": "lua"},
			"c": {"mime": "text/x-csrc", "isEditable": "c_cpp"},
			"h": {"mime": "text/x-chdr", "isEditable": "c_cpp"},
			"jar": {"mime": "application/java-archive"},
			"xul": {"mime": "application/vnd.mozilla.xul+xml", "isEditable": "xml"},
			"psd": {"mime": "image/vnd.adobe.photoshop"},
			"avi": {"mime": "video/x-msvideo"},

			"php": {"mime": "text/plain", "isEditable": "php"},
			"rb": {"mime": "text/plain", "isEditable": "ruby"},
			"pl": {"mime": "text/plain", "isEditable": "perl"}
		};

	function getMIME(e){
		var extension = e.match(extRegex), mime;
		if(extension){
			e = extension.pop();
		}
		mime = extObj[e];
		return mime && mime["mime"];
	}

	function getExt(m){
		return mimeObj[m];
	}

	function isEditable(m, name){//TODO: rewrite it
		var ext = getExt(m), predefMIME;
		if(ext){
			return extObj[ext["ext"]].isEditable;
		}
		predefMIME = getMIME(name);
		if(predefMIME){
			return mimeObj[predefMIME].isEditable;
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