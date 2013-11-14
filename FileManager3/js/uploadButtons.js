/**
 * User: Alexander
 * Date: 05.11.13
 * Time: 15:39
 */
document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var selectedClass = "selected",
		hiddenClass = "hidden",
		buttons = document.getElementsByClassName("upload-button"),
		slashAtEndRegex = /\/$/,
		extRegex = /\.(\w*)$/,
		uploads;

	function getContentType(fileName){
		var extension = fileName.match(extRegex);
		return (extension && window.FileManager.toolbox.getMIMEType(extension[1])) || null;
	}

	uploads = new function(){
		var uploadRequests = [],
			urlPrefix,
			uploadingFiles = 0;

		function uploadFile(file, index){
			var _type, _name, id, url, uploadRequest;
			_name = file.newName || file.name;
			//_type = file.newType || getContentType(_name) || file.type;
			_type = file.newType || file.type || getContentType(_name);

			id = 'upload-' + index;
			/*itemUploadHtml = itemUploadTemplate;
			 itemUploadHtml = itemUploadHtml.replace('<!--', '');
			 itemUploadHtml = itemUploadHtml.replace('-->', '');
			 itemUploadHtml = itemUploadHtml.replace('{id}', id);
			 itemUploadHtml = itemUploadHtml.replace('{file-name}', truncate(_name, 20));*/
			/*if($('.item').length > 0){
			 $('#item-1').before(itemUploadHtml);
			 }else{
			 $('#items').append(itemUploadHtml);
			 $('#no-files').hide();
			 }*/

			setProgress(id, 0, 'Waiting for upload.');
			url = urlPrefix + _name;
			uploadRequest = new XMLHttpRequest();
			uploadRequests.push(uploadRequest);
			uploadRequest.open('PUT', url, true);
			uploadRequest.onload = function(){
				uploadingFiles--;
				 setProgress(this.upload['id'], 100, 'Upload completed.');

				if(uploadingFiles == 0){
					FileManager.ContentChange.animate();
				}

				/*$('.upload-button').each(function(){
				 $(this).parent().html($(this).parent().html());
				 });*/
			};
			uploadRequest.onerror = function(){
				setProgress(this.upload['id'], 0, 'XHR error.');
			};
			uploadRequest.upload['id'] = id;
			uploadRequest.upload.addEventListener("progress", function(e){
				if(e.lengthComputable){
					var percentLoaded = Math.round((e.loaded / e.total) * 100);
					if(percentLoaded < 5){
						setProgress(this['id'], percentLoaded, 'Upload started.');
					}else{
						setProgress(this['id'], percentLoaded, percentLoaded > 98 ? 'Finalizing.' : 'Uploading.');
					}
				}
			});

			uploadRequest.setRequestHeader('Content-Type', _type);
			/*if(!isUploadAs){
			 uploadingFiles++;
			 }*/
			uploadRequest.send(file);
		}

		function setProgress(id, percent, statusLabel){
			console.log("id:" + id, " persent" + percent, " status" + statusLabel);
			/*var progressColor = $('#' + id + ' .progress-color')[0];
			 var progressPercent = $('#' + id + ' .progress-percent')[0];
			 progressColor.style.width = percent + '%';
			 progressPercent.textContent = percent + '%';
			 $('#' + id + ' .progress_bar').className = 'loading';
			 $('#' + id + ' .status')[0].innerText = statusLabel;*/
		}

		this.waitForUploadAs = function(){
			uploadingFiles++;
		};

		this.uploadFiles = function(e){
			//disableAll();
			var path = FileManager.CurrentPath().get();
			//itemUploadTemplate = $('#item-upload-template').html();
			urlPrefix = "https://z.litestack.com/v1/" + path;//TODO: replace hardcode with smth
			!urlPrefix.match(slashAtEndRegex) && (urlPrefix += "/");
			uploadingFiles = e.target.files.length;
			e.target.files.forEach(uploadFile);
			e.target.value = [];//TODO: check for a normal way of uploading same file

		};

		/*$(document).on('click', '.upload-cancel-button', function(){
		 uploadingFiles--;
		 var itemEl = $(this).parent().parent();
		 var uploadIndex = Number(itemEl.attr('id').from('upload-'));
		 uploadRequests[uploadIndex].abort();
		 uploadRequests[uploadIndex] = null;
		 itemEl.hide();

		 if(uploadingFiles == 0){
		 enableAll();
		 }
		 });*/
	};

	function cancel(){
		//lastClickedButton.classList.remove(selectedClass);
	}

	function hide(el){
		el.classList.add(hiddenClass);
	}

	function change(e){
		/*e.stopPropagation();
		e.preventDefault();*/
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