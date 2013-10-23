document.addEventListener('DOMContentLoaded', function(){
	var searchMemo, i, interval,
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
				tryStartGrep({
					input: window.grepApp.searchInput.value,
					mainWorkFunction: window.grepAppHelper.grep,
					files: ["/search/doc/foo/cat.txt", "/search/doc/foo/catcher in the rye.txt"]
				}, window.grepApp.getGrepps);
			}
		}

		function isSearchInput(e){
			return e.target.classList.contains('search-input');
		}

	});

	function tryStartGrep(obj, callback){
		clearInterval(interval);
		window.grepApp.stopGrep();
		interval = setInterval(function(){
			console.log("interval is running")
			if(window.grepApp.isFinished){
				clearInterval(interval);
				searchMemo.onInput(obj, callback);
			}
		}, 300);
	}

	document.addEventListener('click', function(e){
		var i, foo = [];
		for(i = 0; i < 8; i++){
			foo.push("/search/doc/foo/" + i + "cat.txt");
		}

		if(isSearchButton(e)){
			tryStartGrep({
				input: window.grepApp.searchInput.value,
				mainWorkFunction: window.grepAppHelper.grep,
				files: foo.concat(["/search/doc/foo/cat.txt", "/search/doc/foo/catcher in the rye.txt"])
			}, window.grepApp.getGrepps);
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
	document.getElementsByClassName("search-results")[0].addEventListener("scroll", function(e){
		if(Math.abs(e.target.scrollTop - (e.target.scrollHeight - e.target.clientHeight)) < 4){//the reason - 1 extra pixel
			console.log("scrolled to end")
			window.grepApp.onResultScrollEnd();
		}
	})
});