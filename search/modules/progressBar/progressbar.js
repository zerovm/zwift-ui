(function(){
	"use strict";

	function ProgressBar(ele, len, chunkSize){
		var chunkNum, curChunk = 0, chunkPercent, that = this,
			hideClass = "hide",
			progressEle = document.createElement("div"),
			options = {
				len: len,
				chunkSize: chunkSize
			};

		function updateChunk(){
			var value = ++curChunk * chunkPercent;
			that.setValue(value);
			if(value > 99){
				setTimeout(function(){
					that.hide();
					that.reset();
				}, 100);
			}
		}

		function calculateChunkNum(){
			if(!chunkNum){
				chunkNum = Math.ceil(options.len / options.chunkSize);
				chunkPercent = 100 / chunkNum;
			}
		}

		progressEle.className = "ui-progressbar-value ui-widget ui-widget-content ui-corner-all";
		ele.appendChild(progressEle);
		this.reset = function(){
			progressEle.style.width = 0;
		};
		this.setValue = function(value){
			progressEle.style.width = value + "%";
		};
		this.updateChunk = function(){
			calculateChunkNum();
			updateChunk();
		};
		this.setOptions = function(obj){
			this.show();
			Object.keys(obj).forEach(function(propertyName){
				options[propertyName] = obj[propertyName];
			});
			chunkNum = null;
		};
		this.show = function(){
			ele.parentNode.classList.remove(hideClass);
		};
		this.hide = function(){
			ele.parentNode.classList.add(hideClass);
		};
	}

	if(!window.searchApp){
		window.searchApp = {};
	}
	window.searchApp.ProgressBar = ProgressBar;
})();