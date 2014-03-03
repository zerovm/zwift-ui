(function(CurrentPath) {
	'use strict';

	function setRootClass(){
		if(CurrentPath().isContainersList()){
			document.body.classList.add('location-root');
		}else{
			document.body.classList.remove('location-root');
		}
	}

	window.addEventListener("hashchange", setRootClass);

})(CurrentPath);