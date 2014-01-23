

var modifiedHandler = function () {};

function getLabel(device) {
    var label = '';
    if (device === 'stdout') {
        label = '<img src="img/stdout.png" style="width:50px" title="SEQUENTIAL + WRITABLE" />';
    } else if (device === 'stdin') {
        label = '<img src="img/stdin.png" style="width:50px" title="SEQUENTIAL + READABLE" />';
    } else if (device === 'stderr') {
        label = '<img src="img/stdout.png" style="width:50px" title="SEQUENTIAL + WRITABLE" />';
    } else if (device === 'input') {
        label = '<img src="img/random-read.png" style="width:50px" title="RANDOM + READABLE" />';
    } else if (device === 'output') {
        label = '<img src="img/random-write.png" style="width:50px" title="RANDOM + WRITABLE" />';
    } else if (device === 'image') {
        label = '<img src="img/image.png" style="width:50px" title="CDR" />';
    } else if (device === 'debug') {
        label = '<img src="img/network.png" style="width:50px" title="NETWORK" />';
    }
    return label;
}

$(function () {
    LS.gui.initOnPageLoaded();
    // json window
    LS.gui.json.setInput(LS.json.getJsonStr());
    LS.gui.json.setRenderClick(function () {
        var jsonStr = $('.json-input').val();
        renderClick(jsonStr);
        $(this).hide();
    });
    // obj
    LS.gui.board.setDrop(function (event, ui) {
        var type, nodeName, id, left, top;
        left = $(ui.helper).css('left');
        top = $(ui.helper).css('top');
        id = LS.data.generateObjId();
        type = LS.gui.obj.getType(ui.helper);
        LS.gui.board.addObj(id, type, left, top);

        if (type === 'file') {
            LS.data.addFile(id, $('#' + id + ' .device').val(), '');
            LS.gui.obj.setPrevDevice(id, LS.gui.obj.getDevice(id));
            LS.jsPlumb.initNewObj(id);
            LS.gui.json.setInput(LS.json.getJsonStr());
        } else if (type === 'node' || type === 'node-group') {
            nodeName = LS.json.nodes.generateName();
            LS.data.addNode(id, nodeName);
            LS.gui.obj.setName(id, nodeName);
            LS.jsPlumb.initNewObj(id);

            LS.gui.prop.showExecPathValidationLabel(nodeName, id);

        } else {
            LS.gui.errorAlert('Error occurred.');
        }
    });
    LS.gui.toolbox.setDrop(function (event, ui) {
        var id, isFile, nodeName, nodeId, device;
        id = $(ui.helper).attr('id');
        isFile = LS.gui.obj.isFile('#' + id);
        LS.jsPlumb.removeConns(id);
        if (isFile) {
            nodeId = LS.data.getFileNode(id);
            if (nodeId) {
                nodeName =  LS.data.getNodeName(nodeId);
                device = $(ui.helper).find('.device').val();
                LS.json.files.remove(nodeName, device);
                LS.data.removeFile(id);

                if (nodeName === LS.gui.prop.getFileNodeName() && device === LS.gui.prop.getDevice()) {
                    LS.gui.prop.hide();
                }
            }
        } else {
            nodeName = LS.data.getNodeName(id);
            LS.data.removeNodeById(id);
            LS.json.nodes.remove(nodeName);

            if (nodeName === LS.gui.prop.getName()) {
                LS.gui.prop.hide();
            }
        }
        LS.gui.json.setInput(LS.json.getJsonStr());
        $(ui.helper).remove();
    });
    LS.gui.obj.setNameChange(function () {
        var val, prevVal;
        val = $(this).val();
        prevVal = $(this).data('prevVal');
        if ( /[^a-zA-Z0-9]/.test( val ) ) {
            LS.gui.errorAlert('Input is not alphanumeric');
            $(this).show('highlight', {color: 'red'}).val(prevVal);
        } else if (LS.json.nodes.changeName(prevVal , val)) {
            $(this).data('prevVal', val);
            LS.data.renameNode(prevVal, val);
            LS.gui.json.setInput(LS.json.getJsonStr());

            if (LS.gui.prop.getName() === prevVal) {
                LS.gui.prop.setName(val);
            }
        } else {
            LS.gui.errorAlert('Node name is already exists');
            $(this).show('highlight', {color: 'red'}).val(prevVal);
        }
    });
    LS.gui.obj.setDeviceChange(function () {
        var fileId, device, prevDevice, nodeId, nodeName;
        fileId = $(this).parent().attr('id');
        device = LS.gui.obj.getDevice(fileId);
        prevDevice = LS.gui.obj.getPrevDevice(fileId);
        nodeId = LS.data.getFileNode(fileId);


        if (LS.gui.obj.getPath(fileId) === '' && LS.json.files.checkPathRequired(device)) {
            LS.gui.prop.setFileId(fileId);
            LS.gui.prop.setDevice(device);
            LS.gui.prop.setPath('');
            LS.gui.showPageCover('.properties-window');
            LS.gui.prop.showFile(fileId);
            LS.gui.addValidationLabel('required-path', 'Path is required', '.file .path_validation');
            LS.gui.prop.focusPath();
            LS.gui.prop.hideCloseButton();
        }

        nodeName = LS.data.getNodeName(nodeId);
        if (!nodeName || !LS.json.files.exists(nodeName, device)) {

            LS.gui.obj.setPrevDevice(fileId, device);
            if (LS.gui.prop.getFileId() === fileId) {
                LS.gui.prop.setDevice(device);
            }

            if (nodeName) {
                LS.json.files.changeDevice(nodeName, prevDevice, device);
                LS.data.getConn(fileId).connection.overlays[0].setLabel(getLabel(device));
                LS.gui.json.setInput(LS.json.getJsonStr());
                if (LS.gui.prop.getDevice() === prevDevice && LS.gui.prop.getFileNodeName() === nodeName) {
                    LS.gui.prop.setDevice(device);
                }
            }
        } else {
            LS.gui.errorAlert('Device has already assigned to the node');
            $(this).show('highlight', {color: 'red'}).val(prevDevice);
        }
    });
    LS.gui.obj.setPathChange(function () {
        var id, val, prevVal, device;
        id = $(this).parent().attr('id');
        val = $(this).val();
        prevVal = $(this).data('prevVal');
        device = LS.gui.obj.getDevice(id);

        var isDebug = device === 'debug';
        var isOptional = device === 'stdout' || device === 'stderr';
        var isWildcard = val.indexOf('*') !== -1;
        var isNetwork = /^(tcp:\/\/|udp:\/\/)[a-zA-Z0-9]([a-zA-Z0-9]|\.[a-zA-Z0-9]|\-[a-zA-Z0-9])*:[0-9][0-9]*$/.test(val);

        if (isDebug && !isNetwork) {
            LS.gui.errorAlert('debug device path has the following semantics: proto://hostname:port');
            $(this).show('highlight', {color: 'red'}).val(prevVal);
            LS.gui.obj.focusPath(id);
            return;
        } else if (isDebug && isWildcard) {
            LS.gui.errorAlert('/dev/debug cannot have wildcard in path');
            $(this).show('highlight', {color: 'red'}).val(prevVal);
            LS.gui.obj.focusPath(id);
            return;
        } else if (isOptional && val === '') {
        } else if (!isDebug && val.indexOf('/') !== 0) {
            LS.gui.errorAlert('path must start with "/" character');
            $(this).show('highlight', {color: 'red'}).val(prevVal);
            LS.gui.obj.focusPath(id);
            return;
        }

        var nodeName;

        if (LS.gui.prop.getFileId() === id) {
            LS.gui.prop.setPrevPath(val);
            LS.gui.prop.setPath(val);
        }

        $(this).data('prevVal', val);
        nodeName = LS.data.getNodeName(LS.data.getFileNode(id));
        if (nodeName) {
            LS.json.files.setPath(nodeName, device, val);
            LS.gui.json.setInput(LS.json.getJsonStr());

            var nodeId = LS.data.getNodeId(nodeName);
            var count = LS.json.nodes.getCount(nodeName);
            var hasStar = LS.json.files.checkPathStar(nodeName);
            LS.gui.obj.changeNodeType(nodeId, hasStar, count);
        }

        LS.gui.obj.focusPath(id);
    });
    LS.gui.obj.setEditClick(function () {
        var id = $(this).parent().attr('id');

        if (LS.gui.obj.isFile('#' + id)) {
            var device = LS.gui.obj.getDevice(id);
            LS.gui.prop.setFileId(id);
            LS.gui.prop.setDevice(device);
            LS.gui.prop.setPath(LS.gui.obj.getPath(id));
            LS.gui.prop.showFile(id);
        } else {
            var nodeName, execPath, args, keys, envArr, count;
            nodeName = LS.data.getNodeName(id);
            execPath = LS.json.nodes.getExecPath(nodeName);
            args = LS.json.nodes.getArgs(nodeName);
            count = LS.json.nodes.getCount(nodeName);
            if (!count) {
                count = 1;
            }
            LS.gui.prop.showNode(id);
            LS.gui.prop.setName(nodeName);
            LS.gui.prop.setExecPath(execPath);
            LS.gui.prop.setArgs(args);
            LS.gui.prop.setCount(count);
            keys = LS.json.env.getKeys(nodeName);
            envArr = LS.json.env.get(nodeName);
            if (!envArr || envArr.length === 0) {
                LS.gui.prop.showNewExeEnv();
            } else {
                LS.gui.prop.showListExeEnv(envArr, keys);
            }
        }
    });
    // connections
    function createFileConn(fileId, nodeId, conn) {
        var nodeName, device, path;
        nodeName = LS.data.getNodeName(nodeId);
        device = LS.gui.obj.getDevice(fileId);
        path = LS.gui.obj.getPath(fileId);
        if (!LS.json.files.exists(nodeName, device)) {
            LS.gui.obj.setPrevDevice(fileId, device);
            LS.json.files.add(nodeName, device, path);
            LS.data.assignFile(fileId, nodeId);
            conn.connection.getOverlay("label").setLabel(getLabel(device));
            LS.data.addConn(conn);


            var count = LS.json.nodes.getCount(nodeName);
            var hasStar = LS.json.files.checkPathStar(nodeName);
            LS.gui.obj.changeNodeType(nodeId, hasStar, count);

            LS.gui.json.setInput(LS.json.getJsonStr());
        } else {
            LS.jsPlumb.removeConn(conn);
            LS.gui.errorAlert('The device is already exsits.');
            $('#' + fileId + ' .device').show('highlight', {color: 'red'});
        }
    }
    LS.jsPlumb.initPageLoad();
    LS.jsPlumb.connCreated(function (conn) {
        var isSourceFile, isTargetFile, sourceName, targetName, success;
        isSourceFile = LS.gui.obj.isFile('#' + conn.sourceId);
        isTargetFile =  LS.gui.obj.isFile('#' + conn.targetId);
        if (isSourceFile && isTargetFile) {
            LS.jsPlumb.removeConn(conn);
            return;
        } else if (isSourceFile) {
            var fileId = conn.sourceId;
            var nodeId = conn.targetId;
            createFileConn(fileId, nodeId, conn);
        } else if (isTargetFile) {
            var fileId = conn.targetId;
            var nodeId = conn.sourceId;
            createFileConn(fileId, nodeId, conn);
        } else {
            sourceName = LS.data.getNodeName(conn.sourceId);
            targetName = LS.data.getNodeName(conn.targetId);
            success = LS.json.conns.add(sourceName, targetName);
            LS.jsPlumb.createArrow(conn.connection);
            LS.data.addConn(conn);
            if (sourceName === targetName) {

                var hasStar = LS.json.files.checkPathStar(sourceName);
                var count = Number(LS.json.nodes.getCount(sourceName));
                if (!hasStar && count === 1) {

                    LS.data.removeConn(conn);
                    LS.jsPlumb.removeConn(conn);
                    return;
                }
            }
            if (!success) {
                LS.data.removeConn(conn);
                LS.jsPlumb.removeConn(conn);
                return;
            }
        }
        LS.jsPlumb.createConn(conn);
        LS.gui.json.setInput(LS.json.getJsonStr());
    });
    LS.jsPlumb.connRemoved(function (conn) {
        var isSourceFile, isTargetFile, sourceName, targetName;
        LS.jsPlumb.removeConn(conn);
        isSourceFile =  LS.gui.obj.isFile('#' + conn.sourceId);
        isTargetFile =  LS.gui.obj.isFile('#' + conn.targetId);
        LS.data.removeConn(conn);
        if (isSourceFile) {
            nodeId = LS.data.getFileNode(conn.sourceId);
            nodeName = LS.data.getNodeName(nodeId);
            device = $('#' + conn.sourceId + ' .device').val();
            LS.json.files.remove(nodeName, device);
            LS.data.detachFile(conn.sourceId);
            if (LS.gui.prop.getFileNodeName() === nodeName && LS.gui.prop.getDevice() === device) {
                LS.gui.prop.hide();
            }

            var count = LS.json.nodes.getCount(nodeName);
            var hasStar = LS.json.files.checkPathStar(nodeName);
            LS.gui.obj.changeNodeType(nodeId, hasStar, count);
        } else if (isTargetFile) {
            nodeId = LS.data.getFileNode(conn.targetId);
            nodeName = LS.data.getNodeName(nodeId);
            device = $('#' + conn.targetId + ' .device').val();
            LS.json.files.remove(nodeName, device);
            LS.data.detachFile(conn.targetId);

            var count = LS.json.nodes.getCount(nodeName);
            var hasStar = LS.json.files.checkPathStar(nodeName);
            LS.gui.obj.changeNodeType(nodeId, hasStar, count);
        } else {
            sourceName = LS.data.getNodeName(conn.sourceId);
            targetName = LS.data.getNodeName(conn.targetId);
            LS.json.conns.remove(sourceName, targetName);
        }
        LS.gui.json.setInput(LS.json.getJsonStr());
    });
    // properties window
    LS.gui.prop.setExecPathChange(function () {
        var val, prevVal, nodeName, nodeId;
        val = $(this).val();
        nodeName = LS.gui.prop.getName();
        nodeId = LS.data.getNodeId(nodeName);

        if (LS.json.nodes.exists(nodeName)) {

            if (val.indexOf('/') === 0) {
                LS.json.nodes.setExecPath(nodeName, val);
                $(this).data('prevVal', val);
                LS.gui.obj.setExecPath(nodeId, val);
            } else {
                prevVal = $(this).data('prevVal');
                $(this).val(prevVal);
                LS.gui.errorAlert('Invalid path. Slash "/" is missing.');
            }
        } else {
            if (val.indexOf('/') === 0) {
                LS.gui.prop.hideExecPathValidationLabel();
                LS.json.nodes.add(nodeName, val);
                $(this).data('prevVal', val);
                LS.gui.obj.setExecPath(nodeId, val);
            } else {
                $(this).val('');
                LS.gui.errorAlert('Invalid path. Slash "/" is missing.');
            }
        }
        LS.gui.json.setInput(LS.json.getJsonStr());
    });
    LS.gui.prop.setArgsChanged(function () {
        var val, nodeName;
        val = $(this).val();
        nodeName = LS.gui.prop.getName();
        LS.json.nodes.setArgs(nodeName, val);
        LS.gui.json.setInput(LS.json.getJsonStr());
    });
    LS.gui.prop.setCountChanged(function () {
        var val, prevVal, nodeName;
        val = $(this).val();
        prevVal = LS.gui.prop.getPrevCount();
        if (isNaN(val)) {
            $(this).val(prevVal);
            LS.gui.errorAlert('Count must be a number.');
            $(this).show('highlight', {color: 'red'});
            return;
        }
        if (Number(val) < 1) {
            LS.gui.errorAlert('Count must be greater than 1.');
            $(this).show('highlight', {color: 'red'});
            return;
        }
        nodeName = LS.gui.prop.getName();
        LS.json.nodes.setCount(nodeName, val);
        LS.gui.prop.setPrevCount(val);
        LS.gui.json.setInput(LS.json.getJsonStr());
        var id = LS.data.getNodeId(nodeName);
        var count = LS.json.nodes.getCount(nodeName);
        var hasStar = LS.json.files.checkPathStar(nodeName);
        LS.gui.obj.changeNodeType(id, hasStar, count);
    });
    LS.gui.prop.setAddEnvClick(function () {
        var nodeName, key, value, envArr, keys;
        nodeName = LS.gui.prop.getName();
        key = LS.gui.prop.getKey();
        value = LS.gui.prop.getValue();
        if (!key) {
            LS.gui.errorAlert('Key is required.');
            $('.new-exe-env .key').show('highlight', {color: 'red'});
            return;
        }
        if (!value) {
            LS.gui.errorAlert('Value is required.');
            $('.new-exe-env .value').show('highlight', {color: 'red'});
            return;
        }
        if (LS.json.env.exists(nodeName, key)) {
            LS.gui.errorAlert('Key is already exists');
            $('.new-exe-env .key').show('highlight', {color: 'red'});
            return;
        }
        LS.json.env.add(nodeName, key, value);
        LS.gui.json.setInput(LS.json.getJsonStr());
        envArr = LS.json.env.get(nodeName);
        keys = LS.json.env.getKeys(nodeName);
        LS.gui.prop.showListExeEnv(envArr, keys);
    });
    LS.gui.prop.setToggleEnv(function () {
        var exeEnvTitle, nodeName, envArr, keys;
        exeEnvTitle = $(this).text().toLowerCase();
        nodeName = LS.gui.prop.getName();
        envArr = LS.json.env.getAll(nodeName);
        keys = LS.json.env.getKeys();
        if (exeEnvTitle === 'watch list') {
            LS.gui.prop.showListExeEnv(envArr, keys);
        } else {
            LS.gui.prop.showNewExeEnv();
        }
    });
    LS.gui.prop.setDeviceChange(function () {
        var fileId, device, prevDevice, nodeId, nodeName;
        device = $(this).val();
        fileId = LS.gui.prop.getFileId();
        prevDevice = LS.gui.obj.getDevice(fileId);


        if (device === prevDevice) {
            return;
        }
        nodeId = LS.data.getFileNode(fileId);

        if (LS.gui.obj.getPath(fileId) === '' && LS.json.files.checkPathRequired(device)) {
            LS.gui.prop.setFileId(fileId);
            LS.gui.prop.setDevice(device);
            LS.gui.prop.setPath('');
            LS.gui.showPageCover('.properties-window');
            LS.gui.prop.showFile(fileId);
            LS.gui.addValidationLabel('required-path', 'Path is required', '.file .path_validation');
            LS.gui.prop.focusPath();
            LS.gui.prop.hideCloseButton();
        }

        nodeName = LS.data.getNodeName(nodeId);
        if (!nodeName || !LS.json.files.exists(nodeName, device)) {

            LS.gui.obj.setPrevDevice(fileId, device);
            LS.gui.obj.setDevice(fileId, device);

            if (nodeName) {
                LS.json.files.changeDevice(nodeName, prevDevice, device);
                LS.data.getConn(fileId).connection.overlays[0].setLabel(getLabel(device));
                LS.gui.json.setInput(LS.json.getJsonStr());
                if (LS.gui.prop.getDevice() === prevDevice && LS.gui.prop.getFileNodeName() === nodeName) {
                    LS.gui.prop.setDevice(device);
                }
            }
        } else {
            LS.gui.errorAlert('Device has already assigned to the node');
            $(this).show('highlight', {color: 'red'}).val(prevDevice);
        }
    });
    LS.gui.prop.setPathChange(function () {
        var id, path, prevVal, device;
        path = LS.gui.prop.getPath();
        prevVal = LS.gui.prop.getPrevPath();
        device = LS.gui.prop.getDevice();

        var isDebug = device === 'debug';
        var isOptional = device === 'stdout' || device === 'stderr';
        var isWildcard = path.indexOf('*') !== -1;
        var isNetwork = /^(tcp:\/\/|udp:\/\/)[a-zA-Z0-9]([a-zA-Z0-9]|\.[a-zA-Z0-9]|\-[a-zA-Z0-9])*:[0-9][0-9]*$/.test(path);

        if (isDebug && !isNetwork) {
            LS.gui.errorAlert('debug device path has the following semantics: proto://hostname:port');
            $(this).show('highlight', {color: 'red'}).val(prevVal);
            LS.gui.prop.focusPath();
            return;
        } else if (isDebug && isWildcard) {
            LS.gui.errorAlert('/dev/debug cannot have wildcard in path');
            $(this).show('highlight', {color: 'red'}).val(prevVal);
            LS.gui.prop.focusPath();
            return;
        } else if (isOptional && path === '') {
        } else if (!isDebug && path.indexOf('/') !== 0) {
            LS.gui.errorAlert('path must start with "/" character');
            $(this).show('highlight', {color: 'red'}).val(prevVal);
            LS.gui.prop.focusPath();
            return;
        }

        LS.gui.prop.hidePathValidationLabel();

        var fileId, nodeName;
        LS.gui.prop.setPrevPath(path);
        fileId = LS.gui.prop.getFileId();
        LS.gui.obj.setPath(fileId, path);
        nodeName = LS.data.getNodeName(LS.data.getFileNode(fileId));
        if (nodeName) {
            LS.json.files.setPath(nodeName, device, path);
            LS.gui.json.setInput(LS.json.getJsonStr());

            var count = LS.json.nodes.getCount(nodeName);
            var hasStar = LS.json.files.checkPathStar(nodeName);
            LS.gui.obj.changeNodeType(id, hasStar, count);
        }


        LS.gui.prop.focusPath();
    });
    LS.gui.prop.setKeyChange(function () {
        var val, prevVal;
        val = $(this).val();
        prevVal = $(this).data('prevVal');
        if ( /[^a-zA-Z0-9]/.test( val ) ) {
            LS.gui.errorAlert('Input is not alphanumeric');
            $(this).show('highlight', {color: 'red'}).val(prevVal);
        } else {
            $(this).data('prevVal', val);
        }
    });
    LS.gui.prop.setRemoveEnvClick(function (elem) {
        var nodeName, key;
        nodeName = LS.gui.prop.getName();
        key = $(elem).parent().find('.key-td').text();
        $(elem).parent().remove();
        LS.json.env.remove(nodeName, key);
        LS.gui.json.setInput(LS.json.getJsonStr());
    });
});