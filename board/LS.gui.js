var LS;

if (!LS) {
	LS = {};
}

(function () {
	'use strict';

    function RealTypeOf(v) {
        if (typeof(v) == "object") {
            if (v === null) return "null";
            if (v.constructor == (new Array).constructor) return "array";
            if (v.constructor == (new Date).constructor) return "date";
            if (v.constructor == (new RegExp).constructor) return "regex";
            return "object";
        }
        return typeof(v);
    }
    function FormatJSON(oData, sIndent) {
        if (arguments.length < 2) {
            var sIndent = "";
        }
        var sIndentStyle = "    ";
        var sDataType = RealTypeOf(oData);

        // open object
        if (sDataType == "array") {
            if (oData.length == 0) {
                return "[]";
            }
            var sHTML = "[";
        } else {
            var iCount = 0;
            $.each(oData, function() {
                iCount++;
                return;
            });
            if (iCount == 0) { // object is empty
                return "{}";
            }
            var sHTML = "{";
        }

        // loop through items
        var iCount = 0;
        $.each(oData, function(sKey, vValue) {
            if (iCount > 0) {
                sHTML += ",";
            }
            if (sDataType == "array") {
                sHTML += ("\n" + sIndent + sIndentStyle);
            } else {
                sHTML += ("\n" + sIndent + sIndentStyle + "\"" + sKey + "\"" + ": ");
            }

            // display relevant data type
            switch (RealTypeOf(vValue)) {
                case "array":
                case "object":
                    sHTML += FormatJSON(vValue, (sIndent + sIndentStyle));
                    break;
                case "boolean":
                case "number":
                    sHTML += vValue.toString();
                    break;
                case "null":
                    sHTML += "null";
                    break;
                case "string":
                    sHTML += ("\"" + vValue + "\"");
                    break;
                default:
                    sHTML += ("TYPEOF: " + typeof(vValue));
            }

            // loop
            iCount++;
        });

        // close object
        if (sDataType == "array") {
            sHTML += ("\n" + sIndent + "]");
        } else {
            sHTML += ("\n" + sIndent + "}");
        }

        // return
        return sHTML;
    }

	LS.gui = new function() {

		var globals = this;

        this.clear = function () {
            $('.node-obj').remove();
            $('.node-group-obj').remove();
            $('.file-obj').remove();
        }

		this.initOnPageLoaded  = function () {
			this.board.fitHeight();
			this.toolbox.placePosition();
			this.toolbox.makeDraggable();
			this.prop.placePosition();
			this.prop.closeButtonClick();
			//this.json.placePosition();
			this.json.inputKeydown();
			this.makeWindowsDraggable();
			this.windowTitleToggle();

            $('.json-tab').height(window.innerHeight - 55);
            $('.json-tab textarea').height(window.innerHeight - 85);
            $('.json-tab textarea').width($('.board').width() - 25);

            $('.tabs li').click(function () {
                $('.selected-tab').removeClass('selected-tab');
                $(this).addClass('selected-tab');
                var tabName = $(this).text();
                if (tabName.toLowerCase() == 'json') {
                    $('.board').hide();
                    $('.json-tab').show();
                    var myFormattedString = FormatJSON(LS.json.getJson());
                    $('.json-tab textarea').val(myFormattedString);
                } else if (tabName.toLowerCase() == 'board') {
                    $('.board').show();
                    $('.json-tab').hide();
                    renderClick($('.json-tab textarea').val());
                }
            });
		};

		this.makeWindowsDraggable = function () {
			$('.window').draggable({ containment: ".board" });
		};

		this.windowTitleToggle = function () {
			$('.window .title').dblclick(function () {
				$(this).parent().find('.window-body').toggle();
			}).bind("contextmenu", function(e) {
					if (e.which === 3) {
						$(this).parent().find('.window-body').toggle();
						return false;
					}
				});
		};

		this.errorAlert = function (msg) {
			var boardWidth, errorAlertWidth, errorAlertLeft;
			boardWidth = $('.board').width();
			errorAlertWidth = $('.error-alert').width();
			errorAlertLeft = (boardWidth - errorAlertWidth) / 2;
			$('.error-alert').css('left', String(errorAlertLeft) + 'px');
			$('.error-alert').css('top', '25px');
			$('.error-alert').text(msg);
			$('.error-alert').show('drop',{direction: 'up', distance: 25}).delay(800).hide('drop',{direction: 'up', distance: 25});
		};

		this.showPageCover = function (highlightSelector) {
			$('.page-cover').show();
			$(highlightSelector).css('z-index', '101');
		};

		this.hidePageCover = function (highlightSelector) {
			$('.page-cover').hide();
			$(highlightSelector).css('z-index', '98');
		};

		this.addValidationLabel = function (labelClass, content, appendTo) {
			var elem;
			elem = $('.sample-required-field').clone();
			elem.addClass(labelClass);
			elem.find('.content').text(content);
			$(appendTo).append(elem[0].outerHTML);
			$(appendTo).find('.' + labelClass).show();
		};

		this.removeValidationLabel = function (labelClass, appendTo) {
			$('.' + appendTo).find('.' + labelClass).remove();
		};

		this.setSampleItems = function () {
			$('.sample-node').draggable({ containment: ".board" });
			$('.sample-node-group').draggable({ containment: ".board" });
			$('.sample-file').draggable({ containment: ".board" });
			$('.sample-node').css('left', '200px');
			$('.sample-node-group').css('left', '200px');
			$('.sample-file').css('left', '200px');
			$('.sample-node .edit').click(function () {
				editButtonClicked(this);
			});
			$('.sample-node-group .edit').click(function () {
				editButtonClicked(this);
			});
			$('.sample-file .edit').click(function () {
				editButtonClicked(this);
			});
		};

		this.board = new function () {
			this.fitHeight = function () {
				/*$('.board').height(window.innerHeight - 55);*/
			};

			this.setDrop = function (func) {
				$('.board').droppable({ accept: '.item', drop: func });
			};

			this.addObj = function (id, type, left, top) {
				var html, className, div;
				if (type === 'file') {
					html = $('.sample-file').html();
					className = 'file-obj';
				} else if (type === 'node') {
					html = $('.sample-node').html();
					className = 'node-obj';
				} else if (type === 'node-group') {
					html = $('.sample-node-group').html();
					className = 'node-group-obj';
				}
				div = '<div class="'+className+'" style="position:absolute;left:'+left+';top:'+top+';" id="' + id + '">' + html + '</div>';
				$('.board').append(div);
			};

			this.removeObj = function (id) {
				$('#' + id).remove();
			};
		};

		this.toolbox = new function () {
			this.placePosition = function () {
				$('.toolbox-window').css('top', '25px');
				$('.toolbox-window').css('left', '25px');
			};

			this.makeDraggable = function () {
				var dragOptions = { appendTo: '.board', containment: '.board', helper: 'clone' };
				$('.toolbox-window .item').draggable(dragOptions);
			};

			this.setDrop = function (func) {
				$('.toolbox-window').droppable({ accept: '.file-obj, .node-obj, .node-group-obj', drop: func });
			};
		};

		this.prop = new function () {
			this.placePosition = function () {
				var boardWidth, propertiesWindowWidth, propertiesWindowLeft;
				boardWidth = $('.board').width();
				propertiesWindowWidth = $('.properties-window').width();
				propertiesWindowLeft = String(boardWidth - propertiesWindowWidth - 25) + 'px';
				$('.properties-window').css('left', propertiesWindowLeft);
				$('.properties-window').css('top', '25px');
			};

			this.closeButtonClick = function () {
				$('.properties-window .window-body .close').click(function () {
					globals.prop.hide();
				});
			};

			this.showCloseButton = function () {
				$('.close').show();
			};

			this.hideCloseButton = function () {
				$('.close').hide();
			};

			this.hide = function () {
                globals.obj.removeBorder();
				$('.properties-window').hide('drop',{direction: 'right', distance: 25});
			};

			this.showNode = function (objId) {
                globals.obj.drawBorder(objId);
				$('.properties-window .node').show();
				$('.properties-window .file').hide();
				$('.properties-window .title').text('Node Properties');
				if ($('.properties-window').is(':hidden')) {
					globals.prop.placePosition();
					$('.properties-window').show('drop',{direction: 'right', distance: 25});
				} else {
					$('.properties-window').show('highlight', {color: 'white'});
				}
				$('.properties-window .window-body').show();
			};

			this.showFile = function (objId) {
                globals.obj.drawBorder(objId);
				$('.properties-window .node').hide();
				$('.properties-window .file').show();
				$('.properties-window .title').text('File Properties');
				if ($('.properties-window').is(':hidden')) {
					globals.prop.placePosition();
					$('.properties-window').show('drop',{direction: 'right', distance: 25});
				} else {
					$('.properties-window').show('highlight', {color: 'white'});
				}
				$('.properties-window .window-body').show();
			};

            // ---------------------
            // node properties
			// name

			this.setNameChange = function (func) {
				$('.properties-window .node .node-name').change(func);
			};

			this.setName = function (val) {
				$('.properties-window .node .node-name').val(val);
			};

			this.getName = function () {
				return $('.properties-window .node .node-name').val();
			};

			// exec path

			this.setExecPathChange = function (func) {
				$('.exec-path').change(func);
			};

			this.setExecPath = function (val) {
				$('.exec-path').val(val);
			};

			this.focusExecPath = function () {
				$('.exec-path').focus();
			};

			this.showExecPathValidationLabel = function (nodeName, objId) {
				this.setExecPath('');
				this.setArgs('');
                this.setCount('');
				this.setName(nodeName);
				this.showNewExeEnv();
				globals.showPageCover('.properties-window');
				globals.addValidationLabel('rquired-exec-path', 'Exec Path is required', '.exec-path-validation');
				this.showNode(objId);
				this.hideCloseButton();
				this.focusExecPath();
				$('.exe-env-section').hide();
				$('.properties-window .node .args').attr('disabled', 'disabled');
                $('.properties-window .node .count').attr('disabled', 'disabled');
			};

			this.hideExecPathValidationLabel = function () {
				globals.removeValidationLabel('rquired-exec-path', 'exec-path-validation');
				globals.prop.showCloseButton();
				globals.hidePageCover('.properties-window');
				$('.exe-env-section').show();
				$('.properties-window .node .args').removeAttr('disabled');
                $('.properties-window .node .count').removeAttr('disabled');
			};

			// args

			this.setArgsChanged = function (func) {
				$('.args').change(func);
			};

			this.setArgs = function (val) {
				$('.args').val(val);
			};

            // count

            this.setCountChanged = function (func) {
                $('.count').change(func);
            };

            this.setCount = function (val) {
                $('.count').val(val);
            };

            this.setPrevCount = function (val) {
                $('.count').data('prevVal', val)
            };

            this.getPrevCount = function () {
                return $('.count').data('prevVal');
            };

			// env

			this.setAddEnvClick = function (func) {
				$('.node .add').click(func);

                $('.new-exe-env .value').keydown(function () {
                    if (event.which == 13) {
                        func();
                    }
                });
			};

			this.setRemoveEnvClick = function (func) {
				$('.properties-window .list-exe-env .remove-env').live('click', function () {
					func(this);
				});
			};

			this.getKey = function () {
				return $('.new-exe-env .key').val();
			};

			this.setKeyChange = function (func) {
				$('.new-exe-env .key').change(func);
			};

			this.getValue = function () {
				return $('.new-exe-env .value').val();
			};

			this.showListExeEnv = function (envArr, keys) {
				var html, i, key;
				html = '';
				if (envArr.length === 0 || !keys) {
					html += '<tr><td>No records</td></tr>';
				} else {
					for (i = 0; i < keys.length; i++) {
						key = keys[i];
						html += '<tr><td class="key-td">'+key+'</td><td>'+envArr[key]+'</td><td class="remove-env">X</td></tr>';
					}
				}
				$('.table-exe-env').html(html);
				$('.new-exe-env').hide();
				$('.list-exe-env').show();
				$('.toggle-view-text').text('new env');
			};

			this.showNewExeEnv = function () {
				$('.new-exe-env .key').val('');
				$('.new-exe-env .key').data('prevVal', '');
				$('.new-exe-env .value').val('');
				$('.new-exe-env').show();
				$('.list-exe-env').hide();
				$('.toggle-view-text').text('watch list');
				$('.new-exe-env .key').focus();
			};

			this.setToggleEnv = function (func) {
				$('.toggle-view-text').click(func);
			};

            // ---------------------
			// file properties

			this.getFileId = function () {
				return $('.properties-window .file .file-id').val();
			};

			this.setFileId = function (val) {
				$('.properties-window .file .file-id').val(val);
			};

			this.getFileNodeName = function () {
				return $('.properties-window .file .node-name').val();
			};

			this.setFileNodeName = function (val) {
				$('.properties-window .file .node-name').val(val);
			};

            // device

			this.setDevice = function (val) {
				$('.properties-window .file .device').val(val);
			};

			this.getDevice = function () {
				return $('.properties-window .file .device').val();
			};

            this.setDeviceChange = function (func) {
                $('.properties-window .file .device').change(func);
            };

            //path

			this.setPath = function (val) {
				$('.properties-window .file .path').val(val);
				$('.properties-window .file .path').data('prevVal', val);
			};

			this.getPath = function () {
				return $('.properties-window .file .path').val();
			};

			this.setPathChange = function (func) {
				$('.properties-window .file .path').change(func);
			};

			this.setPrevPath = function (val) {
				$('.properties-window .file .path').data('prevVal', val);
			};

			this.getPrevPath = function () {
				return  $('.properties-window .file .path').data('prevVal');
			};

			this.focusPath = function () {
				$('.properties-window .file .path').focus();
			};

			this.hidePathValidationLabel = function () {
				globals.hidePageCover('.properties-window');
				LS.gui.removeValidationLabel('required-path', 'path_validation');
				LS.gui.prop.showCloseButton();
			};
		};

		this.json = new function () {
			this.placePosition = function () {
				var boardHeight, jsonWindowHeight, jsonWindowTop;
				boardHeight = $('body').height();
				jsonWindowHeight = $('.json-window').height();
				jsonWindowTop = boardHeight - jsonWindowHeight - 25;
				$('.json-window').css('top', String(jsonWindowTop) + 'px');
				$('.json-window').css('left', '25px');
			};

			this.inputKeydown = function () {
				$('.json-window .json-input').keydown(function () {
					$('.json-window .render').show();
				});
			};

			this.setInput = function (val) {
                modifiedHandler();
                $('.json-window .json-input').val(FormatJSON(JSON.parse(val)));
			};

            this.getInput = function () {
                return $('.json-window .json-input').val();
            };

			this.setRenderClick = function (func) {
				$('.json-window .render').click(func);
			};
		};

		this.obj = new function () {
            var selectedObjId;

            this.drawBorder = function (id) {
                if (selectedObjId) {
                    this.removeBorder();
                }
                $('#' + id).css('outline', '2px dotted black');
                selectedObjId = id;
            };

            this.removeBorder = function () {
                $('#' + selectedObjId).css('outline', '2px dotted transparent');
            };

            this.changeNodeType = function (id, hasStar, count) {
                var isCount = count && count > 1;
                if (hasStar || isCount) {
                    $('#' + id).removeClass('node-obj');
                    $('#' + id + ' .top-border').show();
                    $('#' + id).addClass('node-group-obj');
                } else {
                    $('#' + id).removeClass('node-group-obj');
                    $('#' + id + ' .top-border').hide();
                    $('#' + id).addClass('node-obj');
                }
            };

			// name
			this.setName = function (id, val) {
				$('#' + id + ' .name').val(val);
				$('#' + id + ' .name').data('prevVal', val);
			};

			this.setNameChange = function (func) {
				$('.name').live('change', func);
			};

			// device
			this.setDeviceChange = function (func) {
				$('.device').live('change', func);
			};

			this.getDevice = function (objId) {
				return $('#' + objId + ' .device').val();
			};

            this.setDevice = function (objId, val) {
                $('#' + objId + ' .device').val(val);
            };

			this.getPrevDevice = function (objId) {
				return $('#' + objId + ' .device').data('prevVal');
			};

			this.setPrevDevice = function (objId, val) {
				$('#' + objId + ' .device').data('prevVal', val);
			};

			this.setPrevDevice = function (objId, val) {
				$('#' + objId + ' .device').data('prevVal', val);
			};

            // exec path

            this.setExecPath = function (id, val) {
                var ele = $('#' + id + ' .node-exec-path');
                if (val.length > 13) {
                    ele.mouseover(function () {

                        var newVal = '';
                        for (var i = 0; i < val.length + 20 ; i+=20) {
                            if (i > 0) {
                                newVal += "<br>";
                            }
                            newVal += val.substring(i, i+20);
                        }
                        tooltip.show(newVal, 200);
                    });
                    ele.mouseout(function () {
                        tooltip.hide();
                    });
                    ele.text('...' + val.slice(val.length - 13));
                } else {
                    ele.mouseover(function (e) {
                        tooltip.show('',0);
                        tooltip.hide();
                    });
                    ele.mouseout(function (e) {
                        tooltip.show('',0);
                        tooltip.hide();
                    });
                    ele.text(val);
                }
            };

			// path
			this.setPath = function (objId, val) {
				$('#' + objId + ' .path').val(val);
			};

			this.getPath = function (objId) {
				return $('#' + objId + ' .path').val();
			};

            this.setPathChange = function (func) {
                $('.file-obj .path').live('change', func);
            };

            this.focusPath = function (objId) {
                $('#' + objId + ' .path').focus();
            };

			// edit
			this.setEditClick = function (func) {
				$('.edit').live('click', func);
			};

			this.isNode = function (selector) {
				return $(selector).hasClass('node-obj') || $(selector).hasClass('node');
			};

			this.isNodeGroup = function (selector) {
				return $(selector).hasClass('node-group-obj') || $(selector).hasClass('node-group');
			};

			this.isFile = function (selector) {
				return $(selector).hasClass('file-obj') || $(selector).hasClass('file');
			};

			this.getType = function (selector) {
				var type = null;
				if (this.isFile(selector)) {
					type = 'file';
				} else if (this.isNode(selector)) {
					type = 'node';
				} else if (this.isNodeGroup(selector)) {
					type = 'node-group';
				}
				return type;
			};
		};
	}
}());

