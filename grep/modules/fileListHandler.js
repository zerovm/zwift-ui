(function(){
	"use strict";

	var DELIMITER = "/";

	function parsePath(value, callback, callbackErr){
		var splittedPath,containerName,path;
		window.grepApp.progress.start();
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
				window.grepApp.progress.end();
				if(response.length){
					callback(response, DELIMITER + containerName + DELIMITER);
				}else{
					callbackErr(response);
				}
			}
		});
	}

	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.getFilelist = parsePath;
})();