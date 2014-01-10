window.addEventListener('authReady', function () {
	'use strict';

	var accountLabel = document.getElementById('AccountLabel'),
		accountWindow = document.getElementById('AccountWindow');

	document.getElementById('header').addEventListener('mousedown', function (e) {
		e.preventDefault();
		e.stopPropagation();
	});
	window.addEventListener('mousedown', function(){
		accountWindow.classList.add('hidden');
	});
	document.getElementById('OpenAccountWindow').addEventListener('click', function () {
		accountWindow.classList.toggle('hidden');
	});

	if (window.FileManager.ENABLE_EMAILS) {
		Auth.getEmail(function (email) {
			accountLabel.textContent = email;

			if (ZLitestackDotCom.userData != null) {
				if (ZLitestackDotCom.userData.hasOwnProperty('name')) {
					accountWindow.getElementsByClassName('full-name')[0].textContent = ZLitestackDotCom.userData.name;
				}
				if (ZLitestackDotCom.userData.hasOwnProperty('picture')) {
					accountWindow.getElementsByClassName('profile-picture')[0].src = ZLitestackDotCom.userData.picture;
				}
			}
		});
	} else {
		accountLabel.textContent = Auth.getAccount();
	}

	SwiftV1.Account.head({
		success: function (metadata, containersCount, bytesUsed) {
			accountWindow.getElementsByClassName('bytes-used')[0].textContent = bytesUsed;
		},
		error: function () {
			accountWindow.getElementsByClassName('bytes-used')[0].textContent = 'Error';
		}
	});

	// Sign Out Button
	accountWindow.getElementsByClassName('sign-out')[0].addEventListener('click', function () {
		Auth.signOut();
	});
});