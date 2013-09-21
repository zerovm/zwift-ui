var LS;

if (!LS) {
    LS = {};
}

(function () {
    'use strict';

    LS.json = new function () {
        var json;
        json = { 'nodes':[] };

        this.clear = function () {
            json = { 'nodes':[] };
        };

        function getNodeIndex(name) {
            var index, i;
            index = -1;
            for (i = 0; i < json.nodes.length; i++) {
                if (json.nodes[i].name === name) {
                    index = i;
                    break;
                }
            }
            return index;
        }

        this.getJson = function () {
            return json;
        };

        this.getJsonStr = function () {
            return JSON.stringify(json);
        };

        this.nodes = new function () {
            var defaultNodePrefix = 'Node';

            this.generateName = function () {
                var i, name;
                i = 0;
                name = defaultNodePrefix + String(i);
                while (this.exists(name)) {
                    i++;
                    name = defaultNodePrefix + String(i);
                }
                return name;
            };

            this.add = function (name, execPath) {
                var success, node;
                success = false;
                if (name && execPath && !this.exists(name)) {
                    node = {
                        'name':name,
                        'exec':{
                            'path':execPath
                        },
                        'count': 1
                    };
                    json.nodes.push(node);
                    success = true;
                }
                return success;
            };

            this.remove = function (name) {
                var success, index;
                success = false;
                index = getNodeIndex(name);
                if (index !== -1) {
                    json.nodes.splice(index, 1);
                    for (var i = 0; i < json.nodes.length; i++) {
                        if (!json.nodes[i].connect) {
                            continue;
                        }
                        for (var j = 0; j < json.nodes[i].connect.length; j++) {
                            if (json.nodes[i].connect[j] === name) {
                                json.nodes[i].connect.splice(j, 1);
                            }
                        }
                        if (json.nodes[i].connect.length === 0) {
                            delete json.nodes[i].connect;
                        }
                    }
                    success = true;
                }
                return success;
            };

            this.get = function (name) {
                var index, node;
                index = getNodeIndex(name);
                node = null;
                if (index !== -1) {
                    node = json.nodes[index];
                }
                return node;
            };

            this.getAll = function () {
                return json.nodes;
            };

            this.removeAll = function () {
                json.nodes = [];
            };

            this.exists = function (name) {
                return getNodeIndex(name) !== -1;
            };

            this.changeName = function (prevName, newName) {
                var success, index;
                success = false;
                index = getNodeIndex(prevName);
                if (index !== -1 && !this.exists(newName)) {
                    json.nodes[index].name = newName;
                    for (var i = 0; i < json.nodes.length; i++) {
                        if (!json.nodes[i].connect) {
                            continue;
                        }
                        for (var j = 0; j < json.nodes[i].connect.length; j++) {
                            if (json.nodes[i].connect[j] === prevName) {
                                json.nodes[i].connect[j] = newName;
                            }
                        }
                    }
                    success = true;
                }
                return success;
            };

            this.getExecPath = function (name) {
                var node = this.get(name);
                return node.exec.path;
            };

            this.setExecPath = function (name, val) {
                var index = getNodeIndex(name);
                json.nodes[index].exec.path = val;
                return true;
            };

            this.getArgs = function (name) {
                var node = this.get(name);
                return node.args;
            };

            this.setArgs = function (name, val) {
                var index = getNodeIndex(name);
                json.nodes[index].args = val;
                return true;
            };

            this.setCount = function (name, val) {
                var index = getNodeIndex(name);
                json.nodes[index].count = val;
                return true;
            };

            this.getCount = function (name) {
                var index = getNodeIndex(name);
                if (json.nodes[index].hasOwnProperty('count')) {
                    return json.nodes[index].count;
                }
                return null;
            };
        };

        this.files = new function () {
            this.add = function (nodeName, device, path) {
                var success, index, file;
                success = false;
                index = getNodeIndex(nodeName);
                if (index !== -1) {
                    if (!json.nodes[index].file_list) {
                        json.nodes[index].file_list = [];
                    }
                    file = { 'device': device, 'path':path };
                    json.nodes[index].file_list.push(file);
                    if (path && json.nodes[index].count) {
                        delete json.nodes[index].count;
                    }
                }
                return success;
            };

            this.remove = function (nodeName, device) {
                var success, index, i;
                success = false;
                index = getNodeIndex(nodeName);
                if (index !== -1) {
                    for (i = 0; i < json.nodes[index].file_list.length; i++) {
                        if (json.nodes[index].file_list[i].device === device) {
                            json.nodes[index].file_list.splice(i, 1);
                            if (json.nodes[index].file_list.length === 0) {
                                delete json.nodes[index].file_list;
                                json.nodes[index].count = 1;
                            }
                            success = true;
                            break;
                        }
                    }
                }
                return success;
            };

            this.get = function (nodeName, device) {
                var index, i, file;
                file = null;
                index = getNodeIndex(nodeName);
                if (index !== -1) {
                    for (i = 0; i < json.nodes[index].file_list.length; i++) {
                        if (json.nodes[index].file_list[i].device === device) {
                            file = json.nodes[index].file_list[i];
                            break;
                        }
                    }
                }
                return file;
            };

            this.getAll = function (nodeName) {
                var index;
                index = getNodeIndex(nodeName);
                if (!json.nodes[index].file_list) {
                    return [];
                }
                return json.nodes[index].file_list;
            };

            this.removeAll = function () {
                var index;
                index = getNodeIndex(nodeName);
                delete json.nodes[index].file_list;
                json.nodes[index].count = 1;
            };

            this.setPath = function (nodeName, device, path) {
                var success, index, i;
                success = false;
                index = getNodeIndex(nodeName);
                if (index !== -1) {
                    for (i = 0; i < json.nodes[index].file_list.length; i++) {
                        if (json.nodes[index].file_list[i].device === device) {
                            json.nodes[index].file_list[i].path = path;
                            if (path && json.nodes[index].count) {
                                delete json.nodes[index].count;
                            }
                            success = true;
                            break;
                        }
                    }
                }
                return success;
            };

            this.changeDevice = function (nodeName, prevDevice, newDevice) {
                var success, index, i;
                success = false;
                index = getNodeIndex(nodeName);
                if (index !== -1) {
                    for (i = 0; i < json.nodes[index].file_list.length; i++) {
                        if (json.nodes[index].file_list[i].device === prevDevice) {
                            json.nodes[index].file_list[i].device = newDevice;
                            success = true;
                            break;
                        }
                    }
                }
                return success;
            };

            this.getPath = function (nodeName, device) {
                var path, index, i;
                path = null;
                index = getNodeIndex(nodeName);
                if (index !== -1) {
                    for (i = 0; i < json.nodes[index].file_list.length; i++) {
                        if (json.nodes[index].file_list[i].device === device) {
                            path = json.nodes[index].file_list[i].path;
                            break;
                        }
                    }
                }
                return path;
            };

            this.exists = function (nodeName, device) {
                var _exists, index, i;
                index = getNodeIndex(nodeName);
                _exists = false;
                if (index !== -1 && json.nodes[index].file_list) {
                    for (i = 0; i < json.nodes[index].file_list.length; i++) {
                        if (json.nodes[index].file_list[i].device === device) {
                            _exists = true;
                            break;
                        }
                    }
                }
                return _exists;
            };

            this.checkPathRequired = function (device) {
                return device === 'stdin' || device === 'input' || device === 'output' || device === 'image' || device === 'debug';
            };

            this.checkPathStar = function (nodeName) {
                var hasStar = false;
                var index = getNodeIndex(nodeName);
                if (json.nodes[index].file_list) {
                    for (var i = 0; i < json.nodes[index].file_list.length; i++) {
                        if (json.nodes[index].file_list[i].path.indexOf('*') !== -1) {
                            hasStar = true;
                            break;
                        }
                    }
                }
                return hasStar;
            };
        };

        this.env = new function () {

            this.getKeys = function (nodeName) {
                var index, key, keys;
                index = getNodeIndex(nodeName);
                keys = [];
                for (key in json.nodes[index].env) {
                    keys.push(key);
                }
                return keys;
            };

            this.add = function (nodeName, key, value) {
                var success, index, env;
                success = false;
                index = getNodeIndex(nodeName);
                if (index !== -1) {
                    if (!json.nodes[index].env) {
                        json.nodes[index].env = {};
                    }
                    json.nodes[index].env[key] = value;
                    success = true;
                }
                return success;
            };

            this.remove = function (nodeName, key) {
                var success, nodeIndex, keysIndex, i;
                success = false;
                nodeIndex = getNodeIndex(nodeName);
                if (nodeIndex !== -1 && json.nodes[nodeIndex].env) {
                    delete json.nodes[nodeIndex].env[key];
                    success = true;
                }
                return success;
            };

            this.setValue = function (nodeName, key, value) {
                var success, index;
                success = false;
                index = getNodeIndex(nodeName);
                if (index !== -1 && json.nodes[index].env[key]) {
                    json.nodes[index].env[key] = value;
                    success = true;
                }
                return success;
            };

            this.changeKey = function (nodeName, prevKey, newKey) {
                var success, index, tempValue;
                success = false;
                index = getNodeIndex(nodeName);
                if (index !== -1 && json.nodes[index].env[prevKey]) {
                    tempValue = this.getValue(nodeName, prevKey);
                    success = this.add(nodeName, newKey, tempValue) && this.remove(nodeName, prevKey);
                }
                return success;
            };

            this.get = function (nodeName) {
                var env, index;
                env = null;
                index = getNodeIndex(nodeName);
                if (index !== -1 && json.nodes[index].env) {
                    env = json.nodes[index].env;
                }
                return env;
            };

            this.getValue = function (nodeName, key) {
                var value, index;
                value = null;
                index = getNodeIndex(nodeName);
                if (index !== -1 && json.nodes[index].env[key]) {
                    value = json.nodes[index].env[key];
                }
                return value;
            };

            this.exists = function (nodeName, key) {
                var exist, index, env;
                exist = false;
                index = getNodeIndex(nodeName);
                if (index !== -1 && json.nodes[index].env) {
                    for (env in json.nodes[index].env) {
                        if (env === key) {
                            exist = true;
                            break;
                        }
                    }
                }
                return exist;
            };

            this.getAll = function (nodeName) {
                var index = getNodeIndex(nodeName);
                return json.nodes[index].env || [];
            };
        };

        this.conns = new function () {
            this.add = function (nodeName, targetNodeName) {
                var success, index;
                success = false;
                index = getNodeIndex(nodeName);
                if (index !== -1) {
                    if (!json.nodes[index].connect) {
                        json.nodes[index].connect = [];
                    }
                    json.nodes[index].connect.push(targetNodeName);
                    success = true;
                }
                return success;
            };

            this.remove = function (nodeName, targetNodeName) {
                var success, index;
                success = false;
                index = getNodeIndex(nodeName);
                if (index !== -1 && json.nodes[index].connect) {
                    for (var i = 0; i < json.nodes[index].connect.length; i++) {
                        if (targetNodeName === json.nodes[index].connect[i]) {
                            json.nodes[index].connect.splice(i, 1);
                            if (json.nodes[index].connect.length === 0) {
                                delete json.nodes[index].connect;
                            }
                            break;
                        }
                    }
                }
                return success;
            };
        };
    }
}());