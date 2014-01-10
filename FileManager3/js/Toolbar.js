(function() {
	'use strict';

	function setRootClass(){
		if(window.FileManager.CurrentPath().isContainersList()){
			document.body.classList.add('location-root');
		}else{
			document.body.classList.remove('location-root');
		}
	}

	document.body.addEventListener("authInit", setRootClass);
	window.addEventListener("hashchange", setRootClass);

})();