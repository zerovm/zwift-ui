/*
 Add String.contains for not supported browsers.
 */
if (!('contains' in String.prototype)) {
	String.prototype.contains = function (str, startIndex) {
		return -1 !== String.prototype.indexOf.call(this, str, startIndex);
	};
}

/*
 Add String.startsWith for not supported browsers.
 */
if (!String.prototype.startsWith) {
	Object.defineProperty(String.prototype, 'startsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			position = position || 0;
			return this.indexOf(searchString, position) === position;
		}
	});
}

/*
 Add String.endsWith for not supported browsers.
 */
if (!String.prototype.endsWith) {
	Object.defineProperty(String.prototype, 'endsWith', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: function (searchString, position) {
			position = position || this.length;
			position = position - searchString.length;
			return this.lastIndexOf(searchString) === position;
		}
	});
}

var SearchApp = {};

SearchApp.search = function (callbackObj) {
	var input, text = callbackObj.searchText, i;
	input = parse(text);
	function parse(str) {
		var arr = str.split('"');
		for (i = 1; i < arr.length; i += 2) {
			arr[i] = arr[i].replace(':', ' ');
		}
		str = arr.join('');
		arr = str.split(' ');
		for (i = 0; i < arr.length; i++) {
			if (arr[i].indexOf(':') != -1) {
				arr[i] = '-j ' + arr[i].replace(':', ' ');
			}
		}
		return arr.join(' ');
	}

	var searchResultsEl = document.querySelector('.search-results');
	searchResultsEl.textContent = 'Loading...';
	searchResultsEl.classList.remove('error');
	searchResultsEl.removeAttribute('hidden');

	var data = JSON.stringify(createConfiguration());
	execute(data);


	function createConfiguration() {
		var account = ZLitestackDotCom.getAccount();
		//var account = ClusterAuth.getAccount();
		return [
			{
				'name' : 'search',
				'exec' :
				{
					'path' : 'swift://' + account + '/search/sys/search.nexe',
					'args' : '-c index/zsphinx.conf -i mainindex -w -m ' + input
				},
				'file_list' :
					[
						{
							'device' : 'input',
							'path' : 'swift://' + account + '/search/sys/rwindex'
						},
						{
							'device' : 'stdout'
						},
						{
							'device' : 'stderr'
						}
					]
			}
		];
	}

	function execute(data) {

		ZeroVmOnSwift.execute({
			data: data,
			contentType: 'application/json',
			success: function (result, report) {
				var locations;
				locations = result.split(/\d. document=/).map(function(str){
					return str && str.split(",")[2];
				}).filter(function(str){
						return str;
					});

				var html = '';

				if (!result) {
					html = 'No results.';
				} else {
					var iconHtml;
					var iconMap = {
						'.txt': 'img/file32_txt.png',
						'.pdf': 'img/file32_pdf.png',
						'.doc': 'img/file32_doc.png',
						'.docx': 'img/file32_doc.png',
						'.h': 'img/file32_c.png',
						'.c': 'img/file32_c.png',
						'.lua': 'img/file32_lua.png'
					};
					for (var i = 0; i < locations.length; i++) {
						iconHtml = '<img src="img/file32.png" />';
						for (var fileExtension in iconMap) {
							if (locations[i].endsWith(fileExtension)) {
								iconHtml = '<img src="' + iconMap[fileExtension] + '" />';
								break;
							}
						}
						html += iconHtml + '<a href="' + ZLitestackDotCom.getStorageUrl() + locations[i] + '">' + locations[i] + '</a><br>';
						//html += iconHtml + '<a href="' + ClusterAuth.getStorageUrl() + locations[i] + '">' + locations[i] + '</a><br>';
					}
				}

				if(callbackObj.callbackInit){
					if (!result) {
						callbackObj.searchFail = true;
						console.log(result)
					}else{
						callbackObj.searchFail = false;
					}
					callbackObj.callbackInit(callbackObj);
				}
				searchResultsEl.innerHTML = html;
				console.log("---------------------------------------")
				console.log(result)
				console.log(report)
				console.log("---------------------------------------")
			},
			error: function (status, statusText, response) {
				searchResultsEl.textContent = 'Http Error: ' + status + ' ' + statusText + '. Execute response: ' + response;
				searchResultsEl.classList.add('error');
			}
		});
	}
};

