document.addEventListener('DOMContentLoaded', function(){
	var searchMemo, i,
		preferenceObj = {},
		preferencesElements = document.querySelectorAll(".preferences-list-wrapper input");
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
				searchMemo.onInput({
					input: window.grepApp.searchInput.value,
					callback: function(){
					},
					file: "/search/doc/foo/cat.txt"
				}, window.grepApp.search);
			}
		}

		function isSearchInput(e){
			return e.target.classList.contains('search-input');
		}

	});

	document.addEventListener('click', function(e){
		if(isSearchButton(e)){
			searchMemo.onInput({
					input: window.grepApp.searchInput.value,
					callback: function(){
					},
					file: "/search/doc/foo/cat.txt"
				}, window.grepApp.search);
		}else if(isPreferences(e)){
			window.grepApp.preferences.clickHandler(e.target);
		}

		function isPreferences(e){
			return e.target.classList.contains('preferences-element');
		}

		function isSearchButton(e){
			return e.target.classList.contains('search-button');
		}
	});
});