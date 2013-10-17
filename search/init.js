document.addEventListener('DOMContentLoaded', function(){
	var timeout, isIntervalStarted, indexMemo, searchMemo;
	ZLitestackDotCom.init();
	if(!window.searchApp){
		window.searchApp = {};
	}
	window.searchApp.progressBar = new window.searchApp.ProgressBar(document.getElementsByClassName("progress-bar")[0]);
	window.searchApp.grepApp = new GrepApp(document.getElementsByClassName("index-input")[0], document.getElementsByClassName("search-input")[0]);//TODO: rename grep

	document.getElementsByClassName("search-results")[0].addEventListener("scroll", searchApp.scrollHendler);

	indexMemo = new window.searchApp.MemoInputHandler();
	searchMemo = new window.searchApp.MemoInputHandler();

	document.addEventListener('keydown', function(e){
		if(isSearchInput(e)){
			if(!isIntervalStarted){
				isIntervalStarted = true;
				searchInputKeydown(e);
			}

		}else if(isIndexInput(e)){
			if(e.keyCode === 13 && window.searchApp.preferences.getPreference("indexing")){
				console.log("started")
				if(e.target.value === ''){
					e.target.classList.add('invalid-input');
					return;
				}
				e.target.classList.remove('invalid-input');
				indexMemo.onInput(e, window.searchApp.grepApp.index);
			}
		}

		function isSearchInput(e){
			return e.target.classList.contains('search-input');
		}

		function isIndexInput(e){
			return e.target.classList.contains('index-input');
		}

		function searchInputKeydown(e){
			e.target.classList.remove('invalid-input');
			var interval;

			interval = setInterval(function(){
				clearInterval(interval);
				setTimeout(function(){
					isIntervalStarted = false;
				}, 300);
				if(e.keyCode === 13){
					if(e.target.value === ''){
						e.target.classList.add('invalid-input');
						return;
					}
					clearTimeout(timeout);
					searchMemo(e, window.searchApp.grepApp.search);
				}else{
					timeout = setTimeout(function(){
						searchMemo(e, window.searchApp.grepApp.search);
					}, 1000);
				}
			}, 300);
		}

	});

	document.addEventListener('click', function(e){
		if(isIndexButton(e)){
			indexMemo.onInput(e, window.searchApp.grepApp.index);
		}else if(isIndexResultCloseButton(e)){
			indexResultCloseButtonClick(e);
		}else if(isSearchButton(e)){
			searchMemo(e, window.searchApp.grepApp.search);
		}else if(isPreferences(e)){
			window.searchApp.preferences.clickHandler(e.target);
		}

		function isIndexButton(e){
			return e.target.classList.contains('index-button');
		}

		function isIndexResultCloseButton(e){
			return e.target.classList.contains('index-result-close-button');
		}

		function isSearchButton(e){
			return e.target.classList.contains('search-button');
		}

		function isPreferences(e){
			return e.target.classList.contains('preferences-element');
		}

		function indexResultCloseButtonClick(e){
			var indexResultEl = document.querySelector('.index-result');
			indexResultEl.setAttribute('hidden', 'hidden');
			e.target.setAttribute('hidden', 'hidden');
		}
	});
});