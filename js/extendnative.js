/**
 * User: Alexander
 * Date: 04.11.13
 * Time: 15:49
 */
(function(){
	"use strict";

	Element.prototype.removeChildren = function(){
		while(this.firstChild){
			this.removeChild(this.firstChild);
		}
	};

	function attachMethods(receiveObj, objAndMethodsToAttach){
		objAndMethodsToAttach.forEach(function(paramObj){
			paramObj.methods.forEach(function(methodName){
				receiveObj.prototype[methodName] = paramObj.obj.prototype[methodName];
			})
		});
	}

	attachMethods(NodeList, [{
		obj: Array,
		methods: ["forEach", "filter"]
	}]);
	attachMethods(FileList, [{
		obj: Array,
		methods: ["forEach", "map"]
	}]);
	attachMethods(HTMLCollection, [{
		obj: Array,
		methods: ["forEach", "indexOf"]
	}]);

})();