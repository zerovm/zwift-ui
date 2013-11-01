(function(){
	"use strict";

	var grepAppHelper = {},
		MAX_OUTPUT_NUM = 25,
		iconMap = {
			extensions: ['.txt', '.pdf', '.doc', '.docx', '.h', '.c', '.lua'],
			images: ['img/file32_txt.png', 'img/file32_pdf.png', 'img/file32_doc.png', 'img/file32_doc.png', 'img/file32_c.png', 'img/file32_c.png', 'img/file32_lua.png'],
			iconPathTemplate: "img/file32.png"
		},
		extensionRegexp = /\.\w*$/,
		fileNameInPathRegexp = /\/([\w \.]*)$/,
		lineSplitterRegex = /\n/g,
		lineSplitter = "\n",
		tagLineSplitter = " <br>",
		GTRegex = />/g,
		GTStr = "&gt;",
		LTRegex = /</g,
		LTStr = "&lt;",
		imgString = "img",
		boundRegexStr = "\\b",
		tagStrongStart = "<strong>",
		tagStrongFinish = "</strong>",
		divString = "div";

	function updateDOM(request, report, text, fullPath){
		var fullPathEl, filename, link, wrapper,
			preview, icon, ext, matchIndex,
			splitLines,
			linkString = "a";
		icon = document.createElement(imgString);
		icon.src = iconMap.iconPathTemplate;
		ext = fullPath.match(extensionRegexp);
		if(ext){
			matchIndex = iconMap.extensions.indexOf(ext[0]);
		}
		if(matchIndex !== -1){
			icon.src = iconMap.images[matchIndex];
		}
		fullPathEl = document.createElement(divString);
		fullPathEl.className = "file-name";
		link = document.createElement(linkString);
		link.href = ZLitestackDotCom.getStorageUrl() + fullPath;
		link.target = "_blank";
		filename = fullPath.match(fileNameInPathRegexp);
		filename = filename ? filename[1] : fullPath;
		link.innerHTML = filename;
		fullPathEl.innerHTML = fullPath;
		wrapper = document.createElement(divString);
		wrapper.appendChild(icon);
		wrapper.appendChild(link);
		wrapper.appendChild(fullPathEl);
		preview = document.createElement(divString);
		splitLines = request.split(lineSplitter);
		request = splitLines.slice(0, MAX_OUTPUT_NUM).join(lineSplitter);
		preview.innerHTML = highlightFounded(request, text);
		wrapper.appendChild(preview);
		window.grepAppHelper.searchResultEl.appendChild(wrapper);
		return splitLines.length > MAX_OUTPUT_NUM;
	}

	grepAppHelper.grep = function(params){
		var input, i, text, fullPath,
			account = ZLitestackDotCom.getAccount();
		fullPath = account + params.file;
		text = params.input;
		input = parse(text);
		function parse(str){
			var arr = str.split('"');
			for(i = 1; i < arr.length; i += 2){
				arr[i] = arr[i].replace(':', ' ');
			}
			str = arr.join('');
			arr = str.split(' ');
			for(i = 0; i < arr.length; i++){
				if(arr[i].indexOf(':') != -1){
					arr[i] = '-j ' + arr[i].replace(':', ' ');
				}
			}
			return arr.join(' ');
		}

		window.grepAppHelper.searchResultEl.classList.remove('error');
		window.grepAppHelper.searchResultEl.removeAttribute('hidden');

		var data = JSON.stringify(createConfiguration());
		execute(data);

		function createConfiguration(){
			if(params.isStraight){
				return [
					{
						'name': 'grep',
						'exec': {
							'path': 'swift://' + account + '/.gui/LiteStack/Grep Search/0.1/execute/sys/grep.nexe',
							'args': input
						},
						'file_list': [
							{
								'device': 'stdin',
								'path': 'swift://' + fullPath
							},
							{
								'device': 'stdout',
								"content_type": "text/plain"
							}
						]
					}
				];
			}else{
				return [
					{
						'name': 'grep',
						'exec': {
							'path': 'swift://' + account + '/.gui/LiteStack/Grep Search/0.1/execute/sys/igrep.nexe',
							'args': input + " /dev/input"
						},
						'file_list': [
							{
								'device': 'input',
								'path': 'swift://' + fullPath
							},
							{
								'device': 'stdout',
								"content_type": "text/plain"
							}
						]
					}
				];
			}
		}

		function execute(data){

			ZeroVmOnSwift.execute({
				data: data,
				contentType: 'application/json',
				success: function(request, report){
					var isRequestTooBig;
					if(!request || window.grepApp.isStopped()){
						params.callbackInit(params);
						return;
					}
					isRequestTooBig = updateDOM(request, report, text, fullPath);
					params.isRequestTooBig = isRequestTooBig;

					window.grepAppHelper.searchResultEl.removeAttribute('hidden');
					params.callbackInit(params);
				},
				error: function(status, statusText, response){
					var wrapper = document.createElement(divString);
					wrapper.innerHTML = 'Http Error: ' + status + ' ' + statusText + '. Execute response: ' + response;
					wrapper.classList.add('error');
					window.grepAppHelper.searchResultEl.appendChild(wrapper);
					params.callbackInit(params);
				}
			});
		}
	};

	function highlightFounded(str, searchText){
		var innerHTML;

		str = str.replace(GTRegex, GTStr).replace(LTRegex, LTStr);
		innerHTML = str.replace(lineSplitterRegex, tagLineSplitter);
		return innerHTML.replace(new RegExp(boundRegexStr + searchText + boundRegexStr, "g"), tagStrongStart + searchText + tagStrongFinish);
	}

	window.grepAppHelper = grepAppHelper;
})();