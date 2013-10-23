(function(){

	"use strict";

	var HIDDEN_ATTRIBUTE = "hidden",
		GREPPED_FILES_NUM = 1,
		indexResultEl,
		isStopped,
		isFinished = true,
		paramsHandler;

	function chunkCalls(paramObj){
		paramObj.updateCallback && paramObj.updateCallback();

		//TODO: convert getChunksNum to value
		if(!paramObj.files.length || isStopped){//exit statement
			isFinished = true;
			paramObj.finalCallback && paramObj.finalCallback();
		}else{
			if(!paramObj.callbackInit){
				paramObj.callbackInit = chunkCalls;
			}
			paramObj.file = paramObj.files[0];
			paramObj.files = paramObj.files.slice(GREPPED_FILES_NUM, paramObj.files.length);
			paramObj.mainWorkFunction(paramObj);
		}
	}

	function startChunkSearch(params){
			removeChildren(window.grepAppHelper.searchResultEl);
			paramsHandler.startSearch(params, true);
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

	function ParamsHandler(){
		var FIRST_TIME_OUTPUT_NUM = 5,
			SCROLL_OUTPUT_NUM = 2,
			savedParams,
			chunkNum;

		function newSearch(parameters){
			savedParams = parameters.createCopy();
			chunkNum = -1;
		}

		function getFiles(){
			var margin;
			chunkNum++;
			margin = FIRST_TIME_OUTPUT_NUM + chunkNum * SCROLL_OUTPUT_NUM;
			if(chunkNum){
				return savedParams.files.slice(margin - SCROLL_OUTPUT_NUM, margin);
			}
			return savedParams.files.slice(0, FIRST_TIME_OUTPUT_NUM);
		}

		this.startSearch = function(params){
			var transferredParams;
			if(isFinished){
				isFinished = false;
				isStopped = false;
				if(params){
					newSearch(params);
				}
				transferredParams = savedParams.createCopy();
				transferredParams.files = getFiles();
				chunkCalls(transferredParams);
			}
		};
	}

	paramsHandler = new ParamsHandler();
	document.addEventListener("DOMContentLoaded", function(){
		indexResultEl = document.getElementsByClassName("index-result")[0];
	});

	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.isFinished = isSearchFinished;
	window.grepApp.isStopped = isSearchStopped;
	window.grepApp.stopGrep = stopGrep;
	window.grepApp.getGrepps = startChunkSearch;
	window.grepApp.onResultScrollEnd = paramsHandler.startSearch
})();