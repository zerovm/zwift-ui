var CurrentPath = function () {
	var path = new Path(location.hash.substr(1));
	path.root = function(){
		return path.account() + "/";
	};
	return path;
};