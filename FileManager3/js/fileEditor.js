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
			editor;

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
			editor = ace.edit(this.id);
			editor.getSession().setValue(data);
			editor.focus();
			return editor;
		};
	}

	if(!window.FileManager){
		window.FileManager = {};
	}
	window.FileManager.fileEditor = new Editor();
});