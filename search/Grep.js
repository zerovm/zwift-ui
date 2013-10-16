(function(){

	"use strict"

	var SEARCH_LIMIT = 1,
		DIRECTORY_TYPE = "application/directory",
		HIDDEN_ATTRIBUTE = "hidden",
		DELIMITER = "/",
		SHOWN_FILES_LIMIT = 2,
		indexInput,
		indexInputValue,
		searchInput,
		indexResultEl,
		pathFiles,
		chunkCallsCounter,
		containerName,
		isStopSearch,
		that,
		isSearchEnded = true;

	function GrepApp(indexInputEl, searchInputEl){
		that = this;
		indexInput = indexInputEl;
		indexInputValue = indexInputEl.value;
		searchInput = searchInputEl;
	}

	function parsePath(el, callback){
		var splittedPath,
			path;
		if(indexInputValue !== el.value){
			pathFiles = null;
			splittedPath = el.value.split(/(\/.*)/);
			path = splittedPath[1];
			containerName = splittedPath[0];
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
						pathFiles = [];
						indexResultEl.setAttribute(HIDDEN_ATTRIBUTE, HIDDEN_ATTRIBUTE);
						createIndexedFilesArray(response, callback);
					}else{
						indexResultEl.innerHTML = 'There is no such directory.';
					}
				}
			});
		}else{
			callback();//chunkCalls
		}

	}

	function chunkCalls(paramObj){
		var chunkString;
		if(!paramObj.maxSearchItems){
			paramObj.maxSearchItems = SHOWN_FILES_LIMIT;
		}
		//getChunkString
		//getChunkString
		paramObj.updateCallback && paramObj.updateCallback();

		if(paramObj.searchFail){
			paramObj.maxSearchItems++;
		}
		if(pathFiles){
			if(that.isSearchDisabled() || chunkCallsCounter === paramObj.maxSearchItems || chunkCallsCounter >= pathFiles.length){//exit statement
				that.enableSearch();
				isSearchEnded = true;
				chunkCallsCounter = 0;
				paramObj.finalCallback && paramObj.finalCallback();
				if(pathFiles && chunkCallsCounter >= pathFiles.length){//if statement is here for debug, should be removed later
					console.log("searched through all files")
				}
				console.log("search ended")
			}else{
				console.log("searched again")
				isSearchEnded = false;
				chunkCallsCounter++;
				if(!paramObj.callbackInit){
					paramObj.callbackInit = chunkCalls;
				}
				if(!paramObj.searchText){
					paramObj.searchText = searchInput.value;
				}
				SearchApp.search(paramObj);
			}
		}
	}

	function createIndexedFilesArray(response, callback){
		var i;
		if(response){
			for(i = 0; i < response.length; i++){
				if(response[i].content_type !== DIRECTORY_TYPE){
					pathFiles.push(response[i]);
				}
			}
			callback();//chunkCalls
		}
	}

	function feedFilesToIndexer(){
		chunkCallsCounter = 0;
		chunkCalls({
			updateCallback: function(){
			},
			finalCallback: function(){
			},
			maxSearchItems: SEARCH_LIMIT
		});
	}

	GrepApp.prototype.search = function(){
		this.enableSearch();
		parsePath(indexInput, feedFilesToIndexer);

	};
	GrepApp.prototype.index = function(){
		SearchApp.index(indexInputValue);
	};
	GrepApp.prototype.disableSearch = function(){
		isStopSearch = true;
	};
	GrepApp.prototype.enableSearch = function(){
		isStopSearch = false;
	};
	GrepApp.prototype.isSearchDisabled = function(){
		return isStopSearch;
	};
	GrepApp.prototype.isSearchEnded = function(){
		return isSearchEnded;
	};

	document.addEventListener("DOMContentLoaded", function(){
		indexResultEl = document.getElementsByClassName("index-result")[0];
	});

	window.GrepApp = GrepApp;
	window.GrepApp.chunkCalls = chunkCalls;
})();

(function(){
	function scrollHendler(e){
		if(e.target.scrollTop === e.target.scrollHeight - e.target.clientHeight){
			//chunkCalls
			console.log("scrolled to end")
		}
	}

	window.scrollHendler = scrollHendler;
})();