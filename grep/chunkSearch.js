var finishChunksEvent = new CustomEvent("finishChunksLoad");
function checkAllUploaded(e){
	window.grepApp.onResultScrollEnd(null, e.target.children.length);
}
(function(){

	"use strict";

	var GREPPED_FILES_NUM = 1,
		searchResulEl,
		isStopped,
		isFinished = true,
		paramsHandler;

	function chunkCalls(paramObj){
		paramObj.updateCallback && paramObj.updateCallback();

		//TODO: convert getChunksNum to value
		if(!paramObj.files.length || isStopped){//exit statement
			isFinished = true;
			paramObj.finalCallback && paramObj.finalCallback();
			searchResulEl.dispatchEvent(finishChunksEvent);
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
		paramsHandler.startSearch(params);
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
			chunkNum,
			offset;

		function newSearch(parameters){
			savedParams = parameters.createCopy();
			chunkNum = -1;
			offset = 0;
		}

		function getFiles(offSetCheckSum){
			var margin, offsetDif;
			if(!offSetCheckSum){
				chunkNum++;
			}
			margin = FIRST_TIME_OUTPUT_NUM + chunkNum * SCROLL_OUTPUT_NUM + offset;
			offsetDif = offSetCheckSum - margin;
			if(offsetDif){
				offset += offsetDif;
				return savedParams.files.slice(margin, margin + offsetDif);
			}
			if(chunkNum){
				return savedParams.files.slice(margin - SCROLL_OUTPUT_NUM, margin);
			}
			return savedParams.files.slice(0, FIRST_TIME_OUTPUT_NUM);
		}

		this.startSearch = function(params, offsetCheckSum){
			var transferredParams;
			if(isFinished){
				isFinished = false;
				isStopped = false;
				if(params){
					newSearch(params);
				}
				transferredParams = savedParams.createCopy();
				transferredParams.files = getFiles(offsetCheckSum);
				chunkCalls(transferredParams);
			}
		};
	}



	paramsHandler = new ParamsHandler();
	document.addEventListener("DOMContentLoaded", function(){
		searchResulEl = document.getElementsByClassName("search-results")[0];
		searchResulEl.addEventListener("finishChunksLoad", function(e){
			checkAllUploaded(e);
		});
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