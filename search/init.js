document.addEventListener('DOMContentLoaded', function(){
	var timeout, isIntervalStarted;
	ZLitestackDotCom.init();
	window.progressBar = new ProgressBar($(".progress-bar"), 53);//TODO: is there any name space?
	window.grepApp = new GrepApp(document.getElementsByClassName("index-input")[0], document.getElementsByClassName("search-input")[0]);

	document.getElementsByClassName("search-results")[0].addEventListener("scroll", scrollHendler);
	function index(){
		grepApp.index();
	}

	function search(){
		grepApp.search();
	}

	document.addEventListener('keydown', function(e){
		if(isSearchInput(e)){
			if(!isIntervalStarted){
				isIntervalStarted = true;
				searchInputKeydown(e);
			}

		}else if(isIndexInput(e)){
			if(e.keyCode === 13){
				if(e.target.value === ''){
					e.target.classList.add('invalid-input');
					return;
				}
				e.target.classList.remove('invalid-input');
				index();
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
				grepApp.disableSearch();
				if(grepApp.isSearchEnded()){
					clearInterval(interval);
					setTimeout(function(){
						console.log("started interval")
						isIntervalStarted = false;
					},300);
					if(e.keyCode === 13){
						if(e.target.value === ''){
							e.target.classList.add('invalid-input');
							return;
						}
						clearTimeout(timeout);
						search();
					}else{
						timeout = setTimeout(search, 1000);
					}
				}
			}, 300);
		}

	});

	document.addEventListener('click', function(e){
		if(isIndexButton(e)){
			index();
		}else if(isIndexResultCloseButton(e)){
			indexResultCloseButtonClick(e);
		}else if(isSearchButton(e)){
			search();
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

		function indexResultCloseButtonClick(e){
			var indexResultEl = document.querySelector('.index-result');
			indexResultEl.setAttribute('hidden', 'hidden');
			e.target.setAttribute('hidden', 'hidden');
		}
	});
});