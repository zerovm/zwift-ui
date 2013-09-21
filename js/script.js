'use strict';

var fileStorage = new FileStorage();

var backButton = new function () {
		this.enable = function () {
			var el = $('#back-button');
			el.unbind('click').click(function () {
				editor.check(function () {
					search.hide();
					metadataDialog.hide();
					list.up();
					$('#file-type-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
				});
			});
			el.removeClass('header-disabled-button');
			el.addClass('header-enabled-button');
		};
		this.disable = function () {
			var el = $('#back-button');
			el.unbind('click');
			el.addClass('header-disabled-button');
			el.removeClass('header-enabled-button');
		};
	},

	title = new function () {
		this.update = function (path) {
			var name = path.endsWith('/') ? path.untilLast('/').fromLast('/') + '/' : path.fromLast('/');
			var el = $('#title');
			if (path.count('/') == 1 || path.endsWith('/')) {
				name = shortifyContainerName(htmlEscape(name));
			} else {
				name = truncate(htmlEscape(name));
			}
			el.html(name);
			el.attr('data-path', path);
			el.attr('title', path.count('/') == 0 ? account.accountName : path);
			window.location.hash = path.count('/') == 0 ? account.accountName : path;
		};
		this.getPath = function () {
			return $('#title').attr('data-path');
		};
	},

	addButton = new function () {
		var self = this;

		this.init = function () {

			$(document).on('click', '.enabled #add-button', function() {
				var path = title.getPath();

				if (list.isContainersList(path)) {
					createContainerDialog.show();
				} else {
					self.menuFiles.toggle();
				}
			});

			self.menuFiles.init();
			self.menuContainers.init();
		};

		this.menuFiles = new function () {

			this.init = function () {
				$('#create-directory-button').click(function () {
					createDirectoryDialog.show();
				});
				uploadButton.init();
				executeButton.init();
				createTextFile.init();
			};
			this.toggle = function () {
				if ($('#add-files-menu').is(':visible')) {
					this.hide();
				} else {
					this.show();
				}
			};
			this.show = function () {
				$('#add-button').addClass('add-button-active');
				$('#add-files-menu').show('slide', {direction:'up'}, 200);
			};
			this.hide = function () {
				$('#add-button').removeClass('add-button-active');
				$('#add-files-menu').hide('slide', {direction:'up'}, 200);
			};
		};

		this.menuContainers = new function () {

			this.init = function () {
				$('#create-container-button').click(function () {
					createContainerDialog.show();
				});
				$('#add-shared-button').click(function () {
					sharedContainerDialog.show();
				});
			};
			this.toggle = function () {
				if ($('#add-containers-menu').is(':visible')) {
					this.hide();
				} else {
					this.show();
				}
			};
			this.show = function () {
				$('#add-button').addClass('add-button-active');
				$('#add-containers-menu').show('slide', {direction:'up'}, 200);
			};
			this.hide = function () {
				$('#add-button').removeClass('add-button-active');
				$('#add-containers-menu').hide('slide', {direction:'up'}, 200);
			};
		};
	},

	newTabButton = new function () {
		this.init = function () {
			$('#new-tab-button').click(function () {
				window.open($('#editor').attr('src'), '_blank');
			});
		};
	},

	fileTypeDialog = new function () {
		this.init = function () {
			$('#type-cancel-button').click(function () {
				$('#file-type-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
			});

			$('#type-ok-button').click(function () {
				var typeEl = $('#file-type');
				var type = typeEl.val();
				var itemPath = $('.selected-item').attr('data-path');
				if (type) {

					var filePath = itemPath.from('/');
					disableAll();

					fileStorage.updateFileContentType({
						path: filePath,
						contentType: type,
						updated: function () {
							list.first20Files(title.getPath(), 'up');
							$('#file-type-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
							enableAll();
						},
						error: errorMessage.handleError
					});

				} else {
					typeEl.addClass('invalid-input');
				}
			});

			$(document).on('keyup', '#file-type', function (e) {
				if (e.which == 13) {
					$('#type-ok-button').click();
					return;
				}
				if ($(this).val().length > 0) {
					$(this).removeClass('invalid-input');
				}
			});
		};

		this.show = function () {

			var itemPath = $('.selected-item').attr('data-path');
			disableAll();

			fileStorage.getFileContentType({
				path: itemPath.from('/'),
				success: function (contentType) {

					var type = '';
					if (contentType && contentType != ',') {
						type = contentType;
					}


					var typeEl = $('#file-type');
					typeEl.val(type);
					typeEl.removeClass('invalid-input');
					$('#file-type-dialog').show('slide', {direction:'up'}, 200, function () {
						layout.fix();
						typeEl.focus();
					});
					addButton.menuFiles.hide();
					enableAll();
				},
				error: errorMessage.handleError
			});

		};
	},

	uploads = new function () {
		var uploadRequests = [],
			lastUploadIndex = 0,
			uploadingFiles = 0;

		this.waitForUploadAs = function () {
			uploadingFiles++;
		};

		this.uploadFiles = function (files, isUploadAs) {

			disableAll();

			var f, itemUploadHtml, id, url, urlPrefix,
				path = title.getPath(),
				itemUploadTemplate = $('#item-upload-template').html();

			urlPrefix = account.xStorageUrl + path;

			if (!path.endsWith('/')) {
				urlPrefix += '/';
			}

			for (var i = 0; i < files.length; i++, lastUploadIndex++) {
				uploadFile(i)
			}

			function uploadFile(i) {
				f = files[i];
				var _name = f.newName || f.name;
				var _type = f.newType || getContentType(_name) || f.type;

				itemUploadHtml = itemUploadTemplate;
				id = 'upload-' + lastUploadIndex;
				itemUploadHtml = itemUploadHtml.replace('<!--', '');
				itemUploadHtml = itemUploadHtml.replace('-->', '');
				itemUploadHtml = itemUploadHtml.replace('{id}', id);
				itemUploadHtml = itemUploadHtml.replace('{file-name}', truncate(_name, 20));
				if ($('.item').length > 0) {
					$('#item-1').before(itemUploadHtml);
				} else {
					$('#items').append(itemUploadHtml);
					$('#no-files').hide();
				}

				setProgress(id, 0, 'Waiting for upload.');
				url = urlPrefix + _name;
				uploadRequests[lastUploadIndex] = new XMLHttpRequest();
				uploadRequests[lastUploadIndex].open('PUT', url, true);
				uploadRequests[lastUploadIndex].onload = function () {
					uploadingFiles--;
					setProgress(this.upload['id'], 100, 'Upload completed.');
					$('#' + this.upload['id'] + ' .upload-cancel-button').text('Hide');

					if (uploadingFiles == 0) {
						list.first20Files(title.getPath(), 'up');
						enableAll();
					}

					$('.upload-button').each(function () {
						$(this).parent().html($(this).parent().html());
					});
				};
				uploadRequests[lastUploadIndex].onerror = function () {
					setProgress(this.upload['id'], 0, 'XHR error.');
				};
				uploadRequests[lastUploadIndex].upload['id'] = id;
				uploadRequests[lastUploadIndex].upload.onprogress = function (e) {
					if (e.lengthComputable) {
						var percentLoaded = Math.round((e.loaded / e.total) * 100);
						if (percentLoaded < 5) {
							setProgress(this['id'], percentLoaded, 'Upload started.');
						} else {
							setProgress(this['id'], percentLoaded, percentLoaded > 98 ? 'Finalizing.' : 'Uploading.');
						}
					}
				};

				uploadRequests[lastUploadIndex].setRequestHeader('Content-Type', _type);
				if(!isUploadAs) {
					uploadingFiles++;
				}
				uploadRequests[lastUploadIndex].send(f);
			}

			function setProgress(id, percent, statusLabel) {
				var progressColor = $('#'+id+' .progress-color')[0];
				var progressPercent = $('#'+id+' .progress-percent')[0];
				progressColor.style.width = percent + '%';
				progressPercent.textContent = percent + '%';
				$('#'+id+' .progress_bar').className = 'loading';
				$('#'+id+' .status')[0].innerText = statusLabel;
			}
		};

		$(document).on('click', '.upload-cancel-button', function () {
			uploadingFiles--;
			var itemEl = $(this).parent().parent();
			var uploadIndex = Number(itemEl.attr('id').from('upload-'));
			uploadRequests[uploadIndex].abort();
			uploadRequests[uploadIndex] = null;
			itemEl.hide();


			if (uploadingFiles == 0) {
				enableAll();
			}
		});
	},

	uploadButton = new function () {

		this.init = function () {
			var documentEl = $(document);
			documentEl.on('click', '.upload-button', function () {
				addButton.menuFiles.hide();
			});
			documentEl.on('change', '.upload-button', function (e) {
				uploads.uploadFiles(e.target.files, false);
			});
		};
	},

	uploadAsButton = new function () {
		var self = this,
			files = [];


		this.init = function () {
			var documentEl = $(document);
			documentEl.on('click', '.upload-as-button', function () {
				setTimeout(function () {
					addButton.menuFiles.hide();
					addButton.menuContainers.hide();
				}, 50);
			});
			documentEl.on('change', '.upload-as-button', self.handleFileSelect);
		};

		this.handleFileSelect = function (evt) {

			var _files = evt.target.files;

			var f, itemUploadHtml, id,
				itemUploadTemplate = $('#item-upload-as-template').html();

			for (var i = 0; i < _files.length; i++) {
				uploads.waitForUploadAs();
				id = 'upload-as-' + files.length;
				files[files.length] = _files[i];
				f = _files[i];
				itemUploadHtml = itemUploadTemplate;
				itemUploadHtml = itemUploadHtml.replace('<!--', '');
				itemUploadHtml = itemUploadHtml.replace('-->', '');
				itemUploadHtml = itemUploadHtml.replace('{id}', id);
				itemUploadHtml = itemUploadHtml.replace('{file-name}', f.name);
				itemUploadHtml = itemUploadHtml.replace('{file-type}', f.type);
				if ($('.item').length > 0) {
					$('#item-1').before(itemUploadHtml);
				} else {
					$('#items').append(itemUploadHtml);
					$('#no-files').hide();
				}
			}

		}

		$(document).on('click', '.start-upload-button', function (e) {
			var el = $(this).parent().parent();
			var id = el.attr('id');
			var index = Number(id.from('upload-as-'));
			files[index].newName = el.find('.upload-as-file-name').val();
			files[index].newType = el.find('.upload-as-file-type').val();
			uploads.uploadFiles([files[index]], true);
			el.remove();
		});

	},


	executeButton = new function () {
		var self = this;

		this.init = function () {
			$(document).on('click', '#execute-button', function () {
				setTimeout(function () {
					addButton.menuFiles.hide();
					addButton.menuContainers.hide();
				}, 50);
			});
			$(document).on('change', '#execute-button', function (evt) {
				var f = evt.target.files[0];
				_execute(f, getContentType(f.name) || f.type);
			});
		};
	},

	createTextFile = new function () {

		this.init = function () {
			$(document).on('click', '#create-text-file-button', function () {
                $('#no-files').hide();
				createTextFileDialog.show();
				addButton.menuFiles.hide();
			});
		};
	},

	logoutButton = new function () {
		this.init = function () {
			$('#logout-button').click(function () {
				editor.check(function () {
					window.location = 'index.html';
				});
			});
		};
	},

	errorMessage = new function () {
		this.init = function () {
			$('#error-msg .reload').click(function () {
				location.reload();
			});
			$('#errorMessage .reload').click(function () {
				location.reload();
			});
		};

		this.show = function (message) {
			$('#errorMessage').show();
			$('#errorMessage .error').text(message);
		};

		this.handleError = function (message) {
			errorMessage.show(message);
			enableAll();
		};
	},



	listHeaders = new function () {
		this.fix = function () {
			if ($('.item').length == 0) {return;}
			$('#list-headers-right-margin').width($('.item-icon')[0].offsetWidth);
			$('#list-name-header').width($('.item-name')[0].offsetWidth);
			$('#list-size-header').width($('.item-size')[0].offsetWidth);
			if ($('.item-modified').length) {
				$('#list-modified-header').width($('.item-modified')[0].offsetWidth);
			} else {
				$('#list-files-header').width($('.item-files')[0].offsetWidth);
			}
			$('#list-headers').show();
		};
	},


	createContainerDialog = new function () {
		this.init = function () {
			$('#create-cancel-button').click(function () {
				$('#create-container-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
			});

			$('#create-ok-button').click(function () {
				var nameEl = $('#container-name');
				var container = nameEl.val();

				if (!container) {
					nameEl.addClass('invalid-input');
					return;
				}

				if (container.length > 256) {
					nameEl.addClass('invalid-input');
					$('#container-max-length').show();
					layout.fix();
					return;
				}

				if (container.contains('/')) {
					nameEl.addClass('invalid-input');
					$('#container-slash').show();
					layout.fix();
					return;
				}



				disableAll();

				fileStorage.checkContainerExist({
					containerName: container,
					exist: function () {
						nameEl.addClass('invalid-input');
						$('#container-exists').show();
						enableAll();
					},
					notExist: function () {
						fileStorage.createContainer({
							containerName: container,
							created: function () {
								list.first20Containers('up');
								$('#create-container-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
								enableAll();
							},
							error: errorMessage.handleError
						});
					},
					error: errorMessage.handleError
				});

			});

			$(document).on('keyup', '#container-name', function (e) {
				if (e.which == 13) {
					$('#create-ok-button').click();
					return;
				}
				if (e.which == 27) {
					$('#create-cancel-button').click();
				}
				if ($(this).val().length > 0) {
					$(this).removeClass('invalid-input');
					$('#container-exists').hide();
					$('#container-max-length').hide();
					$('#container-slash').hide();
				}
			});
		};

		this.show = function () {
			toolbar.hideDialogs();
			var nameEl = $('#container-name');
			nameEl.val('');
			nameEl.removeClass('invalid-input');
			$('#container-exists').hide();
			$('#container-max-length').hide();
			$('#container-slash').hide();
			$('#create-container-dialog').show('slide', {direction:'up'}, 200, function (){
				nameEl.focus();
				layout.fix();
			});
			addButton.menuContainers.hide();
		};
	},

	sharedContainerDialog = new function () {
		this.init = function () {
			$('#shared-cancel-button').click(function () {
				$('#shared-container-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
			});

			$('#shared-ok-button').click(function () {
				var sharedAccountEl = $('#shared-account-name');
				var sharedContainerEl = $('#shared-container-name');
				if (!sharedAccountEl.val()) {
					sharedAccountEl.addClass('invalid-input');
					return;
				}
				if (!sharedContainerEl.val()) {
					sharedContainerEl.addClass('invalid-input');
					return;
				}
				var sharedPath = sharedAccountEl.val() + '/' + sharedContainerEl.val();

				var account = sharedAccountEl.val();
				var container =  sharedContainerEl.val();

				disableAll();

				fileStorage.checkContainerExist({
					account: account,
					containerName: container,
					exist: function () {
						fileStorage.addSharedContainer({
							account: account,
							container: container,
							added: function () {
								list.first20Containers('up');
								$('#shared-container-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
								enableAll();
							},
							notAuthorized: function () {
								sharedContainerEl.addClass('invalid-input');
								$('#shared-container-error').show();
								enableAll();
							},
							error: errorMessage.handleError
						});
					},
					notExist: function () {
						sharedContainerEl.addClass('invalid-input');
						$('#shared-container-error').show();
						enableAll();
					},
					error: function () {
						sharedContainerEl.addClass('invalid-input');
						$('#shared-container-error').show();
						enableAll();
					}
				})

			});

			$(document).on('keypress', '#shared-container-name', function (e) {
				if (e.which == 13) {
					$('#shared-ok-button').click();
					return;
				}
				if ($(this).val().length > 0) {
					$(this).removeClass('invalid-input');
					$('#shared-container-error').hide();
				}
			});
		};

		this.show = function () {
			var sharedAccountEl = $('#shared-container-name');
			sharedAccountEl.val('');
			sharedAccountEl.removeClass('invalid-input');
			var sharedContainerEl = $('#shared-account-name');
			sharedContainerEl.val('');
			sharedContainerEl.removeClass('invalid-input');
			$('#shared-container-error').hide();
			toolbar.hideDialogs();
			$('#shared-container-dialog').show('slide', {direction:'up'}, 200, function (){
				sharedAccountEl.focus();
				layout.fix();
			});
			addButton.menuContainers.hide();
		};
	},

	createDirectoryDialog = new function () {
		this.init = function () {
			$('#directory-cancel-button').click(function () {
				$('#create-directory-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
			});

			$('#directory-ok-button').click(function () {
				var dirEl = $('#directory-name');
				if (!dirEl.val()) {
					dirEl.addClass('invalid-input');
					return;
				}


				if (dirEl.val().contains('/')) {
					dirEl.addClass('invalid-input');
					$('#directory-slash').show();
					return;
				}

				var path = title.getPath();
				var dirPath = path;

				if (!dirPath.endsWith('/')) {
					dirPath += '/';
				}

				dirPath += dirEl.val();

				if (!dirPath.endsWith('/')) {
					dirPath += '/';
				}

				var directoryPath = dirPath.from('/');

				disableAll();

				fileStorage.checkDirectoryExist({
					path: directoryPath,
					exist: function () {
						dirEl.addClass('invalid-input');
						$('#directory-exists').show();
						enableAll();
					},
					notExist: function () {
						fileStorage.createDirectory({
							path: directoryPath,
							created: function () {
								var path = title.getPath();
								list.first20Files(path, 'down');
								$('#create-directory-dialog').hide('slide', {direction:'up'}, 200, firefox.fix);
								enableAll();
							},
							error: errorMessage.handleError
						});
					},
					error: errorMessage.handleError
				});


			});
		};

		this.show = function () {
			var nameEl = $('#directory-name');
			nameEl.val('');
			nameEl.removeClass('invalid-input');
			$('#directory-slash').hide();
			$('#directory-exists').hide();
			$('#create-directory-dialog').show('slide', {direction:'up'}, 200, function (){
				nameEl.focus();
				layout.fix();
			});
			addButton.menuFiles.hide();
		};

		$(document).on('keypress', '#directory-name', function (e) {
			if (e.which == 13) {
				$('#directory-ok-button').click();
				return;
			}
			$('#directory-slash').hide();
			$('#directory-exists').hide();
			if ($(this).val().length > 0) {
				$(this).removeClass('invalid-input');
			}
		});
	},


	createTextFileDialog = new function () {

		this.init = function () {
			$('#create-text-file-cancel-button').click(function () {
				$('#create-text-file-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
			});


			$('#create-text-file-ok-button').click(function () {

				var inputEl = $('#create-text-file-name');
				if (!inputEl.val()) {
					inputEl.addClass('invalid-input');
					return;
				}

				var _path = title.getPath() + '/' + inputEl.val();
				var _data = '';

				fileStorage.createFile({
					path: _path.from('/'),
					contentType: 'text/plain',
					created: function () {
						editor.open(_path);
						$('#create-text-file-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
						$('#file-edited').text('');
						enableAll();
					},
					error: errorMessage.handleError
				});

			});


			$(document).on('keyup', '#create-text-file-name', function (e) {
				if (e.which == 13) {
					$('#create-text-file-ok-button').click();
					return;
				}
				if (e.which == 27) {
					$('#create-text-file-cancel-button').click();
				}
				if ($(this).val().length > 0) {
					$(this).removeClass('invalid-input');
					$('#create-text-file-exists').hide();
					$('#create-text-file-max-length').hide();
					$('#create-text-file-slash').hide();
				}
			});
		};

		this.show = function () {
			var inputEl = $('#create-text-file-name');
			inputEl.val('');
			inputEl.removeClass('invalid-input');
			$('#create-text-file-dialog').show('slide', {direction:'up'}, 200, layout.fix);
			inputEl.focus();
		};
	},

	saveAsDialog = new function () {
		this.init = function () {
			$('#save-as-cancel-button').click(function () {
				$('#save-as-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
			});

			$('#save-as-ok-button').click(function () {
				var dirEl = $('#save-as-path');
				if (!dirEl.val()) {
					dirEl.addClass('invalid-input');
					return;
				}



				var _path = dirEl.val();
				var _data = $('#editor')[0].contentWindow.editor.getValue();


				disableAll();

				fileStorage.createFile({
					path: _path.from('/'),
					contentType: editor.getContentType(),
					data: _data,
					created: function () {
						editor.open(_path);
						$('#save-as-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
						$('#file-edited').text('');
						enableAll();
					},
					error: errorMessage.handleError
				});
			});
		};

		this.show = function () {
			var nameEl = $('#save-as-path');
			nameEl.val(title.getPath());
			nameEl.removeClass('invalid-input');
			$('#save-as-dialog').show('slide', {direction:'up'}, 200, function (){
				nameEl.focus();
				layout.fix();
			});
			addButton.menuFiles.hide();
		};

		$(document).on('keypress', '#save-as-path', function (e) {
			if (e.which == 13) {
				$('#save-as-ok-button').click();
				return;
			}
			if ($(this).val().length > 0) {
				$(this).removeClass('invalid-input');
			}
		});
	},

	deleteDialog = new function () {
		this.init = function () {

			$('#delete-cancel-button').click(function () {
				$('#delete-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
			});
			$('#delete-ok-button').click(function () {
				var itemPath = $('.selected-item').attr('data-path');

				disableAll();

				fileStorage._delete({
					path: itemPath.from('/'),
					deleted: function () {
						if (itemPath.count('/') == 1) {
							list.first20Containers('down');
						} else {
							var path = title.getPath();
							list.first20Files(path, 'down');
							toolbar.hideDialogs();
							toolbar.hideButtons();
						}
						$('#delete-dialog').hide('slide', {direction:'down'}, 200, layout.fix);
						enableAll();
					},
					error: errorMessage.handleError
				});
			});
		}
	},

	metadataDialog = new function () {

		var initialMetadata;

		function metadataToAdd() {
			var metadata = {};
			var metadataRows = $('#metadata-dialog tr');
			for (var i = 0; i < metadataRows.length-2; i++) {
				var key = $(metadataRows[i]).find('input:first').val();
				var val = $(metadataRows[i]).find('input:last').val();
				metadata[key] = val;
			}
			return metadata;
		};

		function metadataToRemove() {
			var metadataToRemoveList = [];
			var metadataToAddList = metadataToAdd();
			var metadataToAddKeys = Object.keys(metadataToAddList);
			for (var i = 0; i < initialMetadata.length; i++) {
				var initialKey = initialMetadata[i];
				if (metadataToAddKeys.indexOf(initialKey) == -1) {
					metadataToRemoveList.push(initialKey);
				}
			}
			return metadataToRemoveList;
		};

		function metadataRow(key, val) {
			key = key || '';
			val = val || '';
			var metadataRow = $('#metadata-row-template').html();
			metadataRow = metadataRow.replace('<!--', '');
			metadataRow = metadataRow.replace('-->', '');
			metadataRow = metadataRow.replace('{key}', htmlEscape(key));
			metadataRow = metadataRow.replace('{value}', htmlEscape(val));

			if (!key && !val) {
				metadataRow = metadataRow.replace('{attr}', 'id="new-metadata-row"');
			} else {
				metadataRow = metadataRow.replace('{attr}', '');
			}

			$('#metadata-dialog tbody').append(metadataRow);
			$('#new-metadata-row input:first').keyup(function () {
				if ($(this).val().contains(' ')) {
					$(this).addClass('invalid-input');
				} else {
					$(this).removeClass('invalid-input');
				}
			});
		}

		this.init = function () {

			$('#metadata-cancel-button').click(function () {
				$('#metadata-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
			});
			$(document).on('keyup', '#metadata-dialog input', function (e) {
				if(e.which == 9) {return;}
				var el = $(this).parent().parent().parent();
				if (el.attr('id') == 'new-metadata-row') {
					if ($('#new-metadata-row input:first').val() || $('#new-metadata-row input:last').val()) {
						$('#new-metadata-row').removeAttr('id');
						metadataRow();
					}
				} else {
					if (!el.find('input:first').val() && !el.find('input:last').val()) {
						el.remove();
					}
				}

                var key = $(this).val();

                if (key === '') {
                    $(this).addClass('invalid-input');
                } else if ($(this).hasClass('metadata-key') && countMetadataKeys(key) > 1) {
					$(this).addClass('invalid-input');
					$(this).parent().find('.metadata-exist').show();
				} else {
					$(this).parent().find('.metadata-exist').hide();
				}
			});

			function countMetadataKeys(key) {
				var count = 0;
				var keys = $('.metadata-key');
				for (var i = 0; i < keys.length; i++) {
					if ($(keys[i]).val().toLowerCase() == key.toLowerCase()) {
						count++;
					}
				}
				return count;
			}

			$('#metadata-save-button').unbind('click').click(function () {
				var itemPath = $('.selected-item').attr('data-path');

				disableAll();
				fileStorage.updateMetadata({
					account: itemPath.until('/'),
					path: itemPath.from('/'),
					metadataToAdd: metadataToAdd(),
					metadataToRemove: metadataToRemove(),
					updated: function () {
						$('#metadata-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
						enableAll();
					},
					error: errorMessage.handleError
				});
			});

			$(document).on('click', '.delete-metadata', function () {
				if ($(this).parent().find('input:first').val() != '') {
					$(this).parent().remove();
				}
			});
		};

		this.open = function () {
			toolbar.hideDialogs();
			var path = $('.selected-item').attr('data-path');

			disableAll();
			fileStorage.getMetadata({
				account: path.until('/'),
				path: path.from('/'),
				success: function (metadata) {
					initialMetadata = Object.keys(metadata);
					$('#metadata-dialog tbody').html('');
					for (var i = 0; i < initialMetadata.length; i++) {
						var key = initialMetadata[i];
						metadataRow(key, metadata[key]);
					}
					metadataRow();
					$('#metadata-dialog').show('slide', {direction:'up'}, 200);
					layout.fix();
					enableAll();
				},
				error: errorMessage.handleError
			});
		};

		this.hide = function () {
			$('#metadata-dialog').hide('slide', {direction: 'up'}, 200, layout.fix);
		};
	},

	copyDialog = new function () {
		var xCopyFrom, copiedFile, path;

		this.init = function () {
			$('#copy-cancel-button').click( function () {
				$('#copy-dialog').hide('slide', {direction: 'up'}, 200, layout.fix);
                $('#copy-name-dialog').hide();
			} );
			$('#copy-ok-button').click( function () {


				var copyTo = title.getPath().from('/');
				var name = $('#copy-change-name').text();
				copyTo = copyTo.endsWith('/') ? copyTo : copyTo + '/';

				disableAll();
				var copyArgs = {
					copyFrom: xCopyFrom,
					copyTo: copyTo,
					copiedFile: copiedFile,
					copied: function () {
						var path = title.getPath();
						list.first20Files(path, 'up');
						$('#copy-dialog').hide('slide', {direction: 'up'}, 200, layout.fix);
                        $('#copy-name-dialog').hide();
						enableAll();
					},
					error: errorMessage.handleError
				};

				if (account.accountName != path.until('/')) {
					copyArgs['copyFromAccount'] = account.accountName;
				}
				fileStorage.copy(copyArgs);

			} );
			$('#copy-change-name').click( function () {
				$('#copy-name-dialog').show('slide', {direction:'up'}, 200, layout.fix);
				var name = $('#copy-change-name').text();
				if (name == 'Change Name') {
					name = $('#file-to-copy').text().fromLast('/');
				}
				$('#copy-name').val(name);
				$('#copy-name').focus();
			} );
			$('#copy-name-cancel-button').click( function () {
				$('#copy-name-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
			});
			$('#copy-name-ok-button').click( function () {
				copiedFile = $('#copy-name').val();
				$('#copy-change-name').text(copiedFile);
				$('#same-directory-label').hide();
				$('#copy-ok-button').show();
				$('#copy-name-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
			});
		};

		this.open = function () {
			path = $('.selected-item').attr('data-path');
			xCopyFrom = path.from('/');
			if (account.accountName != path.until('/')) {
				xCopyFrom = path;
			}
			copiedFile = xCopyFrom.endsWith('/') ? xCopyFrom.untilLast('/').fromLast('/')+'/' : xCopyFrom.fromLast('/');
			$('#file-to-copy').text(xCopyFrom);
			$('#copy-ok-button').hide();
			$('#same-directory-label').show();
			$('#copy-change-name').text('Change Name');
			$('#copy-name-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
			$('#copy-dialog').show('slide', {direction:'up'}, 200, layout.fix);
		};
	},

	rightsDialog = new function () {
		this.init = function () {
			$('#rights-cancel-button').click(function () {
				$('#rights-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
			});

			$('#rights-save-button').click(function () {
				var itemPath = $('.selected-item').attr('data-path');

				disableAll();
				fileStorage.updateRights({
					path: itemPath.from('/'),
					readRights: $('#read-rights').val(),
					writeRights: $('#write-rights').val(),
					updated: function () {
						$('#rights-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
						enableAll();
					},
					error: errorMessage.handleError
				});
			});


			$(document).on('keyup', '#read-rights', function (e) {
				if (e.which == 13) {
					$('#write-rights').focus();
					return;
				}
			});

			$(document).on('keyup', '#write-rights', function (e) {
				if (e.which == 13) {
					$('#rights-save-button').click();
					return;
				}
			});
		};
	},

	executeDialog = new function () {
		var self = this,
			reportParts = {};

		this.init = function () {

			$('#execute-close-button').click(function () {
				self.hide();
			});

			$('#execute-full-button').click(function () {
				self.full();
			});
		};

		this.show = function (_reportParts) {
			self.clear();
			reportParts = _reportParts;
			$('#execute-dialog').show('slide', {direction:'up'}, 200, layout.fix);
			if (reportParts['status']) {
				$('#execute-status-val').text(reportParts['status']);
			} else {
				$('#execute-status-tr').hide();
			}
			if (reportParts['error']) {
				$('#execute-error-val').text(reportParts['error']);
			} else {
				$('#execute-error-tr').hide();
			}
		};

		this.hide = function () {
			$('#execute-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
		};

		this.full = function () {
			$('#execute-full-button').hide();
			var partsKeys = Object.keys(reportParts);
			for (var i = 0; i < partsKeys.length; i++) {
				if (partsKeys[i] != 'status' && partsKeys != 'error') {
					self.append(partsKeys[i], reportParts[partsKeys[i]]);
				}
			}

			layout.fix();
		};

		this.append = function (k, v) {
			$('#execute-tbody').append('<tr class="execute-report-row"><td class="execute-report-part-name">'+k+'</td><td>'+v+'</td></tr>');
			layout.fix();
		};

		this.clear = function () {
			$('#execute-full-button').show();
			$('#execute-status-val').text('');
			$('#execute-error-val').text('');
			$('.execute-report-row').remove();
		};
	},


	firefox = new function () {
		this.fix = function () {
			if (navigator.userAgent.indexOf('Firefox') != -1) {
				$('#scrollable').css('margin-top', $('#header').height());
				$('#editor').css('margin-top', $('#header').height());
			}
		};
	},

	layout = new function () {

		var self = this;

		this.init = function () {
			$(window).resize(function () {
				self.fix();
			});
		};

		this.fix = function () {
			listHeaders.fix();
			firefox.fix();
		};
	},

	account = new function () {

		this.accountName = null;
		this.xStorageUrl = null;

		var self = this;

		this.init = function () {
			self.accountName = fileStorage.getAccountId();
			self.xStorageUrl = fileStorage.getStorageUrl();

			if (!self.accountName) {
				self.loginRedirect();
				return false;
			}

			if (self.accountName == 'logout') {
				$('body').html('');
				window.location = 'logout.html';
				return false;
			}

			return true;
		};

		this.loginRedirect = function () {
			window.location = 'index.html';
		};

		function getAccount() {
			var accountQueryUrlExist = querystring('account').length;
			return accountQueryUrlExist ? querystring('account')[0] : null;
		}
	},


	list = new function () {

		var containersInList = 0;
		var filesInList = 0;
		var dirFile = 0;
		var self = this;

		this.init = function () {
			$(document).on('click touchstart', '.item', function (e) {
				if ($(this).hasClass('selected-item')) {
					$(this).dblclick();
					return;
				}
				$('.selected-item').addClass('unselected-item');
				$('.selected-item').removeClass('selected-item');
				$(this).addClass('selected-item');
				$(this).removeClass('unselected-item');
				toolbar.show();
				toolbar.hideDialogs();
				toolbar.hideButtons();
				addButton.menuFiles.hide();
				addButton.menuContainers.hide();
				$('#toolbar-metadata-button').show();
				var path = $(this).attr('data-path');

				if (path.count('/') > 1) { // Files

					if (path.endsWith('/')) {
						$('#toolbar-open-button').show();


						var containerName = list.containerFromPath(path);
						var prefix = path.from('/').from('/');

						if(path.until('/') == account.accountName) {

							disableAll();
							fileStorage.checkDirectoryHasFiles({
								containerName: containerName,
								prefix: prefix,
								hasFiles: function () {
									$('#toolbar-delete-button').hide();
									enableAll();
								},
								hasNotFiles: function () {
									$('#toolbar-delete-button').show();
									$('#toolbar-copy-button').show();
									enableAll();
								},
								error: errorMessage.handleError
							});
						}

					} else {
						$('#toolbar-type-button').show();
						$('#toolbar-download-button').parent().attr('href', account.xStorageUrl + path);
						$('#toolbar-download-button').parent().attr('download', path.fromLast('/'));
						$('#toolbar-download-button').show();
						$('#toolbar-copy-button').show();

						if (account.accountName == path.until('/')) {
							$('#toolbar-delete-button').show();

							if ($(this).attr('data-editable') == 'true') {
								$('#toolbar-edit-button').show();
							}
						}

						//if ($(this).attr('data-type') == 'application/x-nexe') {
							$('#toolbar-open-button').show();
						//}

						if ($(this).attr('data-type') == 'application/json') {
							$('#toolbar-execute-button').show();
							$('#toolbar-board-button').show();
						}
					}


				} else { // Container

					$('#toolbar-open-button').show();
					if (account.accountName == path.until('/')) {
						$('#toolbar-rights-button').show();
						if ($(this).attr('data-deletable') == 'true') {
							$('#toolbar-delete-button').show();
						}
					} else {
						$('#toolbar-remove-button').show();
					}
				}

				var index = Number($(this).attr('id').from('-'));
				var isLast = index == $('.item').length;
				if (isLast) {
					$('#scrollable')[0].scrollTop = $('#scrollable')[0].scrollHeight;
				}
			});
			$(document).on('contextmenu', '.item', function (e) {
				$(this).click();
				return false;
			});
			$(document).on('contextmenu', '#toolbar', function (e) {
				return false;
			});
			$(document).on('dblclick', '.enabled .item', function (e) {
				var path = $(this).attr('data-path');
				if ($('#search-div').is(':visible')) {
					$('#search-div input').val('');
					$('#search-div input').blur();
					$('#search-div').hide();
				}

				if (path.count('/') > 1 && !path.endsWith('/')) {

					var editable = $(this).attr('data-editable');

					if (editable == 'true') {
						editor.open(path);
						toolbar.hideDialogs();
						toolbar.hide();
					} else {
						//window.open(account.xStorageUrl + path, '_blank');
						$('#toolbar-download-button').click();
					}

				} else {
					self.first20Files(path, 'right');
					toolbar.hideDialogs();
					toolbar.hide();
				}
			});
			$(document).on('click', '#no-containers .create', function () {
				$('#create-container-button').click();
			});


			$('#search-div input').keyup(self._search);

			$('#clear-search').click(function () {
				$('#search-div input').val('');
				self._search();
			});
		};

		this.up = function () {
			var path = prevPath(title.getPath());
			if (self.isContainersList(path)) {
				self.first20Containers('left');
			} else {
				self.first20Files(path, 'left');
			}
		};

		this.list = function (path) {
			if (self.isContainersList(path)) {
				self.first20Containers('up');
			} else {
				self.first20Files(path, 'up');
			}
		};

		this.first20Containers = function (direction) {
			saveAsButton.hide();
			$('#save-as-dialog').hide();
			addButton.menuFiles.hide();
			addButton.menuContainers.hide();
			$('#new-tab-button').hide();
			$('#copy-ok-button').hide();
			$('#copy-containers-label').show();
			$('#same-directory-label').hide();
			$('#copy-editor-label').hide();
			$('#search-div input').attr('placeholder', 'Search containers');

			disableAll();
			title.update(fileStorage.getAccountId());

			disableAll();
			fileStorage.listContainers({
				success: function (containers, sharedContainers) {
					handleResponse(containers, sharedContainers);
					enableAll();
				},
				error: errorMessage.handleError
			});

			function handleResponse(containers, sharedContainers) {
				listMode();
				backButton.disable();
				containersInList = 0;

				var shContainersResult = [];
				sharedContainersSize(0);
				function callback() {

					if (direction) {
						var oDirection = direction == 'left' ? 'right' : direction;
						$('#list').hide('slide', {direction: oDirection}, 200, function () {
							beforeShow();
							$('#list').show('slide', {direction: direction}, 200, function () {
								layout.fix();
								if ($('.item').length > 0 && $('.item')[0].offsetHeight * 20 < $('#content')[0].offsetHeight) {
									var marker = $('.item:last').attr('data-marker') || null;
									self.moreContainers(marker);
								}
							});
						});
					} else {
						$('#list').hide();
						beforeShow();
						$('#list').show(0, function () {
							layout.fix();
							if ($('.item').length > 0 && $('.item')[0].offsetHeight * 20 < $('#content')[0].offsetHeight) {
								var marker = $('.item:last').attr('data-marker') || null;
								self.moreContainers(marker);
							}
						});
					}

					function beforeShow() {
						for (var j = 0; j < shContainersResult.length; j++) {
							containers.splice(0,0,shContainersResult[j]);
						}

						if (containers.length == 0) {
							$('#no-containers').show();
							$('#items').html('');
							$('#list-headers').hide();
							layout.fix();
							return;
						}
						$('#no-containers').hide();
						$('#no-containers-found').hide();
						$('#no-files').hide();
						$('#no-files-found').hide();

						var items = containersToItems(containers);
						var html = itemsHtml(items);
						$('#items').html(html);
						$('#list-modified-header').hide();
						$('#list-files-header').show();
						$('.item-files').show();
						$('.item-modified').hide();
					}
				}
				function sharedContainersSize(i) {
					if (!sharedContainers || i == sharedContainers.length) {
						callback();
						return;
					}
                    var container = sharedContainers[i].from('/');

					disableAll();
					fileStorage.getContainerSize({
						account: sharedContainers[i].until('/'),
						containerName: container,
						success: function (bytes, count) {
							var c = {
								name: sharedContainers[i],
								account: sharedContainers[i].until('/'),
								count: count,
								bytes: bytes,
								icon: 'img/shared-box32.png'
							};
							shContainersResult.push(c);
							sharedContainersSize(i+1);
							enableAll();
						},
						error: function (message) {
							errorMessage.show('Cannot load shared container "' + container + '": ' + message);
							sharedContainersSize(i+1);
							enableAll();
						}
					});
				}
			}
		};

		this.moreContainers = function (marker) {
			disableAll();
			fileStorage.containersAfterMarker({
				marker: marker,
				success: function (containers) {

					if (containers.length == 0) {
						enableAll();
						return;
					}

					var items = containersToItems(containers);
					var html = itemsHtml(items);
					$('#items').append(html);
					$('.item-modified').hide();

					layout.fix();
					enableAll();
				},
				error: errorMessage.handleError
			});
		};

		this.searchContainers = function (q) {

			if (q == '') {
				self.first20Containers();
				return;
			}

			var allContainers = [];

			disableAll();
			fileStorage.checkContainerExist({
				containerName: q,
				exist: function (xhr) {
					var container = {
						name: q,
						count: xhr.getResponseHeader('X-Container-Object-Count'),
						bytes: xhr.getResponseHeader('X-Container-Bytes-Used')
					};
					allContainers.push(container);
					search();
					enableAll();
				},
				notExist: function () {
					search();
					enableAll();
				},
				error: errorMessage.handleError
			});

			function search() {
				fileStorage.containersAfterMarker({
					marker: q,
					success: function (containers) {

						allContainers = allContainers.concat(containers);
						containersInList = 0;
						var items = containersToItems(allContainers, q);
						if (items.length == 0) {
							$('#no-containers-found').show();
							$('#items').html('');
							$('#list-headers').hide();
							layout.fix();
							return;
						}
						$('#no-containers-found').hide();
						var html = itemsHtml(items);
						$('#items').html(html);
						$('.item-modified').hide();

						layout.fix();

						enableAll();
					},
					error: errorMessage.handleError
				});
			}
		};

		this.first20Files = function (path, direction) {
			saveAsButton.hide();
			$('#save-as-dialog').hide();
			addButton.menuFiles.hide();
			addButton.menuContainers.hide();
			$('#new-tab-button').hide();
			$('#copy-ok-button').show();
			$('#copy-editor-label').hide();
			$('#copy-containers-label').hide();
			$('#same-directory-label').hide();
			if (path.count('/') == 1) {
				$('#search-div input').attr('placeholder', 'Search in current container');
			} else {
				$('#search-div input').attr('placeholder', 'Search exact file in current directory');
			}
			listMode();
			var _account = path.until('/');
			var container = self.containerFromPath(path);
			var prefix = null;

			var listFilesArgs = {
				account: _account,
				containerName: container,
				delimiter: '/',
				success: handleResponse,
				error: errorMessage.handleError
			};

			if (path.split('/').length > 2) {
				prefix = path.from('/').from('/');
				listFilesArgs.prefix = prefix;
			}

			disableAll();
			fileStorage.listFiles(listFilesArgs);


			function handleResponse(files) {


				dirFile = 0;
				if ((/*markerFiles ||*/ prefix) && (files.length > 0 && files[0]['content_type'] == "application/directory")) {
					dirFile = 1;
				}
				backButton.enable();
				title.update(path);

				filesInList = 0;
				if (files.length == 0 || (files.length == 1 && dirFile == 1)) {
					$('#no-files').show();
					$('#items').html('');
					$('#list-headers').hide();
					layout.fix();
					enableAll();
					return;
				}


				if (direction) {
					var oDirection = direction == 'left' ? 'right' : 'left';
					$('#list').hide('slide', {direction: oDirection}, 200, function () {
						beforeShow();
						$('#list').show('slide', {direction: direction}, 200, afterShow);
					});
				} else {
					$('#list').hide(0, function () {
						beforeShow();
						$('#list').show('highlight', 0, afterShow);
					});
				}

				function beforeShow() {
					$('#no-containers').hide();
					$('#no-containers-found').hide();
					$('#no-files').hide();
					$('#no-files-found').hide();
					var items = filesToItems(files, path);
					var html = itemsHtml(items);
					$('#items').html(html);
					$('#list-modified-header').show();
					$('#list-files-header').hide();
					$('.item-files').hide();
					$('.item-modified').show();
				}

				function afterShow() {
					layout.fix();
					if ($('.item')[0].offsetHeight * 20 < $('#content')[0].offsetHeight) {
						var marker = $('.item:last').attr('data-marker') || null;
						self.moreFiles(path, marker);
					}
					enableAll();
				}
			}

			function getAccountEmail(xhr) {
				var userData = xhr.getResponseHeader('X-Account-Meta-Userdata');
				return userData ? JSON.parse(userData)['email'] : null;
			}
		};

		this.moreFiles = function (path, markerFiles) {
			var _account = path.until('/');
			var container = self.containerFromPath(path);
			var prefix = path.endsWith('/') ? path.from('/').from('/') : null;

			disableAll();
			var filesArgs = {
				account:_account,
				containerName: container,
				delimiter: '/',
				marker: markerFiles,
				success: handleResponse,
				error: errorMessage.handleError
			};

			if (prefix) {
				filesArgs.prefix = prefix;
			}


			fileStorage.filesAfterMarker(filesArgs);

			function handleResponse(files) {

				if (files.length == 0) {
					enableAll();
					return;
				}

				dirFile = 0;
				if (files[0]['content_type'] == "application/directory") {
					dirFile = 1;
					if (files.length == 1) {
						enableAll();
						return;
					}
				}

				var items = filesToItems(files, path);
				var html = itemsHtml(items);

				$('#items').append(html);

				setTimeout(layout.fix, 50);
				$('.item-files').hide();
				if ($('.item')[0].offsetHeight * $('.item').length < $('#content')[0].offsetHeight) {
					var marker = $('.item:last').attr('data-marker') || null;
					self.moreFiles(path, marker);
				}

				enableAll();
			}
		};

		this.searchFiles = function (path, q) {
			var container = self.containerFromPath(path);
			var prefix = path.endsWith('/') ? path.from('/').from('/') : null;
			var _file;
			var pathSlash = path.endsWith('/') ? path : path + '/';

			disableAll();
			fileStorage.checkFileExist({
				path: pathSlash.from('/') + q,
				exist: function (xhr) {
					_file = {
						name: q,
						bytes: xhr.getResponseHeader('X-Object-Bytes-Used'),
						'last_modified': xhr.getResponseHeader('Last-Modified'),
						'content_type': xhr.getResponseHeader('Content-Type')
					};

					var args = {
						containerName: container,
						delimiter: '/',
						marker: q,
						success: function (files) {
							handleResponse(files);
							enableAll();
						},
						error: function () {
							enableAll();
						}
					};

					if (prefix) {
						args.prefix = prefix;
					}

					fileStorage.filesAfterMarker(args);
				},
				notExist: function () {

					var args = {
						containerName: container,
						delimiter: '/',
						marker: q,
						success: function (files) {
							handleResponse(files);
							enableAll();
						},
						error: function () {
							enableAll();
						}
					};

					if (prefix) {
						args.prefix = prefix;
					}
					fileStorage.filesAfterMarker(args);
				},
				error: function () {

				}
			});

			function handleResponse(files, responseStatus, xhr) {

				if (files.length == 0) {return;}

				filesInList = 0;
				dirFile = 0;
				/*if (files[0]['content_type'] == "application/directory") {
				 dirFile = 1;
				 if (files.length == 1) {return;}
				 }*/

				if (_file) {
					files.splice(0,0, _file);
				}

				var items = filesToItems(files, path, q);
				if (items.length == 0) {
					$('#no-files-found').show();
					$('#items').html('');
					$('#list-headers').hide();
					layout.fix();
					return;
				}
				$('#no-files-found').hide();
				var html = itemsHtml(items);

				$('#items').html(html);

				layout.fix();
				$('.item-files').hide();

			}
		};

		this._search = function (e) {
			if ($('#search-div').is(':hidden')) { return; }

			var searchInputEl = $('#search-div input');
			var clearSearchEl = $('#clear-search');
			var path = title.getPath();

			if (e && e.which == 13) {
				// Enter
				searchInputEl.blur();
				return;
			}

			if (e && e.which == 27) {
				// Esc
				searchInputEl.val('');
			}

			if (searchInputEl.val() == '') {
				clearSearchEl.hide();
				if (self.isContainersList(path)) {
					self.first20Containers('up');
				} else {
					self.first20Files(path,'up');
				}
				return;
			}

			clearSearchEl.show();

			if (self.isContainersList(path)) {
				self.searchContainers(searchInputEl.val());
			} else {
				self.searchFiles(path, searchInputEl.val());
			}
		};

		function itemsHtml(items) {
			var html = '';
			var itemTemplate = $('#item-template').html();
			var itemHtml;

			for (var i = 0; i < items.length; i++) {
				itemHtml = itemTemplate;
				itemHtml = itemHtml.replace('<!--', '');
				itemHtml = itemHtml.replace('-->', '');
				itemHtml = itemHtml.replace('{id}', items[i]['id']);
				itemHtml = itemHtml.replace('{path}', items[i]['path']);
				itemHtml = itemHtml.replace('{icon}', items[i]['icon']);
				itemHtml = itemHtml.replace('{name}', items[i]['name']);
				itemHtml = itemHtml.replace('{title}', items[i]['title']);
				itemHtml = itemHtml.replace('{size}', items[i]['size']);
				if (items[i]['type'] != undefined) {
					itemHtml = itemHtml.replace('{type}', items[i]['type']);
				}
				if (items[i]['files'] != undefined) {
					itemHtml = itemHtml.replace('{files}', items[i]['files']);
				}
				if (items[i]['modified'] != undefined) {
					itemHtml = itemHtml.replace('{modified}', items[i]['modified']);
				}
				if (items[i]['deletable'] != undefined) {
					itemHtml = itemHtml.replace('{deletable}', items[i]['deletable']);
				}
				if (items[i]['editable'] != undefined) {
					itemHtml = itemHtml.replace('{editable}', items[i]['editable']);
				}
				if (items[i]['marker'] != undefined) {
					itemHtml = itemHtml.replace('{marker}', items[i]['marker']);
				}
				html += itemHtml;
			}

			return html;
		}

		function makeUrl(opts) {
			var url = account.xStorageUrl;

			if (opts && opts['account']) {
				url = url + opts['account'];
			} else {
				url = url + account.accountName;
			}

			if (opts && opts['container']) {
				url += '/' + opts['container'];
			}

			url += '?format=json&limit=20';

			if (opts && opts['delimiter']) {
				url += '&delimiter=/';
			}

			if (opts && opts['prefix']) {
				url += '&prefix=' + encodeURIComponent(opts['prefix']);
			}

			if (opts && opts['marker']) {
				url += '&marker=' + encodeURIComponent(opts['marker']);
			}

			return url;
		}

		function bytesToSize(bytes, precision) {
			var kilobyte = 1024;
			var megabyte = kilobyte * 1024;
			var gigabyte = megabyte * 1024;
			var terabyte = gigabyte * 1024;

			if ((bytes >= 0) && (bytes < kilobyte)) {
				return bytes + ' B';

			} else if ((bytes >= kilobyte) && (bytes < megabyte)) {
				return (bytes / kilobyte).toFixed(precision) + ' KB';

			} else if ((bytes >= megabyte) && (bytes < gigabyte)) {
				return (bytes / megabyte).toFixed(precision) + ' MB';

			} else if ((bytes >= gigabyte) && (bytes < terabyte)) {
				return (bytes / gigabyte).toFixed(precision) + ' GB';

			} else if (bytes >= terabyte) {
				return (bytes / terabyte).toFixed(precision) + ' TB';

			} else {
				return bytes + ' B';
			}
		}

		function containersToItems(containers, q) {
			var items = [];
			for (var i = 0; i < containers.length; i++) {
				if (q && !containers[i]['name'].toLowerCase().startsWith(q.toLowerCase())) { break; }
				var name = containers[i]['name'],
					shortName = shortifyContainerName(htmlEscape(name));

				items[i] = {};
				items[i]['icon'] = containers[i]['icon'] || 'img/box32.png';
				items[i]['title'] = shortName == name ? '' : name;
				items[i]['marker'] = name;
				items[i]['name'] = shortName;
				items[i]['size'] = bytesToSize(containers[i]['bytes']);
				items[i]['files'] = containers[i].count;
				items[i]['deletable'] = Number(containers[i].count) == 0;
				items[i]['path'] = containers[i].name.count('/') > 0 ? containers[i].name : account.accountName + '/' + containers[i].name;
				items[i]['id'] = 'item-'+ ++containersInList;
			}
			return items;
		}

		function filesToItems(files, path, q) {

			var items = [];
			for (var i = dirFile; i < files.length; i++) {

				var marker = files[i]['name'] || files[i]['subdir'];
				if (q && !marker.toLowerCase().startsWith(q.toLowerCase())) { break; }
				var name = marker;
				var modified = '';
				var size = '';
				var editable = false;
				var icon = '';

				if (isDir(name)) {
					if (name.untilLast('/').contains('/')) {
						name =  name.untilLast('/').fromLast('/') + '/';
					}
					icon = 'img/folder32.png';
				} else {
					name =  name.fromLast('/');
					modified = prettyDate(files[i]['last_modified']) || (new Date(files[i]['last_modified']).toDateString());
					size = bytesToSize(files[i]['bytes']);
					var contentType = files[i]['content_type'];
					editable = isEditable(contentType, files[i]['bytes']);


					contentType = contentType.until(';');

					if (contentType.startsWith('audio')) {
						icon = 'img/file32_music.png';
					} else if (contentType == 'application/pdf') {
						icon = 'img/file32_pdf.png';
					} else if (contentType.startsWith('image')) {
						icon = 'img/file32_picture.png';
					} else if (contentType.startsWith('video')) {
						icon = 'img/file32_video.png';
					} else if (contentType == 'application/msword' || contentType == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
						icon = 'img/file32_doc.png';
					} else if (contentType == 'application/vnd.ms-excel' || contentType == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
						icon = 'img/file32_xsl.png';
					} else if (contentType == 'application/vnd.ms-powerpoint' || contentType == 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
						icon = 'img/file32_ppt.png';
					} else if (contentType == 'text/html' || contentType.toLowerCase().contains('xml')) {
						icon = 'img/file32_xml.png';
					} else if (contentType == 'text/x-python') {
						icon = 'img/file32_py.png';
					} else if (contentType == 'text/x-lua') {
						icon = 'img/file32_lua.png';
					} else if (contentType == 'application/x-tar' || contentType == 'application/zip' || contentType == 'application/gzip' || contentType == 'application/x-rar' || contentType == 'application/x-rar-compressed') {
						icon = 'img/file32_zip.png';
					} else if (contentType == 'text/plain') {
						icon = 'img/file32_txt.png';
					} else if (contentType == 'text/csv') {
						icon = 'img/file32_csv.png';
					} else if (contentType == 'application/json') {
						icon = 'img/file32_json.png';
					} else if (contentType == 'application/x-nexe') {
						icon = 'img/file32_nexe.png';
					} else if (contentType == 'text/x-csrc' || contentType == 'text/x-chdr') {
						icon = 'img/file32_c.png';
					} else {
						icon = 'img/file32.png';
					}
				}

				var shortName = truncate(htmlEscape(name));

				var item = {};
				item['icon'] = icon;
				item['title'] = shortName == name ? '' : name;
				item['marker'] = marker;
				item['path'] = name.startsWith('/') || path.endsWith('/') ? path + name : path + '/' + name;
				item['name'] = shortName;
				item['type'] = contentType;
				item['size'] = size || '&nbsp;&nbsp;&nbsp;&nbsp;';
				item['modified'] = modified || '&nbsp;&nbsp;&nbsp;&nbsp;';
				item['editable'] = editable;
				item['id'] = 'item-'+ ++filesInList;
				items.push(item);
			}
			return items;
		}

		this.containerFromPath = function (path) {
			path = path.slice(path.indexOf('/') + 1);
			if (path.contains('/')) {
				path = path.slice(0, path.indexOf('/'));
			}
			return path;
		}

		function nextPath(prevPath, name) {

			if (self.isContainersList(prevPath)) {
				return prevPath + '/' + name;
			}

			if (isDir(name)) {
				name =  name.untilLast('/').fromLast('/') + '/';
			} else {
				name =  name.fromLast('/');
			}

			var path = '';
			if (prevPath.endsWith('/')) {
				path = prevPath + name;
			} else {
				path = prevPath + '/' + name;
			}
			return path;
		}
		function isDir(s) {
			return s.endsWith('/');
		}



		function prettyDate(time) {
			var diff = ((new Date()).getTime() - (new Date(time)).getTime()) / 1000,
				day_diff = Math.floor(diff / 86400);

			if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
				return;

			return day_diff == 0 && (
				diff < 60 && "just now" ||
					diff < 120 && "1 minute ago" ||
					diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
					diff < 7200 && "1 hour ago" ||
					diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
				day_diff == 1 && "Yesterday" ||
				day_diff < 7 && day_diff + " days ago" ||
				day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
		}

		this.isContainersList = function (path) {
			return path.count('/') == 0;
		}

		function listMode() {
			$($('#editor')[0]).unbind('load');
			$('#editor')[0].src = "about:blank";
			$('#editor').hide();
			$('#file-edited').text('');
			$('#save-button').hide();
			$('#add-button').show();
			$('#scrollable').addClass('scrollable');

			$('#scrollable').unbind('scroll').scroll(function () {
				if (this.scrollTop > 100 ||  $('#search-div input').val().length > 0) {
					$('#search-div').show();
					layout.fix();
					if ( $('#search-div input').val().length > 0) {
						return;
					}
				} else if (this.scrollTop < 10) {
					$('#search-div').hide();
					layout.fix();
				}

				if (this.scrollHeight - this.offsetHeight == this.scrollTop) {
					var path = title.getPath();
					var marker = $('.item:last').attr('data-marker') || null;
					if (self.isContainersList(path)) {
						self.moreContainers(marker);
					} else {
						self.moreFiles(path, marker);
					}
				}
			});
		}

	},

	search = new function () {

		this.hide = function () {
			var searchDivEl = $('#search-div');
			if (searchDivEl.is(':visible')) {
				searchDivEl.find('input').val('');
				searchDivEl.find('input').blur();
				searchDivEl.hide();
			}
		};
	},

	toolbar = new function () {
		var self = this;

		this.init = function () {
			self.openButton.init();
			self.editButton.init();
			self.deleteButton.init();
			self.metadataButton.init();
			self.copyButton.init();
			self.rightsButton.init();
			self.removeButton.init();
			self.typeButton.init();
			self.executeButton.init();
			self.boardButton.init();
		};
		this.hideButtons = function() {
			$('#toolbar-execute-button').hide();
			$('#toolbar-open-button').hide();
			$('#toolbar-download-button').hide();
			$('#toolbar-edit-button').hide();
			$('#toolbar-delete-button').hide();
			$('#toolbar-copy-button').hide();
			$('#toolbar-metadata-button').hide();
			$('#toolbar-rights-button').hide();
			$('#toolbar-remove-button').hide();
			$('#toolbar-type-button').hide();
			$('#toolbar-board-button').hide();
		};
		this.hideDialogs = function() {
			$('#create-container-dialog').hide();
			$('#create-directory-dialog').hide();
			$('#delete-dialog').hide();
			$('#upload-file-dialog').hide();
			$('#rights-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
			$('#file-type-dialog').hide('slide', {direction:'up'}, 200, layout.fix);
			$('#create-text-file-dialog').hide();
			$('#save-as-dialog').hide();
			$('#shared-container-dialog').hide();
			layout.fix();
			metadataDialog.hide();
		};
		this.show = function () {
			$('#toolbar').parent().parent().remove();
			var html = $('#toolbar-template').html();
			html = html.replace('<!--', '');
			html = html.replace('-->', '');
			$('.selected-item').after(html);
			$('#toolbar').show('slide', {direction:'up'}, 200, layout.fix);
		};
		this.hide = function () {
			$('#toolbar').parent().parent().remove();
			layout.fix();
		};

		this.executeButton = new function () {
			this.init = function () {
				$(document).on('click', '.enabled #toolbar-execute-button', function () {
					var path = $('.selected-item').attr('data-path');

					timerDialog.start();

					disableAll();
					fileStorage.getFile({
						account: path.until('/'),
						path: path.from('/'),
						success: function (data) {
							title.update(path);
							var contentType = $('.selected-item').attr('data-type');
							_execute(data, contentType);
							enableAll();
						},
						error: errorMessage.handleError
					});

					toolbar.hideDialogs();
				});
			};
		};

		this.openButton = new function () {
			this.init = function () {
				$(document).on('click', '.enabled #toolbar-open-button', function () {
					if ($('#search-div').is(':visible')) {
						$('#search-div input').val('');
						$('#search-div input').blur();
						$('#search-div').hide();
					}
					var path = $('.selected-item').attr('data-path');
					if (path.count('/') > 1 && !path.endsWith('/')) {

						$('#copy-ok-button').hide();
						$('#copy-editor-label').show();

						toolbar.hide();
						title.update(path);

						$('#editor').attr('src', fileStorage.getStorageUrl().untilLast('/').untilLast('/') + '/open/' + account.accountName + '/' +path.from('/'));

						$('#add-button').hide();
						$('#new-tab-button').show();

						$($('#editor')[0]).unbind('load').load(function () {

							title.update(path);
							$('#scrollable').unbind('scroll');
							$('#scrollable').removeClass('scrollable');
							$('.item').remove();
							$('#list-headers').hide();
							$('#editor').show();
							layout.fix();
						});

					} else {
						list.first20Files(path, 'right');
					}

					toolbar.hideDialogs();
				});
			};
		};

		this.editButton = new function () {
			this.init = function () {
				$(document).on('click', '.enabled #toolbar-edit-button', function () {
					editor.open($('.selected-item').attr('data-path'));
				});
			};
		};

		this.deleteButton = new function () {
			this.init = function () {
				$(document).on('click', '.enabled #toolbar-delete-button', function () {
					toolbar.hideDialogs();
					$('#delete-dialog').show('slide', {direction:'up'}, 200, function () {
						layout.fix();
					});
				});
			};
		};

		this.metadataButton = new function () {
			this.init = function () {
				$(document).on('click', '.enabled #toolbar-metadata-button', metadataDialog.open);
			};
		};

		this.copyButton = new function () {
			this.init = function () {
				$(document).on('click', '.enabled #toolbar-copy-button', copyDialog.open);
			};
		};

		this.rightsButton = new function () {
			this.init = function () {
				$(document).on('click', '.enabled #toolbar-rights-button', function () {
					toolbar.hideDialogs();
					var path = $('.selected-item').attr('data-path');

					disableAll();
					fileStorage.getRights({
						path: path.from('/'),
						success: function (read, write) {
							$('#read-rights').val(read);
							$('#write-rights').val(write);
							$('#rights-dialog').show('slide', {direction:'up'}, 200, layout.fix);
							enableAll();
						},
						error: errorMessage.handleError
					});

				});
			};
		};

		this.removeButton = new function () {
			this.init = function () {
				$(document).on('click', '.enabled #toolbar-remove-button', function () {
					var path = $('.selected-item').attr('data-path');

					disableAll();

					fileStorage.removeSharedContainer({
						account: path.until('/'),
						container: path.from('/'),
						removed: function () {
							toolbar.hideDialogs();
							list.first20Containers('up');
							enableAll();
						},
						error: errorMessage.handleError
					});
				});
			};
		};

		this.typeButton = new function () {
			this.init = function () {
				$(document).on('click', '.enabled #toolbar-type-button', function () {
					fileTypeDialog.show();
				});
			}
		};

		this.boardButton = new function () {
			this.init = function () {
				$(document).on('click', '.enabled #toolbar-board-button', function () {
					board.open($('.selected-item').attr('data-path'));
				});
			}
		};
	},

	editor = new function () {
		var afterSaveCallback = function () {};
		var _contentType;

		this.getContentType = function () {
			return _contentType;
		};

		this.init = function () {
		};

		this.open = function (path) {
			afterSaveCallback = function () {};
			$('#save-button').unbind('click').click(function () {

				var data = $('#editor')[0].contentWindow.editor.getValue(),
					path = title.getPath();

				disableAll();
				fileStorage.createFile({
					path: path.from('/'),
					contentType: _contentType,
					data: data,
					created: function () {
						$('#save-button').hide();
						$('#file-edited').text('');
						afterSaveCallback();
						enableAll();
					},
					error: errorMessage.handleError
				});

			});

			fileStorage.getFile({
				account: path.until('/'),
				path: path.from('/'),
				success: function (data, xhr) {
					handleResponse(data, xhr)
					enableAll();
				},
				error: errorMessage.handleError
			});

			function handleResponse(data, xhr) {
				if ($('#search-div').is(':visible')) {
					$('#search-div input').val('');
					$('#search-div input').blur();
					$('#search-div').hide();
				}
				$('#copy-ok-button').hide();
				$('#copy-editor-label').show();
				$('#new-tab-button').hide();
				saveAsButton.show();

				toolbar.hide();
				title.update(path);

				$($('#editor')[0]).unbind('load').load(function () {
					toolbar.hideDialogs();
					$('#scrollable').unbind('scroll');
					$('#scrollable').removeClass('scrollable');
					$('.item').remove();
					$('#add-button').hide();
					$('#list-headers').hide();
					$('#editor').show();
					layout.fix();
					$('#editor')[0].contentWindow.editor.setValue(data);
					$('#editor')[0].contentWindow.editor.on('change', function () {
						$('#save-button').show();
						$('#file-edited').text('*');
					});
				});

				var contentType = xhr.getResponseHeader('Content-Type');
				_contentType = contentType;


				contentType = contentType.until(';');
				if (contentType == 'text/html' || contentType == 'application/xml') {
					$('#editor')[0].src = 'code-mirror/xml.html';
				} else if (contentType == 'text/x-lua') {
					$('#editor')[0].src = 'code-mirror/lua.html';
				} else if (contentType == 'text/x-python') {
					$('#editor')[0].src = 'code-mirror/python.html';
				} else if (contentType == 'text/x-csrc' || contentType == 'text/x-chdr') {
					$('#editor')[0].src = 'code-mirror/c.html';
				} else {
					$('#editor')[0].src = 'code-mirror/text.html';
				}

			}
		};

		this.check = function (callback, callbackArgs) {
			if ($('#file-edited').text() != '*') {
				callback(callbackArgs);
				return;
			}

			$('#close-editor-dialog').show('slide', {direction:'up'}, 200);
			layout.fix();

			$('#editor-save-close-button').unbind('click').click(function () {
				afterSaveCallback = function () {
					callback(callbackArgs);
				};
				$('#save-button').click();
				$('#close-editor-dialog').hide();
			});
			$('#editor-close-button').unbind('click').click(function () {
				$('#close-editor-dialog').hide();
				callback(callbackArgs);
			});
			$('#editor-cancel-button').unbind('click').click(function () {
				$('#close-editor-dialog').hide();
			});
		}
	},

	saveAsButton = new function () {
		this.init = function () {
			$('#save-as-button').click(function () {
			   saveAsDialog.show();
			});
		};

		this.show = function () {
			$('#save-as-button').show();
		};

		this.hide = function () {
			$('#save-as-button').hide();
		};
	},

	board = new function () {

		this.open = function (path) {

			fileStorage.getFile({
				account: path.until('/'),
				path: path.from('/'),
				success: function (data) {
					handleResponse(data)
					enableAll();
				},
				error: errorMessage.handleError
			});

			function handleResponse(data) {
				if ($('#search-div').is(':visible')) {
					$('#search-div input').val('');
					$('#search-div input').blur();
					$('#search-div').hide();
				}
				$('#copy-ok-button').hide();
				$('#copy-editor-label').show();

				toolbar.hide();
				title.update(path);

				$('#editor').attr('src', 'board/index.html');
				$($('#editor')[0]).unbind('load').load(function () {
					$('#scrollable').unbind('scroll');
					$('#scrollable').removeClass('scrollable');
					$('.item').remove();
					$('#add-button').hide();
					$('#list-headers').hide();
					$('#editor').show();
					layout.fix();

					$('#editor')[0].contentWindow.renderClick(JSON.stringify({"nodes":JSON.parse(data)}));

					$('#editor')[0].contentWindow.modifiedHandler = function () {
						$('#save-button').show();
						$('#file-edited').text('*');
					}
					$('#editor')[0].contentWindow.LS.gui.json.placePosition();
					$('#save-button').unbind('click').click(function () {
						var _json = $('#editor')[0].contentWindow.LS.gui.json.getInput()
						_json = JSON.stringify(JSON.parse(_json).nodes);

						fileStorage.createFile({
							path: path.from('/'),
							contentType: 'application/json',
							data: _json,
							created: function () {
								$('#save-button').hide();
								$('#file-edited').text('');
							},
							error: function () {

							}
						});
					});

					function FormatJSON(oData, sIndent) {
						if (arguments.length < 2) {
							var sIndent = "";
						}
						var sIndentStyle = "    ";
						var sDataType = RealTypeOf(oData);

						// open object
						if (sDataType == "array") {
							if (oData.length == 0) {
								return "[]";
							}
							var sHTML = "[";
						} else {
							var iCount = 0;
							$.each(oData, function() {
								iCount++;
								return;
							});
							if (iCount == 0) { // object is empty
								return "{}";
							}
							var sHTML = "{";
						}

						// loop through items
						var iCount = 0;
						$.each(oData, function(sKey, vValue) {
							if (iCount > 0) {
								sHTML += ",";
							}
							if (sDataType == "array") {
								sHTML += ("\n" + sIndent + sIndentStyle);
							} else {
								sHTML += ("\n" + sIndent + sIndentStyle + "\"" + sKey + "\"" + ": ");
							}

							// display relevant data type
							switch (RealTypeOf(vValue)) {
								case "array":
								case "object":
									sHTML += FormatJSON(vValue, (sIndent + sIndentStyle));
									break;
								case "boolean":
								case "number":
									sHTML += vValue.toString();
									break;
								case "null":
									sHTML += "null";
									break;
								case "string":
									sHTML += ("\"" + vValue + "\"");
									break;
								default:
									sHTML += ("TYPEOF: " + typeof(vValue));
							}

							// loop
							iCount++;
						});

						// close object
						if (sDataType == "array") {
							sHTML += ("\n" + sIndent + "]");
						} else {
							sHTML += ("\n" + sIndent + "}");
						}

						// return
						return sHTML;


						function RealTypeOf(v) {
							if (typeof(v) == "object") {
								if (v === null) return "null";
								if (v.constructor == (new Array).constructor) return "array";
								if (v.constructor == (new Date).constructor) return "date";
								if (v.constructor == (new RegExp).constructor) return "regex";
								return "object";
							}
							return typeof(v);
						}
					}
				});

			}
		};
	},

	timerDialog = new function () {
		var t;

		function count() {
			var seconds = Number($('#timer-seconds').text());
			seconds++;
			if (seconds < 60) {
				seconds = seconds < 10 ? '0'+String(seconds) : String(seconds);
				$('#timer-seconds').text(seconds);
			} else {
				$('#timer-seconds').text('00');
				var minutes = Number($('#timer-minutes').text());
				minutes++;
				minutes = minutes < 10 ? '0'+String(minutes) : String(minutes);
				$('#timer-minutes').text(minutes);
			}
			t = setTimeout(count, 1000);
		}

		this.start = function () {
			$('#timer-seconds').text('00');
			$('#timer-minutes').text('00');
			t = setTimeout(count, 1000);
			$('#timer-dialog').show();
		};

		this.stop = function () {
			clearTimeout(t);
			$('#timer-dialog').hide();
		};
	};

$(document).ready(function () {
	if (navigator.userAgent.indexOf('MSIE') != -1) {
		$('body').html('<h1 style="margin:5% auto; text-align: center;font-family: arial; color: #8b0000;">Internet Explorer is not supported. Please open in other browser.</h1>');
		return;
	}
	if (!account.init()) {
		return;
	}
	layout.init();
	errorMessage.init();
	addButton.init();
	newTabButton.init();
	logoutButton.init();
	list.init();
	editor.init();
	toolbar.init();
	createContainerDialog.init();
	sharedContainerDialog.init();
	createDirectoryDialog.init();
	createTextFileDialog.init();
	deleteDialog.init();
	metadataDialog.init();
	rightsDialog.init();
	copyDialog.init();
	fileTypeDialog.init();
	executeDialog.init();
	uploadAsButton.init();
	saveAsButton.init();
	saveAsDialog.init();
	$('#center').show('drop', {direction: 'up'});



	hashToAction();
	/*window.onhashchange = function () {
		hashToAction();
	};*/



	$('body').keydown(function (e) {
		if ($('input').is(":focus") && e.which != 27) {return;}
		if ($('.dialog-bar').is(':visible')) {
			if (e.which == 13) {
				if ($('#delete-dialog').is(':visible')) {
					$('#delete-ok-button').click();
				}
			}
			if (e.which == 27) {
				// Esc
				toolbar.hideDialogs();
			}
			return;
		}
		var selected = $('.selected-item');
		var noSelected = selected.length == 0;
		var itemsLength = $('.item').length;
		var noItems = itemsLength == 0;
		var id = noSelected ? '' : selected.attr('id');
		var index = noSelected ? -1 : Number(id.fromLast('-'));
		if (e.which == 40) {
			// Down Arrow
			var isLast = index == (itemsLength);
			if (!noItems && !isLast) {
				var newId;
				if (!noSelected) {
					newId = 'item-' + (index + 1);
					$('#scrollable')[0].scrollTop = 40 * index - ($('#content').height() / 2) + 40;
				} else {
					newId = 'item-1';
					$('#scrollable')[0].scrollTop = 0;
				}
				$('#'+newId).click();
			}
			if (isLast && $('#search-div input').val() == '') {

				var path = title.getPath();
				var marker = $('.item:last').attr('data-marker') || null;
				if (list.isContainersList(path)) {
					list.moreContainers(marker);
				} else if (path.count('/') > 1 && !path.endsWith('/')) {
					return;
				} else {
					list.moreFiles(path, marker);
				}
				$('#scrollable')[0].scrollTop = $('#scrollable')[0].scrollHeight;
			}
		} else if (e.which == 38) {
			// UP Arrow
			var isFirst = index == 1;
			if (!noSelected && !isFirst) {
				var newId = 'item-' + (index - 1);
				$('#'+newId).click();
				$('#scrollable')[0].scrollTop =  40 * (index-2) - ($('#content').height() / 2) + 80;
			}

		} else if (e.which == 13 || e.which == 39) {
			// Enter Arrow or Right Arrow
			if (!noSelected) {
				selected.dblclick();
			}

		} else if (e.which == 46) {
			// Delete key
			if ($('#toolbar-delete-button').is(":visible")) {
				$('#toolbar-delete-button').click();
			}

		} else if (e.which == 37 || e.which == 8) {
			// Left Arrow or Remove key

			if ($('#back-button').hasClass('header-enabled-button')) {
				$('#back-button').click();
			}
		} else if (e.which == 27) {
			// Esc

			var searchInputEl = $('#search-div input');

			if (!noSelected) {
				$('.click-to-unselect:first').click();
			} else if (!searchInputEl.is(":focus") && searchInputEl.is(':visible') && searchInputEl.val() != '') {
				searchInputEl.val('');
				list._search();
			}
		}
	});

	$('body').keyup(function (e) {
		if (e.ctrlKey && e.which == 77) {
			document.querySelector('#macro-dialog').removeAttribute('hidden');
			document.querySelector('#macro-dialog input').focus();
			$('#macro-dialog').draggable();
		} else if (e.which == 27) {
			document.querySelector('#macro-dialog').setAttribute('hidden', 'hidden');
		}
	});

	$('#macro-command').keydown(function (e) {
		if (e.keyCode == 13) {
			macro();
		}
	});

	$('#macro-ok-button').click(function () {
		macro();
	});

	function macro() {

		var currentPath = window.location.hash.substr(1);

		function convertToPath(arg) {

			var path;

			if (arg.startsWith('~')) {
				path = account.accountName + arg.substr(1);
			} else if (arg.startsWith('..')) {
				path = (currentPath.untilLast('/') || account.accountName) + arg.substr(2);
			} else if (arg.startsWith('.')) {
				path = (currentPath || account.accountName) + arg.substr(1);
			} else {
				path = arg;
			}

			return path;
		}

		function cd(arg) {

			var path = convertToPath(arg);
			list.list(path);
		}

		function cp(arg1, arg2) {

			var copyFrom = convertToPath(arg1).from('/');
			var copyTo = convertToPath(arg2).from('/');

			disableAll();
			var copyArgs = {
				copyFrom: copyFrom,
				copyTo: copyTo.untilLast('/') + '/',
				copiedFile: copyTo.fromLast('/'),
				copied: function () {
					var path = title.getPath();
					list.first20Files(path, 'up');
					enableAll();
				},
				error: errorMessage.handleError
			};

			if (account.accountName != convertToPath(arg1).until('/')) {
				copyArgs['copyFromAccount'] = convertToPath(arg1).until('/');
			}

			fileStorage.copy(copyArgs);

		}

		function edit(arg) {

			var path = convertToPath(arg);

			fileStorage.checkFileExist({
				path: path.from('/'),
				exist: function (xhr) {
					var contentType = xhr.getResponseHeader('Content-Type');
					var size = xhr.getResponseHeader('Content-Length');

					if (isEditable(contentType, size)) {
						editor.open(path);
						toolbar.hideDialogs();
						toolbar.hide();
						backButton.enable();
					} else {
						alert('file is not editable');
						list.first20Files(prevPath(path));
					}
				},
				notExist: function () {
					alert('not exist');
				},
				error: function (message) {
					alert(message);
				}
			});
		}

		var command = removeMultipleSpaces($('#macro-command').val().trim());
		var commandParts = command.split(' ');
		var commandVerb = commandParts[0];

		if (commandVerb == 'cd') {
			var arg = commandParts[1];
			cd(arg);
		} else if (commandVerb == 'cp') {
			var arg1 = commandParts[1];
			var arg2 = commandParts[2];
			cp(arg1, arg2);
		}  else if (commandVerb == 'chmod') {


		} else if (commandVerb == 'put') {


		} else if (commandVerb == 'get') {


		} else if (commandVerb == 'chattr') {


		} else if (commandVerb == 'mkdir') {


		} else if (commandVerb == 'edit') {
			var arg = commandParts[1];
			edit(arg);

		} else {

		}
	}

	$('#macro-cancel-button').click(function () {
		document.querySelector('#macro-dialog').setAttribute('hidden', 'hidden');
	});

	$('.click-to-unselect').click(function () {
		$('.selected-item').addClass('unselected-item');
		$('.selected-item').removeClass('selected-item');
		//toolbar.hideButtons();
		toolbar.hide();
		toolbar.hideDialogs();
		addButton.menuFiles.hide();
		addButton.menuContainers.hide();
	});

	function newAuth() {

	}

	setTimeout(newAuth, 1800000);
});

function hashToAction() {
	var path = window.location.hash.from('#');
	if (!path || path.count('/') == 0) {
		list.first20Containers();
	} else if (path.count('/') == 1 || path.endsWith('/')) {
		list.first20Files(path);
	} else {


		fileStorage.checkFileExist({
			path: path.from('/'),
            exist: function (xhr) {
				var contentType = xhr.getResponseHeader('Content-Type');
				var size = xhr.getResponseHeader('Content-Length');

				if (isEditable(contentType, size)) {
					editor.open(path);
					toolbar.hideDialogs();
					toolbar.hide();
					backButton.enable();
				} else {
					list.first20Files(prevPath(path));
				}
			},
            notExist: function () {

            },
			error: function () {

			}
		});
	}
}

function prevPath(path) {
	var slashesInPath = path.count('/');
	if (slashesInPath == 0) {
		return path;
	}
	if (slashesInPath <= 2) {
		return path.untilLast('/');
	}
	if  (slashesInPath == 3 && path.endsWith('/')) {
		return path.untilLast('/').untilLast('/');
	}
	if (path.endsWith('/')) {
		return path.untilLast('/').untilLast('/') + '/';
	}
	return path.untilLast('/') + '/';
}

function isEditable(contentType, size) {
	var editable = false;
	var megabyte = 1024 * 1024;
	var maxSize = 3*megabyte;

	contentType = contentType.until(';');

	if ((size < maxSize) && (contentType == 'application/javascript'
		|| contentType == 'application/xml'
		|| contentType == 'application/x-httpd-php'
		|| contentType == 'application/json'
		|| contentType == 'application/php'
		|| contentType == 'application/x-php'
		|| contentType.startsWith('text'))) {
		editable = true;
	}
	return editable;
}

function truncate(n, len) {
	len = len || 30;

	if (n.indexOf('.') != -1) {
		var ext = n.substring(n.lastIndexOf(".") + 1, n.length).toLowerCase();
		var filename = n.replace('.' + ext,'');
		if(filename.length <= len) {
			return n;
		}
		filename = filename.substr(0, len) + (n.length > len ? '&raquo;' : '');
		return filename + '.' + ext;
	}

	if(n.length <= len) {
		return n;
	}
	return n.substr(0, len) + '&raquo;';
}

function shortifyContainerName(name, len) {
	len = len || 30;

	if (name.length <= len) {
		return name;
	}

	return name.substr(0, len) + '&raquo;';
}


function _execute(dataToSend, dataType) {


    var xhr = new XMLHttpRequest();
    xhr.open('POST', account.xStorageUrl + account.accountName, true);
    xhr.responseType = 'blob';

    xhr.setRequestHeader('X-Zerovm-Execute', '1.0');
    xhr.setRequestHeader('Content-Type', dataType);


    xhr.onload = function(e) {
        var blob = this.response;
        $('#editor').attr('src', window.URL.createObjectURL(blob));
        $($('#editor')[0]).unbind('load').load(function () {
            $('#scrollable').unbind('scroll');
            $('#scrollable').removeClass('scrollable');
            $('.item').remove();
            $('#list-headers').hide();
            $('#editor').show();
            layout.fix();
            timerDialog.stop();
        });


        $('#copy-ok-button').hide();
        $('#copy-editor-label').show();
        toolbar.hide();
        var headers = parseResponseHeaders(this.getAllResponseHeaders());
        var hKeys = Object.keys(headers);
        var reportParts = {};
        var lowerCaseKey;
        for (var i = 0; i < hKeys.length; i++) {
            lowerCaseKey = hKeys[i].toLowerCase();

            if (lowerCaseKey == 'x-nexe-cdr-line') {
                var billingStr = headers[hKeys[i]];
                billingReportGui(new BillingReportObj(billingStr));

            } else if (lowerCaseKey.startsWith('x-nexe')) {
                reportParts[lowerCaseKey.from('x-nexe-')] = headers[hKeys[i]];
            }
        }

        executeDialog.show(reportParts);


        $('#add-button').hide();
        $('#new-tab-button').show();

    };

    xhr.send(dataToSend);


}

/*
function _execute(dataToSend, dataType) {

    fileStorage.execute({
        dataType: dataType,
        success: function (xhr) {
            var blob = xhr.response;
            $('#editor').attr('src', window.URL.createObjectURL(blob));
            $($('#editor')[0]).unbind('load').load(function () {
                $('#scrollable').unbind('scroll');
                $('#scrollable').removeClass('scrollable');
                $('.item').remove();
                $('#list-headers').hide();
                $('#editor').show();
                layout.fix();
                timerDialog.stop();
            });


            $('#copy-ok-button').hide();
            $('#copy-editor-label').show();
            toolbar.hide();
            var headers = parseResponseHeaders(xhr.getAllResponseHeaders());
            var hKeys = Object.keys(headers);
            var reportParts = {};
            var lowerCaseKey;
            for (var i = 0; i < hKeys.length; i++) {
                lowerCaseKey = hKeys[i].toLowerCase();

                if (lowerCaseKey == 'x-nexe-cdr-line') {
                    var billingStr = headers[hKeys[i]];
                    billingReportGui(new BillingReportObj(billingStr));

                } else if (lowerCaseKey.startsWith('x-nexe')) {
                    reportParts[lowerCaseKey.from('x-nexe-')] = headers[hKeys[i]];
                }
            }

            executeDialog.show(reportParts);


            $('#add-button').hide();
            $('#new-tab-button').show();
        }
    });

}
*/

function getContentType(fileName) {
	var extension = fileName.fromLast('.');
	var extensionToType = {
		'txt': 'text/plain',
		'json': 'application/json',
		'html': 'text/html',
		'htm': 'text/html',
		'nexe': 'application/x-nexe',
		'py': 'text/x-python',
		'pdf': 'application/pdf',
		'doc': 'application/msword',
		'ppt': 'application/vnd.ms-powerpoint',
		'xls': 'application/vnd.ms-excel',
		'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		'xml': 'application/xml',
		'zip': 'application/zip',
		'mp3': 'audio/mpeg',
		'mp4': 'audio/mp4',
		'gif': 'image/gif',
		'jpg': 'image/jpeg',
		'png': 'image/png',
		'css': 'text/css',
		'csv': 'text/csv',
		'tar': 'application/x-tar',
		'js': 'text/javascript',
		'lua': 'text/x-lua',
		'c': 'text/x-csrc',
		'h': 'text/x-chdr',
		'jar': 'application/java-archive',
		'xul': 'application/vnd.mozilla.xul+xml',
		'psd': 'image/vnd.adobe.photoshop',
		'avi': 'video/x-msvideo'
	};

	return extensionToType[extension] || null;
}

function parseResponseHeaders(headerStr) {
	var headers = {};
	if (!headerStr) {
		return headers;
	}
	var headerPairs = headerStr.split('\u000d\u000a');
	for (var i = 0; i < headerPairs.length; i++) {
		var headerPair = headerPairs[i];
		// Can't use split() here because it does the wrong thing
		// if the header value has the string ": " in it.
		var index = headerPair.indexOf('\u003a\u0020');
		if (index > 0) {
			var key = headerPair.substring(0, index);
			var val = headerPair.substring(index + 2);
			headers[key] = val;
		}
	}
	return headers;
}

function htmlEscape(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function htmlUnescape(value) {
	return String(value)
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}




/*

 Billing report is stored in the X-Nexe-Cdr-Line header.
 Billing report has the same properties as execution report: the particular nodes are separated by commas, but with one difference: first number in the header is the total time of the clustered job (of all nodes).
 Example of the numbers in header:
 “Total Server Time”, “1st Node Server Time”, “1st Node CDR result”, “2nd Node Server Time”, “2nd Node CDR result”,........

 Each "CDR result" line consists of 12 numbers separated by spaces.
 The numbers are:
 1. "System Time, sec"
 2. "User Time, sec"
 3. "Memory used, bytes"
 4. "Swap used, bytes"
 5. "Number of reads from disk"
 6. "Number of bytes read from disk"
 7. "Number of writes to disk"
 8. "Number of bytes written to disk"
 9. "Number of reads from network"
 10. "Number of bytes read from network"
 11. "Number of writes to network"
 12. "Number of bytes written to network"

 All numbers must be converted to human readable format, i.e. if seconds are < 1 they should be converted to milliseconds.
 If bytes are more than 1KB - converted to KB, more than 1MB - to MB
 If reads/writes are more than 1000 convert to 1K if more than 1000000 convert to 1M, etc.

 */

function BillingReportObj(xNexeCdrLine) {
	this.totalServerTime = xNexeCdrLine.until(',').trim();
	var nodesBillingInfo = xNexeCdrLine.from(',').trim().split(',');
	this.nodes = [];

	var j = 0;
	for (var i = 0; i < nodesBillingInfo.length; i++) {
		if (i % 2 == 0) {
			this.nodes[j] = {};
			this.nodes[j].nodeServerTime = nodesBillingInfo[i];
		} else {
			var nodeCdrResult = nodesBillingInfo[i].trim().split(' ');

			this.nodes[j].systemTime = nodeCdrResult[0];
			this.nodes[j].userTime = nodeCdrResult[1];
			this.nodes[j].memoryUsed = nodeCdrResult[2];

			this.nodes[j].SwapUsed = nodeCdrResult[3];
			this.nodes[j].readsFromDisk = nodeCdrResult[4];
			this.nodes[j].bytesReadFromDisk = nodeCdrResult[5];

			this.nodes[j].writesToDisk = nodeCdrResult[6];
			this.nodes[j].bytesWrittenToDisk = nodeCdrResult[7];
			this.nodes[j].readsFromNetwork = nodeCdrResult[8];

			this.nodes[j].bytesReadFromNetwork = nodeCdrResult[9];
			this.nodes[j].writesToNetwork = nodeCdrResult[10];
			this.nodes[j].bytesWrittenToNetwork = nodeCdrResult[11];
			j++;
		}

	}
}

function billingReportGui(billingReportObj) {
	$('.auto-created-report-td').remove();
	document.getElementById('total-time-tr').insertAdjacentHTML('beforeend', td(billingReportObj['totalServerTime']));

	var nodesLength = billingReportObj.nodes.length;
	for (var i = 0; i < nodesLength; i++) {
		document.getElementById('node-number-tr').insertAdjacentHTML('beforeend', td(getGetOrdinal(i+1)));
		document.getElementById('node-server-time-tr').insertAdjacentHTML('beforeend', td(billingReportObj.nodes[i]['nodeServerTime']));

		document.getElementById('system-time-tr').insertAdjacentHTML('beforeend', td(billingReportObj.nodes[i]['systemTime']));
		document.getElementById('user-time-tr').insertAdjacentHTML('beforeend', td(billingReportObj.nodes[i]['userTime']));
		document.getElementById('memory-used-tr').insertAdjacentHTML('beforeend', td(billingReportObj.nodes[i]['memoryUsed']));

		document.getElementById('swap-used-tr').insertAdjacentHTML('beforeend', td(billingReportObj.nodes[i]['SwapUsed']));
		document.getElementById('reads-from-disk-tr').insertAdjacentHTML('beforeend', td(billingReportObj.nodes[i]['readsFromDisk']));
		document.getElementById('bytes-read-from-disk-tr').insertAdjacentHTML('beforeend', td(billingReportObj.nodes[i]['bytesReadFromDisk']));

		document.getElementById('writes-to-disk-tr').insertAdjacentHTML('beforeend', td(billingReportObj.nodes[i]['writesToDisk']));
		document.getElementById('bytes-written-to-disk-tr').insertAdjacentHTML('beforeend', td(billingReportObj.nodes[i]['bytesWrittenToDisk']));
		document.getElementById('reads-from-network-tr').insertAdjacentHTML('beforeend', td(billingReportObj.nodes[i]['readsFromNetwork']));

		document.getElementById('bytes-read-from-network-tr').insertAdjacentHTML('beforeend', td(billingReportObj.nodes[i]['bytesReadFromNetwork']));
		document.getElementById('writes-to-network-tr').insertAdjacentHTML('beforeend', td(billingReportObj.nodes[i]['writesToNetwork']));
		document.getElementById('bytes-written-to-network-tr').insertAdjacentHTML('beforeend', td(billingReportObj.nodes[i]['bytesWrittenToNetwork']));
	}
	document.getElementById('billing-report-title').setAttribute('colspan', String(1+nodesLength));
	if (nodesLength > 3) {
		document.getElementById('billing-tbody').style.fontSize = 'x-small';
	} else {
		document.getElementById('billing-tbody').style.fontSize = 'medium';
	}

	function td(txt) {
		return '<td class="auto-created-report-td">' + txt + '</td>';
	}

	function getGetOrdinal(n) {
		var s=["th","st","nd","rd"],
			v=n%100;
		return n+(s[(v-20)%10]||s[v]||s[0]);
	}
}

function enableAll() {
	$('body').removeClass('disabled');
	$('body').addClass('enabled');
	if (!list.isContainersList(title.getPath())) {
		backButton.enable();
	}
	$('.loading').removeClass('loading');
}

function disableAll() {
	$('body').removeClass('enabled');
	$('body').addClass('disabled');
	backButton.disable();
	$('html').addClass('loading');
	$('body').addClass('loading');
	$('div').addClass('loading');
}

function removeMultipleSpaces(str) {
	return str.replace(/ +(?= )/g,'');
}