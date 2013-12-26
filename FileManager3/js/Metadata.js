var Metadata = {};

(function () {
	'use strict';

	var MetadataDialog = document.getElementById('MetadataDialog');
	var list = MetadataDialog.getElementsByClassName('meta-data-list')[0];

	function createMetaInputRow(meta, value) {
		var newMetadataEl = MetadataDialog.getElementsByClassName('template')[0].cloneNode(true);
		newMetadataEl.classList.remove('template');
		var metaKeyEl = newMetadataEl.getElementsByClassName('meta-key-input')[0];
		var metaValueEl = newMetadataEl.getElementsByClassName('meta-value-input')[0];

		meta && (metaKeyEl.value = decodeURIComponent(meta));
		value && (metaValueEl.value = decodeURIComponent(value));
		list.appendChild(newMetadataEl);
	}

	MetadataDialog.onsubmit = function (e) {

		SwiftV1.updateFileMetadata({
			metadata: metadataObj.getMeta(),
			removeMetadata: metadataObj.getRemovedMeta(),
			contentType: item.dataset.contentType,
			updated: window.FileManager.files.refreshItemList,
			path: window.FileManager.CurrentPath().withoutAccount() + previousParent.dataset.path,
			error: function () {

			},
			notExist: function(){
				window.FileManager.errorMsgHandler.show({
					header: "File not exist"
				});
			}
		});
		e.preventDefault();
	};

	MetadataDialog.getElementsByClassName('btn-cancel')[0].onclick = function () {
		MetadataDialog.classList.add('hidden');
	};

	Metadata.show = function (path, type, callback) {
		var args = {
			success: function(metadata){
				//list.removeChildren();
				var originMetadata = metadata;
				var originMetadataKeys = Object.keys(originMetadata);
				originMetadataKeys.forEach(function(key){
					createMetaInputRow(key, originMetadata[key]);
				});
				createMetaInputRow();
				MetadataDialog.classList.remove('hidden');
			},
			notExist: function(){
				window.FileManager.errorMsgHandler.show({
					header: "Item does not exist"
				});
			},
			error: function (status, statusText) {
				//TODO:
				alert(status + ' ' + statusText);
			}
		};
		path = window.FileManager.CurrentPath().withoutAccount() + path;
		window.FileManager.errorMsgHandler.hide();
		if(type === 'container'){
			args.containerName = path;
			SwiftV1.Container.head(args);
		}else{
			args.path = path;
			SwiftV1.File.head(args);
		}
	};



})();