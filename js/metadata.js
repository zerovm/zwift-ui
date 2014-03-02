var Metadata = (function (SwiftV1, Path) {

	var dialogEl = document.getElementById('MetadataDialog');
	var listEl = dialogEl.getElementsByClassName('metadata-list')[0];
	var initialMetadata;
	var initialContentType;
	var metadataPath;

	function loadMetadata(path) {
		metadataPath = new Path(path);

		clear();
		dialogEl.getElementsByClassName('metadata-loading')[0].classList.remove('hidden');
		dialogEl.classList.remove('hidden');
		handleCancelButtonClickEvent();
		handleSaveButtonClickEvent();

		if (CurrentPath().isContainersList()) {
			loadContainerMetadata();
		} else {
			loadFileMetadata();
		}

		function fillMetadataList(metadata) {
			var k = Object.keys(metadata);
			for (var i = 0; i < k.length; i++) {
				addRow(k[i], metadata[k[i]]);
			}
		}

		function addRow(k, v) {
			var newRow = dialogEl.getElementsByClassName('template')[0].cloneNode(true);
			newRow.classList.remove('template');
			newRow.classList.remove('hidden');
			if (arguments.length === 2) {
				newRow.getElementsByClassName('metadata-key')[0].value = k;
				newRow.getElementsByClassName('metadata-value')[0].value = v;
			}
			listEl.appendChild(newRow);
		}

		function clear() {
			listEl.innerHTML = '';
			listEl.classList.remove('hidden');
			dialogEl.getElementsByClassName('metadata-loading-error')[0].classList.add('hidden');
			dialogEl.getElementsByClassName('metadata-uploading')[0].classList.add('hidden');
			dialogEl.getElementsByClassName('metadata-uploaded')[0].classList.add('hidden');
			dialogEl.getElementsByClassName('metadata-uploading-error')[0].classList.add('hidden');
		}

		function loadContainerMetadata() {
			XHR();

			function XHR() {
				SwiftV1.getContainerMetadata({
					containerName: metadataPath.container(),
					success: XHR_OK,
					error: XHR_ERROR
				});
			}
		}

		function loadFileMetadata() {
			XHR();

			function XHR() {
				SwiftV1.getFileMetadata({
					path: metadataPath.withoutAccount(),
					success: XHR_FILE_OK,
					error: XHR_ERROR
				});
			}

			function XHR_FILE_OK(metadata, contentType) {
				initialContentType = contentType;
				XHR_OK(metadata);
			}
		}

		function XHR_OK(metadata) {
			initialMetadata = metadata;
			fillMetadataList(metadata);
			addRow();
			dialogEl.getElementsByClassName('metadata-loading')[0].classList.add('hidden');
		}

		function XHR_ERROR(status, statusText) {
			var errorEl = dialogEl.getElementsByClassName('metadata-loading-error')[0];
			errorEl.getElementsByClassName('ajax-error-status-text')[0].textContent = statusText;
			errorEl.getElementsByClassName('ajax-error-status-code')[0].textContent = status;
			errorEl.classList.remove('hidden');
		}

		function handleCancelButtonClickEvent() {
			dialogEl.getElementsByClassName('metadata-cancel')[0].onclick = function () {
				dialogEl.classList.add('hidden');
			};
		}

		function handleSaveButtonClickEvent() {
			dialogEl.onsubmit = function (e) {
				e.preventDefault();
				updateMetadata();
			};
		}

		listEl.onkeyup = function (e) {
			removeEmptyInputs(e.target);
			insureLastRowIsEmpty();
			clearHighlight();
			highlightDuplicatedKeys();

			function insureLastRowIsEmpty() {
				var elements = listEl.getElementsByClassName('metadata-key');
				if (elements[elements.length - 1].value !== '') {
					addRow();
				}
			}

			function clearHighlight() {
				var elements = listEl.getElementsByClassName('metadata-key');

				for (var i = 0; i < elements.length; i++) {
					elements[i].classList.remove('error-input');
				}
			}

			function highlightDuplicatedKeys() {
				var elements = listEl.getElementsByClassName('metadata-key');

				for (var i = 0; i < elements.length; i++) {
					if (elements[i].value === '') {
						continue;
					}

					for (var j = 0; j < elements.length; j++) {
						if (elements[i] == elements[j]) {
							continue;
						}
						if (elements[i].value == elements[j].value) {
							elements[i].classList.add('error-input');
							elements[j].classList.add('error-input');
						}
					}
				}
			}

			function removeEmptyInputs(ignoreEl) {
				var elements = listEl.getElementsByClassName('metadata-key');

				if (elements.length === 1) {
					return;
				}

				for (var i = 0; i < elements.length; i++) {
					if (elements[i] == ignoreEl) {
						continue;
					}
					if (elements[i].value === '') {
						removeInputRow(elements[i]);
					}
				}
			}

			function removeInputRow(inputEl) {
				var rowEl = inputEl;
				while (!rowEl.classList.contains('metadata-row')) {
					rowEl = rowEl.parentNode;
				}
				listEl.removeChild(rowEl);
			}
		};
	}

	function updateMetadata() {
		dialogEl.getElementsByClassName('metadata-uploading')[0].classList.remove('hidden');
		listEl.classList.add('hidden');
		var metadata = metadataFromMetadataList();

		if (CurrentPath().isContainersList()) {
			updateContainerMetadata(metadata);
		} else {
			updateFileMetadata(metadata);
		}

		function metadataFromMetadataList() {
			var rows = listEl.getElementsByClassName('metadata-row');
			var metadata = {}, k, v;
			for (var i = 0; i < rows.length - 1; i++) {
				k = rows[i].getElementsByClassName('metadata-key')[0].value;
				v = rows[i].getElementsByClassName('metadata-value')[0].value;
				metadata[k] = v;
			}
			return metadata;
		}

		function metadataToRemove(metadata) {
			var metadataToRemoveList = [];
			var metadataToAddKeys = Object.keys(metadata);
			var initialKeys = Object.keys(initialMetadata);
			for (var i = 0; i < initialKeys.length; i++) {
				var initialKey = initialKeys[i];
				if (metadataToAddKeys.indexOf(initialKey) == -1) {
					metadataToRemoveList.push(initialKey);
				}
			}
			return metadataToRemoveList;
		}

		function updateContainerMetadata(metadata) {
			XHR();

			function XHR() {
				SwiftV1.updateContainerMetadata({
					containerName: metadataPath.container(),
					metadata: metadata,
					removeMetadata: metadataToRemove(metadata),
					updated: XHR_OK,
					error: XHR_ERROR
				});
			}
		}

		function updateFileMetadata(metadata) {
			XHR();

			function XHR() {
				SwiftV1.updateFileMetadata({
					path: metadataPath.withoutAccount(),
					contentType: initialContentType,
					metadata: metadata,
					removeMetadata: metadataToRemove(metadata),
					updated: XHR_OK,
					error: XHR_ERROR
				});
			}
		}

		function XHR_OK() {
			dialogEl.getElementsByClassName('metadata-uploaded')[0].classList.add('hidden');
			setTimeout(function () {
				dialogEl.classList.add('hidden');
			}, 1000);
		}

		function XHR_ERROR(status, statusText) {
			var errorEl = dialogEl.getElementsByClassName('metadata-uploading-error')[0];
			errorEl.getElementsByClassName('ajax-error-status-text')[0].textContent = statusText;
			errorEl.getElementsByClassName('ajax-error-status-code')[0].textContent = status;
			errorEl.classList.remove('hidden');
		}
	}

	return {
		loadMetadata: loadMetadata
	};

})(SwiftV1, Path);