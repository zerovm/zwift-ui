(function(){
	"use strict";

	var grepAppHelper = {},
		iconMap = {
			extensions: ['.txt','.pdf','.doc','.docx','.h','.c','.lua'],
			images: ['img/file32_txt.png', 'img/file32_pdf.png', 'img/file32_doc.png', 'img/file32_doc.png', 'img/file32_c.png', 'img/file32_c.png', 'img/file32_lua.png']
		},
		extensionRegexp = /\.\w*$/,
		delimiter = /\//g;

	grepAppHelper.grep = function(text, callback){
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
			var account = ZLitestackDotCom.getAccount();//fileList - path to file
			return [
				{
					'name': 'grep',
					'exec': {
						'path': 'swift://' + account + '/search/sys/grep.nexe',
						'args': '-c index/zsphinx.conf -i mainindex -w -m ' + input
					},
					'file_list': [
						{
							'device': 'stdin',
							'path': 'swift://' + account + '/search/sys/rwindex'
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

	window.grepAppHelper = grepAppHelper;
})();