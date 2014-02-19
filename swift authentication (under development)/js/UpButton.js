document.getElementById('UpButton').addEventListener('click', function() {
		var upperLevel = CurrentPath().up();
		if (upperLevel) {
			NavigationBar.showLoading();
			location.hash = upperLevel;
		}
	}
);