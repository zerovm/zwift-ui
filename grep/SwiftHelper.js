(function(){
	"use strict";

	var grepAppHelper = {},
		searchResultsEl,
		dataSplitter = " ",
		iconMap = {
			extensions: ['.txt', '.pdf', '.doc', '.docx', '.h', '.c', '.lua'],
			images: ['img/file32_txt.png', 'img/file32_pdf.png', 'img/file32_doc.png', 'img/file32_doc.png', 'img/file32_c.png', 'img/file32_c.png', 'img/file32_lua.png'],
			iconPathTemplate:  "img/file32.png"
		},
		extensionRegexp = /\.\w*$/,
		fileNameInPathRegexp = /\/([\w \.]*)$/,
		lineSplitterRegex = /\n/g,
		tagLineSplitter = " <br>",
		GTRegex = />/g,
		GTStr = "&gt;",
		LTRegex = /</g,
		LTStr = "&lt;",
		strStartAndSpace = "(^|\\s|\\.|\\-|\\:|\"|\'|\\/)",
		strFinishAndSpace = "(\\s|\\/|\\.|\\:|\\;|\\-|\"|\'|\\,|$)",
		noResultText = "No results.",
		imgString = "img",
		tagStrongStart = "<strong>",
		tagStrongFinish = "</strong>";

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

		searchResultsEl = document.querySelector('.search-results');//TODO: get it from global namespace
		searchResultsEl.textContent = 'Loading...';
		searchResultsEl.classList.remove('error');
		searchResultsEl.removeAttribute('hidden');

		var data = JSON.stringify(createConfiguration());
		execute(data);

		function createConfiguration(){
			return [
				{
					'name': 'grep',
					'exec': {
						'path': 'swift://' + account + '/search/sys/grep.nexe',
						'args': input
					},
					'file_list': [
						{
							'device': 'stdin',
							'path':  'swift://' + fullPath
						},
						{
							'device': 'stdout',
							"content_type": "text/plain"
						}
					]
				}
			];
		}

		function execute(data){

			ZeroVmOnSwift.execute({
				data: data,
				contentType: 'application/json',
				success: function(request, report){
					var fullPathEl, filename, link, wrapper,
					preview, icon, ext, matchIndex,
					linkString = "a",
					divString = "div";
					if(!request){
						displayNoResult();
						console.log("empty request");
						return;
					}
					icon = document.createElement(imgString);
					ext = fullPath.match(extensionRegexp);
					if(ext){
						matchIndex = iconMap.extensions.indexOf(ext[0]);
					}
					if(matchIndex !== -1){
						icon.src = iconMap.images[matchIndex];
					}else{
						icon.src = iconMap.iconPathTemplate;
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
					preview.innerHTML = highlightFounded(request, text, dataSplitter);
					wrapper.appendChild(preview);
					searchResultsEl.appendChild(wrapper);

				},
				error: function(status, statusText, response){
					searchResultsEl.textContent = 'Http Error: ' + status + ' ' + statusText + '. Execute response: ' + response;
					searchResultsEl.classList.add('error');
				}
			});
		}
	};

	function highlightFounded(str, searchText, splitter, joiner){
		var regexArray, innerHTML;

		str = str.replace(GTRegex, GTStr).replace(LTRegex, LTStr);
		innerHTML = str.replace(lineSplitterRegex, tagLineSplitter);
		regexArray = searchText.split(dataSplitter)
			.filter(function(str){
				return str;
			})
			.map(function(word){
				return getWordRegex(word)
			});
		return innerHTML.split(splitter).map(function(word){
			var i;
			for(i = regexArray.length - 1; i >= 0; i--){
				if(word.match(regexArray[i])){
					return word.replace(searchText ,tagStrongStart + searchText + tagStrongFinish);
				}
			}
			return word;
		}).join(joiner ? joiner : splitter);
	}

	function getWordRegex(word, param){
		var regex;
		param ? regex = new RegExp(strStartAndSpace + word + strFinishAndSpace, param) : regex = new RegExp(strStartAndSpace + word + strFinishAndSpace);
		return regex;
	}

	function removeChildren(el){
		while(el.firstChild){
			el.removeChild(el.firstChild);
		}
	}

	function displayNoResult(){
		removeChildren(searchResultsEl);
		searchResultsEl.innerHTML = noResultText;
	}

	window.grepAppHelper = grepAppHelper;
})();