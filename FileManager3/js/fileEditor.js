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
				redo: "redo"
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

		function saveFile(e){
			var requestArgs = {};
			e.stopPropagation();
			requestArgs.path = FileManager.CurrentPath().withoutAccount();
			requestArgs.contentType = FileManager.File.contentType;
			requestArgs.data = editor.getValue();

			if (FileManager.ENABLE_SHARED_CONTAINERS) {
				requestArgs.account = FileManager.CurrentPath().account();
			}

			requestArgs.created = function () {
				setButtonState(false, buttonsClasses.save);
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

		function initEditor(){
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
		}

		this.id = "codeEditor";
		this.el = document.getElementById(this.id);
		this.hide = function(){
			window.removeEventListener("hashchange", that.hide);
			document.body.classList.remove(showClass);
		};
		this.show = function(){
			window.addEventListener("hashchange", that.hide);
			document.body.classList.add(showClass);
		};
		this.set = function(data){
			var session;
			if(!editor){
				initEditor();
			}else{
				disableClasses.forEach(function(className){
					fileMenuButtonsWrapper.classList.remove(className);
				});
			}
			session = editor.getSession();
			session.setValue(data);
			undoManager = session.getUndoManager();
			editor.focus();
			return editor;
		};
	}

	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.fileEditor = new Editor();
});