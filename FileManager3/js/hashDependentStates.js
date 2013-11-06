/**
 * User: Alexander
 * Date: 06.11.13
 * Time: 15:11
 */
document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	var slashStr = "/",
		rootClass = "location-root";

	function setRootClass(){
		if(location.hash.indexOf(slashStr) !== -1){
			document.body.classList.remove(rootClass);
		}else{
			document.body.classList.add(rootClass);
		}
	}

	setRootClass();
	window.addEventListener("hashchange", setRootClass);
});