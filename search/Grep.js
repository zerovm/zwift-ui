function ProgressBar(selector, len, chunkSize){//TODO: extract into separated file
	var chunkNum, curChunk = 0, chunkPercent, that = this, ele;

	function updateChunk(){
		var value = ++curChunk * chunkPercent;
		that.setValue(value);
		if(value > 99){
			setTimeout(function(){
				that.reset();
			}, 100);
		}
	}

	function resetProgress(){
		ele.progressbar({
			value: 0
		});
	}

	ele = $(selector);
	resetProgress();
	this.setValue = function(value){
		ele.progressbar({value: value});
	};
	this.updateChunk = function(){
		chunkNum = Math.ceil(len / chunkSize);
		chunkPercent = 100 / chunkNum;
		updateChunk();
		that.updateChunk = updateChunk;
	};
	this.reset = resetProgress;
}

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
		searchInput = searchInputEl;
	}

	function parsePath(el, callback){
		var splittedPath,
			path;
		if(indexInputValue !== el.value){
			pathFiles = null;
			if(!indexInputValue){
				indexInputValue = el.value;
			}
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
						createIndexedFIlesArray(response, callback);
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
				isSearchEnded = false;
				chunkCallsCounter++;
				if(!paramObj.callbackInit){
					paramObj.callbackInit = chunkCalls;
				}
				if(!paramObj.searchText){
					paramObj.searchText = searchInput.value;
				}
				//second parameter is callback on success request
				//paramObj contains link to this function (chunkCalls), which will be called from callback of callback passed to SearchApp.index
				//this case on success index calls search, on search success calls chunkCalls, which handles how much times search should be called
				SearchApp.index(containerName + DELIMITER + pathFiles[chunkCallsCounter].name, SearchApp.search, paramObj);
			}
		}
	}

	function createIndexedFIlesArray(response, callback){
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