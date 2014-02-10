function handleFileClick(el, callback){//TODO: remove extra request for file exist
	var emptynessMsg = window.FileManager.toolbox.emptynessMsg;
	var args,
		currentPath = CurrentPath(),
		path = currentPath.withoutAccount();

	function fileExist(metadata, contentType, contentLength, lastModified) {
		switch(window.FileManager.item.itemCommandName.pop()){
			case "open":
				window.FileManager.item.open(path);
				break;
			case "execute":
				window.FileManager.item.execute(path);
				break;
			default :
				if(window.FileManager.toolbox.isEditable(contentType)){
					editFile(el);
				}else{
					el.removeChildren();
					NavigationBar.setContent(CurrentPath().name());
					emptynessMsg.show({
						wrapper: el,
						className: "empty",
						text: "It's not a text file."
					});
				}
			//document.querySelector('.download-link').setAttribute('download', filename);
		}
		callback();
	}

	function fileNotExist(){
		document.getElementById('UpButton').removeAttribute('disabled');
		el.removeChildren();
		window.FileManager.errorMsgHandler.show({
			header: "File was not found.",
			onclose: function(){
				location.hash = window.CurrentPath().up();
			}
		});
		callback();
	}

	function ajaxError(status, statusText){
		document.getElementById('UpButton').removeAttribute('disabled');
		el.textContent = 'Error: ' + status + ' ' + statusText;
		callback();
	}

	args = {
		path: path,
		success: fileExist,
		notExist: fileNotExist,
		error: ajaxError
	};
	SwiftV1.checkFileExist(args);
}

function editFile(el) {
	var emptynessMsg = window.FileManager.toolbox.emptynessMsg;
	var args = {
			path: CurrentPath().withoutAccount(),
			success: handleResponse,
			error: function(status, statusText) {
				progressbar.cancel();
				document.getElementById('UpButton').removeAttribute('disabled');
				window.FileManager.errorMsgHandler.show({header: "Ajax error occured", status: status, statusText: statusText});
			},
			notExist: function() {
				window.FileManager.errorMsgHandler.show({header: "File was not found."});
				document.getElementById('UpButton').removeAttribute('disabled');
				progressbar.cancel();
			},
			progress: function (loaded) {
				if (loaded > 2097152) {
					document.getElementById('UpButton').removeAttribute('disabled');
					progressbar.cancel();
					emptynessMsg.show({
						wrapper: el,
						className: "large-file",
						text: "File is too large (2MB+)."
					});
				}
			}
		},
		progressbar,
		xhr;
	document.getElementById('UpButton').setAttribute('disabled', 'disabled');
	xhr = SwiftV1.getFile(args);
	progressbar = new window.FileManager.toolbox.ProgressBar({
		request: xhr,
		wrapper: el,
		isDownload: true,
		onEndCallback: function(){
			document.getElementById('UpButton').removeAttribute('disabled');
		}
	});
	//progressbar.setText("Fetching file...");

	function handleResponse(data, contentType){
		var fileName = CurrentPath().name();

		NavigationBar.setContent(fileName);

		window.FileManager.fileEditor.show(data, contentType, fileName);

		document.getElementById('UpButton').removeAttribute('disabled');
	}
}