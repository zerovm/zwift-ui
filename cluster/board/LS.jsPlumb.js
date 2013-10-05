var LS;

if (!LS) {
    LS = {};
}

(function () {
    'use strict';

    LS.jsPlumb = new function() {

        function makeSource(id) {
            var objElement, epElement, params;
            objElement = $('#' + id);
            epElement = objElement.find('.ep');
            params = {
                parent: objElement,
                anchor: "Continuous",
                connector: [ "StateMachine", { curviness:20 } ],
                connectorStyle: { strokeStyle:'lightgray', lineWidth:2 },
                maxConnections: 10
            };
            jsPlumb.makeSource(epElement, params, function () {
                console.log(this);
                return false;
            });
        }

        function makeTarget(id) {
            var objElement = $('#' + id);
            jsPlumb.makeTarget(objElement, {
                dropOptions:{ hoverClass: 'dragHover' },
                anchor: 'Continuous'
            });
        }

        this.initNewObj = function (id) {
            jsPlumb.draggable(id, { containment: ".board" });
            makeSource(id);
            makeTarget(id);
        };

        this.initPageLoad = function () {
            jsPlumb.Defaults.Container = $(".board");

            jsPlumb.importDefaults({
                Endpoint : ["Dot", {radius:0.1}],
                HoverPaintStyle : {strokeStyle:"white", lineWidth:4 },
                ConnectionOverlays : [
                    [ "Label", {
                        label:"",
                        id:"label"
                    }
                    ]
                ]
            });
        };

        this.createConn = function (conn) {
            var con = conn.connection || conn;
            con.setPaintStyle({
                strokeStyle:'lightgray',
                lineWidth:2

            });
        };

        this.connCreated = function (func) {
            jsPlumb.bind("jsPlumbConnection", func);
        };

        this.createArrow = function (conn) {
            conn.addOverlay([ "Arrow", {
                location: 1,
                id: "arrow",
                length: 14,
                foldback: 0.8
            }
            ]);
        };

        this.connRemoved = function (func) {
            jsPlumb.bind("click", func);
        };

        this.removeConn = function (conn) {
            jsPlumb.detach(conn);
        };

        this.removeConns = function (id) {
            jsPlumb.detachAllConnections(id);
        };

        this.clear = function (idArr) {

            for (var i = 0; i < idArr.length; i++) {
                this.removeConns(idArr[i]);
            }
        };

        this.createArrowConn = function (sourceId, targetId) {

            jsPlumb.draggable(sourceId, {anchor:"Continuous"});
            jsPlumb.draggable(targetId, {anchor:"Continuous"});
            jsPlumb.connect({
                source: sourceId,
                target: targetId,
                anchor: "Continuous",
                connector: "StateMachine",
                paintStyle: {
                    lineWidth: 2,
                    strokeStyle: "black"
                },
                hoverPaintStyle: {
                    lineWidth: 4,
                    strokeStyle: "white"
                },
                endpoint: "Blank",
                overlays: [
                    ["PlainArrow", {location:1, width:20, length:12} ]
                ]
            });
        };

        this.createLabelConn = function (sourceId, targetId, label) {

            jsPlumb.draggable(sourceId, {anchor:"Continuous"});
            jsPlumb.draggable(targetId, {anchor:"Continuous"});
            return jsPlumb.connect({
                source: sourceId,
                target: targetId,
                anchor: "Continuous",
                connector: "StateMachine",
                paintStyle: {
                    lineWidth: 2,
                    strokeStyle: "lightgray"
                },
                hoverPaintStyle: {
                    lineWidth: 4,
                    strokeStyle: "white"
                },
                endpoint: "Blank",
                overlays: [
                    ["Label", {label:label} ]
                ]
            });
        }
    }
}());