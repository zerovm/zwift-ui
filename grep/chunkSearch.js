(function(){

	"use strict"

	var DIRECTORY_TYPE = "application/directory",
		HIDDEN_ATTRIBUTE = "hidden",
		DELIMITER = "/",
		INDEX_CHUNK_SIZE = 1,
		indexResultEl,
		pathFiles,
		chunkCallsCounter,
		isStopped,
		isFinished;

	/*function parsePath(value, callback, callbackParams){//remove !!!!!!!!!!!!!!!!!!!!!!!!!
		var splittedPath,containerName,path;
		pathFiles = null;
		splittedPath = value.split(/(\/.*)/);
		path = splittedPath[1];
		callbackParams.containerName = containerName = splittedPath[0];
		path = path.substr(1, splittedPath[1].length);//substr... -removing extra slash
		path = path.replace("*", "");
		indexResultEl.removeAttribute(HIDDEN_ATTRIBUTE);
		indexResultEl.innerHTML = 'Getting files...';
		SwiftV1.Container.get({
			format: "json",
			prefix: path,
			DELIMITER: DELIMITER,
			containerName: containerName,
			success: function(response){
				response = JSON.parse(response);
				if(response.length){
					indexResultEl.setAttribute(HIDDEN_ATTRIBUTE, HIDDEN_ATTRIBUTE);
					createIndexedFilesArray(response, callback, callbackParams);
				}else{
					indexResultEl.innerHTML = 'There is no such directory.';
				}
			}
		});

	}*/

	function chunkCalls(paramObj){
		paramObj.updateCallback && paramObj.updateCallback();

		//TODO: convert getChunksNum to value
		if(!paramObj.files.length || isStopped){//exit statement
			isFinished = true;
			chunkCallsCounter = 0;
			paramObj.finalCallback && paramObj.finalCallback();
		}else{
			if(!paramObj.callbackInit){
				paramObj.callbackInit = chunkCalls;
			}
			paramObj.file = paramObj.files[0];
			paramObj.files = paramObj.files.slice(INDEX_CHUNK_SIZE, paramObj.files.length);
			//chunkCallsCounter++;
			paramObj.mainWorkFunction(paramObj);
		}
	}

	function startChunkSearch(params){
		chunkCallsCounter = 0;
		isFinished = false;
		isStopped = false;
		removeChildren(window.grepAppHelper.searchResultEl);
		chunkCalls(params);
	}

	function isFinished(){
		return isFinished;
	}
	function stopGrep(){
		isStopped = true;
	}

	function removeChildren(el){
		while(el.firstChild){
			el.removeChild(el.firstChild);
		}
	}

	/*function createIndexedFilesArray(response, callback, callbackParams){
		var i;
		if(response){
			pathFiles = [];
			for(i = 0; i < response.length; i++){
				if(response[i].content_type !== DIRECTORY_TYPE){
					pathFiles.push(response[i]);
				}
			}
			callback(callbackParams);//chunkCalls
		}
	}*/

	/*function getFiles(value){
		chunkCallsCounter = 0;
		parsePath(value, chunkCalls, {
			mainWorkFunction: grepApp.grep,
			pathFiles: pathFiles,
			getChunksNum: function(){
				return Math.ceil(pathFiles.length / INDEX_CHUNK_SIZE);
			}
		});
	}*/

	document.addEventListener("DOMContentLoaded", function(){
		indexResultEl = document.getElementsByClassName("index-result")[0];
	});

	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.isFinished = isFinished;
	window.grepApp.stopGrep = stopGrep;
	window.grepApp.getGrepps = startChunkSearch;
})();