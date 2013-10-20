(function(){

	"use strict";

	var searchResultEl,
		iconMap = {
			extensions: ['.txt', '.pdf', '.doc', '.docx', '.h', '.c', '.lua'],
			images: ['img/file32_txt.png', 'img/file32_pdf.png', 'img/file32_doc.png', 'img/file32_doc.png', 'img/file32_c.png', 'img/file32_c.png', 'img/file32_lua.png']
		},
		extensionRegexp = /\.\w*$/,
		fileNameInPathRegexp = /\/([\w\.]*)$/,
		insideBrecketRegexp = /<(.*)>/,
		higherFolderInPathRegexp = /^[\w]*\//,
		metaDataSeparator = " ; ",
		dataSplitter = " ",
		lineSplitterRegex = new RegExp("\n", "g"),
		delimiter = /\//g,
		wordBraker = "/<wbr/>",
		valueText = "\nvalue: ",
		metaDataPredefinedText = "Found in metadata:\nkey: ",
		metaDataPathPredefinedText = "Found in path: ",
		noResultText = "No results.",
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

	function imgPreload(imgArr){
		imgArr.forEach(function(src){
			var img = new Image();
			img.src = src;
		});
	}

	function splitResult(result, input){
		var splittedResult;
		splittedResult = result.split(/\d. document=/).filter(function(str){
			return str;
		}).map(function(str){
				return str && str.split(",");
			});

		while(searchResultEl.firstChild){
			searchResultEl.removeChild(searchResultEl.firstChild);
		}

		if(!splittedResult.length || !parseInt(result.split(/(\d*) hits/)[1])){
			searchResultEl.innerHTML = noResultText;
		}else{
			processMultipleRequests(splittedResult, input);
		}
	}

	function processMultipleRequests(splittedResult, input){
		var icon, matchIndex, link, wrapper, ext,
			fragmentArray = new Array(splittedResult.length);
		callbackCounter = 0;
		callbackCounterMax = splittedResult.length;
		splittedResult.forEach(function(splitString, index){
			var splitSubString = splitString[5].split(";"),
				location = splitString[2].replace(" filename=/", ""),
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
				ext: ext ? ext[0].replace(".", "") : "other",
				gatherArray: fragmentArray,
				input: input
			});
		});
	}

	function processRequest(options, request, isError){
		var preview, juce, requestLines, i, splitedMeta, splitData, onlyWordRegexp;
		requestLines = request.split(lineSplitterRegex).filter(function(str){
			return str;
		});
		if(isError){
			juce = "An error occured";
		}else{
			if(requestLines.length > 2){//third line should be a flag marked metadata
				onlyWordRegexp = new RegExp("(^|\\s|\\/)" + options.input + "(\\s|\\/|$)");
				if(options.location.match(onlyWordRegexp)){
					juce = metaDataPathPredefinedText + options.location.replace(higherFolderInPathRegexp, "");
				}else{
					splitedMeta = requestLines[1].match(insideBrecketRegexp)[1].split(metaDataSeparator);
					juce = metaDataPredefinedText;
					for(i = 0; i < splitedMeta.length; i++){//TODO: check out new response format for lowercase meta key
						if(splitedMeta[i].match(onlyWordRegexp)){
							splitData = splitedMeta[i].split(dataSplitter);
							juce += splitData[0] + valueText + splitData[1];
							break;
						}
					}
				}
			}else{
				juce = requestLines[1].match(insideBrecketRegexp)[1];
			}
		}
		preview = document.createElement(divString);
		preview.innerText ? preview.innerText = juce : preview.textContent = juce;
		preview.innerHTML = preview.innerHTML.replace(delimiter, wordBraker)
			.replace(new RegExp(options.input, "g"), "<strong>" + options.input + "</strong>")
			.replace(lineSplitterRegex, "<br>");
		options.el.appendChild(preview);
		options.gatherArray[options.index] = options.el;

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

	imgPreload(iconMap.images);
	if(!window.searchApp){
		window.searchApp = {};
	}
	window.searchApp.search = search;
})();