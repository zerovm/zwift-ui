document.addEventListener('DOMContentLoaded', function(){
	var i, interval,
		preferenceObj = {},
		searchMemo = new window.grepApp.MemoInputHandler(),
		fileListMemo = new window.grepApp.MemoInputHandler(),
		preferencesElements = document.querySelectorAll(".preferences-list-wrapper input"),
		directoryContentType = "application/directory",
		fileSelector,
		grepFiles,
		messagePopup = new window.grepApp.Popup({child: "No files were chosen."});
	ZLitestackDotCom.init();
	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.searchInput = document.getElementsByClassName("search-input")[0];
	for(i = 0; i < preferencesElements.length; i++){
		preferenceObj[preferencesElements[i].dataset.preference] = {
			el: preferencesElements[i]
		};
	}
	window.grepApp.preferences = new window.grepApp.Preferences(preferenceObj);

	document.addEventListener('keydown', function(e){//TODO: unificate click and keydown
		var paramObj;
		if(isSearchInput(e)){
			e.target.classList.remove('invalid-input');
			if(e.keyCode === 13){
				if(e.target.value === ''){
					e.target.classList.add('invalid-input');
					return;
				}
				paramObj = {
					input: window.grepApp.searchInput.value,
					mainWorkFunction: window.grepAppHelper.grep,
					callback: window.grepApp.getGrepps
				};
				getFilelist(tryStartGrep, paramObj);
			}
		}else if(isGetFiles(e) && e.keyCode === 13){
			if(e.target.value === ''){
				e.target.classList.add('invalid-input');
				return;
			}
			getFilelist();
		}

		function isSearchInput(e){
			return e.target.classList.contains('search-input');
		}

		function isGetFiles(e){
			return e.target.classList.contains('file-list-input');
		}

	});

	function getFilelist(callback, callbackParam){
		searchMemo.reset();
		if(fileSelector && fileSelector.getChosenFilesArray()){
			grepFiles = fileSelector.getChosenFilesArray();
			if(callback){
				callbackParam.files = grepFiles;
				callback(callbackParam);
			}
		}else{
			if(!window.grepAppHelper.fileListElement.value){
				messagePopup.show();
			}else{
				window.grepApp.getFilelist(window.grepAppHelper.fileListElement.value, function(responseArray, containerName){
						grepFiles = responseArray.filter(function(pathObj){
							return !pathObj.content_type.match(directoryContentType);
						}).map(function(pathObj){
								console.log(containerName + pathObj.name);
								return containerName + pathObj.name;
							});
						if(callback){
							callbackParam.files = grepFiles;
							callback(callbackParam);
						}
					},
					function(){
						grepFiles = null;
						messagePopup.show();
					});
			}
		}
	}

	function tryStartGrep(obj){
		clearInterval(interval);
		window.grepApp.stopGrep();
		interval = setInterval(function(){
			if(window.grepApp.isFinished()){
				clearInterval(interval);
				searchMemo.onInput(obj, obj.callback);
			}
		}, 300);
	}

	document.addEventListener('click', function(e){
		var paramObj;

		if(isSearchButton(e)){
			paramObj = {
				input: window.grepApp.searchInput.value,
				mainWorkFunction: window.grepAppHelper.grep,
				callback: window.grepApp.getGrepps
			};
			getFilelist(tryStartGrep, paramObj);
		}else if(isPreferences(e)){
			window.grepApp.preferences.clickHandler(e.target);
		}else if(isGetFiles(e)){
			if(!fileSelector){
				fileSelector = new window.grepApp.FileSelector({
					onbeforeCreate: function(){
						this.show("", true);
					},
					oncreate: function(){
						fileSelector.show();
					},
					onconfirm: function(){
						grepFiles = fileSelector.getChosenFilesArray();
					},
					ondecline: function(){
						grepFiles = null;
					}
				});
			}else{
				fileSelector.show();
			}
		}

		function isGetFiles(e){
			return e.target.classList.contains('file-list-button') || e.target.parentNode.classList.contains("file-list-button");//TODO: replace
		}

		function isPreferences(e){
			return e.target.classList.contains('preferences-element');
		}

		function isSearchButton(e){
			return e.target.classList.contains('search-button');
		}
	});
	window.grepAppHelper.searchResultEl = document.getElementsByClassName("search-results")[0];
	window.grepAppHelper.fileListElement = document.getElementsByClassName("file-list-input")[0];
	window.grepAppHelper.fileListElement.addEventListener("blur", function(e){
		fileListMemo.onInput({input: e.target.value}, function(){
			getFilelist();
		});
	});
	window.grepAppHelper.searchResultEl.addEventListener("scroll", function(e){
		if(Math.abs(e.target.scrollTop - (e.target.scrollHeight - e.target.clientHeight)) < 4){//the reason - one extra pixel
			window.grepApp.onResultScrollEnd();
		}
	})
});