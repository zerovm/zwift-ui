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

			"php": {"mime": "text/php", "isEditable": "php"},
			"rb": {"mime": "text/ruby", "isEditable": "ruby"},
			"pl": {"mime": "text/perl", "isEditable": "perl"}
		},
		gradeMap = ["B", "KB", "MB", "GB"];

	function getMIME(e){
		var extension, mime;
		if(!e){
			return null;
		}
		extension = e.match(extRegex);
		if(extension){
			e = extension.pop();
		}
		mime = extObj[e];
		return mime && mime["mime"];
	}

	function getExt(m){
		return mimeObj[m];
	}

	function isEditable(m, name){//TODO: rewrite it!!!!!
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
		while(el && el.tagName !== topParentTag){
			if(el.classList.contains(className)){
				return el;
			}
			el = el.parentNode;
		}
		return null;
	}

	function getTransformedBytes(bytes){
		var counter = 1,
			grade = 1024,
			checksum = Math.pow(grade, counter),
			result;
		while(bytes > checksum){
			counter++;
			checksum = Math.pow(grade, counter);
		}
		result = (bytes / Math.pow(grade, counter - 1));
		result = result % 1 ? result.toFixed(2) : result;
		return result + gradeMap[counter - 1];
	}

	function escapeHTML(str){
		return String(str)
			.replace('&raquo;', '///')
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace('///', '&raquo;');
	}

	function makeShortName(name, len){
		var ext, filename;
		len = len || 30;
		if(name.length <= len){
			return name;
		}
		if(name.indexOf(".") !== -1){
			ext = name.substring(name.lastIndexOf("."), name.length);
			filename = name.replace(ext, "");
			filename = filename.substr(0, len) + "&raquo;" + ext;
			return filename;
		}
		return name.substr(0, len) + "&raquo;";
	}

	function createLoadMoreButton(parent){
		var el = document.createElement("div");
		el.className = "load-more-button";
		el.textContent = "Load More";
		parent.appendChild(el);
	}

	function makeDatePretty(time){
		var alternative = new Date(time),
			pretty,
			diff = (new Date().getTime() - alternative.getTime()) / 1000,
			day_diff = Math.floor(diff / 86400);
		pretty = day_diff == 0 && (
			diff < 60 && "just now" ||
				diff < 120 && "1 minute ago" ||
				diff < 3600 && Math.floor(diff / 60) + " minutes ago" ||
				diff < 7200 && "1 hour ago" ||
				diff < 86400 && Math.floor(diff / 3600) + " hours ago") ||
			day_diff == 1 && "Yesterday" ||
			day_diff < 7 && day_diff + " days ago" ||
			day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago";
		return pretty || alternative.toDateString();
	}

	function ProgressBar(params){
		var progressbarEl = document.createElement("div"),
			progressEl = document.createElement("div"),
			progressValueEl = document.createElement("div"),
			buttonWrapper = document.createElement("div"),
			hideButton = document.createElement("button"),
			cancelButton = document.createElement("button"),
			animationClass = "run-progress-run",
			textEl = document.createElement("p"),
			isRemoved,
			request = params.request, onEndCallback = params.onEndCallback, wrapper = params.wrapper;

		function setProgress(e){
			var percentLoaded;
			if(e.lengthComputable){
				percentLoaded = Math.round((e.loaded / e.total) * 100);
				setProgressValue(percentLoaded);
				/*if(percentLoaded < 5){
					setText("Upload started.");
				}else if(percentLoaded < 98){
					setText("Uploading...");
				}else{
					setText("Finalizing");
				}*/
			}else{
				setText("Loaded " + e.loaded);
				!progressbarEl.classList.contains(animationClass) && progressbarEl.classList.add(animationClass);
			}
		}

		function setText(text){
			textEl.innerHTML = text;
		}

		function setProgressValue(percent){
			if(percent <= 100 && percent >= 0){
				progressValueEl.style.width = percent + "%";
			}
		}

		function remove(e){
			e && e.stopPropagation();
			if(!isRemoved){
				isRemoved = true;
				onEndCallback && onEndCallback(wrapper);
				setTimeout(function(){
					progressbarEl && progressbarEl.parentNode && progressbarEl.parentNode.removeChild(progressbarEl);
				}, 100);
			}
		}

		function cancel(e){
			e && e.stopPropagation();
			request && request.abort();
			params.onabort && params.onabort();
			remove();
		}

		this.params = params ? params : {};
		this.cancel = cancel;
		this.remove = remove;
		this.setText = setText;
		this.setProgressValue = setProgressValue;
		this.wrapper = progressbarEl;

		request && (params.isDownload ? request.addEventListener("progress", setProgress) : request.upload.addEventListener("progress", setProgress));
		request && request.addEventListener("load", remove);

		progressbarEl.className = "progressbar item";
		progressEl.className = "progress";
		progressValueEl.className = "progress-value";
		buttonWrapper.className = "buttons-wrapper";
		progressEl.appendChild(progressValueEl);
		progressEl.appendChild(textEl);
		progressbarEl.appendChild(progressEl);
		cancelButton.addEventListener("click", cancel);
		cancelButton.innerHTML = "Cancel";
		cancelButton.className = "btn btn-default";
		buttonWrapper.appendChild(cancelButton);
		hideButton.addEventListener("click", remove);
		hideButton.innerHTML = "Hide";
		hideButton.className = "btn btn-default";
		buttonWrapper.appendChild(hideButton);
		progressbarEl.appendChild(buttonWrapper);
		if(wrapper){
			wrapper.insertBefore(progressbarEl, wrapper.firstElementChild);
			wrapper.firstElementChild.scrollIntoView();
		}
	}

	function isLastChildren(el){
		return el.parentNode.children.indexOf(el) === el.parentNode.children.length - 1;
	}

	function onscrollLoadMore(e){//TODO: move it somewhere else
		e = e.target ? e.target : e;
		if(Math.abs(e.scrollTop - (e.scrollHeight - e.clientHeight)) <= 1){
			if(!document.body.classList.contains(FileManager.elements.bodyLoadingClass)){
				FileManager.files.loadMore();
			}
		}
	}

	function downloadClick(path, filename){
		var clickEvent = document.createEvent("MouseEvent"),
			a = document.createElement("a");
		clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		a.href = path;
		a.download = filename ? filename : path;
		a.dispatchEvent(clickEvent);
	}

	function EmptynessMsg(){
		var clickHandler,
			button = document.createElement("button"),
			emptynessMsg = document.createElement("div"),
			label = document.createElement("label");

		this.show = function(params){
			params.wrapper.appendChild(emptynessMsg);
			params.wrapper.classList.add("empty-list");
			params.wrapper.classList.add(params.className);
			label.textContent = params.text;
			clickHandler = params.clickHandler;
		};

		emptynessMsg.className = "wrapper";
		emptynessMsg.appendChild(label);
		button.addEventListener("click", function(){
			clickHandler && clickHandler();
		});
		emptynessMsg.appendChild(button);
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
		isExecutable: isExecutable,
		shortenSize: getTransformedBytes,
		makeShortName: makeShortName,
		createLoadMoreButton: createLoadMoreButton,
		escapeHTML: escapeHTML,
		makeDatePretty: makeDatePretty,
		onscrollLoadMore: onscrollLoadMore,
		ProgressBar: ProgressBar,
		isLastChildren: isLastChildren,
		downloadClick: downloadClick,
		emptynessMsg: new EmptynessMsg()
	};
})();