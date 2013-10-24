var ZipLib = {};

(function() {
	'use strict';

	var entries;
	var entryIndex = 0;
	var zipFiles = {};

	function readEntry(reader, callback) {

		if (entryIndex == entries.length) {
			entryIndex = 0;
			entries = null;
			callback(zipFiles);
			return;
		}

		var fileName = entries[entryIndex].filename;
		var fileData;

		var writer = fileName=='manifest.json' ? new zip.TextWriter("utf-8") : new zip.BlobWriter(extToMIME(fileName));

		entries[entryIndex].getData(writer, function (data) {
			fileData = data;

			zipFiles[fileName] = fileData;

			reader.close(function() {
				// onclose callback
			});

			entryIndex++;
			readEntry(reader, callback);
		});
	}

	ZipLib.unzip = function (file, callback) {

		zip.createReader(new zip.BlobReader(file), function(reader) {

			reader.getEntries(function(_entries) {
				entries = _entries;

				readEntry(reader, callback);
			});
		}, function(error) {
			alert("Error occurred while unzipping the file.");
			console.log(error);
		});
	};
})();