var Authentication = (function (SwiftV1, toolbox, refreshItemList) {

	var authenticationEl = document.getElementById('Authentication');

	var auth_url = authenticationEl.getElementsByClassName('v1-auth-url')[0];
	if (auth_url.value === '') {
		auth_url.value = document.location.protocol + '//' +
			document.location.host + '/auth/v1.0';
	}

	authenticationEl.onsubmit = function (e) {
		e.preventDefault();

		var v1AuthUrl = authenticationEl.getElementsByClassName('v1-auth-url')[0].value;
		var tenant = authenticationEl.getElementsByClassName('tenant')[0].value;
		var xAuthUser = authenticationEl.getElementsByClassName('x-auth-user')[0].value;
		var xAuthKey = authenticationEl.getElementsByClassName('x-auth-key')[0].value;

		SwiftV1.retrieveTokens({
			v1AuthUrl: v1AuthUrl,
			tenant: tenant,
			xAuthUser: xAuthUser,
			xAuthKey: xAuthKey,
			error: XHR_ERROR,
			ok: XHR_OK
		});
	};


	if (liteauth.getLoginInfo()) {
		liteauth.getProfile(function (response) {
			var xAuthUser =
				liteauth.getLoginInfo().split(':')[0];
			var tenant =
				liteauth.getLoginInfo().split(':').splice(1).join(':');
			var v1AuthUrl =
				decodeURIComponent(getCookie('storage'));
			var xAuthKey =
				JSON.parse(response)['auth'].split('plaintext:')[1];

			SwiftV1.retrieveTokens({
				v1AuthUrl: v1AuthUrl,
				tenant: tenant,
				xAuthUser: xAuthUser,
				xAuthKey: xAuthKey,
				error: XHR_ERROR,
				ok: XHR_OK
			});
		});
	}

	authenticationEl.getElementsByClassName('login-with-google')[0].onclick = function () {
		liteauth.login(liteauth.AUTH_TYPES.GOOGLE);
	};

	function XHR_OK() {
		document.getElementById('Authentication').setAttribute('hidden', 'hidden');

		document.getElementById('AccountId').textContent = SwiftV1.account;
		document.getElementById('SignOut').onclick = function () {
			window.location.reload(true);
		};
		location.hash = SwiftV1.account + "/";

		toolbox();
		reAuth();
		refreshItemList();
	}

	function XHR_ERROR() {
		alert(arguments[0] + ' ' + arguments[1]);
	}

	function reAuth() {
		SwiftV1.Account.head({success:function(){},error:function(){}});
		setTimeout(Authentication.reAuth, 1000 * 60 * 20);
	}

	function getCookie(cookieName) {
		var name = cookieName + '=';
		var ca = document.cookie.split(';');
		for (var i=0; i< ca.length; i++) {
			var c = ca[i].trim();
			if (c.indexOf(name)==0) {
				return c.substring(name.length, c.length);
			}
		}
		return '';
	}

	return {
		reAuth: reAuth
	};

})(SwiftV1, toolbox, refreshItemList);