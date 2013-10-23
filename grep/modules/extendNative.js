(function(){
	"use strict";

	Object.prototype.createCopy = function(){
		var copyObj = {}, that = this;
		Object.keys(this).forEach(function(parameter){
			copyObj[parameter] = that[parameter];
		});
		return copyObj;
	};
})();