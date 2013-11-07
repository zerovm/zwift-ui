/**
 * User: Alexander
 * Date: 04.11.13
 * Time: 15:49
 */
(function(){
	"use strict";

	function attachMethods(receiveObj, objAndMethodsToAttach){
		objAndMethodsToAttach.forEach(function(paramObj){
			paramObj.methods.forEach(function(methodName){
				receiveObj.prototype[methodName] = paramObj.obj.prototype[methodName];
			})
		});
	}

	attachMethods(NodeList, [{
		obj: Array,
		methods: ["forEach"]
	}]);
	attachMethods(FileList, [{
		obj: Array,
		methods: ["forEach"]
	}]);
	attachMethods(HTMLCollection, [{
		obj: Array,
		methods: ["forEach"]
	}]);

})();