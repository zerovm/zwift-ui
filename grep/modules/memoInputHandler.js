(function(){
	"use strict";

	var prevValue;

	function MemoInputHandler(){//TODO:deblock if there were no search
		this.onInput = function(params, callback){
			if(params.input && prevValue !== params.input){
				prevValue = params.input;
				callback(params);
			}
		};
		this.reset = function(){
			prevValue = null;
		}
	}

	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.MemoInputHandler = MemoInputHandler;
})();