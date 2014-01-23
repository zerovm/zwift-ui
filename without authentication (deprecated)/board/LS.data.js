var LS;

if (!LS) {
    LS = {};
}

(function () {
    'use strict';

    function DataStore() {
        var nodeMap = [];
        var objList = [];
        var fileMap = [];
        var conns = [];

        this.clear = function () {
            nodeMap = [];
            objList = [];
            fileMap = [];
            conns = [];
        };

        this.getObjList = function () {
            return objList;
        };

        this.addNode = function (nodeId, nodeName) {
            if (!this.checkNodeIdExists(nodeId) && !this.checkNodeNameExists(nodeName)) {
                nodeMap.push([nodeId, nodeName]);
                objList.push(nodeId);
                return true;
            }
            return false;
        };

        this.addFile = function (fileId, device, path) {
            objList.push(fileId);
        };

        this.assignFile = function (fileId, nodeId) {
            fileMap.push([fileId, nodeId]);
        };

        this.addConn = function (conn) {
            conns.push(conn);
        };

        this.removeConn = function (conn) {
            for (var i = 0; i < conns.length; i++) {
                if (conns[i].sourceId === conn.sourceId && conns[i].targetId === conn.targetId) {
                    conns.splice(i, 1);
                    break;
                }
            }
        };

        this.getConn = function (id) {
            var conn = null;
            for (var i = 0; i < conns.length; i++) {
                if (conns[i].sourceId === id || conns[i].targetId === id) {
                    conn = conns[i];
                }
            }
            return conn;
        };

        function getNodeIndexById(nodeId) {
            var index = -1;
            for (var i = 0; i < nodeMap.length; i++) {
                if (nodeMap[i][0] === nodeId) {
                    index = i;
                    break;
                }
            }
            return index;
        };

        function getNodeIndexByName(nodeName) {
            var index = -1;
            for (var i = 0; i < nodeMap.length; i++) {
                if (nodeMap[i][1] === nodeName) {
                    index = i;
                    break;
                }
            }
            return index;
        };

        function getFileIndexByFile(file) {
            var index = -1;
            for (var i = 0; i < fileMap.length; i++) {
                if (fileMap[i][0] === file) {
                    index = i;
                    break;
                }
            }
            return index;
        };

        function getFileIndexByNode(node) {
            var index = -1;
            for (var i = 0; i < fileMap.length; i++) {
                if (fileMap[i][1] === node) {
                    index = i;
                    break;
                }
            }
            return index;
        };

        this.renameNode = function (prevName, newName) {
            var index = getNodeIndexByName(prevName);
            nodeMap[index][1] = newName;
        };

        this.removeNodeById = function (nodeId) {
            var index = getNodeIndexById(nodeId);
            nodeMap.splice(index ,1);
            objList.splice(objList.indexOf(nodeId), 1);
        };

        this.removeNodeByName = function (nodeName) {
            var index = getNodeIndexByName(nodeName);
            objList.splice(objList.indexOf(nodeMap[index][0]), 1);
            nodeMap.splice(index ,1);
        };

        this.removeFile = function (fileId) {
            var index, fileIndex;
            index = objList.indexOf(fileId);
            objList.splice(index, 1);
            fileIndex = getFileIndexByFile(fileId);
            fileMap.splice(fileIndex ,1);
        };

        this.detachFile = function (fileId) {
            var fileIndex;
            fileIndex = getFileIndexByFile(fileId);
            fileMap.splice(fileIndex ,1);
        };

        this.getNodeName = function (nodeId) {
            var index = getNodeIndexById(nodeId);
            return index !== -1 ? nodeMap[index][1] : null;
        };

        this.getNodeId = function (nodeName) {
            var index = getNodeIndexByName(nodeName);
            return nodeMap[index][0];
        };

        this.getFileNode = function (fileId) {
            var index = getFileIndexByFile(fileId);
            return index !== -1 ? fileMap[index][1] : null;
        };

        this.checkNodeIdExists = function (nodeId) {
            var index = getNodeIndexById(nodeId);
            return index !== -1;
        };

        this.checkNodeNameExists = function (nodeName) {
            var index = getNodeIndexByName(nodeName);
            return index !== -1;
        };

        this.generateObjId = function () {
            var i, id;
            i = 0;
            id = 'obj' + String(i);
            while (objList.indexOf(id) !== -1) {
                i++;
                id = 'obj' + String(i);
            }
            return id;
        };
    };

    LS.data = new DataStore();
}());