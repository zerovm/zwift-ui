(function(){
	"use strict";

	var prevValue;

	function MemoInputHandler(){
		this.onInput = function(e, callback){
			var curValue = e.target.value;
			if(curValue && prevValue !== curValue){
				prevValue = curValue;
				callback(curValue);
			}
		};
	}

	if(!window.searchApp){
		window.searchApp = {};
	}
	window.searchApp.MemoInputHandler = MemoInputHandler;
})();