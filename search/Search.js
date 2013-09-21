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

document.addEventListener('keydown', function (e) {

	if (isSearchInput(e)) {
		searchInputKeydown(e);
	}

	function isSearchInput(e) {
		return e.target.classList.contains('search-input');
	}

	function searchInputKeydown(e) {
		e.target.classList.remove('invalid-input');

		if (e.keyCode === 13) {
			if (e.target.value === '') {
				e.target.classList.add('invalid-input');
				return;
			}
			search(parse(e.target.value));
		}
	}

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

	function search(input) {

		var searchResultsEl = document.querySelector('.search-results');
		searchResultsEl.textContent = 'Loading...';
		searchResultsEl.classList.remove('error');
		searchResultsEl.removeAttribute('hidden');

		var data = JSON.stringify(createConfiguration());
		execute(data);

		function createConfiguration() {
			return [
				{
					'name' : 'search',
					'exec' :
					{
						'path' : 'swift://' + FileStorage.getAccountId() + '/search/sys/search.nexe',
						'args' : '-c index/zsphinx.conf -i mainindex -w -m ' + input
					},
					'file_list' :
						[
							{
								'device' : 'input',
								'path' : 'swift://' + FileStorage.getAccountId() + '/search/sys/rwindex'
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

			FileStorage.execute({
				dataToSend: data,
				dataType: 'application/json',
				success: function (blob, xhr) {
					read(blob);
				},
				error: function (message) {
					searchResultsEl.textContent = message;
					searchResultsEl.classList.add('error');
				}
			});
		}

		function read(blob) {

			var reader = new FileReader();

			reader.addEventListener('load', function (e) {
				var locations = [];
				var spl = e.target.result.split('filename=/');
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
						html += iconHtml + '<a href="https://z.litestack.com/v1/'+locations[i]+'">' + locations[i] + '</a><br>';
						//html += iconHtml + '<a href="' + AppService.createFileUrl(locations[i]) + '">' + locations[i] + '</a><br>';
					}
				}

				searchResultsEl.innerHTML = html;
			});

			reader.addEventListener('error', function (message) {
				searchResultsEl.textContent = message;
				searchResultsEl.classList.add('error');
			});

			reader.readAsText(blob);
		}
	}
});

document.addEventListener('click', function (e) {

	if (isIndexButton(e)) {
		indexButtonClick(e);
	} else if (isIndexResultCloseButton(e)) {
		indexResultCloseButtonClick(e);
	}

	function isIndexButton(e) {
		return e.target.classList.contains('index-button');
	}

	function isIndexResultCloseButton(e) {
		return e.target.classList.contains('index-result-close-button');
	}

	function indexButtonClick(e) {

		var indexResultEl = document.querySelector('.index-result');
		indexResultEl.classList.remove('error');
		indexResultEl.textContent = '';
		indexResultEl.removeAttribute('hidden');

		retrieveIndexFile();

		function retrieveIndexFile() {
			indexResultEl.textContent = 'Retrieving "search/indexing.json"...';
			FileStorage.getFile({
				path: AppService.getPath().split('/').splice(1).join('/') + 'execute/indexing.json',
				success: function (data) {
					execute(data);
				},
				error: function (message) {
					indexResultEl.textContent = message;
					indexResultEl.classList.add('error');
				}
			});
		}

		function execute(data) {
			indexResultEl.textContent = 'Executing...';
			FileStorage.execute({
				dataToSend: data,
				dataType: 'application/json',
				success: function (blob, xhr) {
					read(blob);
				},
				error: function (message) {
					indexResultEl.textContent = message;
					indexResultEl.classList.add('error');
				}
			});
		}

		function read(blob) {
			indexResultEl.textContent = 'Reading result...';
			var reader = new FileReader();
			reader.addEventListener('load', function (e) {
				indexResultEl.textContent = e.target.result;
				document.querySelector('.index-result-close-button').removeAttribute('hidden');
			});
			reader.addEventListener('error', function (message) {
				indexResultEl.textContent = message;
				indexResultEl.classList.add('error');
			});
			reader.readAsText(blob);
		}

	}

	function indexResultCloseButtonClick(e) {
		var indexResultEl = document.querySelector('.index-result');
		indexResultEl.setAttribute('hidden', 'hidden');
		e.target.setAttribute('hidden', 'hidden');
	}
});