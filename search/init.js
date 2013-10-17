document.addEventListener('DOMContentLoaded', function(){
	var timeout, indexMemo, searchMemo;
	ZLitestackDotCom.init();
	if(!window.searchApp){
		window.searchApp = {};
	}
	window.searchApp.indexInput = document.getElementsByClassName("index-input")[0];
	window.searchApp.searchInput = document.getElementsByClassName("search-input")[0];
	window.searchApp.progressBar = new window.searchApp.ProgressBar(document.getElementsByClassName("progress-bar")[0]);
	indexMemo = new window.searchApp.MemoInputHandler();
	searchMemo = new window.searchApp.MemoInputHandler();

	document.addEventListener('keydown', function(e){
		if(isSearchInput(e)){
			e.target.classList.remove('invalid-input');
			if(e.keyCode === 13){
				clearTimeout(timeout);
				if(e.target.value === ''){
					e.target.classList.add('invalid-input');
					return;
				}
				searchMemo.onInput(e, window.searchApp.search);
			}else{
				if(window.searchApp.preferences.getPreference("suggest")){
					timeout = setTimeout(function(){
						searchMemo.onInput(window.searchApp.searchInput, window.searchApp.search);
					}, 1000);
				}
			}
		}else if(isIndexInput(e)){
			if(e.keyCode === 13 && window.searchApp.preferences.getPreference("indexing")){
				if(e.target.value === ''){
					e.target.classList.add('invalid-input');
					return;
				}
				e.target.classList.remove('invalid-input');
				indexMemo.onInput(window.searchApp.indexInput, window.searchApp.index);
			}
		}

		function isSearchInput(e){
			return e.target.classList.contains('search-input');
		}

		function isIndexInput(e){
			return e.target.classList.contains('index-input');
		}

	});

	document.addEventListener('click', function(e){
		if(isIndexButton(e)){
			indexMemo.onInput(window.searchApp.searchInput, window.searchApp.index);
		}else if(isIndexResultCloseButton(e)){
			indexResultCloseButtonClick(e);
		}else if(isSearchButton(e)){
			clearTimeout(timeout);
			searchMemo.onInput(window.searchApp.indexInput, window.searchApp.search);
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