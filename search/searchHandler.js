(function(){

	"use strict";

	var searchResultEl,
		iconMap = {
			extensions: ['.txt', '.pdf', '.doc', '.docx', '.h', '.c', '.lua'],
			images: ['img/file32_txt.png', 'img/file32_pdf.png', 'img/file32_doc.png', 'img/file32_doc.png', 'img/file32_c.png', 'img/file32_c.png', 'img/file32_lua.png'],
			iconPathTemplate:  "img/file32.png"
		},
		extensionRegexp = /\.\w*$/,
		fileNameInPathRegexp = /\/([\w \.]*)$/,
		insideBrecketRegexp = /<(.*)>/,
		higherFolderInPathRegexp = /^[\w]*\//,
		metaDataSeparator = " ; ",
		dataSplitter = " ",
		lineSplitterRegex = /\n/g,
		tagLineSplitter = " <br>",
		GTRegex = />/g,
		GTStr = "&gt;",
		LTRegex = /</g,
		LTStr = "&lt;",
		delimiter = "/",
		strStartAndSpace = "(^|\\s|\\/)",
		strFinishAndSpace = "(\\s|\\/|$)",
		wordBraker = "/<wbr/>",
		valueText = "<br>value: ",
		metaDataPredefinedText = "Found in metadata:<br>key: ",
		metaDataPathPredefinedText = "Found in path: ",
		noResultText = "No results.",
		imgString = "img",
		linkString = "a",
		divString = "div",
		tagStrongStart = "<strong>",
		tagStrongFinish = "</strong>",
		callbackCounter,
		callbackCounterMax;

//TODO: replace static json for indexer and rest (indexing.json, merge.json and so on)
	function search(value){
		removeChildren(searchResultEl);
		window.SearchApp.search(value, splitResult, searchResultEl);
	}

	function removeChildren(el){
		while(el.firstChild){
			el.removeChild(el.firstChild);
		}
	}

	function displayNoResult(text){
		removeChildren(searchResultEl);
		searchResultEl.innerHTML = text || noResultText;
	}

	function splitResult(result, input){
		var splittedResult;
		splittedResult = result.split(lineSplitterRegex).filter(function(str){
			return str;
		});

		removeChildren(searchResultEl);

		if(splittedResult[0].match("FATAL:")){
			displayNoResult(splittedResult);
			return;
		}
		if(splittedResult.length){
			processMultipleRequests(splittedResult, input);
			return;
		}
		displayNoResult();
	}

	function processMultipleRequests(splittedResult, input){
		var icon, link, wrapper, ext,
			matchIndex = -1,
			fragmentArray = new Array(splittedResult.length);
		callbackCounter = 0;
		callbackCounterMax = splittedResult.length;
		splittedResult.forEach(function(splitString, index){
			var splitSubString = splitString.split(";"),
				location = splitSubString[0].replace(delimiter, ""),
				filename, fullPathEl, fullPath;
			fullPathEl = document.createElement(divString);
			fullPathEl.className = "file-name";
			icon = document.createElement(imgString);
			ext = location.match(extensionRegexp);
			if(ext){
				matchIndex = iconMap.extensions.indexOf(ext[0]);
			}
			if(matchIndex !== -1){
				icon.src = iconMap.images[matchIndex];
			}else{
				icon.src = iconMap.iconPathTemplate;
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
			wrapper.appendChild(link);
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
		var preview, juce, requestLines, i, splitedMeta, splitData, onlyWordRegexp, innerHTML;
		preview = document.createElement(divString);
		requestLines = request.split(lineSplitterRegex).filter(function(str){
			return str;
		});
		if(!request){
			displayNoResult();
			console.log("empty request");
			return;
		}
		if(isError){
			preview.innerHTML = "An error occured";
		}else{
			if(requestLines.length > 2){//third line should be a flag marked metadata
				onlyWordRegexp = getWordRegex(options.input);
				if(options.location.match(onlyWordRegexp)){
					juce = options.location.replace(higherFolderInPathRegexp, "");
					juce = highlightFounded(juce, options.input, delimiter, wordBraker);
					innerHTML = metaDataPathPredefinedText + juce;
				}else{
					splitedMeta = requestLines[1].match(insideBrecketRegexp)[1].split(metaDataSeparator);
					for(i = 0; i < splitedMeta.length; i++){
						if(splitedMeta[i].match(onlyWordRegexp)){
							splitData = splitedMeta[i].split(dataSplitter);
							innerHTML = highlightFounded(splitData[0], options.input, dataSplitter);
							innerHTML += valueText + highlightFounded(splitData[1], options.input, dataSplitter);
							break;
						}
					}
					innerHTML = metaDataPredefinedText + innerHTML;
				}
			}else{
				juce = requestLines[1].match(insideBrecketRegexp)[1];
				innerHTML = highlightFounded(juce, options.input, dataSplitter);
			}
			preview.innerHTML = innerHTML;
		}
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
		removeChildren(searchResultEl);
		searchResultEl.appendChild(fragment);
	}

	function highlightFounded(str, searchText, splitter, joiner){
		var regexArray, innerHTML;

		str = str.replace(GTRegex, GTStr).replace(LTRegex, LTStr);
		innerHTML = str.replace(lineSplitterRegex, tagLineSplitter);
		regexArray = searchText.split(dataSplitter)
			.filter(function(str){return str;})
			.map(function(word){return getWordRegex(word)});
		return innerHTML.split(splitter).map(function(word){
			var i;
			for(i = regexArray.length - 1; i >= 0; i--){
				if(word.match(regexArray[i])){
					return tagStrongStart + word + tagStrongFinish;
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

	document.addEventListener("DOMContentLoaded", function(){
		searchResultEl = document.getElementsByClassName("search-results")[0];
	});

	window.searchApp.imgPreload(iconMap.images);
	if(!window.searchApp){
		window.searchApp = {};
	}
	window.searchApp.search = search;
})();