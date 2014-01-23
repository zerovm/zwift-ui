
// Add methods to JavaScript String:

String.prototype.startsWith = function (s) {
    return this.indexOf(s) === 0;
};

String.prototype.endsWith = function (s) {
    return this.lastIndexOf(s) === this.length - s.length;
};

String.prototype.count = function (s) {
    function count(str) {
        var index = str.indexOf(s);
        if (index === -1) {
            return 0;
        }
        return 1 + count(str.substr(index + s.length));
    }

    return count(this);
};

String.prototype.untilLast = function (s) {
    return this.substring(0, this.lastIndexOf(s));
};

String.prototype.contains = function (s) {
    return this.indexOf(s) != -1;
};

String.prototype.equals = function (s) {
    return this.toString() == s;
};

String.prototype.fromLast = function (s) {
    return this.substr(this.lastIndexOf(s) + s.length);
};

String.prototype.from = function (s) {
    return this.substring(this.indexOf(s) + s.length);
};

String.prototype.until = function (s) {
    if (this.indexOf(s) != -1) {
        return this.substring(0, this.indexOf(s));
    }
    return this.toString();
};