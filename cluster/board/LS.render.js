function isInteger(num) {
    return String(num).indexOf('.') === -1;
}

function calcColumns(objects) {
    var columns = Math.sqrt(objects)
    var i = 1;
    while (!isInteger(columns)) {
        columns = Math.sqrt(objects + i);
        i++;
    }
    return columns;
}

function calcPositions(objects, containerWidth, containerHeight, objectWidth, objectHeight) {
    var positions = [];
    var pos, left, top;
    var lines = Math.round(Math.sqrt(objects));
    var columns = calcColumns(objects);
    var lastLineColumns = columns - (columns * lines - objects);
    var x1 = (containerWidth / (columns + 1)) - (objectWidth / 2);
    var y1 = (containerHeight / (lines + 1)) - (objectHeight / 2);
    var lastLineX1 = (containerWidth / (lastLineColumns + 1)) - (objectWidth / 2);

    for (var y = 1; y < lines; y++) {
        for (var x = 1; x <= columns; x++) {
            left = x1 * x;
            if (x > 1) {
                left += (objectWidth / 2)*(x-1);
            }
            top = y1 * y;
            if (y > 1) {
                top += (objectHeight / 2)*(y-1);
            }
            pos = [left, top];
            positions.push(pos);
        }
    }

    for (var x = 1; x <= lastLineColumns; x++) {
        left = lastLineX1 * x;
        if (x > 1) {
            left += (objectWidth / 2)*(x-1);
        }
        top = y1 * lines;
        if (y > 1) {
            top += (objectHeight / 2)*(y-1);
        }
        pos = [left, top];
        positions.push(pos);
    }

    return positions;
}

function countFiles (json) {
    var counter = 0;
    for (var i = 0; i < json.nodes.length; i++) {
        if (!json.nodes[i].file_list) {
            continue;
        }
        counter += json.nodes[i].file_list.length;
    }
    return counter;
}

function renderClick (jsonStr) {
    //modifiedHandler();

    var idArr = LS.data.getObjList();
    LS.jsPlumb.clear(idArr);
    LS.data.clear();
    LS.json.clear();
    LS.gui.clear();
    var jsonObj = JSON.parse(jsonStr);
    var objects = jsonObj.nodes.length + countFiles(jsonObj);

    var containerWidth = $('.board').width();
    var containerHeight = $('.board').height();
    var objectWidth = 150;
    var objectHeight = 100;
    var positions = calcPositions(objects, containerWidth, containerHeight, objectWidth, objectHeight);

    var id, type, top, left, nodeName, execPath;
    for (var i = 0; i < jsonObj.nodes.length; i++) {
        id = LS.data.generateObjId();
        type = 'node';
        left = String(positions[i][0]) + 'px';
        top = String(positions[i][1]) + 'px';
        LS.gui.board.addObj(id, type, left, top);
        nodeName = jsonObj.nodes[i].name;
        execPath = jsonObj.nodes[i].exec.path;
        LS.data.addNode(id, nodeName);
        LS.gui.obj.setName(id, nodeName);
        LS.gui.obj.setExecPath(id, execPath);
        LS.jsPlumb.initNewObj(id);
        LS.json.nodes.add(nodeName, execPath);
        if (jsonObj.nodes[i].hasOwnProperty('args')) {
            LS.json.nodes.setArgs(nodeName, jsonObj.nodes[i].args);
        }
        if (jsonObj.nodes[i].hasOwnProperty('count')) {
            var count = jsonObj.nodes[i].count;
            LS.json.nodes.setCount(nodeName, count);
        }
        if (jsonObj.nodes[i].env) {
            for (var key in jsonObj.nodes[i].env) {
                LS.json.env.add(nodeName, key, jsonObj.nodes[i].env[key]);
            }
        }
    }
    for (var i = 0; i < jsonObj.nodes.length; i++) {

        if (jsonObj.nodes[i].connect) {
            var source, target;
            var nodeName = jsonObj.nodes[i].name;
            for (var j = 0; j < jsonObj.nodes[i].connect.length; j++) {
                //LS.json.conns.add(nodeName, jsonObj.nodes[i].connect[j]);
                source = LS.data.getNodeId(nodeName);
                target = LS.data.getNodeId(jsonObj.nodes[i].connect[j]);
                LS.jsPlumb.createArrowConn(source, target);
            }
        }
    }

    var id, type, k, device, path, conn;
    k = jsonObj.nodes.length;
    type = 'file';
    for (var i = 0; i < jsonObj.nodes.length; i++) {
        if (!jsonObj.nodes[i].file_list) {
            continue;
        }
        for (var j = 0; j < jsonObj.nodes[i].file_list.length; j++) {
            id = LS.data.generateObjId();
            left = String(positions[k][0]) + 'px';
            top = String(positions[k][1]) + 'px';
            LS.gui.board.addObj(id, type, left, top);
            k++;

            device = jsonObj.nodes[i].file_list[j].device;
            path = jsonObj.nodes[i].file_list[j].path;
            LS.data.addFile(id, device, path);
            LS.gui.obj.setPrevDevice(id, device);
            LS.jsPlumb.initNewObj(id);
            LS.gui.obj.setDevice(id, device);
            LS.gui.obj.setPath(id, path);

            var nodeId = LS.data.getNodeId(jsonObj.nodes[i].name);
            conn = LS.jsPlumb.createLabelConn(nodeId, id, getLabel(device));

            LS.data.assignFile(id, nodeId);
            LS.data.addConn(conn);
        }
    }

    var json = LS.json.getJson();
    for (var i = 0; i < json.nodes.length; i++) {
        var nodeName = json.nodes[i].name;
        var id = LS.data.getNodeId(nodeName);
        var count = LS.json.nodes.getCount(nodeName);
        var hasStar = LS.json.files.checkPathStar(nodeName);
        LS.gui.obj.changeNodeType(id, hasStar, count);
    }
}