
// Add methods to JavaScript String:

if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function (searchString, position) {
            position = position || 0;
            return this.indexOf(searchString, position) === position;
        }
    });
}

if (!String.prototype.endsWith) {
    Object.defineProperty(String.prototype, 'endsWith', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: function (searchString, position) {
            position = position || this.length;
            position = position - searchString.length;
            return this.lastIndexOf(searchString) === position;
        }
    });
}

if(!('contains' in String.prototype)) {
    String.prototype.contains = function(str, startIndex) {
        return -1 !== this.indexOf(str, startIndex);
    };
}

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