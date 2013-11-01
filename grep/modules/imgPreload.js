/**
 * Created with JetBrains PhpStorm.
 * User: Alexander
 * Date: 01.11.13
 * Time: 17:30
 * To change this template use File | Settings | File Templates.
 */
(function(){
	"use strict";

	function imgPreload(imgArr){
		imgArr.forEach(function(src){
			var img = new Image();
			img.src = src;
		});
	}

	if(window.searchApp){
		window.searchApp = {};
	}
	window.grepApp.imgPreload = imgPreload;
})();