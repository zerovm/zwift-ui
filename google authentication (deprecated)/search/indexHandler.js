(function(){

	"use strict"

	var DIRECTORY_TYPE = "application/directory",
		HIDDEN_ATTRIBUTE = "hidden",
		DELIMITER = "/",
		INDEX_CHUNK_SIZE = 20,
		indexResultEl,
		pathFiles,
		chunkCallsCounter;

	function parsePath(value, callback, callbackParams){
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
				response = response instanceof Array ? response : JSON.parse(response);
				if(response.length){
					indexResultEl.setAttribute(HIDDEN_ATTRIBUTE, HIDDEN_ATTRIBUTE);
					createIndexedFilesArray(response, callback, callbackParams);
				}else{
					indexResultEl.innerHTML = 'There is no such directory.';
				}
			}
		});

	}

	function chunkCalls(paramObj){
		paramObj.updateCallback && paramObj.updateCallback();

		//TODO: convert getChunksNum to value
		if(chunkCallsCounter >= paramObj.getChunksNum()){//exit statement
			chunkCallsCounter = 0;
			paramObj.finalCallback && paramObj.finalCallback();
		}else{
			if(!paramObj.callbackInit){
				paramObj.callbackInit = chunkCalls;
			}
			paramObj.pathes = pathFiles.slice(chunkCallsCounter * INDEX_CHUNK_SIZE, (chunkCallsCounter + 1) * INDEX_CHUNK_SIZE);
			chunkCallsCounter++;
			paramObj.mainWorkFunction(paramObj);
		}
	}

	function createIndexedFilesArray(response, callback, callbackParams){
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
	}

	function index(value){
		chunkCallsCounter = 0;
		parsePath(value, chunkCalls, {
			mainWorkFunction: SearchApp.index,
			pathFiles: pathFiles,
			updateCallback: function(){
				window.searchApp.progressBar.show();
				window.searchApp.progressBar.setOptions({len: pathFiles.length, chunkSize: INDEX_CHUNK_SIZE});
				this.updateCallback = window.searchApp.progressBar.updateChunk;
				this.updateCallback();
			},
			finalCallback: function(){
				window.searchApp.progressBar.hide();
				window.searchApp.progressBar.reset();
			},
			getChunksNum: function(){
				return Math.ceil(pathFiles.length / INDEX_CHUNK_SIZE);
			}
		});
	}

	document.addEventListener("DOMContentLoaded", function(){
		indexResultEl = document.getElementsByClassName("index-result")[0];
	});

	if(!window.searchApp){
		window.searchApp = {};
	}
	window.searchApp.index = index;
})();