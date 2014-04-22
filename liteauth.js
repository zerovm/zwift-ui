var liteauth = (function () {

	var AUTH_ENDPOINT = 'zebra.zerovm.org';
	var AUTH_TYPES = {
		GOOGLE: '/login/google',
		FACEBOOK: '/login/fb'
	};

	var QueryString = function () {
		// This function is anonymous, is executed immediately and
		// the return value is assigned to QueryString!
		var query_string = {};
		var query = window.location.search.substring(1);
		var vars = query.split("&");
		for (var i=0;i<vars.length;i++) {
			var pair = vars[i].split("=");
			// If first entry with this name
			if (typeof query_string[pair[0]] === "undefined") {
				query_string[pair[0]] = pair[1];
				// If second entry with this name
			} else if (typeof query_string[pair[0]] === "string") {
				var arr = [ query_string[pair[0]], pair[1] ];
				query_string[pair[0]] = arr;
				// If third or later entry with this name
			} else {
				query_string[pair[0]].push(pair[1]);
			}
		}
		return query_string;
	} ();

	function login(authType) {
		window.location = location.protocol + '//' + AUTH_ENDPOINT
			+ authType + '?state=' + encodeURIComponent(location.pathname);
	}

	function getLoginInfo() {
		return QueryString['account'];
	}

	function getProfile(args) {
		var xhr = new XMLHttpRequest();
	        var profile_url = "https://" + AUTH_ENDPOINT + "/profile";
		xhr.open('GET', profile_url);
		xhr.withCredentials = true;
		xhr.onload = function (e) {
			if (e.target.status == 200) {
				args.success(e.target.responseText);
			} else if (e.target.status == 404) {
			    var pxhr = new XMLHttpRequest();
			    pxhr.open('PUT', profile_url);
			    pxhr.withCredentials = true;
			    pxhr.onload = function (e) {
				if (e.target.status == 201) {
				    args.success(e.target.responseText);
				} else {
				    args.error(e.target.status, e.target.statusText);
				}};
			    pxhr.send();
			} else {
				args.error(e.target.status, e.target.statusText);
			}
		};
		xhr.send();
	}

	function updateProfile(userKey, inviteCode) {
		var xhr = new XMLHttpRequest();
		xhr.open('PUT', 'https://' + AUTH_ENDPOINT + '/profile');
		xhr.withCredentials = true;
		//xhr.setRequestHeader('X-Auth-User-Key', userKey);
		//xhr.setRequestHeader('Content-Type', 'text/plain');
		//xhr.setRequestHeader('X-Auth-Invite-Code', inviteCode);
		xhr.onload = function (e) {
			console.log(e.target.status);
			console.log(e.target.statusText);
			console.log(e.target.responseText);
			console.log(e.target.getResponseHeader('Content-Type'));
		};
		xhr.onreadystatechange = function () {
			console.log(document.readyState);
			console.log(arguments);
		};
		xhr.send('{"user-key": "' + userKey + '"}');
	}

	return {
		AUTH_TYPES: AUTH_TYPES,
		login: login,
		getProfile: getProfile,
		updateProfile: updateProfile,
		getLoginInfo: getLoginInfo
	};

})();
