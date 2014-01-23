(function(){

	"use strict";

	var GREPPED_FILES_NUM = 1,
		FIRST_TIME_OUTPUT_NUM = 10,
		SCROLL_ADD_NUM = 5,
		isStopped,
		isFinished = true,
		paramsProcessor,
		noResultText = "No results.",
		messagePopup,
		messagePopupStrTemplate = "Currently grep is guided onto:<br/>",
		allSlashRegex = /\//g,
		slashWbrStr = "/<wbr/>";

	function chunkCalls(paramObj){
		paramObj.updateCallback && paramObj.updateCallback();

		if(!paramObj.files.length || isStopped || paramObj.isRequestTooBig){//exit statement
			isFinished = true;
			paramObj.finalCallback && paramObj.finalCallback();
			window.grepApp.progress.end();
			if(paramObj.isRequestTooBig){
				paramsProcessor.equateMarginToOutput();
			}else{
				paramsProcessor.startSearch(null, true);
			}
			messagePopup.hide();
		}else{
			if(!paramObj.callbackInit){
				paramObj.callbackInit = chunkCalls;
			}
			paramObj.file = paramObj.files[0];
			messagePopup.show(messagePopupStrTemplate + paramObj.file.replace(allSlashRegex, slashWbrStr));
			paramObj.files = paramObj.files.slice(GREPPED_FILES_NUM, paramObj.files.length);
			paramObj.mainWorkFunction(paramObj);
		}
	}

	function displayNoResult(el){
		var div = document.createElement("div");
		//removeChildren(el);
		div.className = "no-result";
		div.innerHTML = noResultText;
		el.appendChild(div);
	}

	function startChunkSearch(params){
		removeChildren(window.grepAppHelper.searchResultEl);
		isStopped = false;
		paramsProcessor.startSearch(params);
	}

	function isSearchFinished(){
		return isFinished;
	}

	function stopGrep(){
		isStopped = true;
	}

	function isSearchStopped(){
		return isStopped;
	}

	function removeChildren(el){
		while(el.firstChild){
			el.removeChild(el.firstChild);
		}
	}

	function ParamsProcessor(){
		var savedParams,
			margin,
			offset;

		function newSearch(parameters){
			if(!messagePopup){
				messagePopup = new window.grepApp.Popup({isNoButtons: true, wrapperClassName:"searching-files"});
				window.my = messagePopup
			}
			savedParams = parameters.createCopy();
			margin = FIRST_TIME_OUTPUT_NUM;
			offset = 0;
		}

		function getOffsets(checkLoadedNum){
			var offsetDif, filesArrayOffsets = {};

			offsetDif = margin - window.grepAppHelper.searchResultEl.children.length - offset;
			if(checkLoadedNum){
				if(offsetDif){
					filesArrayOffsets.start = margin;
					margin += offsetDif;
					filesArrayOffsets.end = margin;
					offset += offsetDif;
				}else{
					filesArrayOffsets = null;
				}
			}else{
				if(!offsetDif){
					filesArrayOffsets.start = margin;
					margin += SCROLL_ADD_NUM;
					filesArrayOffsets.end = margin;
				}else{
					filesArrayOffsets = null;
				}
			}
			return filesArrayOffsets;
		}

		this.startSearch = function(params, checkLoadedNum){
			var transferredParams, filesOffsets;
			if(isFinished){
				if(params){
					newSearch(params);
					filesOffsets = {
						start: 0,
						end: margin
					};
				}else{
					filesOffsets = getOffsets(checkLoadedNum);
				}
				if(filesOffsets){
					transferredParams = savedParams.createCopy();
					transferredParams.files = savedParams.files.slice(filesOffsets.start, filesOffsets.end);
					if(transferredParams.files.length){
						window.grepApp.progress.start();
						isFinished = false;
						chunkCalls(transferredParams);
					}else{
						if(!window.grepAppHelper.searchResultEl.children.length){
							displayNoResult(window.grepAppHelper.searchResultEl);
						}
					}
				}
			}
		};

		this.equateMarginToOutput = function(){
			margin = window.grepAppHelper.searchResultEl.children.length + offset;
		}
	}

	paramsProcessor = new ParamsProcessor();

	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.isFinished = isSearchFinished;
	window.grepApp.isStopped = isSearchStopped;
	window.grepApp.stopGrep = stopGrep;
	window.grepApp.getGrepps = startChunkSearch;
	window.grepApp.onResultScrollEnd = paramsProcessor.startSearch;
})();