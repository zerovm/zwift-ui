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
			disableClasses = [];

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
						setButtonState(hasRedo, "redo");
						setButtonState(hasUndo, "undo");
						setButtonState(hasRedo || hasUndo, "save");
						/*TODO: change condition to smth like following
						 ace.session.getUndoManager().isClean()
						 and save status with
						 ace.session.getUndoManager().markClean()*/
					}
				}, 0);//workaround for undomanager status not updated
			});
			fileMenuButtonsWrapper.getElementsByClassName("undo")[0].addEventListener("click", function(e){
				e.stopPropagation();
				undoManager && undoManager.undo();
				editor.focus();
			});
			fileMenuButtonsWrapper.getElementsByClassName("redo")[0].addEventListener("click", function(e){
				e.stopPropagation();
				undoManager && undoManager.redo();
				editor.focus();
			});
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
				undoManager = null;
				disableClasses.forEach(function(className){
					fileMenuButtonsWrapper.classList.remove(className);
				});
			}
			session = editor.getSession();
			session.setValue(data);
			undoManager = session.getUndoManager();
			editor.focus();
			window.editor = editor;
			return editor;
		};
	}

	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.fileEditor = new Editor();
});