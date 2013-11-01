(function(){
	"use strict";

	var DELIMITER = "/";

	function parsePath(value, callback, callbackErr){
		var splittedPath, containerName, path, wideContainerName;
		window.grepApp.progress.start();
		if(value){
			splittedPath = value.split(/\/(.*)/);
			path = splittedPath[1] || "";
			containerName = splittedPath[0];
			//callbackParams.containerName = containerName = splittedPath[0];
			/*indexResultEl.removeAttribute(HIDDEN_ATTRIBUTE);
			 indexResultEl.innerHTML = 'Getting files...';*/
			wideContainerName = DELIMITER + containerName + DELIMITER;
		}
		SwiftV1.Container.get({
			format: "json",
			prefix: value ? path : "",
			DELIMITER: DELIMITER,
			containerName: value ? containerName : "",
			success: function(response){
				response = JSON.parse(response);
				window.grepApp.progress.end();
				if(response.length){
					callback(response, wideContainerName);
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