(function(){
	"use strict";

	var SearchApp = {};

	SearchApp.search = function(text, callback, outputEl){
		var input, i;
		input = parse(text);
		function parse(str){//TODO: wtf is it?
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

		outputEl.textContent = 'Loading...';
		outputEl.classList.remove('error');
		outputEl.removeAttribute('hidden');

		var data = JSON.stringify(createConfiguration());
		execute(data);

		function createConfiguration(){
			var account = ZLitestackDotCom.getAccount();//TODO: find out description for params (num of outputed files etc)
			return [
				{
					'name': 'search',
					'exec': {
						'path': 'swift://' + account + '/.gui/LiteStack/Search/0.1/execute/sys/search.nexe',
						'args': '-c index/zsphinx.conf -i mainindex -m -ws ' + input
					},
					'file_list': [
						{
							'device': 'input',
							'path': 'swift://' + account + '/.gui/LiteStack/Search/0.1/execute/sys/rwindex'
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
					callback(result, input);
				},
				error: function(status, statusText, response){
					outputEl.textContent = 'Http Error: ' + status + ' ' + statusText + '. Execute response: ' + response;
					outputEl.classList.add('error');
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
						"exec": {"path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/pdf.nexe"},
						"file_list": [
							{"device": "image", "path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/confpdf.tar"},
							{"device": "stderr", "path": "swift://" + account + "/search/outputfiles/pdf_stderr.txt"}
						],
						"connect": ["xmlpipecreator"],
						"replicate": 0
					},
					{
						"name": "other",
						"exec": {"path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/other.nexe"},
						"file_list": [
							{"device": "stdout", "path": "swift://" + account + "/search/outputfiles/other_stdout.txt"}
						],
						"connect": ["xmlpipecreator"],
						"replicate": 0
					},
					{
						"name": "txt",
						"exec": {"path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/txt.nexe"},
						"file_list": [
							{"device": "stderr", "path": "swift://" + account + "/search/outputfiles/txt_stderr.txt"}
						],
						"connect": ["xmlpipecreator"],
						"replicate": 0
					},
					{
						"name": "doc",
						"exec": {
							"path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/doc.nexe",
							"args": "temp.doc"
						},
						"file_list": [
							{"device": "image", "path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/antiword.tar"},
							{"device": "stderr", "path": "swift://" + account + "/search/outputfiles/doc_stderr.txt"}
						],
						"connect": ["xmlpipecreator"],
						"replicate": 0
					},
					{
						"name": "xmlpipecreator",
						"exec": {
							"path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/xmlpipecreator.nexe",
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
							"path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/indexer.nexe",
							"args": "--config index/zsphinx.conf deltaindex"
						},
						"file_list": [
							{"device": "stdout", "path": "swift://" + account + "/search/outputfiles/indexer_stdout.txt"},
							{"device": "input", "path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/rwindex"},
							{"device": "output", "path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/rwindex"},
							{"device": "stderr"}
						],
						"replicate": 0
					}
				];
			pathesObjs.forEach(function(pathObj, index){
				request.push({
					"name": "filesender" + index,
					"exec": {
						"path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/filesender.nexe"
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
						"path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/indexer.nexe",
						"args": "--config index/zsphinx.conf --merge mainindex deltaindex"
					},
					"file_list": [
						{"device": "stdout", "path": "swift://" + account + "/search/outputfiles/indexer_stdout.txt"},
						{"device": "input", "path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/rwindex"},
						{"device": "output", "path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/rwindex"},
						{"device": "stderr"}
					],
					"replicate": 0
				}
			];
		}
	};

	SearchApp.getPreview = function(callback, options){

		var data = JSON.stringify(createConfiguration());
		execute(data);

		function createConfiguration(){
			var account = ZLitestackDotCom.getAccount(),
				resultJSON = [
					{
						"name": options.ext,
						"file_list": [
							{"device": "input", "path": "swift://" + options.location}
						],
						"exec": {
							"args": "--search " + options.startOffset + " " + options.endOffset
						},
						"replicate": 0
					}
				];
			switch(options.ext){
				case "txt":
					resultJSON[0]["file_list"].push(
						{"device": "stdout"}
					);
					resultJSON[0]["exec"]["path"] = "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/txt.nexe";
					break;
				case "doc":
					resultJSON[0]["file_list"].push(
						{"device": "image", "path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/antiword.tar"}
					);
					resultJSON[0]["file_list"].push(
						{"device": "stderr", "path": "swift://" + account + "/search/outputfiles/doc_stderr.txt"}
					);

					resultJSON[0]["exec"]["args"] = "temp.doc --search " + options.startOffset + " " + options.endOffset;
					resultJSON[0]["exec"]["path"] = "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/doc.nexe";
					break;
				case "pdf":
					resultJSON[0]["file_list"].push(
						{"device": "image", "path": "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/confpdf.tar"}
					);
					resultJSON[0]["file_list"].push(
						{"device": "stderr", "path": "swift://" + account + "/search/outputfiles/pdf_stderr.txt"}
					);
					resultJSON[0]["exec"]["path"] = "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/pdf.nexe";
					break;
				default:
					resultJSON[0]["file_list"].push(
						{"device": "stdout"}
					);
					resultJSON[0]["exec"]["path"] = "swift://" + account + "/.gui/LiteStack/Search/0.1/execute/sys/other.nexe";
					resultJSON[0]["name"] = "other";
					break;
			}
			return resultJSON;
		}

		function execute(data){

			ZeroVmOnSwift.execute({
				data: data,
				contentType: 'application/json',
				success: function(result, report){
					callback(options, result);
				},
				error: function(status, statusText, response){
					callback(options, 'Http Error: ' + status + ' ' + statusText + '. Execute response: ' + response, true);
				}
			});
		}
	};

	window.SearchApp = SearchApp;
})();