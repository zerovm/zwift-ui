(function(){
	"use strict";

	var SearchApp = {};

	SearchApp.search = function(text, callback, outputEl){
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
						'path': 'swift://' + account + '/search/sys/search.nexe',
						'args': '-c index/zsphinx.conf -i mainindex -m ' + input
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
					callback(result);
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

	SearchApp.getPreview = function(callback, options){

		var data = JSON.stringify(createConfiguration());
		execute(data);

		function createConfiguration(){
			var account = ZLitestackDotCom.getAccount(), fileList,
				resultJSON = [
					{
						"name": options.ext,
						"exec": {
							"path": "swift://" + account + "/search/sys/doc.nexe",
							"args": "--search " + options.startOffset + " " + options.endOffset
						},
						"replicate": 0
					}
				];
			switch(options.ext){
				case "txt":
					resultJSON["file_list"] = [
						{"device": "input", "path": options.location},
						{"device": "stdout", "path": "swift://g_103319991787805482239/search/outputfiles/txt_stdout.txt"}
					];
					break;
				case "doc":
					resultJSON["file_list"] = [
						{"device": "input", "path": options.location},
						{"device": "image", "path": "swift://g_103319991787805482239/search/sys/antiword.tar"},
						{"device": "stderr", "path": "swift://g_103319991787805482239/search/outputfiles/doc_stderr.txt"}
					];
					resultJSON["exec"]["args"] = "temp.doc --search " + options.startOffset + " " + options.endOffset;
					break;
				case "pdf":
					resultJSON["file_list"] = [
						{"device": "input", "path": options.location},
						{"device": "image", "path": "swift://g_103319991787805482239/search/sys/confpdf.tar"},
						{"device": "stderr", "path": "swift://g_103319991787805482239/search/outputfiles/pdf_stderr.txt"}
					];
					break;
				default:
					resultJSON["file_list"] = [
						{"device": "input", "path": options.location},
						{"device": "stdout", "path": "swift://g_103319991787805482239/search/outputfiles/other_stdout.txt"}
					];
					resultJSON["name"] = "other";
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

/*



 var a =[
 {
 "name" : "txt",
 "exec" : {
 "args" : "--search 209 220"  <<<<<------------- 209 - start из резуьтата, 220 - end
 "path" : "swift://g_103319991787805482239/search/sys/txt.nexe"
 },
 "file_list" :
 [
 {"device" : "input", "path" : "swift://g_103319991787805482239/search/doc/channels_.doc"},  <<<<<------------- filename из результата
 {"device" : "stdout",   "path" : "swift://g_103319991787805482239/search/outputfiles/txt_stdout.txt"}
 ],
 "replicate" : 0
 }
 ]


 для *.doc-файлов:
 [
 {
 "name" : "doc",
 "exec" :
 {
 "path" : "swift://g_103319991787805482239/search/sys/doc.nexe",
 "args" : "temp.doc --search 209 220"  <<<<<------------- 209 - start из резуьтата, 220 - end
 },
 "file_list" :
 [
 {"device" : "input", "path" : "swift://g_103319991787805482239/search/doc/channels_.doc"},  <<<<<------------- filename из результата
 {"device" : "image", "path" :  "swift://g_103319991787805482239/search/sys/antiword.tar"},
 {"device" : "stderr",   "path" : "swift://g_103319991787805482239/search/outputfiles/doc_stderr.txt"}
 ],
 "replicate" : 0
 }
 ]

 для *.pdf-файлов:
 [
 {
 "name" : "pdf",
 "exec" : {
 "path" : "swift://g_103319991787805482239/search/sys/pdf.nexe"
 "args" : "--search 209 220"  <<<<<------------- 209 - start из резуьтата, 220 - end
 },
 "file_list" :
 [
 {"device" : "input", "path" : "swift://g_103319991787805482239/search/doc/channels_.doc"},  <<<<<------------- filename из результата
 {"device" : "image",  "path" : "swift://g_103319991787805482239/search/sys/confpdf.tar"},
 {"device" : "stderr",   "path" : "swift://g_103319991787805482239/search/outputfiles/pdf_stderr.txt"}
 ],
 "replicate" : 0
 }
 ]

 для всех остальных файлов:
 [
 {
 "name" : "other",
 "exec" : {
 "path" : "swift://g_103319991787805482239/search/sys/other.nexe"
 "args" : "--search 209 220"  <<<<<------------- 209 - start из резуьтата, 220 - end
 },
 "file_list" :
 [
 {"device" : "input", "path" : "swift://g_103319991787805482239/search/doc/channels_.doc"},  <<<<<------------- filename из результата
 {"device" : "stdout",   "path" : "swift://g_103319991787805482239/search/outputfiles/other_stdout.txt"}
 ],
 "replicate" : 0
 }
 ]*/
