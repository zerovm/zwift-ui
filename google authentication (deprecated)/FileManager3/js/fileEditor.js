/**
 * User: Alexander
 * Date: 12.11.13
 * Time: 11:10
 */
document.addEventListener("DOMContentLoaded", function(){
	"use strict";

	function Editor(){
		var showClass = "code-editor-is-shown",
			that = this,
			undoManager,
			fileMenuButtonsWrapper,
			editor,
			disableClasses = [],
			buttonsClasses = {
				save: "save",
				undo: "undo",
				redo: "redo",
				saveAs: "save-as",
				execute: "execute",
				download: "download-link"
			};

		function enableButton(className){
			if(disableClasses.indexOf(className) === -1){
				disableClasses.push(className);
			}
			fileMenuButtonsWrapper.classList.add(className);
		}

		function setButtonState(flag, className){
			if(flag){
				enableButton(className);
			}else{
				fileMenuButtonsWrapper.classList.remove(className);
			}
		}

		function save(account, path, oncreateCallback){
			var requestArgs = {};
			requestArgs.path = path;
			requestArgs.contentType = window.FileManager.fileEditor.currentFileType;
			requestArgs.data = editor.getValue();

			if (FileManager.ENABLE_SHARED_CONTAINERS) {
				requestArgs.account = account;
			}

			requestArgs.created = function () {
				setButtonState(false, buttonsClasses.save);
				oncreateCallback && oncreateCallback();
			};
			requestArgs.error = function (status, statusText) {
				window.FileManager.errorMsgHandler.show({
					header: "Error: ",
					status: status,
					statusText: statusText
				});
			};
			SwiftV1.createFile(requestArgs);
			editor.focus();
		}

		function saveFile(e){
			var pathObj = FileManager.CurrentPath(),
				path = pathObj.withoutAccount(),
				account = pathObj.account();
			e.stopPropagation();
			save(account, path);
		}

		function saveAsFile(e){
			e.stopPropagation();
			window.FileManager.dialogForm.show({
				type: "input",
				customizationClass: "save-as-dialog",
				placeholder: "New name of file",
				confirm: saveAsConfirm,
				decline: null
			});
		}

		function saveAsConfirm(input){
			var pathObj = FileManager.CurrentPath(),
				inputValue = input.value,
				pathPrefix = pathObj.up().replace(pathObj.account() + "/", ""),
				account = pathObj.account();
			save(account, pathPrefix + inputValue, function(){
				location.hash = pathObj.up() + inputValue;
			});
			window.FileManager.dialogForm.hide();
		}

		function setMode(editor, type, name){
			var pathPrefix = "ace/mode/";
			type = FileManager.toolbox.isEditable(type, name);
			window.editor = editor;
			if(type && type !== "txt"){//TODO: check bug(open single stirng json file with error, it leads to next opened single sting text file will contain same error)
				editor.getSession().setMode(pathPrefix + type);
			}else{
				editor.getSession().setMode("");
			}
		}

		function initEditor(){//TODO: on exit add save dialog
			editor = ace.edit(that.id);
			fileMenuButtonsWrapper = document.getElementsByClassName("menu-file")[0];
			editor.addEventListener("change", function(){
				setTimeout(function(){
					var hasUndo,
						hasRedo;
					if(undoManager){
						hasUndo = undoManager.hasUndo();
						hasRedo = undoManager.hasRedo();
						setButtonState(hasRedo, buttonsClasses.redo);
						setButtonState(hasUndo, buttonsClasses.undo);
						setButtonState(hasRedo || hasUndo, buttonsClasses.save);
						/*TODO: change condition to smth like following
						 ace.session.getUndoManager().isClean()
						 and save status with
						 ace.session.getUndoManager().markClean()*/
					}
				}, 0);//workaround for undomanager status not updated
			});
			fileMenuButtonsWrapper.getElementsByClassName(buttonsClasses.undo)[0].addEventListener("click", function(e){
				e.stopPropagation();
				undoManager && undoManager.undo();
				editor.focus();
			});
			fileMenuButtonsWrapper.getElementsByClassName(buttonsClasses.redo)[0].addEventListener("click", function(e){
				e.stopPropagation();
				undoManager && undoManager.redo();
				editor.focus();
			});
			fileMenuButtonsWrapper.getElementsByClassName(buttonsClasses.save)[0].addEventListener("click", saveFile);
			fileMenuButtonsWrapper.getElementsByClassName(buttonsClasses.saveAs)[0].addEventListener("click", saveAsFile);
			fileMenuButtonsWrapper.getElementsByClassName(buttonsClasses.execute)[0].addEventListener("click", function(e){
				saveFile(e);
				that.hide();
				window.FileManager.fileExecutor.execute({
					contentType: window.FileManager.fileEditor.currentFileType,
					data: editor.getValue()
				});
			});
			fileMenuButtonsWrapper.getElementsByClassName(buttonsClasses.download)[0].addEventListener("click", function(){
				var current = FileManager.CurrentPath();
				//window.FileManager.toolbox.downloadClick(Auth.getStorageUrl() + current.get(), current.name());
				window.FileManager.toolbox.downloadClick(
					URL.createObjectURL(new Blob([window.FileManager.fileEditor.getValue()], {type: "text/plain"})),
					current.name());
			});
		}

		this.id = "codeEditor";
		this.el = document.getElementById(this.id);
		this.hide = function(){
			window.removeEventListener("hashchange", that.hide);
			document.body.classList.remove(showClass);
			document.body.classList.remove(window.FileManager.elements.disableToolbarClass);
		};
		this.show = function(data, type, name){
			this.currentFileType = type;
			this.set(data, type, name);
			window.addEventListener("hashchange", that.hide);
			document.body.classList.add(showClass);
			document.body.classList.add(window.FileManager.elements.disableToolbarClass);
		};
		this.set = function(data, type, name){
			var session;
			if(!editor){
				initEditor();
			}else{
				disableClasses.forEach(function(className){
					fileMenuButtonsWrapper.classList.remove(className);
				});
			}
			setMode(editor, type, name);
			session = editor.getSession();
			session.setValue(data);
			undoManager = session.getUndoManager();
			editor.focus();
			return editor;
		};
		this.getValue = function(){
			return editor && editor.getValue();
		}
	}

	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.fileEditor = new Editor();
});