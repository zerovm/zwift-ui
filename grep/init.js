document.addEventListener('DOMContentLoaded', function(){
	var timeout, searchMemo;
	//ZLitestackDotCom.init();
	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.searchInput = document.getElementsByClassName("search-input")[0];
	searchMemo = new window.grepApp.MemoInputHandler();

	document.addEventListener('keydown', function(e){
		if(isSearchInput(e)){
			e.target.classList.remove('invalid-input');
			if(e.keyCode === 13){
				clearTimeout(timeout);
				if(e.target.value === ''){
					e.target.classList.add('invalid-input');
					return;
				}
				searchMemo.onInput(window.grepApp.searchInput, window.grepApp.search);
			}
		}

		function isSearchInput(e){
			return e.target.classList.contains('search-input');
		}

	});

	document.addEventListener('click', function(e){
		if(isSearchButton(e)){
			clearTimeout(timeout);
			searchMemo.onInput(window.grepApp.searchInput, window.grepApp.search);
		}

		function isSearchButton(e){
			return e.target.classList.contains('search-button');
		}
	});
});