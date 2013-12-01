Auth.ready.push(function () {
	'use strict';

	var accountLabel = document.getElementById('AccountLabel'),
		accountWindow = document.getElementById('AccountWindow');

	// TODO: Profile Picture and Full Name
	accountWindow.getElementsByClassName('profile-picture')[0];
	accountWindow.getElementsByClassName('full-name')[0];

	// Account Label (email)
	if (window.FileManager.ENABLE_EMAILS) {
		Auth.getEmail(function (email) {
			accountLabel.textContent = email;
		});
	} else {
		accountLabel.textContent = Auth.getAccount();
	}

	// Sign Out Button
	accountWindow.getElementsByClassName('sign-out')[0].addEventListener('click', function () {
		Auth.signOut();
	});
});