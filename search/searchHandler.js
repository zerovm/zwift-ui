(function(){

	"use strict"

	var searchResultEl,
		iconMap = {
			extensions: ['.txt','.pdf','.doc','.docx','.h','.c','.lua'],
			images: ['img/file32_txt.png', 'img/file32_pdf.png', 'img/file32_doc.png', 'img/file32_doc.png', 'img/file32_c.png', 'img/file32_c.png', 'img/file32_lua.png']
		},
		extensionRegexp = /\.\w*$/,
		noResultText = "No results.",
		delimiter = /\//g,
		wordBraker = "/<wbr/>",
		iconPathTemplate = "img/file32.png",
		imgString = "img",
		linkString = "a",
		divString = "div",
		fragmentArray,
		callbackCounter,
		callbackCounterMax;

//TODO: replace static json for indexer and rest (indexing.json, merge.json and so on)
	function search(value){
		console.log("started search")
		window.SearchApp.search(value, splitResult, searchResultEl);
	}

	function splitResult(result){
		var splittedResult,
			startOffsets = [],
			locations = [],
			endsOffsets = [];
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
			locations = [];

		fragmentArray = new Array(splittedResult.length);
		callbackCounter = 0;
		callbackCounterMax = splittedResult.length;
		splittedResult.forEach(function(splitString, index){
			var splitSubString = splitString[4].split(";");
			icon = document.createElement(imgString);
			ext = locations[i].match(extensionRegexp);
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
			link.href = ZLitestackDotCom.getStorageUrl() + locations[i];
			link.target = "_blank";
			link.innerHTML = locations[i].replace(delimiter, wordBraker);
			wrapper = document.createElement(divString);
			wrapper.appendChild(icon);
			wrapper.appendChild(link);
			SearchApp.getPreview(processRequest, {
				location: splitString[2].replace(" filename=/",""),
				startOffset: splitSubString[1].replace(" start=", ""),
				endOffset: splitSubString[2].replace(" end=", ""),
				index: index,
				el: wrapper,
				ext: ext.replace(".","")
			});
		});
	}

	function processRequest(options, request, isError){
		var preview;
		if(isError){
			console.log("error")
		}else{
			preview = document.createElement(divString);
			preview.innerText ? preview.innerText = request : preview.textContent = request;
		}
		callbackCounter++;
		if(callbackCounter === callbackCounterMax){
			displayData();
		}

	}

	function displayData(){
		var fragment = document.createDocumentFragment();
		fragmentArray.forEach(function(piece){
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