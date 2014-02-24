var UpButton = (function () {
	var el = document.getElementById('UpButton');

	function disable() {
		el.setAttribute('disabled', 'disabled');
	}

	function enable() {
		el.removeAttribute('disabled');
	}

	el.addEventListener('click', function() {
		var upperLevel = CurrentPath().up();
		if (upperLevel) {
			NavigationBar.showLoading();
			location.hash = upperLevel;
		}
	});

	return {
		enable: enable,
		disable: disable
	};
})();
