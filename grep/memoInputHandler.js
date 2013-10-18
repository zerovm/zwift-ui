(function(){
	"use strict";

	var prevValue;

	function MemoInputHandler(){
		this.onInput = function(e, callback){
			var curValue = e.value;
			if(curValue && prevValue !== curValue){
				prevValue = curValue;
				callback(curValue);
			}
		};
	}

	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.MemoInputHandler = MemoInputHandler;
})();