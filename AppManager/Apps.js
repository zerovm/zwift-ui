// Message for old Internet Explorer.
document.onload = function () {
	if (navigator.userAgent.indexOf('MSIE') != -1) {
		$('body').html('<h1 style="margin:5% auto; text-align: center;font-family: arial; color: #8b0000;">Internet Explorer is not supported. Please open in other browser.</h1>');
		return;
	}
}

var Apps = {};

Apps.disableAll = function () {
	document.querySelector('.upload').setAttribute('disabled','disabled');
	document.querySelector('.edit').setAttribute('disabled', 'disabled');
	document.querySelector('.done').setAttribute('disabled', 'disabled');

	var apps = document.querySelectorAll('.content .app');
	for (var i = 0; i < apps.length; i++) {
		apps.item(i).setAttribute('disabled', 'disabled');
	}
};

Apps.enableAll = function () {
	document.querySelector('.upload').removeAttribute('disabled');
	document.querySelector('.edit').removeAttribute('disabled');
	document.querySelector('.done').removeAttribute('disabled');

	var apps = document.querySelectorAll('.content .app');
	for (var i = 0; i < apps.length; i++) {
		apps.item(i).removeAttribute('disabled');
	}
};

Apps.upload = {};

Apps.upload.reset = function () {
	var el = document.querySelector('.upload');
	el.innerHTML = el.innerHTML;
};

Apps.upload.fileChange = function (el) {
	if (!el.value) {
		return;
	}

	Apps.disableAll();
	var selectedFile = el.files[0];

	ZipLib.unzip(selectedFile, Apps.upload.fileUnzip);
};

Apps.upload.fileUnzip = function (zipFiles) {
	var files = Object.keys(zipFiles);

	if (!zipFiles.hasOwnProperty('manifest.json')) {
		alert('The archive has no ./manifest.json file.');
		return;
	}

	var manifest = JSON.parse(zipFiles['manifest.json']);
	var appAuthor = manifest.author;
	var appName = manifest.name;
	var appVersion = manifest.version;

	addAppButton();
	uploadApp();

	function addAppButton() {

		var appTemplate = document.querySelector('#appTemplate');
		var appDocumentFragment = appTemplate.content.cloneNode(true);
		var contentEl = document.querySelector('.content');
		contentEl.appendChild(appDocumentFragment);

		var appEl = contentEl.querySelector('.app:last-child');
		var iconUrl = window.URL.createObjectURL(zipFiles[manifest.icon]);
		appEl.style.backgroundImage = 'url("' + iconUrl + '")';
		appEl.querySelector('label.name').textContent = appName;
		appEl.setAttribute('data-app-path', manifest.author + '/' + manifest.name + '/' + manifest.version);
		appEl.setAttribute('data-default-page', manifest['homepage']);
		appEl.querySelector('progress').hidden = false;
	}

	function uploadApp() {
		ZeroAppsOnSwift.createAppDir({
			appAuthor: appAuthor,
			appName: appName,
			appVersion: appVersion,
			created: function () {
				uploadFile(0);
			},
			error: function (message) {
				alert(message);
			}
		});

		ZeroAppsOnSwift.addAppLocation({
			appLocation: appAuthor + '/' + appName + '/' + appVersion
		});

		function uploadFile(i) {
			if (i == files.length) {
				document.querySelector('.app:last-child progress').hidden = true;
				Apps.enableAll();
				Apps.upload.reset();
				return;
			}

			var path = appAuthor + '/' + appName + '/' + appVersion + '/' + files[i];
			var data = zipFiles[files[i]];

			ZeroAppsOnSwift.uploadAppFile({
				filePath: path,
				fileData: data,
				callback: function () {
					uploadFile(i + 1);
				}
			});
		}
	}
};

Apps.edit = {};

Apps.edit.click = function (el) {
	el.setAttribute('hidden', 'hidden');
	document.querySelector('.done').removeAttribute('hidden');
	document.querySelector('.upload').setAttribute('disabled', 'disabled');
	showRemoveLabels();

	function showRemoveLabels() {
		var removeButtons = document.querySelectorAll('.remove');
		for (var i = 0; i < removeButtons.length; i++) {
			removeButtons.item(i).removeAttribute('hidden');
		}
	}
};

Apps.done = {};

Apps.done.click = function (el) {
	el.setAttribute('hidden', 'hidden');
	document.querySelector('.edit').removeAttribute('hidden');
	document.querySelector('.upload').removeAttribute('disabled');
	hideRemoveLabels();

	function hideRemoveLabels() {
		var removeButtons = document.querySelectorAll('.remove');
		for (var i = 0; i < removeButtons.length; i++) {
			removeButtons.item(i).setAttribute('hidden', 'hidden');
		}
	}
};

