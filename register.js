(function () {
    var invite_code = document.getElementById("invite_code").value ||
	document.cookie.replace(
		/(?:(?:^|.*;\s*)invite_code\s*\=\s*([^;]*).*$)|^.*$/,
	    "$1");

    function login(authType) {
	window.location = location.protocol + '//' + config.authEndpoint
	    + authType + '?state=' + encodeURIComponent("/register.html");
    }

    document.getElementById("register").addEventListener('click', function () {
	var invite_code = document.getElementById("invite_code").value;
	if (invite_code) {
	    document.cookie = "invite_code=" + invite_code;
	}
	login(liteauth.AUTH_TYPES.GOOGLE);
    });
    if (document.location.href.search(/\?account=/) >= 0) {
	// we have received a response from google.
	// let's try PUTing our profile
	var pxhr = new XMLHttpRequest();
	var profile_url = document.location.protocol + "//" + config.authEndpoint
	    + "/profile";
	pxhr.open('PUT', profile_url);
	pxhr.withCredentials = true;
	if (invite_code) {
	    pxhr.setRequestHeader("X-Auth-Invite-Code", invite_code);
	    document.cookie = "invite_code=;expires=Thu, 01 Jan 1970 00:00:01 GMT";
	}
	pxhr.onload = function (e) {
	    if (e.target.status == 201) {
		document.location = document.location.protocol
		    + "//" + document.location.host + "/index.html";
	    } else {
		alert("Not on whitelist or invite code is no good");
	    }};
	pxhr.send();
    }
}());
