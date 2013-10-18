(function(){
	"use strict";

	var SearchApp = {},
		iconMap = {
			extensions: ['.txt','.pdf','.doc','.docx','.h','.c','.lua'],
			images: ['img/file32_txt.png', 'img/file32_pdf.png', 'img/file32_doc.png', 'img/file32_doc.png', 'img/file32_c.png', 'img/file32_c.png', 'img/file32_lua.png']
		},
		extensionRegexp = /\.\w*$/,
		delimiter = /\//g;

	SearchApp.search = function(text, callback){
		var input, i;
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

		var searchResultsEl = document.querySelector('.search-results');//TODO: get it from global namespace
		searchResultsEl.textContent = 'Loading...';
		searchResultsEl.classList.remove('error');
		searchResultsEl.removeAttribute('hidden');

		var data = JSON.stringify(createConfiguration());
		execute(data);

		function createConfiguration(){
			var account = ZLitestackDotCom.getAccount();//TODO: find out description for params (num of outputed files etc)
			return [
				{
					'name': 'search',
					'exec': {
						'path': 'swift://' + account + '/search/sys/search.nexe',
						'args': '-c index/zsphinx.conf -i mainindex -w -m ' + input
					},
					'file_list': [
						{
							'device': 'input',
							'path': 'swift://' + account + '/search/sys/rwindex'
						},
						{
							'device': 'stdout'
						},
						{
							'device': 'stderr'
						}
					]
				}
			];
		}

		function execute(data){

			ZeroVmOnSwift.execute({
				data: data,
				contentType: 'application/json',
				success: function(result, report){
					var locations, icon, matchIndex, link, wrapper,
						wordBraker = "/<wbr/>",
						iconPathTemplate = "img/file32.png",
						imgString = "img",
						linkString = "a",
						divString = "div",
						fragment = document.createDocumentFragment(),
						ext;
					locations = result.split(/\d. document=/).map(function(str){
						return str && str.split(",")[2];
					}).filter(function(str){
							return str;
						});


					if(!locations.length){
						fragment = document.createElement(divString);
						fragment.innerHTML = 'No results.';
					}else{
						for(var i = 0; i < locations.length; i++){
							icon = document.createElement(imgString);
							ext = locations[i].match(extensionRegexp);
							locations[i] = locations[i].replace(" filename=/","");
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
							fragment.appendChild(wrapper);
						}
					}

					callback && callback();

					while (searchResultsEl.firstChild) {
						searchResultsEl.removeChild(searchResultsEl.firstChild);
					}
					searchResultsEl.appendChild(fragment);
					console.log(result)
					console.log(report)
				},
				error: function(status, statusText, response){
					searchResultsEl.textContent = 'Http Error: ' + status + ' ' + statusText + '. Execute response: ' + response;
					searchResultsEl.classList.add('error');
				}
			});
		}
	};

	SearchApp.index = function(paramsObj){

		var pathesObjs = paramsObj.pathes,//TODO: rename both
			callback = paramsObj.callbackInit,
			indexResultEl = document.querySelector('.index-result');
		indexResultEl.classList.remove('error');
		indexResultEl.textContent = '';
		indexResultEl.removeAttribute('hidden');

		index(JSON.stringify(createConfiguration()));

		function createConfiguration(){
			var account = ZLitestackDotCom.getAccount(),
				request = [
					{
						"name": "pdf",
						"exec": {"path": "swift://" + account + "/search/sys/pdf.nexe"},
						"file_list": [
							{"device": "image", "path": "swift://" + account + "/search/sys/confpdf.tar"},
							{"device": "stderr", "path": "swift://" + account + "/search/outputfiles/pdf_stderr.txt"}
						],
						"connect": ["xmlpipecreator"],
						"replicate": 0
					},
					{
						"name": "other",
						"exec": {"path": "swift://" + account + "/search/sys/other.nexe"},
						"file_list": [
							{"device": "stdout", "path": "swift://" + account + "/search/outputfiles/other_stdout.txt"}
						],
						"connect": ["xmlpipecreator"],
						"replicate": 0
					},
					{
						"name": "txt",
						"exec": {"path": "swift://" + account + "/search/sys/txt.nexe"},
						"file_list": [
							{"device": "stderr", "path": "swift://" + account + "/search/outputfiles/txt_stderr.txt"}
						],
						"connect": ["xmlpipecreator"],
						"replicate": 0
					},
					{
						"name": "doc",
						"exec": {
							"path": "swift://" + account + "/search/sys/doc.nexe",
							"args": "temp.doc"
						},
						"file_list": [
							{"device": "image", "path": "swift://" + account + "/search/sys/antiword.tar"},
							{"device": "stderr", "path": "swift://" + account + "/search/outputfiles/doc_stderr.txt"}
						],
						"connect": ["xmlpipecreator"],
						"replicate": 0
					},
					{
						"name": "xmlpipecreator",
						"exec": {
							"path": "swift://" + account + "/search/sys/xmlpipecreator.nexe",
							"args": "--duplicate"
						},
						"file_list": [
							{"device": "stdout", "path": "swift://" + account + "/search/outputfiles/xmlpipecreator_stdout.txt"}
						],
						"connect": ["indexer"],
						"replicate": 0
					},
					{
						"name": "indexer",
						"exec": {
							"path": "swift://" + account + "/search/sys/indexer.nexe",
							"args": "--config index/zsphinx.conf deltaindex"
						},
						"file_list": [
							{"device": "stdout", "path": "swift://" + account + "/search/outputfiles/indexer_stdout.txt"},
							{"device": "input", "path": "swift://" + account + "/search/sys/rwindex"},
							{"device": "output", "path": "swift://" + account + "/search/sys/rwindex"},
							{"device": "stderr"}
						],
						"replicate": 0
					}
				];
			pathesObjs.forEach(function(pathObj, index){
				request.push({
					"name": "filesender" + index,
					"exec": {
						"path": "swift://" + account + "/search/sys/filesender.nexe"
					},
					"file_list": [
						{"device": "input", "path": "swift://" + account + "/" + paramsObj.containerName + "/" + pathObj.name},
						{"device": "stderr"}
					],
					"connect": ["pdf", "txt", "doc", "other"],
					"replicate": 0
				});
			});
			return request;
		}

		function index(data){
			indexResultEl.textContent = 'Indexing...';
			ZeroVmOnSwift.execute({
				data: data,
				contentType: 'application/json',
				success: function(result, report){
					merge(JSON.stringify(createMergeConfiguration()));
					callback && callback(paramsObj);
				},
				error: function(status, statusText, response){
					indexResultEl.textContent = 'Http Error: ' + status + ' ' + statusText + '. Execute response: ' + response;
					indexResultEl.classList.add('error');
				}
			});
		}

		function read(blob){
			indexResultEl.textContent = 'Reading result...';
			var reader = new FileReader();
			reader.addEventListener('load', function(e){
				indexResultEl.textContent = e.target.result;
				document.querySelector('.index-result-close-button').removeAttribute('hidden');
			});
			reader.addEventListener('error', function(message){
				indexResultEl.textContent = message;
				indexResultEl.classList.add('error');
			});
			reader.readAsText(blob);
		}

		function merge(data){
			indexResultEl.textContent = 'Merging...';
			ZeroVmOnSwift.execute({
				data: data,
				contentType: 'application/json',
				success: function(result, report){
					indexResultEl.textContent = 'Merge completed. ' + result;
					document.querySelector('.index-result-close-button').removeAttribute('hidden');
				},
				error: function(status, statusText, response){
					var errorMessage = '';
					if(status != -1){
						errorMessage += 'Http Error: ' + status + ' ' + statusText + '. ';
					}
					errorMessage += 'Execute response: ' + response;
					indexResultEl.textContent = errorMessage;
					indexResultEl.classList.add('error');
				}
			});
		}

		function createMergeConfiguration(){
			var account = ZLitestackDotCom.getAccount();
			return [
				{
					"name": "indexer",
					"exec": {
						"path": "swift://" + account + "/search/sys/indexer.nexe",
						"args": "--config index/zsphinx.conf --merge mainindex deltaindex"
					},
					"file_list": [
						{"device": "stdout", "path": "swift://" + account + "/search/outputfiles/indexer_stdout.txt"},
						{"device": "input", "path": "swift://" + account + "/search/sys/rwindex"},
						{"device": "output", "path": "swift://" + account + "/search/sys/rwindex"},
						{"device": "stderr"}
					],
					"replicate": 0
				}
			];
		}
	};

	window.SearchApp = SearchApp;
})();