Apps.email = {};

Apps.email.update = function (email) {
	document.querySelector('.email').textContent = email;
};

Apps.signOut = {};

Apps.signOut.click = function () {
	ZLitestackDotCom.signOut();
	//ClusterAuth.signOut();
};

Apps.app = {};

Apps.app.click = function (el) {
	if (el.querySelector('.remove').hasAttribute('hidden')) {

		var appLocation = el.getAttribute('data-app-path');
		var defaultPage = el.getAttribute('data-default-page');
		ZeroAppsOnSwift.openApp({
			appLocation: appLocation,
			defaultPage: defaultPage
		});

	} else {

		Apps.disableAll();
		el.querySelector('label.remove').setAttribute('hidden', 'hidden');
		el.querySelector('progress').removeAttribute('hidden');
		var appPath = el.getAttribute('data-app-path');
		ZeroAppsOnSwift.removeApp(appPath, function () {
			el.parentNode.removeChild(el);
			Apps.enableAll();
		},
			// progress:
			function (totalFiles, deletedFiles) {
				//var percentComplete = totalFiles / deletedFiles * 100;
				el.querySelector('progress').setAttribute('max', totalFiles);
				el.querySelector('progress').setAttribute('value', deletedFiles);
			}
		);

	}
};

document.addEventListener('click', function (e) {
	'use strict';

	if (e.target.classList.contains('file-button')) {
		e.target.querySelector('input[type=file]').click();
	}

	if (e.target.classList.contains('edit')) {
		Apps.edit.click(e.target);
	}

	if (e.target.classList.contains('done')) {
		Apps.done.click(e.target);
	}

	if (e.target.classList.contains('sign-out')) {
		Apps.signOut.click(e.target);
	}

	if (e.target.classList.contains('app')) {
		Apps.app.click(e.target);
	}
});

document.addEventListener('change', function (e) {
	'use strict';

	if (e.target.parentElement.classList.contains('upload')) {
		Apps.upload.fileChange(e.target);
	}
});

document.addEventListener('DOMContentLoaded', function () {
	'use strict';

	ZLitestackDotCom.init(function () {
		Apps.email.update(ZLitestackDotCom.getAccount());
	});
	//Apps.email.update(ClusterAuth.getAccount());
	//Apps.email.update(ZLitestackDotCom.getAccount());

	function checkReady(callback) {

		SwiftV1.checkContainerExist({
			containerName: '.gui',
			success: function () {
				file();
			},
			notExist: function () {
				SwiftV1.createContainer({
					containerName: '.gui',
					created: function () {
						file();
					},
					error: function () {
						file();
					}
				});
			},
			error: function () {
				file();
			}
		});

		function file() {
			SwiftV1.checkFileExist({
				path: '.gui/app-locations',
				notExist: function () {
					SwiftV1.createFile({
						path: '.gui/app-locations',
						contentType: 'application/json',
						data: '[]',
						created: function () {
							callback();
						},
						error: function () {

						}
					});
					callback();
				},
				success: function () {
					callback();
				},
				error: function () {
					callback();
				}
			});
		}
	}

	checkReady(function () {

		ZeroAppsOnSwift.getAppLocations({
			success: callback_appLocations,
			error: function (message) {
				// TODO: error treatment.
				console.log(message);
			}
		});


		function callback_appLocations(appLocations) {
			var appName, appIcon;

			var i = 0;
			next();

			function next() {
				if (i == appLocations.length) {
					return;
				}

				ZeroAppsOnSwift.getManifest({
					appPath: appLocations[i],
					callback: function (manifest) {

						if (manifest == null) {
							i++;
							next();
							return;
						}

						appName = manifest['name'];
						appIcon = manifest['icon'];
						var iconUrl = ZeroAppsOnSwift.getAppIconUrl({
							appLocation: appLocations[i],
							appIcon: appIcon
						});

						document.querySelector('.content').innerHTML += document.querySelector('#appTemplate').innerHTML;

						var appEl = document.querySelector('.app:last-child');
						appEl.style.backgroundImage = 'url("' + iconUrl + '")';
						appEl.querySelector('label.name').textContent = appName;
						appEl.setAttribute('data-app-path', appLocations[i]);
						appEl.setAttribute('data-default-page', manifest['homepage']);

						i++;
						next();
					}
				});
			}
		}
	});
});