SearchApp.index = function (path, callback, callbackParams) {

	var indexingResult;

	var indexResultEl = document.querySelector('.index-result');
	indexResultEl.classList.remove('error');
	indexResultEl.textContent = '';
	indexResultEl.removeAttribute('hidden');

	index(JSON.stringify(createConfiguration()));


	function createConfiguration() {
		var account = ZLitestackDotCom.getAccount();
		//var account = ClusterAuth.getAccount();
		console.log("swift://" + account + "/" + path)
		return [
			{
				"name" : "filesender",
				"exec" :
				{
					"path": "swift://" + account + "/search/sys/filesender.nexe"
				},
				"file_list" :
					[
						{"device" : "input", "path" : "swift://" + account + "/" + path},
						{"device" : "stderr"}
					],
				"connect" : ["pdf", "txt", "doc", "other"],
				"replicate" : 0
			},
			{
				"name" : "pdf",
				"exec" : {"path" : "swift://" + account + "/search/sys/pdf.nexe"},
				"file_list" :
					[
						{"device" : "image", 	"path" : "swift://" + account + "/search/sys/confpdf.tar"},
						{"device" : "stderr",  	"path" : "swift://" + account + "/search/outputfiles/pdf_stderr.txt"}
					],
				"connect" : ["xmlpipecreator"],
				"replicate" : 0
			},
			{
				"name" : "other",
				"exec" : {"path" : "swift://" + account + "/search/sys/other.nexe"},
				"file_list" :
					[
						{"device" : "stdout",  	"path" : "swift://" + account + "/search/outputfiles/other_stdout.txt"}
					],
				"connect" : ["xmlpipecreator"],
				"replicate" : 0
			},
			{
				"name" : "txt",
				"exec" : {"path" : "swift://" + account + "/search/sys/txt.nexe"},
				"file_list" :
					[
						{"device" : "stderr",  	"path" : "swift://" + account + "/search/outputfiles/txt_stderr.txt"}
					],
				"connect" : ["xmlpipecreator"],
				"replicate" : 0
			},
			{
				"name" : "doc",
				"exec" :
				{
					"path" : "swift://" + account + "/search/sys/doc.nexe",
					"args" : "temp.doc"
				},
				"file_list" :
					[
						{"device" : "image", "path" :  "swift://" + account + "/search/sys/antiword.tar"},
						{"device" : "stderr",  	"path" : "swift://" + account + "/search/outputfiles/doc_stderr.txt"}
					],
				"connect" : ["xmlpipecreator"],
				"replicate" : 0
			},
			{
				"name" : "xmlpipecreator",
				"exec" :
				{
					"path" : "swift://" + account + "/search/sys/xmlpipecreator.nexe",
					"args" : "--duplicate"
				},
				"file_list" :
					[
						{"device" : "stdout", "path" :  "swift://" + account + "/search/outputfiles/xmlpipecreator_stdout.txt"}
					],
				"connect" : ["indexer"],
				"replicate" : 0
			},
			{
				"name" : "indexer",
				"exec" :
				{
					"path" : "swift://" + account + "/search/sys/indexer.nexe",
					"args" : "--config index/zsphinx.conf deltaindex"
				},
				"file_list" :
					[
						{"device" : "stdout",  "path" : "swift://" + account + "/search/outputfiles/indexer_stdout.txt"},
						{"device" : "input",   "path" : "swift://" + account + "/search/sys/rwindex"},
						{"device" : "output",  "path" : "swift://" + account + "/search/sys/rwindex"},
						{"device" : "stderr"}
					],
				"replicate" : 0
			}
		];
	}

	function index(data) {
		indexResultEl.textContent = 'Indexing...';
		console.log("execute index")
		console.log(data)
		ZeroVmOnSwift.execute({
			data: data,
			contentType: 'application/json',
			success: function (result, report) {
				indexingResult = result;
				merge(JSON.stringify(createMergeConfiguration()));
				callback && callback(callbackParams);
			},
			error: function (status, statusText, response) {
				indexResultEl.textContent = 'Http Error: ' + status + ' ' + statusText + '. Execute response: ' + response;
				indexResultEl.classList.add('error');
			}
		});
	}

	function read(blob) {
		indexResultEl.textContent = 'Reading result...';
		var reader = new FileReader();
		reader.add=EventListener('load', function (e) {
			indexResultEl.textContent = e.target.result;
			document.querySelector('.index-result-close-button').removeAttribute('hidden');
		});
		reader.addEventListener('error', function (message) {
			indexResultEl.textContent = message;
			indexResultEl.classList.add('error');
		});
		reader.readAsText(blob);
	}

	function merge(data) {
		indexResultEl.textContent = 'Merging...';
		ZeroVmOnSwift.execute({
			data: data,
			contentType: 'application/json',
			success: function (result, report) {
				indexResultEl.textContent = 'Merge completed. ' + result;
				document.querySelector('.index-result-close-button').removeAttribute('hidden');
			},
			error: function (status, statusText, response) {
				var errorMessage = '';
				if (status != -1) {
					errorMessage += 'Http Error: ' + status + ' ' + statusText + '. ';
				}
				errorMessage += 'Execute response: ' + response;
				indexResultEl.textContent = errorMessage;
				indexResultEl.classList.add('error');
			}
		});
	}

	function createMergeConfiguration() {
		var account = ZLitestackDotCom.getAccount();
		//var account = ClusterAuth.getAccount();
		return [
			{
				"name" : "indexer",
				"exec" :
				{
					"path" : "swift://" + account + "/search/sys/indexer.nexe",
					"args" : "--config index/zsphinx.conf --merge mainindex deltaindex"
				},
				"file_list" :
					[
						{"device" : "stdout",  "path" : "swift://" + account + "/search/outputfiles/indexer_stdout.txt"},
						{"device" : "input",   "path" : "swift://" + account + "/search/sys/rwindex"},
						{"device" : "output",  "path" : "swift://" + account + "/search/sys/rwindex"},
						{"device" : "stderr"}
					],
				"replicate" : 0
			}
		];
	}
};