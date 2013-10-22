(function(){
	"use strict";

	var prevValue;

	function MemoInputHandler(){
		this.onInput = function(params, callback){
			if(params.input && prevValue !== params.input){
				prevValue = params.input;
				callback(params);
			}
		};
	}

	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.MemoInputHandler = MemoInputHandler;
})();