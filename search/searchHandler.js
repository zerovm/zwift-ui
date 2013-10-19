(function(){

	"use strict"

	var searchResultEl,
		iconMap = {
			extensions: ['.txt','.pdf','.doc','.docx','.h','.c','.lua'],
			images: ['img/file32_txt.png', 'img/file32_pdf.png', 'img/file32_doc.png', 'img/file32_doc.png', 'img/file32_c.png', 'img/file32_c.png', 'img/file32_lua.png']
		},
		extensionRegexp = /\.\w*$/,
		fileNameInPathRegexp = /\/([\w\.]*)$/,
		insideBrecketRegexp = /<(.*)>/,
		lineSplitter = "\n",
		metaDataPrefix = "CONTENT_LENGTH 4 CONTENT_TYPE",
		metaDataPredefinedText = "Found in metadata",
		noResultText = "No results.",
		delimiter = /\//g,
		wordBraker = "/<wbr/>",
		iconPathTemplate = "img/file32.png",
		imgString = "img",
		linkString = "a",
		divString = "div",
		callbackCounter,
		callbackCounterMax;

//TODO: replace static json for indexer and rest (indexing.json, merge.json and so on)
	function search(value){
		window.SearchApp.search(value, splitResult, searchResultEl);
	}

	function splitResult(result){
		var splittedResult;
		splittedResult = result.split(/\d. document=/).filter(function(str){
			return str;
		}).map(function(str){
			return str && str.split(",");
		});

		while (searchResultEl.firstChild) {
			searchResultEl.removeChild(searchResultEl.firstChild);
		}

		if(!splittedResult.length || !parseInt(result.split(/(\d*) hits/)[1])){
			searchResultEl.innerHTML = noResultText;
		}else{
			processMultipleRequests(splittedResult);
		}



	}

	function processMultipleRequests(splittedResult){
		var icon, matchIndex, link, wrapper, ext,
			fragmentArray = new Array(splittedResult.length);
		callbackCounter = 0;
		callbackCounterMax = splittedResult.length;
		splittedResult.forEach(function(splitString, index){
			var splitSubString = splitString[5].split(";"),
				location = splitString[2].replace(" filename=/",""),
				filename, fullPathEl, fullPath;
			fullPathEl = document.createElement(divString);
			fullPathEl.className = "file-name";
			icon = document.createElement(imgString);
			ext = location.match(extensionRegexp);
			if(ext){
				matchIndex = iconMap.extensions.indexOf(ext[0]);
			}else{
				matchIndex = -1;
			}
			if(matchIndex !== -1){
				icon.src = iconMap.images[matchIndex];
			}else{
				icon.src = iconPathTemplate;
			}
			link = document.createElement(linkString);
			fullPath = ZLitestackDotCom.getStorageUrl() + location;
			link.href = fullPath;
			link.target = "_blank";
			filename = location.match(fileNameInPathRegexp);
			filename = filename ? filename[1] : location;
			link.innerHTML = filename;
			fullPathEl.innerHTML = fullPath;
			wrapper = document.createElement(divString);
			wrapper.appendChild(icon);
			wrapper.appendChild(link);//TODO: reduce ext checks number
			wrapper.appendChild(fullPathEl);
			SearchApp.getPreview(processRequest, {
				location: location,
				startOffset: splitSubString[1].replace(" start=", ""),
				endOffset: splitSubString[2].replace(" end=", ""),
				index: index,
				el: wrapper,
				ext: ext ? ext[0].replace(".","") : "other",
				gatherArray: fragmentArray
			});
		});
	}

	function processRequest(options, request, isError){
		var preview,
			juce;
		if(isError){
			console.log("error")
		}else{
			juce = request.split(lineSplitter).filter(function(str){return str})[1].match(insideBrecketRegexp)[1];
			if(juce.indexOf(metaDataPrefix) !== -1){
				juce = metaDataPredefinedText;
			}
			preview = document.createElement(divString);
			preview.innerText ? preview.innerText = juce : preview.textContent = juce;
			options.el.appendChild(preview);
			options.gatherArray[options.index] = options.el;
		}
		callbackCounter++;
		if(callbackCounter === callbackCounterMax){
			displayData(options.gatherArray);
		}

	}

	function displayData(gatherArray){
		var fragment = document.createDocumentFragment();
		gatherArray.forEach(function(piece){
			fragment.appendChild(piece);
		});
		searchResultEl.appendChild(fragment);
	}

	document.addEventListener("DOMContentLoaded", function(){
		searchResultEl = document.getElementsByClassName("search-results")[0];
	});

	if(!window.searchApp){
		window.searchApp = {};
	}
	window.searchApp.search = search;
})();