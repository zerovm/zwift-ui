document.addEventListener('DOMContentLoaded', function(){
	var searchMemo, i, interval,
		preferenceObj = {},
		preferencesElements = document.querySelectorAll(".preferences-list-wrapper input"),
		directoryContentType = "application/directory",
		grepFiles;
	ZLitestackDotCom.init();
	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.searchInput = document.getElementsByClassName("search-input")[0];
	searchMemo = new window.grepApp.MemoInputHandler();
	for(i = 0; i < preferencesElements.length; i++){
		preferenceObj[preferencesElements[i].dataset.preference] = {
			el: preferencesElements[i]
		}
	}
	window.grepApp.preferences = new window.grepApp.Preferences(preferenceObj);

	document.addEventListener('keydown', function(e){
		if(isSearchInput(e)){
			e.target.classList.remove('invalid-input');
			if(e.keyCode === 13){
				if(e.target.value === ''){
					e.target.classList.add('invalid-input');
					return;
				}
				grepFiles && tryStartGrep({
					input: window.grepApp.searchInput.value,
					mainWorkFunction: window.grepAppHelper.grep,
					files: grepFiles
				}, window.grepApp.getGrepps);
			}
		}else if(isGetFiles(e)){
			window.getFilelist(window.grepAppHelper.fileListElement.value, function(responseArray, containerName){
				console.log("grepped some files:\n");
				console.log(responseArray);
				grepFiles = responseArray.filter(function(pathObj){
					return !pathObj.content_type.match(directoryContentType);
				}).map(function(pathObj){
						console.log(containerName + pathObj.name)
						return containerName + pathObj.name;
					});
			})
		}

		function isSearchInput(e){
			return e.target.classList.contains('search-input');
		}

		function isGetFiles(e){
			return e.target.classList.contains('file-list-input');
		}

	});

	function tryStartGrep(obj, callback){
		clearInterval(interval);
		window.grepApp.stopGrep();
		interval = setInterval(function(){
			if(window.grepApp.isFinished){
				clearInterval(interval);
				searchMemo.onInput(obj, callback);
			}
		}, 300);
	}

	document.addEventListener('click', function(e){
		var i, foo = [];
		for(i = 0; i < 4; i++){
			foo.push("/search/doc/foo/" + i + "cat.txt");
		}

		if(isSearchButton(e)){
			grepFiles && tryStartGrep({
				input: window.grepApp.searchInput.value,
				mainWorkFunction: window.grepAppHelper.grep,
				files: grepFiles
			}, window.grepApp.getGrepps);
		}else if(isPreferences(e)){
			window.grepApp.preferences.clickHandler(e.target);
		}else if(isGetFiles(e)){
			//show popup
		}

		function isGetFiles(e){
			return e.target.classList.contains('file-list-button');
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
	window.grepAppHelper.searchResultEl.addEventListener("scroll", function(e){
		if(Math.abs(e.target.scrollTop - (e.target.scrollHeight - e.target.clientHeight)) < 4){//the reason - 1 extra pixel
			window.grepApp.onResultScrollEnd();
		}
	})
});