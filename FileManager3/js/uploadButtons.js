/**
 * User: Alexander
 * Date: 05.11.13
 * Time: 15:39
 */
document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var slashAtEndRegex = /\/$/,
		uploads,
		disableAllClass = "freeze-all",
		buttonsPointerClass = "progressbar-buttons";

	function ProgressBar(wrapper, request, onEndCallback){
		var progressbarEl = document.createElement("div"),
			progressEl = document.createElement("div"),
			progressValueEl = document.createElement("div"),
			buttonWrapper = document.createElement("div"),
			hideButton = document.createElement("button"),
			cancelButton = document.createElement("button"),
			textEl = document.createElement("p"),
			isRemoved;

		function setProgress(e){
			var percentLoaded;
			if(e.lengthComputable){
				percentLoaded = Math.round((e.loaded / e.total) * 100);
				progressValueEl.style.width = percentLoaded + "%";
				if(percentLoaded < 5){
					textEl.innerHTML =  "Upload started.";
				}else if(percentLoaded < 98){
					textEl.innerHTML =  "Uploading...";
				}else{
					textEl.innerHTML =  "Finalizing";
				}
			}
		}

		function remove(e){
			e && e.stopPropagation();
			if(!isRemoved){
				isRemoved = true;
				onEndCallback && onEndCallback();
				setTimeout(function(){
					progressbarEl.parentNode.removeChild(progressbarEl);
				}, 100);
			}
		}

		function cancel(e){
			e && e.stopPropagation();
			request.abort();
			remove();
		}

		request.upload.addEventListener("progress", setProgress);
		request.addEventListener("load", remove);

		progressbarEl.className = "progressbar item";
		progressEl.className = "progress";
		progressValueEl.className = "progress-value";
		buttonWrapper.className = "buttons-wrapper";
		textEl.innerHTML = "Waiting for upload.";
		progressEl.appendChild(progressValueEl);
		progressEl.appendChild(textEl);
		progressbarEl.appendChild(progressEl);
		cancelButton.addEventListener("click", cancel);
		cancelButton.innerHTML = "Cancel";
		buttonWrapper.appendChild(cancelButton);
		hideButton.addEventListener("click", remove);
		hideButton.innerHTML = "Hide";
		buttonWrapper.appendChild(hideButton);
		progressbarEl.appendChild(buttonWrapper);
		wrapper.insertBefore(progressbarEl, wrapper.firstElementChild);
		wrapper.firstElementChild.scrollIntoView();
	}

	uploads = new function(){
		var urlPrefix,
			uploadingFiles = 0;

		function onloadCallback(){
			uploadingFiles--;
			if(uploadingFiles === 0){
				document.body.classList.remove(disableAllClass);
				document.body.classList.remove(buttonsPointerClass);
				FileManager.ContentChange.animate();
			}
		}

		function uploadFile(file){
			var _type, _name, url, uploadRequest;
			_name = file.newName || file.name;
			_type = file.newType || file.type || window.FileManager.toolbox.getMIMEType(_name);

			url = urlPrefix + _name;
			uploadRequest = new XMLHttpRequest();
			new ProgressBar(window.FileManager.elements.itemsWrapperEl, uploadRequest, onloadCallback);
			uploadRequest.open('PUT', url, true);

			uploadRequest.setRequestHeader('Content-Type', _type);
			uploadRequest.send(file);
		}

		this.uploadFiles = function(e){
			var path = FileManager.CurrentPath().get();
			urlPrefix = "https://z.litestack.com/v1/" + path;//TODO: replace hardcode with smth
			!urlPrefix.match(slashAtEndRegex) && (urlPrefix += "/");
			uploadingFiles = e.target.files.length;
			document.body.classList.add(disableAllClass);
			document.body.classList.add(buttonsPointerClass);
			e.target.files.forEach(uploadFile);
			e.target.value = [];
		};
	};

	function change(e){
		e.stopPropagation();
		e.preventDefault();
		switch(e.target.dataset.action){
			case "file":
				uploads.uploadFiles(e);
				break;
			case "as":
				break;
			case "exec":
				break;
			default:
				console.log("unkown action: " + e.target.dataset.action);
				break;
		}
		return false;
	}

	//document.getElementById("CancelDialog").addEventListener("click", cancel);

	document.getElementsByClassName("upload-input").forEach(function(input){
		input.addEventListener("change", change);
	});
});