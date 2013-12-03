window.addEventListener('authReady', function () {
	'use strict';

	var accountLabel = document.getElementById('AccountLabel'),
		accountWindow = document.getElementById('AccountWindow');

	// TODO: Profile Picture and Full Name
	accountWindow.getElementsByClassName('profile-picture')[0];
	accountWindow.getElementsByClassName('full-name')[0];

	document.getElementById('OpenAccountWindow').addEventListener('click', function () {
		if (accountWindow.classList.contains('hidden')) {
			accountWindow.classList.remove('hidden');
		} else {
			accountWindow.classList.add('hidden');
		}
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

	// Sign Out Button
	accountWindow.getElementsByClassName('sign-out')[0].addEventListener('click', function () {
		Auth.signOut();
	});
});