(function(){
	"use strict";

	var DELIMITER = "/";

	function parsePath(params){
		var splittedPath, containerName, path, wideContainerName;
		window.grepApp.progress.start();
		if(params.input){
			splittedPath = params.input.split(/\/(.*)/);
			path = splittedPath[1] || "";
			containerName = splittedPath[0];
			wideContainerName = DELIMITER + containerName + DELIMITER;
		}
		SwiftV1.Container.get({
			format: "json",
			prefix: params.input ? path : "",
			DELIMITER: DELIMITER,
			containerName: params.input ? containerName : "",
			success: function(response){
				response = JSON.parse(response);
				window.grepApp.progress.end();
				if(response.length){
					if(params.isSorted){
						response.sort(function(a,b){
							return Date.parse(a.last_modified) - Date.parse(b.last_modified);
						})
					}
					params.onsuccess(response, wideContainerName);
				}else{
					params.onerror(response);
				}
			}
		});
	}

	if(!window.grepApp){
		window.grepApp = {};
	}
	window.grepApp.getFilelist = parsePath;
})();