(function(){

	"use strict"

	var SEARCH_LIMIT = 1,
		DIRECTORY_TYPE = "application/directory",
		HIDDEN_ATTRIBUTE = "hidden",
		DELIMITER = "/",
		SHOWN_FILES_LIMIT = 2,
		INDEX_CHUNK_SIZE = 20,
		indexInput,
		searchInput,
		indexResultEl,
		pathFiles,
		chunkCallsCounter,
		that;

	function GrepApp(indexInputEl, searchInputEl){
		that = this;
		indexInput = indexInputEl;
		searchInput = searchInputEl;
	}

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
				response = JSON.parse(response);
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

		//TODO: convert getMaxSearchItems to value
		if(chunkCallsCounter >= paramObj.getMaxSearchItems()){//exit statement
			chunkCallsCounter = 0;
			paramObj.finalCallback && paramObj.finalCallback();
			if(pathFiles && chunkCallsCounter >= pathFiles.length){//if statement is here for debug, should be removed later
				console.log("searched through all files")
			}
			console.log("search ended")
		}else{
			console.log("searched again")
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

	function feedFilesToIndexer(){
		chunkCalls({
			updateCallback: function(){
			},
			finalCallback: function(){
			},
			getMaxSearchItems: function(){
				return SEARCH_LIMIT;
			}
		});
	}

	GrepApp.prototype.search = function(){
		chunkCallsCounter = 0;
		/*this.enableSearch();
		 parsePath(indexInput, feedFilesToIndexer);*/

	};

	GrepApp.prototype.index = function(value){
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
			getMaxSearchItems: function(){
				return Math.ceil(pathFiles.length / INDEX_CHUNK_SIZE);
			}
		});
		//SearchApp.index(value);
	};

	document.addEventListener("DOMContentLoaded", function(){
		indexResultEl = document.getElementsByClassName("index-result")[0];
	});

	window.GrepApp = GrepApp;
})();

(function(){
	function scrollHendler(e){
		if(e.target.scrollTop === e.target.scrollHeight - e.target.clientHeight){
			//chunkCalls
			console.log("scrolled to end")
		}
	}


	if(!window.searchApp){
		window.searchApp = {};
	}
	window.searchApp.scrollHendler = scrollHendler;
})();