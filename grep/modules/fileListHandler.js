(function(){
	"use strict";

	var DELIMITER = "/";

	function parsePath(value, callback){
		var splittedPath,containerName,path;
		splittedPath = value.split(/(\/.*)/);
		path = splittedPath[1];
		containerName = splittedPath[0];
		//callbackParams.containerName = containerName = splittedPath[0];
		path = path.substr(1, splittedPath[1].length);//substr... -removing extra slash
		/*indexResultEl.removeAttribute(HIDDEN_ATTRIBUTE);
		indexResultEl.innerHTML = 'Getting files...';*/
		SwiftV1.Container.get({
			format: "json",
			prefix: path,
			DELIMITER: DELIMITER,
			containerName: containerName,
			success: function(response){
				response = JSON.parse(response);
				if(response.length){
					callback(response, DELIMITER + containerName + DELIMITER);
				}
			}
		});
	}

	window.getFilelist = parsePath;
})();