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

SearchApp.search = function () {
	var input = parse(document.querySelector('.search-input').value);
	function parse(str) {
		var arr = str.split('"');
		for (var i = 1; i < arr.length; i += 2) {
			arr[i] = arr[i].replace(':', ' ');
		}
		str = arr.join('');
		arr = str.split(' ');
		for (var i = 0; i < arr.length; i++) {
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
				var locations = [];
				var spl = result.split('filename=/');
				for (var i = 1; i < spl.length; i++) {
					locations[locations.length] = spl[i].split(', ')[0];
				}

				var html = '';

				if (locations.length == 0) {
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

				searchResultsEl.innerHTML = html;
			},
			error: function (status, statusText, response) {
				searchResultsEl.textContent = 'Http Error: ' + status + ' ' + statusText + '. Execute response: ' + response;
				searchResultsEl.classList.add('error');
			}
		});
	}
};

SearchApp.index = function () {

	var indexingResult;

	var indexResultEl = document.querySelector('.index-result');
	indexResultEl.classList.remove('error');
	indexResultEl.textContent = '';
	indexResultEl.removeAttribute('hidden');

	index(JSON.stringify(createConfiguration()));


	function createConfiguration() {
		var account = ZLitestackDotCom.getAccount();
		//var account = ClusterAuth.getAccount();
		return [
			{
				"name" : "filesender",
				"exec" :
				{
					"path": "swift://" + account + "/search/sys/filesender.nexe"
				},
				"file_list" :
					[
						{"device" : "input", "path" : "swift://" + account + "/" + document.querySelector('.index-input').value},
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
		ZeroVmOnSwift.execute({
			data: data,
			contentType: 'application/json',
			success: function (result, report) {
				indexingResult = result;
				merge(JSON.stringify(createMergeConfiguration()));
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

function ProgressBar(ele, partsNum){
	var chunkNum, chunkSize = 50, curChunk = 0, chunkPercent;
	chunkNum = partsNum % chunkSize;
	if(partsNum - chunkNum * chunkSize !== 0){
		chunkNum += 1;
	}
	chunkPercent = 100 / chunkNum;
	ele.progressbar({
		value: 0
	});
	this.setValue = function(value){
		ele.progressbar({value: value});
	};
	this.updateChunk = function(){
		this.setValue(++curChunk);
	}
}

document.addEventListener('keydown', function (e) {

	if (isSearchInput(e)) {
		searchInputKeydown(e);
	} else if (isIndexInput(e)) {
		indexInputKeyDown(e);
	}

	function isSearchInput(e) {
		return e.target.classList.contains('search-input');
	}

	function isIndexInput(e) {
		return e.target.classList.contains('index-input');
	}

	function searchInputKeydown(e) {
		e.target.classList.remove('invalid-input');

		if (e.keyCode === 13) {
			if (e.target.value === '') {
				e.target.classList.add('invalid-input');
				return;
			}
			SearchApp.search();
		} else {
			document.querySelector('.search-results').innerHTML = 'Type "Enter" to view results.';
		}
	}

	function indexInputKeyDown(e) {
		e.target.classList.remove('invalid-input');

		if (e.keyCode === 13) {
			if (e.target.value === '') {
				e.target.classList.add('invalid-input');
				return;
			}
			SearchApp.index();
		}
	}
});

document.addEventListener('click', function (e) {

	if (isIndexButton(e)) {
		SearchApp.index();
	} else if (isIndexResultCloseButton(e)) {
		indexResultCloseButtonClick(e);
	} else if (isSearchButton(e)) {
		SearchApp.search();
	}

	function isIndexButton(e) {
		return e.target.classList.contains('index-button');
	}

	function isIndexResultCloseButton(e) {
		return e.target.classList.contains('index-result-close-button');
	}

	function isSearchButton(e) {
		return e.target.classList.contains('search-button');
	}

	function indexResultCloseButtonClick(e) {
		var indexResultEl = document.querySelector('.index-result');
		indexResultEl.setAttribute('hidden', 'hidden');
		e.target.setAttribute('hidden', 'hidden');
	}
});

document.addEventListener('DOMContentLoaded', function () {
	ZLitestackDotCom.init();
	window.progressBar = new ProgressBar($(".progress-bar"), 53);//TODO: is there any name space?
});